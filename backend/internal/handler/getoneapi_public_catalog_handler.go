package handler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/getoneapi/catalog"
	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/pkg/response"

	"github.com/gin-gonic/gin"
)

// PublicCatalogService abstracts the GetOneAPI public catalog service for
// testability. *catalog.Service satisfies it.
type PublicCatalogService interface {
	Enabled() bool
	Get(ctx context.Context) (*catalog.Snapshot, string, time.Duration, error)
}

// PublicCatalogHandler serves the unauthenticated GetOneAPI public service
// catalog. The endpoint is fully isolated from authentication and billing:
// when the feature is disabled it returns a bare 404, and source failures
// surface as 503 without affecting any other route.
type PublicCatalogHandler struct {
	catalog PublicCatalogService
}

// NewPublicCatalogHandler creates the public catalog handler.
func NewPublicCatalogHandler(catalogSvc PublicCatalogService) *PublicCatalogHandler {
	return &PublicCatalogHandler{catalog: catalogSvc}
}

// Get returns the cached public catalog snapshot.
// GET /api/v1/catalog/public
func (h *PublicCatalogHandler) Get(c *gin.Context) {
	if !h.catalog.Enabled() {
		c.Status(http.StatusNotFound)
		c.Writer.WriteHeaderNow()
		return
	}
	snapshot, etag, ttl, err := h.catalog.Get(c.Request.Context())
	if err != nil {
		response.ErrorFrom(c, infraerrors.ServiceUnavailable(
			"PUBLIC_CATALOG_UNAVAILABLE",
			"public catalog is temporarily unavailable",
		))
		return
	}
	c.Header("ETag", etag)
	c.Header("Cache-Control", fmt.Sprintf("public, max-age=%d", int(ttl.Seconds())))
	if c.GetHeader("If-None-Match") == etag {
		c.Status(http.StatusNotModified)
		c.Writer.WriteHeaderNow()
		return
	}
	response.Success(c, snapshot)
}
