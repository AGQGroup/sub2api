<template>
  <div data-surface="getoneapi-auth" class="g1-auth-layout">
    <PageHeader :show-login="false" />
    <main v-if="isLoginRoute" class="content g1-auth-grid">
      <section class="g1-auth-facts" aria-labelledby="service-facts-title">
        <p class="g1-auth-eyebrow">API access service</p>
        <h1 id="service-facts-title">{{ appStore.siteName }}</h1>
        <p class="g1-auth-subtitle">
          {{ settings?.site_subtitle || 'Published access, billing, and service information.' }}
        </p>
        <dl>
          <div>
            <dt>API endpoint</dt>
            <dd>{{ settings?.api_base_url || 'Available after sign in' }}</dd>
          </div>
          <div>
            <dt>Pricing source</dt>
            <dd>Public catalog</dd>
          </div>
          <div>
            <dt>Billing currency</dt>
            <dd>USD</dd>
          </div>
        </dl>
        <nav v-if="links.documentation.length" aria-label="Service documentation">
          <a v-for="link in links.documentation" :key="link.href" :href="link.href">
            {{ link.label }}
          </a>
        </nav>
      </section>

      <section class="g1-auth-panel" aria-label="Authentication">
        <slot />
        <footer v-if="$slots.footer" class="g1-auth-footer">
          <slot name="footer" />
        </footer>
      </section>

      <section class="g1-auth-catalog" aria-label="Catalog details">
        <CatalogPreview />
      </section>
    </main>
    <main v-else class="content g1-auth-compact">
      <section class="g1-auth-panel" aria-label="Authentication">
        <slot />
        <footer v-if="$slots.footer" class="g1-auth-footer">
          <slot name="footer" />
        </footer>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { routeLocationKey } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PageHeader from '@/getoneapi/components/PageHeader.vue'
import CatalogPreview from '@/getoneapi/components/catalog/CatalogPreview.vue'
import { getPublicLinks } from '@/getoneapi/content/publicLinks'

const appStore = useAppStore()
const route = inject(routeLocationKey, null)
const isLoginRoute = computed(() => route ? route.path === '/login' : true)
const settings = computed(() => appStore.cachedPublicSettings)
const links = computed(() => getPublicLinks({
  doc_url: settings.value?.doc_url || appStore.docUrl,
  login_agreement_documents: settings.value?.login_agreement_documents,
  contact_info: settings.value?.contact_info || appStore.contactInfo,
}))
</script>

<style scoped>
.g1-auth-layout {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--g1-canvas);
}

.g1-auth-grid {
  display: grid;
  grid-template-areas:
    'facts authentication'
    'catalog authentication';
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.85fr);
  gap: 40px 56px;
  align-items: start;
  padding: 48px clamp(24px, 4vw, 64px) 72px;
}

.g1-auth-facts {
  grid-area: facts;
  min-width: 0;
  padding-top: 16px;
}

.g1-auth-eyebrow,
.g1-auth-facts h1,
.g1-auth-subtitle {
  margin: 0;
}

.g1-auth-eyebrow {
  color: var(--g1-primary);
  font-size: var(--g1-text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.g1-auth-facts h1 {
  margin-top: 12px;
  overflow-wrap: anywhere;
  font-size: var(--g1-text-hero);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.g1-auth-subtitle {
  max-width: 54ch;
  margin-top: 16px;
  color: var(--g1-text-secondary);
  font-size: var(--g1-text-md);
  line-height: 1.65;
}

.g1-auth-facts dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 36px 0 0;
  border-block: 1px solid var(--g1-divider);
}

.g1-auth-facts dl > div {
  min-width: 0;
  padding: 14px 12px;
}

.g1-auth-facts dl > div + div {
  border-left: 1px solid var(--g1-divider);
}

.g1-auth-facts dt {
  color: var(--g1-text-tertiary);
  font-size: var(--g1-text-xs);
}

.g1-auth-facts dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  font-size: 14px;
}

.g1-auth-facts nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 16px;
}

.g1-auth-facts a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  color: var(--g1-link);
  font-weight: 600;
}

.g1-auth-panel {
  grid-area: authentication;
  min-width: 0;
  padding: 28px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
  box-shadow: var(--g1-shadow-raised);
}

.g1-auth-panel :deep(.space-y-6) {
  margin: 0;
}

.g1-auth-panel :deep(form) {
  margin-top: 24px;
}

.g1-auth-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--g1-divider);
  text-align: center;
}

.g1-auth-catalog {
  grid-area: catalog;
  min-width: 0;
}

.g1-auth-compact {
  display: flex;
  min-height: calc(100dvh - 64px);
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

.g1-auth-compact .g1-auth-panel {
  width: min(100%, 480px);
}

@media (min-width: 768px) and (max-width: 1023px) {
  .g1-auth-grid {
    gap: 28px 24px;
    padding-inline: 24px;
  }
}

@media (max-width: 767px) {
  .g1-auth-grid {
    display: grid;
    grid-template-areas:
      'facts'
      'authentication'
      'catalog';
    grid-template-columns: minmax(0, 1fr);
    gap: var(--g1-space-8);
    padding: 28px 16px 48px;
  }

  .g1-auth-facts h1 {
    font-size: 34px;
  }

  .g1-auth-facts dl {
    grid-template-columns: 1fr;
  }

  .g1-auth-facts dl > div + div {
    border-top: 1px solid var(--g1-divider);
    border-left: 0;
  }

  .g1-auth-panel {
    padding: 20px 16px;
  }
}
</style>
