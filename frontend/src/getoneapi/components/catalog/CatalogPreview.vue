<template>
  <section class="g1-catalog" aria-labelledby="public-pricing-title">
    <div class="g1-catalog__intro">
      <p>Public catalog</p>
      <h2 id="public-pricing-title">Published pricing</h2>
    </div>

    <SurfaceState
      v-if="!enabled"
      state="disabled"
      title="Billing rules and documentation"
      message="Public model pricing is not published for this service."
    >
      <a v-for="link in links.documentation" :key="link.href" :href="link.href">{{ link.label }}</a>
    </SurfaceState>

    <SurfaceState v-else-if="state === 'idle' || state === 'loading'" state="loading" />

    <SurfaceState
      v-else-if="state === 'empty'"
      state="empty"
      title="No public pricing is published"
      message="Review the billing rules for the current service terms."
    >
      <a v-if="billingRulesLink" :href="billingRulesLink.href">{{ billingRulesLink.label }}</a>
    </SurfaceState>

    <SurfaceState
      v-else-if="state === 'error'"
      state="error"
      title="Pricing is temporarily unavailable"
      message="Authentication remains available. Retry pricing or review the billing rules."
      retryable
      @retry="loadCatalog"
    >
      <a v-if="billingRulesLink" :href="billingRulesLink.href">{{ billingRulesLink.label }}</a>
    </SurfaceState>

    <div v-else-if="catalog && activeGroup" data-catalog-state="ready">
      <CatalogMeta :catalog="catalog" />

      <div class="g1-catalog__tabs" role="tablist" aria-label="Pricing groups">
        <button
          v-for="(group, index) in catalog.groups"
          :id="`catalog-tab-${group.key}`"
          :key="group.key"
          type="button"
          role="tab"
          :aria-selected="group.key === activeGroup.key"
          :aria-controls="`catalog-panel-${group.key}`"
          :tabindex="group.key === activeGroup.key ? 0 : -1"
          ref="groupTabs"
          @click="activeGroupKey = group.key"
          @keydown="selectGroup($event, index)"
        >
          {{ group.name }}
        </button>
      </div>

      <div
        :id="`catalog-panel-${activeGroup.key}`"
        role="tabpanel"
        :aria-labelledby="`catalog-tab-${activeGroup.key}`"
      >
        <GroupPricingTable :group="activeGroup" :currency="catalog.currency" />
      </div>

      <div class="g1-catalog__disclosure">
        <button
          type="button"
          data-ui="catalog-disclosure"
          :aria-expanded="disclosureOpen"
          aria-controls="catalog-disclosure-content"
          @click="disclosureOpen = !disclosureOpen"
          @keydown="toggleDisclosureFromKeyboard"
        >
          Full pricing disclosure
          <Icon name="chevronDown" size="sm" aria-hidden="true" />
        </button>
        <div v-if="disclosureOpen" id="catalog-disclosure-content">
          <p>
            Effective prices apply the published group multiplier to the model price. Peak windows
            apply the published peak multiplier where enabled. Prices are shown in
            {{ catalog.currency }} using {{ catalog.token_price_unit }}.
          </p>
          <a v-if="billingRulesLink" :href="billingRulesLink.href">Read billing rules</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'
import { getPublicCatalog } from '@/getoneapi/catalog/api'
import type { PublicCatalog } from '@/getoneapi/catalog/types'
import { getPublicLinks } from '@/getoneapi/content/publicLinks'
import SurfaceState from '@/getoneapi/components/SurfaceState.vue'
import CatalogMeta from './CatalogMeta.vue'
import GroupPricingTable from './GroupPricingTable.vue'

type CatalogState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

const appStore = useAppStore()
const state = ref<CatalogState>('idle')
const catalog = shallowRef<PublicCatalog | null>(null)
const activeGroupKey = ref('')
const disclosureOpen = ref(false)
const groupTabs = ref<HTMLButtonElement[]>([])
let controller: AbortController | null = null

const enabled = computed(() => appStore.getoneapiPublicCatalogEnabled)
const settings = computed(() => appStore.cachedPublicSettings)
const links = computed(() => getPublicLinks({
  doc_url: settings.value?.doc_url || appStore.docUrl,
  login_agreement_documents: settings.value?.login_agreement_documents,
  contact_info: settings.value?.contact_info || appStore.contactInfo,
}))
const billingRulesLink = computed(() =>
  links.value.documentation.find((link) => link.label === 'Billing rules') || null
)
const activeGroup = computed(() =>
  catalog.value?.groups.find((group) => group.key === activeGroupKey.value)
    || catalog.value?.groups[0]
    || null
)

async function loadCatalog(): Promise<void> {
  if (!appStore.getoneapiPublicCatalogEnabled) return
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  try {
    catalog.value = await getPublicCatalog({ signal: controller.signal })
    state.value = catalog.value.groups.length ? 'ready' : 'empty'
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') return
    state.value = 'error'
  }
}

function selectGroup(event: KeyboardEvent, index: number): void {
  if (!catalog.value || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const groups = catalog.value.groups
  let nextIndex = index
  if (event.key === 'ArrowRight') nextIndex = (index + 1) % groups.length
  if (event.key === 'ArrowLeft') nextIndex = (index - 1 + groups.length) % groups.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = groups.length - 1
  activeGroupKey.value = groups[nextIndex].key
  void nextTick(() => groupTabs.value[nextIndex]?.focus())
}

function toggleDisclosureFromKeyboard(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  disclosureOpen.value = !disclosureOpen.value
}

watch(catalog, (value) => {
  activeGroupKey.value = value?.groups[0]?.key || ''
})
onMounted(loadCatalog)
onBeforeUnmount(() => controller?.abort())
</script>

<style scoped>
.g1-catalog {
  min-width: 0;
}

.g1-catalog__intro {
  margin-bottom: 16px;
}

.g1-catalog__intro p,
.g1-catalog__intro h2 {
  margin: 0;
}

.g1-catalog__intro p {
  color: var(--g1-text-tertiary);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
}

.g1-catalog__intro h2 {
  margin-top: 4px;
  font-size: 24px;
}

.g1-catalog__tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-block: 12px;
  border-bottom: 1px solid var(--g1-divider);
}

.g1-catalog__tabs button {
  flex: 0 0 auto;
  background: transparent;
  color: var(--g1-text-secondary);
}

.g1-catalog__tabs button[aria-selected='true'] {
  background: var(--g1-control);
  color: var(--g1-text);
}

.g1-catalog__disclosure {
  padding-block: 16px;
  border-bottom: 1px solid var(--g1-divider);
}

.g1-catalog__disclosure > button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding-inline: 0;
  background: transparent;
  font-weight: 600;
  text-align: left;
}

.g1-catalog__disclosure p {
  max-width: 72ch;
  color: var(--g1-text-secondary);
  line-height: 1.6;
}

.g1-catalog a,
.g1-catalog__disclosure a {
  color: var(--g1-link);
  font-weight: 600;
}
</style>
