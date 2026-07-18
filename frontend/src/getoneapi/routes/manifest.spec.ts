import { describe, expect, it } from 'vitest'
import { routes } from '@/router'
import { getoneapiRouteManifest } from './manifest'

describe('GetOneAPI route ownership', () => {
  it('classifies every public and regular-user page', () => {
    // Ownership rule: public + regular-user = everything except /setup and /admin*
    const actual = routes
      .filter((route) => route.component)
      .map((route) => route.path)
      .filter((path) => path !== '/setup' && !path.startsWith('/admin'))
      .sort()
    expect(actual).toEqual(Object.keys(getoneapiRouteManifest).sort())
  })

  it('pins the exact core-5 set', () => {
    const core5 = Object.entries(getoneapiRouteManifest)
      .filter(([, phase]) => phase === 'core-5')
      .map(([path]) => path)
      .sort()
    expect(core5).toEqual([
      '/auth/callback',
      '/auth/dingtalk/callback',
      '/auth/dingtalk/email-completion',
      '/auth/linuxdo/callback',
      '/auth/oidc/callback',
      '/auth/wechat/callback',
      '/dashboard',
      '/email-verify',
      '/forgot-password',
      '/home',
      '/keys',
      '/login',
      '/register',
      '/reset-password'
    ])
  })

  it('never claims setup or an admin route', () => {
    const paths = Object.keys(getoneapiRouteManifest)
    expect(paths).not.toContain('/setup')
    expect(paths.some((path) => path.startsWith('/admin'))).toBe(false)
  })
})
