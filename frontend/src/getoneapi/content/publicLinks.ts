import type { PublicSettings } from '@/types'
import { sanitizeUrl } from '@/utils/url'

export interface PublicLink {
  label: string
  href: string
}

export interface PublicLinks {
  documentation: PublicLink[]
  legal: PublicLink[]
  support: PublicLink | null
}

type PublicLinkSettings = Pick<
  PublicSettings,
  'doc_url' | 'login_agreement_documents' | 'contact_info'
>

function documentationLinks(docUrl: string): PublicLink[] {
  const safeUrl = sanitizeUrl(docUrl)
  if (!safeUrl) return []
  return [{ label: 'Documentation', href: safeUrl }]
}

function legalLinks(settings: PublicLinkSettings): PublicLink[] {
  if (!Array.isArray(settings.login_agreement_documents)) return []

  return settings.login_agreement_documents.flatMap((document) => {
    const id = document.id?.trim()
    const label = document.title?.trim()
    return id && label
      ? [{ label, href: `/legal/${encodeURIComponent(id)}` }]
      : []
  })
}

function supportLink(contactInfo: string): PublicLink | null {
  const label = contactInfo.trim()
  if (!label) return null
  return { label, href: sanitizeUrl(label) }
}

export function getPublicLinks(settings: PublicLinkSettings): PublicLinks {
  return {
    documentation: documentationLinks(settings.doc_url || ''),
    legal: legalLinks(settings),
    support: supportLink(settings.contact_info || ''),
  }
}
