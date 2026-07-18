// Package catalog builds the GetOneAPI public service catalog: an
// unauthenticated, cached snapshot of allowlisted public groups and their
// effective model prices.
//
// Prices are resolved through the same ModelPricingResolver path used by
// gateway billing, then scaled by the public group's rate multiplier, so the
// published numbers always match what billing would charge. The snapshot
// never exposes channel internals (IDs, names, routing, cost prices).
package catalog

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

// perMillion converts per-token USD prices to per-1M-token USD prices.
const perMillion = 1_000_000

// Snapshot is the public catalog contract.
type Snapshot struct {
	Version        string  `json:"version"`
	UpdatedAt      string  `json:"updated_at"`
	Currency       string  `json:"currency"`
	TokenPriceUnit string  `json:"token_price_unit"`
	Timezone       string  `json:"timezone"`
	Groups         []Group `json:"groups"`
}

// Group is a publishable (allowlisted, non-exclusive) group.
type Group struct {
	Key                string   `json:"key"`
	Name               string   `json:"name"`
	Description        string   `json:"description"`
	Platform           string   `json:"platform"`
	RateMultiplier     float64  `json:"rate_multiplier"`
	PeakRateEnabled    bool     `json:"peak_rate_enabled"`
	PeakStart          string   `json:"peak_start"`
	PeakEnd            string   `json:"peak_end"`
	PeakRateMultiplier float64  `json:"peak_rate_multiplier"`
	SupportedClients   []string `json:"supported_clients"`
	Models             []Model  `json:"models"`
}

// Model is a supported model with its effective public pricing.
type Model struct {
	Name     string   `json:"name"`
	Platform string   `json:"platform"`
	Pricing  *Pricing `json:"pricing"`
}

// Pricing is the effective public price view of a resolved model pricing.
// Token fields are per-1M-token USD; PerRequest is per-request USD.
type Pricing struct {
	BillingMode           string            `json:"billing_mode"`
	InputPerMillion       *float64          `json:"input_per_million"`
	OutputPerMillion      *float64          `json:"output_per_million"`
	CacheWritePerMillion  *float64          `json:"cache_write_per_million"`
	CacheReadPerMillion   *float64          `json:"cache_read_per_million"`
	ImageOutputPerMillion *float64          `json:"image_output_per_million"`
	PerRequest            *float64          `json:"per_request"`
	Intervals             []PricingInterval `json:"intervals"`
}

// PricingInterval is one tier of a tiered pricing (token intervals or
// per-request/image tiers).
type PricingInterval struct {
	MinTokens            int      `json:"min_tokens"`
	MaxTokens            *int     `json:"max_tokens"`
	TierLabel            string   `json:"tier_label,omitempty"`
	InputPerMillion      *float64 `json:"input_per_million"`
	OutputPerMillion     *float64 `json:"output_per_million"`
	CacheWritePerMillion *float64 `json:"cache_write_per_million"`
	CacheReadPerMillion  *float64 `json:"cache_read_per_million"`
	PerRequest           *float64 `json:"per_request"`
}

func scaled(value float64, multiplier, scale float64) *float64 {
	result := value * multiplier * scale
	return &result
}

func scaledPtr(value *float64, multiplier, scale float64) *float64 {
	if value == nil {
		return nil
	}
	return scaled(*value, multiplier, scale)
}

// pricingResolver abstracts service.ModelPricingResolver for testability.
type pricingResolver interface {
	Resolve(ctx context.Context, input service.PricingInput) *service.ResolvedPricing
}

// channelSource abstracts service.ChannelService for testability.
type channelSource interface {
	ListAvailable(ctx context.Context) ([]service.AvailableChannel, error)
}

type cacheEntry struct {
	snapshot  *Snapshot
	etag      string
	expiresAt time.Time
}

// Service builds and caches the public catalog snapshot.
type Service struct {
	cfg      *config.Config
	source   channelSource
	resolver pricingResolver
	now      func() time.Time

	mu    sync.Mutex
	entry *cacheEntry
}

