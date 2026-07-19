import type { Page } from '@playwright/test'

export const publicSettings = {
  registration_enabled: true,
  email_verify_enabled: false,
  force_email_on_third_party_signup: false,
  registration_email_suffix_whitelist: [],
  promo_code_enabled: false,
  password_reset_enabled: true,
  invitation_code_enabled: false,
  login_agreement_enabled: false,
  login_agreement_documents: [
    { id: 'terms', title: 'Terms of service', content_md: 'Terms' },
    { id: 'privacy', title: 'Privacy notice', content_md: 'Privacy' },
  ],
  turnstile_enabled: false,
  turnstile_site_key: '',
  site_name: 'GetOneAPI',
  site_logo: '/logo.png',
  site_subtitle: 'A clear access layer for reviewed AI model endpoints.',
  api_base_url: 'https://api.getone.example/v1',
  contact_info: 'support@getone.example',
  doc_url: 'https://docs.getone.example/guide',
  home_content: '',
  hide_ccs_import_button: false,
  payment_enabled: true,
  risk_control_enabled: false,
  table_default_page_size: 20,
  table_page_size_options: [20, 50],
  custom_menu_items: [],
  custom_endpoints: [],
  linuxdo_oauth_enabled: false,
  dingtalk_oauth_enabled: false,
  wechat_oauth_enabled: false,
  wechat_oauth_open_enabled: false,
  wechat_oauth_mp_enabled: false,
  wechat_oauth_mobile_enabled: false,
  oidc_oauth_enabled: false,
  oidc_oauth_provider_name: 'OIDC',
  github_oauth_enabled: false,
  google_oauth_enabled: false,
  backend_mode_enabled: false,
  version: 'baseline',
  server_timezone: 'Asia/Shanghai',
  server_utc_offset: '+08:00',
  balance_low_notify_enabled: false,
  account_quota_notify_enabled: false,
  balance_low_notify_threshold: 0,
  channel_monitor_enabled: false,
  channel_monitor_default_interval_seconds: 60,
  available_channels_enabled: true,
  service_quota_enabled: false,
  affiliate_enabled: true,
  allow_user_view_error_requests: false,
  getoneapi_user_ui_enabled: true,
  getoneapi_public_catalog_enabled: true,
}

export const publicCatalog = {
  version: '2026.07.18',
  updated_at: '2026-07-18T08:30:00+08:00',
  currency: 'USD',
  token_price_unit: 'per_1m_tokens',
  timezone: 'Asia/Shanghai',
  groups: [
    {
      key: 'general',
      name: 'General',
      description: 'Reviewed models for standard API clients.',
      platform: 'anthropic',
      rate_multiplier: 1.1,
      peak_rate_enabled: true,
      peak_start: '09:00',
      peak_end: '18:00',
      peak_rate_multiplier: 1.25,
      supported_clients: ['Claude Code', 'OpenAI SDK'],
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
        {
          name: 'claude-haiku-4-5',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 1,
            output_per_million: 5,
            cache_write_per_million: 1.25,
            cache_read_per_million: 0.1,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
        {
          name: 'claude-opus-4-1',
          platform: 'anthropic',
          pricing: {
            billing_mode: 'token',
            input_per_million: 15,
            output_per_million: 75,
            cache_write_per_million: 18.75,
            cache_read_per_million: 1.5,
            image_output_per_million: null,
            per_request: null,
            intervals: [],
          },
        },
      ],
    },
    {
      key: 'openai',
      name: 'OpenAI compatible',
      description: 'Reviewed chat-completions compatible endpoints.',
      platform: 'openai',
      rate_multiplier: 1,
      peak_rate_enabled: false,
      peak_start: '',
      peak_end: '',
      peak_rate_multiplier: 1,
      supported_clients: ['OpenAI SDK'],
      models: [],
    },
  ],
}

export const authMeUser = {
  id: 100,
  email: 'user@example.test',
  role: 'user',
  balance: 25,
}

export const authMeAdmin = {
  id: 1,
  email: 'admin@example.test',
  role: 'admin',
  balance: 100,
}

export async function installDeterministicMocks(
  page: Page,
  mode: 'light' | 'dark',
  settings = publicSettings,
): Promise<void> {
  await page.addInitScript(
    ({ settings, theme }) => {
      (window as any).__APP_CONFIG__ = settings
      localStorage.setItem('theme', theme)
      localStorage.setItem('sub2api_locale', 'en')
    },
    { settings, theme: mode },
  )

  await page.route('**/setup/status*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: { needs_setup: false, step: 'complete' } }),
    }),
  )
  await page.route('**/api/v1/settings/public*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: settings }),
    }),
  )
  await page.route('**/api/v1/catalog/public*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: publicCatalog }),
    }),
  )
  await page.route('**/health', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    }),
  )
}

export async function installAuthenticatedMocks(
  page: Page,
  mode: 'light' | 'dark',
  role: 'user' | 'admin' = 'user',
): Promise<void> {
  const user = role === 'admin' ? authMeAdmin : authMeUser
  await installDeterministicMocks(page, mode)
  await page.addInitScript(
    ({ user }) => {
      localStorage.setItem('auth_token', 'e2e-token')
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    { user },
  )
  await page.route('**/api/v1/auth/me*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: user }),
    }),
  )
  await page.route('**/usage/dashboard/stats*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_api_keys: 1,
        active_api_keys: 1,
        total_requests: 5,
        today_requests: 2,
        today_cost: 0.05,
        today_actual_cost: 0.05,
        total_actual_cost: 0.25,
      }),
    }),
  )
  await page.route('**/usage/dashboard/trend*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ trend: [] }),
    }),
  )
  await page.route('**/usage/dashboard/models*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ models: [] }),
    }),
  )
  await page.route('**/api/v1/keys*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 1,
            key: 'sk-test-redacted',
            name: 'My key',
            status: 'active',
            group_id: 1,
            quota: 0,
            created_at: '2026-07-18T00:00:00+08:00',
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
        pages: 1,
      }),
    }),
  )
  await page.route('**/api/v1/groups*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0 }),
    }),
  )
}
