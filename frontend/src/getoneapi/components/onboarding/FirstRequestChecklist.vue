<template>
  <section data-ui="first-request-checklist" class="g1-checklist" aria-labelledby="g1-checklist-title">
    <h3 id="g1-checklist-title" class="g1-checklist__title">{{ t('getoneapi.onboarding.title') }}</h3>
    <ul class="g1-checklist__list">
      <li
        v-for="step in steps"
        :key="step.id"
        class="g1-checklist__step"
        :class="{ 'g1-checklist__step--complete': step.complete }"
        :data-ui="`checklist-${step.id}`"
        :data-complete="step.complete"
      >
        <span class="g1-checklist__marker" aria-hidden="true">
          <Icon v-if="step.complete" name="checkCircle" size="md" />
          <span v-else class="g1-checklist__dot" />
        </span>
        <span class="g1-checklist__label">
          {{ t(`getoneapi.onboarding.${step.id}`) }}
        </span>
        <router-link
          v-if="!step.complete"
          :to="step.href"
          class="g1-checklist__link"
          :data-ui="`checklist-action-${step.id}`"
        >
          {{ t('getoneapi.onboarding.go') }}
        </router-link>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import {
  resolveFirstRequestProgress,
  type FirstRequestFacts,
} from '@/getoneapi/adapters/firstRequestProgress'

const { t } = useI18n()

const props = defineProps<{
  facts: FirstRequestFacts
}>()

defineEmits<{ createKey: [] }>()

const steps = computed(() => resolveFirstRequestProgress(props.facts))
</script>

<style scoped>
.g1-checklist {
  padding: 24px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
}

.g1-checklist__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-checklist__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.g1-checklist__step {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.g1-checklist__step--complete .g1-checklist__label {
  color: var(--g1-text-tertiary);
  text-decoration: line-through;
}

.g1-checklist__marker {
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.g1-checklist__step--complete .g1-checklist__marker {
  color: var(--g1-success);
}

.g1-checklist__dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--g1-text-tertiary);
}

.g1-checklist__label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--g1-text);
}

.g1-checklist__link {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  padding: 0 12px;
  border-radius: var(--g1-radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--g1-primary);
  text-decoration: none;
  background: var(--g1-control);
}

.g1-checklist__link:hover {
  background: var(--g1-divider);
}
</style>
