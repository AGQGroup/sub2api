//go:build unit

package catalog

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/service"
)

type stubResolver struct {
	byGroupModel map[string]*service.ResolvedPricing
}

func (s *stubResolver) Resolve(_ context.Context, input service.PricingInput) *service.ResolvedPricing {
	if input.GroupID == nil {
		return nil
	}
	return s.byGroupModel[fmt.Sprintf("%d:%s", *input.GroupID, input.Model)]
}

type stubSource struct {
	calls    int
	channels []service.AvailableChannel
	err      error
}

func (s *stubSource) ListAvailable(_ context.Context) ([]service.AvailableChannel, error) {
	s.calls++
	return s.channels, s.err
}

func ptrFloat64(v float64) *float64 { return &v }

func ptrInt(v int) *int { return &v }

var testNow = time.Date(2026, 7, 18, 0, 0, 0, 0, time.UTC)

func TestBuildFiltersAndScalesResolvedPublicGroups(t *testing.T) {
	input := []service.AvailableChannel{{
		Status: service.StatusActive,
		Groups: []service.AvailableGroupRef{
			{ID: 7, Name: "Standard", Description: "Public", Platform: "anthropic", RateMultiplier: 0.8},
			{ID: 8, Name: "Private", Platform: "anthropic", RateMultiplier: 1, IsExclusive: true},
		},
		SupportedModels: []service.SupportedModel{{Name: "claude-sonnet", Platform: "anthropic"}},
	}}
	resolver := &stubResolver{byGroupModel: map[string]*service.ResolvedPricing{
		"7:claude-sonnet": {
			Mode: service.BillingModeToken,
			BasePricing: &service.ModelPricing{
				InputPricePerToken:  3e-6,
				OutputPricePerToken: 15e-6,
			},
		},
	}}
	got := buildSnapshot(context.Background(), input, resolver, map[int64]struct{}{7: {}, 8: {}}, "Asia/Shanghai", testNow)
	require.Len(t, got.Groups, 1)
	require.Equal(t, "Standard", got.Groups[0].Name)
	require.Equal(t, "Public", got.Groups[0].Description)
	require.Len(t, got.Groups[0].Models, 1)
	require.InDelta(t, 2.4, *got.Groups[0].Models[0].Pricing.InputPerMillion, 1e-9)
	require.InDelta(t, 12.0, *got.Groups[0].Models[0].Pricing.OutputPerMillion, 1e-9)
}

func TestBuildSkipsInactiveChannelsNonAllowlistedAndCrossPlatformModels(t *testing.T) {
	input := []service.AvailableChannel{
		{
			Status:          "disabled",
			Groups:          []service.AvailableGroupRef{{ID: 7, Name: "Standard", Platform: "anthropic", RateMultiplier: 1}},
			SupportedModels: []service.SupportedModel{{Name: "claude-sonnet", Platform: "anthropic"}},
		},
		{
			Status: service.StatusActive,
			Groups: []service.AvailableGroupRef{
				{ID: 9, Name: "NotAllowlisted", Platform: "anthropic", RateMultiplier: 1},
				{ID: 7, Name: "Standard", Platform: "anthropic", RateMultiplier: 1},
			},
			SupportedModels: []service.SupportedModel{
				{Name: "claude-sonnet", Platform: "anthropic"},
				{Name: "gpt-5.1", Platform: "openai"}, // cross-platform: must not join anthropic group
			},
		},
	}
	resolver := &stubResolver{byGroupModel: map[string]*service.ResolvedPricing{
		"7:claude-sonnet": {
			Mode:        service.BillingModeToken,
			BasePricing: &service.ModelPricing{InputPricePerToken: 3e-6, OutputPricePerToken: 15e-6},
		},
	}}
	got := buildSnapshot(context.Background(), input, resolver, map[int64]struct{}{7: {}}, "UTC", testNow)
	require.Len(t, got.Groups, 1)
	require.Equal(t, "Standard", got.Groups[0].Name)
	require.Len(t, got.Groups[0].Models, 1)
	require.Equal(t, "claude-sonnet", got.Groups[0].Models[0].Name)
}

