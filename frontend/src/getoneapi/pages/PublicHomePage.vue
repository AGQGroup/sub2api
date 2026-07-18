<template>
  <GetOneAPIPublicLayout>
    <main class="content g1-public-home">
      <section class="g1-public-home__intro" aria-labelledby="public-home-title">
        <div>
          <p class="g1-public-home__eyebrow">API access service</p>
          <h1 id="public-home-title">{{ appStore.siteName }}</h1>
          <p>
            {{ settings?.site_subtitle || 'Public service facts, pricing, and access documentation.' }}
          </p>
        </div>
        <dl>
          <div>
            <dt>API access</dt>
            <dd>{{ settings?.api_base_url || 'Provided after sign in' }}</dd>
          </div>
          <div>
            <dt>Catalog</dt>
            <dd>{{ appStore.getoneapiPublicCatalogEnabled ? 'Published below' : 'Documentation only' }}</dd>
          </div>
          <div>
            <dt>Account</dt>
            <dd><RouterLink to="/login">Sign in</RouterLink></dd>
          </div>
        </dl>
      </section>

      <CatalogPreview />

      <section class="g1-public-home__resources" aria-labelledby="resources-title">
        <div>
          <p class="g1-public-home__eyebrow">Resources</p>
          <h2 id="resources-title">Documentation and service terms</h2>
        </div>
        <nav aria-label="Public resources">
          <a v-for="link in links.documentation" :key="link.href" :href="link.href">{{ link.label }}</a>
          <RouterLink v-for="link in links.legal" :key="link.href" :to="link.href">{{ link.label }}</RouterLink>
          <a v-if="links.support?.href" :href="links.support.href">{{ links.support.label }}</a>
          <span v-else-if="links.support">Support: {{ links.support.label }}</span>
        </nav>
      </section>
    </main>
  </GetOneAPIPublicLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import GetOneAPIPublicLayout from '@/getoneapi/layouts/GetOneAPIPublicLayout.vue'
import CatalogPreview from '@/getoneapi/components/catalog/CatalogPreview.vue'
import { getPublicLinks } from '@/getoneapi/content/publicLinks'

const appStore = useAppStore()
const settings = computed(() => appStore.cachedPublicSettings)
const links = computed(() => getPublicLinks({
  doc_url: settings.value?.doc_url || appStore.docUrl,
  login_agreement_documents: settings.value?.login_agreement_documents,
  contact_info: settings.value?.contact_info || appStore.contactInfo,
}))
</script>

<style scoped>
.g1-public-home {
  padding: 0 clamp(16px, 4vw, 64px) 64px;
}

.g1-public-home__intro {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 48px;
  align-items: end;
  min-height: min(460px, calc(100dvh - 180px));
  padding-block: 64px 48px;
}

.g1-public-home__eyebrow,
.g1-public-home h1,
.g1-public-home h2,
.g1-public-home__intro p {
  margin: 0;
}

.g1-public-home__eyebrow {
  color: var(--g1-text-tertiary);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
}

.g1-public-home h1 {
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-size: 64px;
  line-height: 1.05;
}

.g1-public-home__intro > div > p:last-child {
  max-width: 62ch;
  margin-top: 16px;
  color: var(--g1-text-secondary);
  font-size: 18px;
  line-height: 1.6;
}

.g1-public-home__intro dl {
  margin: 0;
  border-block: 1px solid var(--g1-divider);
}

.g1-public-home__intro dl div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
}

.g1-public-home__intro dl div + div {
  border-top: 1px solid var(--g1-divider);
}

.g1-public-home__intro dt {
  color: var(--g1-text-tertiary);
}

.g1-public-home__intro dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.g1-public-home a {
  color: var(--g1-link);
  font-weight: 600;
}

.g1-public-home__resources {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 1fr);
  gap: 48px;
  padding-block: 64px 24px;
}

.g1-public-home__resources h2 {
  margin-top: 6px;
  font-size: 24px;
}

.g1-public-home__resources nav {
  display: grid;
  gap: 1px;
  border-block: 1px solid var(--g1-divider);
}

.g1-public-home__resources nav > * {
  display: flex;
  min-height: 44px;
  align-items: center;
  border-bottom: 1px solid var(--g1-divider);
}

@media (max-width: 767px) {
  .g1-public-home__intro,
  .g1-public-home__resources {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }

  .g1-public-home__intro {
    min-height: min(600px, calc(100dvh - 112px));
    padding-block: 40px 32px;
  }

  .g1-public-home h1 {
    font-size: 40px;
  }

  .g1-public-home__intro > div > p:last-child,
  .g1-public-home {
    font-size: 16px;
  }
}
</style>
