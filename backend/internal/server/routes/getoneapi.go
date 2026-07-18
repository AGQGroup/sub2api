package routes

import (
	"time"

	"github.com/Wei-Shaw/sub2api/internal/handler"
	"github.com/Wei-Shaw/sub2api/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RegisterGetOneAPIPublicRoutes 注册 GetOneAPI 公开（免认证）路由。
//
// 公开目录端点与认证体系完全隔离：不挂任何 auth 中间件，限流器
// fail-open（Redis 故障时放行），目录构建失败只影响本端点自身。
func RegisterGetOneAPIPublicRoutes(v1 *gin.RouterGroup, h *handler.Handlers, redisClient *redis.Client) {
	rateLimiter := middleware.NewRateLimiter(redisClient)

	catalog := v1.Group("/catalog")
	catalog.GET("/public", rateLimiter.LimitWithOptions(
		"getoneapi-public-catalog", 120, time.Minute,
		middleware.RateLimitOptions{FailureMode: middleware.RateLimitFailOpen},
	), h.PublicCatalog.Get)
}
