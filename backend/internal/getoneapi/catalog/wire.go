package catalog

import (
	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/service"

	"github.com/google/wire"
)

// ProvideService is the Wire provider: it adapts the concrete channel and
// pricing services to this package's unexported source/resolver interfaces.
func ProvideService(cfg *config.Config, channelService *service.ChannelService, resolver *service.ModelPricingResolver) *Service {
	return NewService(cfg, channelService, resolver)
}

// ProviderSet wires the catalog Service.
var ProviderSet = wire.NewSet(ProvideService)
