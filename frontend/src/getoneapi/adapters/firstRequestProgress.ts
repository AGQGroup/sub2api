export interface FirstRequestFacts {
  keyCount: number
  configurationOpened: boolean
  totalRequests: number
}

export function resolveFirstRequestProgress(facts: FirstRequestFacts) {
  return [
    { id: 'key', complete: facts.keyCount > 0, href: '/keys' },
    { id: 'configure', complete: facts.configurationOpened, href: '/keys' },
    { id: 'request', complete: facts.totalRequests > 0, href: '/dashboard' },
  ] as const
}
