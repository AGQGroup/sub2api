export interface NavItem {
  path: string
  labelKey: string
  icon: string
}

export const coreUserNavigation = [
  { path: '/dashboard', labelKey: 'getoneapi.nav.overview', icon: 'home' },
  { path: '/keys', labelKey: 'getoneapi.nav.keys', icon: 'key' },
  { path: '/usage', labelKey: 'getoneapi.nav.usage', icon: 'chartBar' },
  { path: '/available-channels', labelKey: 'getoneapi.nav.services', icon: 'server' },
  { path: '/profile', labelKey: 'getoneapi.nav.account', icon: 'user' },
] as const

export const secondaryNavigation: NavItem[] = [
  { path: '/purchase', labelKey: 'getoneapi.nav.subscription', icon: 'creditCard' },
  { path: '/subscriptions', labelKey: 'getoneapi.nav.mySubscriptions', icon: 'inbox' },
  { path: '/redeem', labelKey: 'getoneapi.nav.redeem', icon: 'gift' },
  { path: '/affiliate', labelKey: 'getoneapi.nav.affiliate', icon: 'userPlus' },
]

export const utilityNavigation: NavItem[] = [
  { path: '/monitor', labelKey: 'getoneapi.nav.monitor', icon: 'cpu' },
  { path: '/batch-image', labelKey: 'getoneapi.nav.batchImage', icon: 'cube' },
  { path: '/orders', labelKey: 'getoneapi.nav.orders', icon: 'document' },
]
