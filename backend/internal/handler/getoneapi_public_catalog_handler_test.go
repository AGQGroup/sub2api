//go:build unit

package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/getoneapi/catalog"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

type stubPublicCatalog struct {
	enabled  bool
	snapshot *catalog.Snapshot
	etag     string
	ttl      time.Duration
	err      error
	getCalls int
}

func (s *stubPublicCatalog) Enabled() bool { return s.enabled }

func (s *stubPublicCatalog) Get(_ context.Context) (*catalog.Snapshot, string, time.Duration, error) {
	s.getCalls++
	return s.snapshot, s.etag, s.ttl, s.err
}

func newPublicCatalogContext(target string) (*gin.Context, *httptest.ResponseRecorder) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, target, nil)
	return c, w
}

func publicCatalogTestSnapshot() *catalog.Snapshot {
	input := 2.4
	output := 12.0
	return &catalog.Snapshot{
		Version:        "1",
		UpdatedAt:      "2026-07-18T00:00:00Z",
		Currency:       "USD",
		TokenPriceUnit: "per_1m_tokens",
		Timezone:       "Asia/Shanghai",
		Groups: []catalog.Group{{
			Key:              "abc123def456",
			Name:             "Standard",
			Description:      "Public group",
			Platform:         "anthropic",
			RateMultiplier:   0.8,
			SupportedClients: []string{"claude_code"},
			Models: []catalog.Model{{
				Name:     "claude-sonnet",
				Platform: "anthropic",
				Pricing: &catalog.Pricing{
					BillingMode:      "token",
					InputPerMillion:  &input,
					OutputPerMillion: &output,
					Intervals:        []catalog.PricingInterval{},
				},
			}},
		}},
	}
}

func TestPublicCatalog_DisabledReturns404WithoutSourceCall(t *testing.T) {
	stub := &stubPublicCatalog{enabled: false}
	h := NewPublicCatalogHandler(stub)
	c, w := newPublicCatalogContext("/api/v1/catalog/public")

	h.Get(c)

	require.Equal(t, http.StatusNotFound, w.Code)
	require.Equal(t, 0, stub.getCalls, "disabled catalog must not touch the source")
	require.Empty(t, strings.TrimSpace(w.Body.String()), "404 must not leak a body")
}

func TestPublicCatalog_ReturnsSnapshotWithCachingHeaders(t *testing.T) {
	stub := &stubPublicCatalog{
		enabled:  true,
		snapshot: publicCatalogTestSnapshot(),
		etag:     `"deadbeef"`,
		ttl:      300 * time.Second,
	}
	h := NewPublicCatalogHandler(stub)
	c, w := newPublicCatalogContext("/api/v1/catalog/public")

	h.Get(c)

	require.Equal(t, http.StatusOK, w.Code)
	require.Equal(t, `"deadbeef"`, w.Header().Get("ETag"))
	require.Equal(t, "public, max-age=300", w.Header().Get("Cache-Control"))
	require.Equal(t, 1, stub.getCalls)
	body := w.Body.String()
	require.Contains(t, body, `"groups"`)
	require.Contains(t, body, "claude-sonnet")
}

func TestPublicCatalog_IfNoneMatchReturns304WithoutBody(t *testing.T) {
	stub := &stubPublicCatalog{
		enabled:  true,
		snapshot: publicCatalogTestSnapshot(),
		etag:     `"deadbeef"`,
		ttl:      300 * time.Second,
	}
	h := NewPublicCatalogHandler(stub)
	c, w := newPublicCatalogContext("/api/v1/catalog/public")
	c.Request.Header.Set("If-None-Match", `"deadbeef"`)

	h.Get(c)

	require.Equal(t, http.StatusNotModified, w.Code)
	require.Equal(t, `"deadbeef"`, w.Header().Get("ETag"))
	require.Empty(t, strings.TrimSpace(w.Body.String()), "304 must not carry a body")
}

func TestPublicCatalog_SourceErrorReturns503(t *testing.T) {
	stub := &stubPublicCatalog{
		enabled: true,
		err:     errors.New("database is down"),
	}
	h := NewPublicCatalogHandler(stub)
	c, w := newPublicCatalogContext("/api/v1/catalog/public")

	h.Get(c)

	require.Equal(t, http.StatusServiceUnavailable, w.Code)
	require.Contains(t, w.Body.String(), "PUBLIC_CATALOG_UNAVAILABLE")
	require.NotContains(t, w.Body.String(), "database is down", "internal error details must not leak")
}

func TestPublicCatalog_ResponseHidesInternalFields(t *testing.T) {
	stub := &stubPublicCatalog{
		enabled:  true,
		snapshot: publicCatalogTestSnapshot(),
		etag:     `"deadbeef"`,
		ttl:      300 * time.Second,
	}
	h := NewPublicCatalogHandler(stub)
	c, w := newPublicCatalogContext("/api/v1/catalog/public")

	h.Get(c)

	require.Equal(t, http.StatusOK, w.Code)
	body := w.Body.String()
	for _, forbidden := range []string{`"channel"`, `"cost"`, `"account"`, `"api_key"`, `"group_id"`} {
		require.NotContainsf(t, body, forbidden, "public catalog must not expose %s", forbidden)
	}
}
