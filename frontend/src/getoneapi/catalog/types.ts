// Contract source of truth: backend/internal/getoneapi/catalog/catalog.go — keep these types in sync with the Go snapshot DTOs.
export interface PublicCatalogPricingInterval {
  min_tokens: number
  max_tokens: number | null
  tier_label?: string
  input_per_million: number | null
  output_per_million: number | null
  cache_write_per_million: number | null
  cache_read_per_million: number | null
  per_request: number | null
}

export interface PublicCatalogPricing {
  billing_mode: 'token' | 'per_request' | 'image'
  input_per_million: number | null
  output_per_million: number | null
  cache_write_per_million: number | null
  cache_read_per_million: number | null
  image_output_per_million: number | null
  per_request: number | null
  intervals: PublicCatalogPricingInterval[]
}

export interface PublicCatalogModel {
  name: string
  platform: string
  pricing: PublicCatalogPricing
}

export interface PublicCatalogGroup {
  key: string
  name: string
  description: string
  platform: string
  rate_multiplier: number
  peak_rate_enabled: boolean
  peak_start: string
  peak_end: string
  peak_rate_multiplier: number
  supported_clients: string[]
  models: PublicCatalogModel[]
}

export interface PublicCatalog {
  version: string
  updated_at: string
  currency: 'USD'
  token_price_unit: 'per_1m_tokens'
  timezone: string
  groups: PublicCatalogGroup[]
}
