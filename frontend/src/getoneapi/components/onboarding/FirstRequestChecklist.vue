<template>
  <section data-ui="first-request-checklist" class="g1-checklist" aria-labelledby="g1-checklist-title">
    <div class="g1-checklist__header">
      <h3 id="g1-checklist-title" class="g1-checklist__title">{{ t('getoneapi.onboarding.title') }}</h3>
      <span class="g1-checklist__progress-text" aria-hidden="true">{{ completedCount }}/{{ steps.length }}</span>
    </div>
    <div class="g1-checklist__progress-track" role="progressbar" :aria-valuenow="completedCount" :aria-valuemax="steps.length" :aria-label="t('getoneapi.onboarding.title')">
      <div class="g1-checklist__progress-fill" :style="{ width: `${(completedCount / steps.length) * 100}%` }" />
    </div>
    <ul class="g1-checklist__list">
      <li
        v-for="step in steps"
        :key="step.id"
        class="g1-checklist__step"
        :class="{ 'g1-checklist__step--complete': step.complete }"
        :data-ui="`checklist-${step.id}`"
        :data-complete="step.complete"
      >
        <span class="g1-checklist__marker" :class="{ 'g1-checklist__marker--done': step.complete }" aria-hidden="true">
          <Icon v-if="step.complete" name="check" size="sm" />
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
const completedCount = computed(() => steps.value.filter((s) => s.complete).length)
</script>

<style scoped>
.g1-checklist {
  padding: 24px;
  border: 1px solid var(--g1-divider);
  border-radius: var(--g1-radius-md);
  background: var(--g1-surface);
  box-shadow: var(--g1-shadow-raised);
}

.g1-checklist__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.g1-checklist__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--g1-text);
}

.g1-checklist__progress-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--g1-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.g1-checklist__progress-track {
  height: 4px;
  margin-bottom: 18px;
  border-radius: 2px;
  background: var(--g1-control);
  overflow: hidden;
}

.g1-checklist__progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--g1-primary);
  transition: width 300ms ease;
}

.g1-checklist__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.g1-checklist__step {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.g1-checklist__step--complete .g1-checklist__label {
  color: var(--g1-text-tertiary);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.g1-checklist__marker {
  display: flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
}

.g1-checklist__marker--done {
  background: var(--g1-success);
  color: #ffffff;
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
  min-height: 44px;
  align-items: center;
  padding: 0 14px;
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