func TestBuildDeduplicatesAndOmitsUnpricedModels(t *testing.T) {
	channel := service.AvailableChannel{
		Status:          service.StatusActive,
		Groups:          []service.AvailableGroupRef{{ID: 7, Name: "Standard", Platform: "anthropic", RateMultiplier: 1}},
		SupportedModels: []service.SupportedModel{{Name: "claude-sonnet", Platform: "anthropic"}},
	}
	// Two channels expose the same group/model candidate; one extra model the
	// resolver cannot price must be omitted.
	second := channel
	second.SupportedModels = []service.SupportedModel{
		{Name: "claude-sonnet", Platform: "anthropic"},
		{Name: "claude-unknown", Platform: "anthropic"},
	}
	resolver := &stubResolver{byGroupModel: map[string]*service.ResolvedPricing{
		"7:claude-sonnet": {
			Mode:        service.BillingModeToken,
			BasePricing: &service.ModelPricing{InputPricePerToken: 3e-6, OutputPricePerToken: 15e-6},
		},
	}}
	got := buildSnapshot(context.Background(), []service.AvailableChannel{channel, second}, resolver, map[int64]struct{}{7: {}}, "UTC", testNow)
	require.Len(t, got.Groups, 1)
	require.Len(t, got.Groups[0].Models, 1)
	require.Equal(t, "claude-sonnet", got.Groups[0].Models[0].Name)
}

func TestBuildResolverConsistencyAcrossBillingModes(t *testing.T) {
	const rate = 0.8
	input := []service.AvailableChannel{{
		Status: service.StatusActive,
		Groups: []service.AvailableGroupRef{
			{ID: 7, Name: "Standard", Platform: "anthropic", RateMultiplier: rate},
		},
		SupportedModels: []service.SupportedModel{
			{Name: "flat", Platform: "anthropic"},
			{Name: "tiered", Platform: "anthropic"},
			{Name: "perreq", Platform: "anthropic"},
			{Name: "image", Platform: "anthropic"},
		},
	}}
	resolver := &stubResolver{byGroupModel: map[string]*service.ResolvedPricing{
		"7:flat": {
			Mode: service.BillingModeToken,
			BasePricing: &service.ModelPricing{
				InputPricePerToken:         3e-6,
				OutputPricePerToken:        15e-6,
				CacheCreationPricePerToken: 3.75e-6,
				CacheReadPricePerToken:     0.3e-6,
				ImageOutputPricePerToken:   30e-6,
			},
		},
		"7:tiered": {
			Mode:        service.BillingModeToken,
			BasePricing: &service.ModelPricing{InputPricePerToken: 3e-6, OutputPricePerToken: 15e-6},
			Intervals: []service.PricingInterval{
				{
					MinTokens:       0,
					MaxTokens:       ptrInt(200000),
					InputPrice:      ptrFloat64(3e-6),
					OutputPrice:     ptrFloat64(15e-6),
					CacheWritePrice: ptrFloat64(3.75e-6),
					CacheReadPrice:  ptrFloat64(0.3e-6),
				},
				{
					MinTokens:   200000,
					InputPrice:  ptrFloat64(6e-6),
					OutputPrice: ptrFloat64(22.5e-6),
				},
			},
		},
		"7:perreq": {
			Mode:                   service.BillingModePerRequest,
			DefaultPerRequestPrice: 0.04,
			RequestTiers: []service.PricingInterval{
				{TierLabel: "4K", PerRequestPrice: ptrFloat64(0.08)},
			},
		},
		"7:image": {
			Mode:                   service.BillingModeImage,
			DefaultPerRequestPrice: 0.02,
			RequestTiers: []service.PricingInterval{
				{TierLabel: "HD", PerRequestPrice: ptrFloat64(0.04)},
			},
		},
	}}
	got := buildSnapshot(context.Background(), input, resolver, map[int64]struct{}{7: {}}, "UTC", testNow)
	require.Len(t, got.Groups, 1)
	models := got.Groups[0].Models
	require.Len(t, models, 4)
	// Models are sorted by name: flat, image, perreq, tiered.
	byName := make(map[string]Model, len(models))
	for _, m := range models {
		byName[m.Name] = m
	}

	// Flat token: every public token value = resolved per-token * rate * 1e6.
	flat := byName["flat"].Pricing
	require.Equal(t, "token", flat.BillingMode)
	require.InDelta(t, 3e-6*rate*1e6, *flat.InputPerMillion, 1e-9)
	require.InDelta(t, 15e-6*rate*1e6, *flat.OutputPerMillion, 1e-9)
	require.InDelta(t, 3.75e-6*rate*1e6, *flat.CacheWritePerMillion, 1e-9)
	require.InDelta(t, 0.3e-6*rate*1e6, *flat.CacheReadPerMillion, 1e-9)
	require.InDelta(t, 30e-6*rate*1e6, *flat.ImageOutputPerMillion, 1e-9)
	require.Nil(t, flat.PerRequest)

	// Tiered token: intervals carry scaled token prices and preserve bounds.
	tiered := byName["tiered"].Pricing
	require.Equal(t, "token", tiered.BillingMode)
	require.Len(t, tiered.Intervals, 2)
	require.Equal(t, 0, tiered.Intervals[0].MinTokens)
	require.Equal(t, 200000, *tiered.Intervals[0].MaxTokens)
	require.InDelta(t, 3e-6*rate*1e6, *tiered.Intervals[0].InputPerMillion, 1e-9)
	require.InDelta(t, 15e-6*rate*1e6, *tiered.Intervals[0].OutputPerMillion, 1e-9)
	require.InDelta(t, 3.75e-6*rate*1e6, *tiered.Intervals[0].CacheWritePerMillion, 1e-9)
	require.InDelta(t, 0.3e-6*rate*1e6, *tiered.Intervals[0].CacheReadPerMillion, 1e-9)
	require.Nil(t, tiered.Intervals[1].MaxTokens)
	require.InDelta(t, 6e-6*rate*1e6, *tiered.Intervals[1].InputPerMillion, 1e-9)
	require.InDelta(t, 22.5e-6*rate*1e6, *tiered.Intervals[1].OutputPerMillion, 1e-9)

	// Per-request: public per-request value = resolved * rate (no 1e6 scale).
	perreq := byName["perreq"].Pricing
	require.Equal(t, "per_request", perreq.BillingMode)
	require.InDelta(t, 0.04*rate, *perreq.PerRequest, 1e-12)
	require.Nil(t, perreq.InputPerMillion)
	require.Len(t, perreq.Intervals, 1)
	require.Equal(t, "4K", perreq.Intervals[0].TierLabel)
	require.InDelta(t, 0.08*rate, *perreq.Intervals[0].PerRequest, 1e-12)

	// Image: same per-request scaling path.
	image := byName["image"].Pricing
	require.Equal(t, "image", image.BillingMode)
	require.InDelta(t, 0.02*rate, *image.PerRequest, 1e-12)
	require.Len(t, image.Intervals, 1)
	require.Equal(t, "HD", image.Intervals[0].TierLabel)
	require.InDelta(t, 0.04*rate, *image.Intervals[0].PerRequest, 1e-12)
}