// NewService is the Wire provider. *service.ChannelService and
// *service.ModelPricingResolver satisfy the source/resolver interfaces.
func NewService(cfg *config.Config, source channelSource, resolver pricingResolver) *Service {
	return &Service{
		cfg:      cfg,
		source:   source,
		resolver: resolver,
		now:      time.Now,
	}
}

// Enabled reports whether the public catalog feature is switched on.
func (s *Service) Enabled() bool {
	return s.cfg.GetOneAPI.PublicCatalogEnabled
}

// Get returns the cached immutable snapshot until expiry, rebuilding it from
// the channel source on miss. The returned string is a quoted ETag and the
// duration is the remaining cache TTL. Errors are never cached.
func (s *Service) Get(ctx context.Context) (*Snapshot, string, time.Duration, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := s.now()
	if s.entry != nil && now.Before(s.entry.expiresAt) {
		return s.entry.snapshot, s.entry.etag, s.entry.expiresAt.Sub(now), nil
	}

	channels, err := s.source.ListAvailable(ctx)
	if err != nil {
		return nil, "", 0, fmt.Errorf("list available channels: %w", err)
	}
	snapshot := buildSnapshot(ctx, channels, s.resolver, s.allowlist(), s.cfg.Timezone, now)
	raw, err := json.Marshal(snapshot)
	if err != nil {
		return nil, "", 0, fmt.Errorf("marshal catalog snapshot: %w", err)
	}
	sum := sha256.Sum256(raw)
	etag := `"` + hex.EncodeToString(sum[:]) + `"`

	ttl := s.ttl()
	s.entry = &cacheEntry{snapshot: snapshot, etag: etag, expiresAt: now.Add(ttl)}
	return snapshot, etag, ttl, nil
}

// Invalidate atomically clears the cached entry.
func (s *Service) Invalidate() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.entry = nil
}

func (s *Service) ttl() time.Duration {
	secs := s.cfg.GetOneAPI.PublicCatalogCacheTTLSeconds
	if secs <= 0 {
		secs = 300
	}
	return time.Duration(secs) * time.Second
}

func (s *Service) allowlist() map[int64]struct{} {
	ids := s.cfg.GetOneAPI.PublicCatalogGroupIDs
	out := make(map[int64]struct{}, len(ids))
	for _, id := range ids {
		out[id] = struct{}{}
	}
	return out
}

// buildSnapshot transforms the available-channel view into the public
// contract. It includes only active channels, allowlisted non-exclusive
// groups, and same-platform models; candidates are deduplicated by group ID
// and model name. Models the resolver cannot price are omitted. The
// candidate channel's raw Pricing pointer is never read — every published
// number comes from the resolver.
func buildSnapshot(ctx context.Context, channels []service.AvailableChannel, resolver pricingResolver, allowlist map[int64]struct{}, timezone string, now time.Time) *Snapshot {
	type dedupKey struct {
		groupID int64
		model   string
	}
	seen := make(map[dedupKey]struct{})
	groupByID := make(map[int64]*Group)

	for i := range channels {
		ch := &channels[i]
		if ch.Status != service.StatusActive {
			continue
		}
		for _, g := range ch.Groups {
			if _, ok := allowlist[g.ID]; !ok {
				continue
			}
			if g.IsExclusive {
				continue
			}
			for _, m := range ch.SupportedModels {
				if m.Platform != g.Platform {
					continue
				}
				key := dedupKey{groupID: g.ID, model: m.Name}
				if _, ok := seen[key]; ok {
					continue
				}
				seen[key] = struct{}{}

				groupID := g.ID
				resolved := resolver.Resolve(ctx, service.PricingInput{Model: m.Name, GroupID: &groupID})
				if resolved == nil {
					continue
				}
				grp, ok := groupByID[g.ID]
				if !ok {
					grp = &Group{
						Key:                groupKey(g.Platform, g.Name),
						Name:               g.Name,
						Description:        g.Description,
						Platform:           g.Platform,
						RateMultiplier:     g.RateMultiplier,
						PeakRateEnabled:    g.PeakRateEnabled,
						PeakStart:          g.PeakStart,
						PeakEnd:            g.PeakEnd,
						PeakRateMultiplier: g.PeakRateMultiplier,
						SupportedClients:   supportedClients(g.Platform),
					}
					groupByID[g.ID] = grp
				}
				grp.Models = append(grp.Models, Model{
					Name:     m.Name,
					Platform: m.Platform,
					Pricing:  toPublicPricing(resolved, g.RateMultiplier),
				})
			}
		}
	}

	groups := make([]Group, 0, len(groupByID))
	for _, grp := range groupByID {
		sort.SliceStable(grp.Models, func(i, j int) bool { return grp.Models[i].Name < grp.Models[j].Name })
		groups = append(groups, *grp)
	}
	sort.SliceStable(groups, func(i, j int) bool { return groups[i].Name < groups[j].Name })

	return &Snapshot{
		Version:        "1",
		UpdatedAt:      now.UTC().Format(time.RFC3339),
		Currency:       "USD",
		TokenPriceUnit: "per_1m_tokens",
		Timezone:       timezone,
		Groups:         groups,
	}
}

