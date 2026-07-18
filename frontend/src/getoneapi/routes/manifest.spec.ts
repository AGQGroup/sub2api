import { describe, expect, it } from 'vitest'
import { routes } from '@/router'
import { getoneapiRouteManifest } from './manifest'

describe('GetOneAPI route ownership', () => {
  it('classifies every public and regular-user page', () => {
    const actual = routes
      .filter((route) => route.component)
      .map((route) => route.path)
      .filter((path) => path !== '/setup' && !path.startsWith('/admin'))
      .sort()
    expect(actual).toEqual(Object.keys(getoneapiRouteManifest).sort())
  })

  it('never claims setup or an admin route', () => {
    const paths = Object.keys(getoneapiRouteManifest)
    expect(paths).not.toContain('/setup')
    expect(paths.some((path) => path.startsWith('/admin'))).toBe(false)
  })
})