func TestSnapshotJSONWhitelist(t *testing.T) {
	input := []service.AvailableChannel{{
		Status:             service.StatusActive,
		Name:               "internal-channel-name",
		BillingModelSource: "channel_mapped",
		RestrictModels:     true,
		Groups: []service.AvailableGroupRef{
			{ID: 7, Name: "Standard", Platform: "anthropic", RateMultiplier: 1},
		},
		SupportedModels: []service.SupportedModel{{Name: "claude-sonnet", Platform: "anthropic"}},
	}}
	resolver := &stubResolver{byGroupModel: map[string]*service.ResolvedPricing{
		"7:claude-sonnet": {
			Mode:        service.BillingModeToken,
			BasePricing: &service.ModelPricing{InputPricePerToken: 3e-6, OutputPricePerToken: 15e-6},
		},
	}}
	snapshot := buildSnapshot(context.Background(), input, resolver, map[int64]struct{}{7: {}}, "UTC", testNow)
	raw, err := json.Marshal(snapshot)
	require.NoError(t, err)
	for _, forbidden := range []string{
		"channel_id",
		"channel_name",
		"billing_model_source",
		"restrict_models",
		"account_count",
		"routing",
		"cost_price",
	} {
		require.NotContains(t, string(raw), forbidden)
	}
}

func TestSupportedClientsMapping(t *testing.T) {
	cases := map[string][]string{
		"anthropic":   {"claude_code"},
		"openai":      {"codex_cli", "openai_compatible"},
		"gemini":      {"gemini_cli"},
		"grok":        {"openai_compatible"},
		"antigravity": {"claude_code", "gemini_cli"},
	}
	for platform, want := range cases {
		require.Equal(t, want, supportedClients(platform), "platform %s", platform)
	}
	require.Empty(t, supportedClients("unknown-platform"))
}

func TestGroupKeyDerivation(t *testing.T) {
	// Stable, platform-scoped, 12 lowercase hex chars of SHA-256.
	require.Equal(t, groupKey("anthropic", "Standard"), groupKey("anthropic", "Standard"))
	require.NotEqual(t, groupKey("anthropic", "Standard"), groupKey("openai", "Standard"))
	require.Len(t, groupKey("anthropic", "Standard"), 12)
}

