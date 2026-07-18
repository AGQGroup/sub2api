import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PublicCatalog } from '../types'

const { get } = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  apiClient: {
    get,
  },
}))

import { getPublicCatalog } from '../api'

const fixtureCatalog: PublicCatalog = {
  version: '2026-07-18',
  updated_at: '2026-07-18T00:00:00Z',
  currency: 'USD',
  token_price_unit: 'per_1m_tokens',
  timezone: 'UTC',
  groups: [
    {
      key: 'default',
      name: 'Default',
      description: 'Default group',
      platform: 'anthropic',
      rate_multiplier: 1,
      peak_rate_enabled: false,
      peak_start: '',
      peak_end: '',
      peak_rate_multiplier: 1,
      supported_clients: ['claude-code'],
      models: [
        {
          name: 'claude-sonnet-4-5',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 3,
            output_per_million: 15,
            cache_write_per_million: 3.75,
            cache_read_per_million: 0.3,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
      ],
    },
  ],
}

describe('getoneapi catalog api', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('requests the unauthenticated public catalog', async () => {
    get.mockResolvedValue({ data: fixtureCatalog })

    await expect(getPublicCatalog()).resolves.toEqual(fixtureCatalog)
    expect(get).toHaveBeenCalledWith('/catalog/public', { signal: undefined })
  })

  it('forwards an abort signal when provided', async () => {
    get.mockResolvedValue({ data: fixtureCatalog })
    const controller = new AbortController()

    await expect(getPublicCatalog({ signal: controller.signal })).resolves.toEqual(fixtureCatalog)
    expect(get).toHaveBeenCalledWith('/catalog/public', { signal: controller.signal })
  })
})