// toPublicPricing converts a resolved pricing into the public price view,
// applying the group rate multiplier. Token prices are additionally scaled
// to per-1M-token units.
func toPublicPricing(resolved *service.ResolvedPricing, rate float64) *Pricing {
	p := &Pricing{BillingMode: string(resolved.Mode)}
	switch resolved.Mode {
	case service.BillingModePerRequest, service.BillingModeImage:
		p.PerRequest = scaled(resolved.DefaultPerRequestPrice, rate, 1)
		p.Intervals = toPublicIntervals(resolved.RequestTiers, rate)
	default:
		if bp := resolved.BasePricing; bp != nil {
			p.InputPerMillion = scaled(bp.InputPricePerToken, rate, perMillion)
			p.OutputPerMillion = scaled(bp.OutputPricePerToken, rate, perMillion)
			p.CacheWritePerMillion = scaled(bp.CacheCreationPricePerToken, rate, perMillion)
			p.CacheReadPerMillion = scaled(bp.CacheReadPricePerToken, rate, perMillion)
			p.ImageOutputPerMillion = scaled(bp.ImageOutputPricePerToken, rate, perMillion)
		}
		p.Intervals = toPublicIntervals(resolved.Intervals, rate)
	}
	return p
}

func toPublicIntervals(intervals []service.PricingInterval, rate float64) []PricingInterval {
	if len(intervals) == 0 {
		return nil
	}
	out := make([]PricingInterval, 0, len(intervals))
	for _, iv := range intervals {
		var maxTokens *int
		if iv.MaxTokens != nil {
			max := *iv.MaxTokens
			maxTokens = &max
		}
		out = append(out, PricingInterval{
			MinTokens:            iv.MinTokens,
			MaxTokens:            maxTokens,
			TierLabel:            iv.TierLabel,
			InputPerMillion:      scaledPtr(iv.InputPrice, rate, perMillion),
			OutputPerMillion:     scaledPtr(iv.OutputPrice, rate, perMillion),
			CacheWritePerMillion: scaledPtr(iv.CacheWritePrice, rate, perMillion),
			CacheReadPerMillion:  scaledPtr(iv.CacheReadPrice, rate, perMillion),
			PerRequest:           scaledPtr(iv.PerRequestPrice, rate, 1),
		})
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].MinTokens != out[j].MinTokens {
			return out[i].MinTokens < out[j].MinTokens
		}
		return out[i].TierLabel < out[j].TierLabel
	})
	return out
}

// groupKey derives a stable, non-enumerable public identifier: the first 12
// lowercase hex characters of SHA-256 over platform + "\x00" + name.
func groupKey(platform, name string) string {
	sum := sha256.Sum256([]byte(platform + "\x00" + name))
	return hex.EncodeToString(sum[:])[:12]
}

// supportedClients is the public presentation mapping from platform to the
// clients known to work with it. Unknown platforms return an empty list
// instead of making a support claim.
func supportedClients(platform string) []string {
	switch platform {
	case "anthropic":
		return []string{"claude_code"}
	case "openai":
		return []string{"codex_cli", "openai_compatible"}
	case "gemini":
		return []string{"gemini_cli"}
	case "grok":
		return []string{"openai_compatible"}
	case "antigravity":
		return []string{"claude_code", "gemini_cli"}
	default:
		return []string{}
	}
}