func newTestService(source *stubSource, resolver *stubResolver) *Service {
	cfg := &config.Config{Timezone: "UTC"}
	cfg.GetOneAPI.PublicCatalogEnabled = true
	cfg.GetOneAPI.PublicCatalogGroupIDs = []int64{7}
	cfg.GetOneAPI.PublicCatalogCacheTTLSeconds = 300
	return NewService(cfg, source, resolver)
}

func catalogFixture() ([]service.AvailableChannel, *stubResolver) {
	channels := []service.AvailableChannel{{
		Status: service.StatusActive,
		Groups: []service.AvailableGroupRef{
			{ID: 7, Name: "Standard", Platform: "anthropic", RateMultiplier: 1},
		},
		SupportedModels: []service.SupportedModel{{Name: "claude-sonnet", Platform: "anthropic"}},
	}}
	resolver := &stubResolver{byGroupModel: map[string]*service.ResolvedPricing{
		"7:claude-sonnet": {
			Mode:        service.BillingModeToken,
			BasePricing: &service.ModelPricing{InputPricePerToken: 3e-6, OutputPricePerToken: 15e-6},
		},
	}}
	return channels, resolver
}

func TestGetCachesSnapshotUntilExpiry(t *testing.T) {
	channels, resolver := catalogFixture()
	source := &stubSource{channels: channels}
	svc := newTestService(source, resolver)
	now := testNow
	svc.now = func() time.Time { return now }

	snap1, etag1, ttl1, err := svc.Get(context.Background())
	require.NoError(t, err)
	snap2, etag2, _, err := svc.Get(context.Background())
	require.NoError(t, err)
	require.Equal(t, 1, source.calls, "second Get within TTL must reuse the cache")
	require.Same(t, snap1, snap2)
	require.Equal(t, etag1, etag2)
	require.InDelta(t, 300, ttl1.Seconds(), 1)

	now = now.Add(301 * time.Second)
	_, _, _, err = svc.Get(context.Background())
	require.NoError(t, err)
	require.Equal(t, 2, source.calls, "Get after expiry must refresh")
}

func TestGetDoesNotCacheErrors(t *testing.T) {
	channels, resolver := catalogFixture()
	source := &stubSource{err: errors.New("store down")}
	svc := newTestService(source, resolver)
	svc.now = func() time.Time { return testNow }

	_, _, _, err := svc.Get(context.Background())
	require.Error(t, err)

	source.err = nil
	source.channels = channels
	snapshot, etag, _, err := svc.Get(context.Background())
	require.NoError(t, err)
	require.NotNil(t, snapshot)
	require.NotEmpty(t, etag)
	require.Equal(t, 2, source.calls)
}

func TestInvalidateClearsCache(t *testing.T) {
	channels, resolver := catalogFixture()
	source := &stubSource{channels: channels}
	svc := newTestService(source, resolver)
	svc.now = func() time.Time { return testNow }

	_, _, _, err := svc.Get(context.Background())
	require.NoError(t, err)
	svc.Invalidate()
	_, _, _, err = svc.Get(context.Background())
	require.NoError(t, err)
	require.Equal(t, 2, source.calls, "Get after Invalidate must rebuild")
}

func TestGetReturnsQuotedStableETag(t *testing.T) {
	channels, resolver := catalogFixture()
	source := &stubSource{channels: channels}
	svc := newTestService(source, resolver)
	svc.now = func() time.Time { return testNow }

	_, etag, _, err := svc.Get(context.Background())
	require.NoError(t, err)
	require.Greater(t, len(etag), 2)
	require.Equal(t, byte('"'), etag[0])
	require.Equal(t, byte('"'), etag[len(etag)-1])

	// Same inputs at the same clock produce the same ETag after invalidation.
	svc.Invalidate()
	_, etag2, _, err := svc.Get(context.Background())
	require.NoError(t, err)
	require.Equal(t, etag, etag2)
}

func TestEnabledReflectsConfig(t *testing.T) {
	channels, resolver := catalogFixture()
	svc := newTestService(&stubSource{channels: channels}, resolver)
	require.True(t, svc.Enabled())

	cfg := &config.Config{}
	svc = NewService(cfg, &stubSource{}, resolver)
	require.False(t, svc.Enabled())
}
