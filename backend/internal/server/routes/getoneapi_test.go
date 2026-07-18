package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/getoneapi/catalog"
	"github.com/Wei-Shaw/sub2api/internal/handler"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

type stubGetOneAPICatalog struct {
	enabled bool
}

func (s *stubGetOneAPICatalog) Enabled() bool { return s.enabled }

func (s *stubGetOneAPICatalog) Get(_ context.Context) (*catalog.Snapshot, string, time.Duration, error) {
	return &catalog.Snapshot{Version: "1", Groups: []catalog.Group{}}, `"etag"`, 300 * time.Second, nil
}

// The public catalog route is unauthenticated and rate-limited fail-open:
// a dead Redis must never block the endpoint (or anything else).
func TestGetOneAPIPublicCatalogRouteFailOpen(t *testing.T) {
	gin.SetMode(gin.TestMode)

	rdb := redis.NewClient(&redis.Options{
		Addr:         "127.0.0.1:1",
		DialTimeout:  50 * time.Millisecond,
		ReadTimeout:  50 * time.Millisecond,
		WriteTimeout: 50 * time.Millisecond,
	})
	t.Cleanup(func() {
		_ = rdb.Close()
	})

	h := &handler.Handlers{
		PublicCatalog: handler.NewPublicCatalogHandler(&stubGetOneAPICatalog{enabled: true}),
	}
	r := gin.New()
	v1 := r.Group("/api/v1")
	RegisterGetOneAPIPublicRoutes(v1, h, rdb)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/catalog/public", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	require.Equal(t, http.StatusOK, rec.Code, "dead redis must fail open")
	require.NotEmpty(t, rec.Header().Get("ETag"))
}

func TestGetOneAPIPublicCatalogRouteDisabled(t *testing.T) {
	gin.SetMode(gin.TestMode)

	rdb := redis.NewClient(&redis.Options{
		Addr:         "127.0.0.1:1",
		DialTimeout:  50 * time.Millisecond,
		ReadTimeout:  50 * time.Millisecond,
		WriteTimeout: 50 * time.Millisecond,
	})
	t.Cleanup(func() {
		_ = rdb.Close()
	})

	h := &handler.Handlers{
		PublicCatalog: handler.NewPublicCatalogHandler(&stubGetOneAPICatalog{enabled: false}),
	}
	r := gin.New()
	v1 := r.Group("/api/v1")
	RegisterGetOneAPIPublicRoutes(v1, h, rdb)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/catalog/public", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	require.Equal(t, http.StatusNotFound, rec.Code)
}
