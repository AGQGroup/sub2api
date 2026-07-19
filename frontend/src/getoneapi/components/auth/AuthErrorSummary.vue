<template>
  <div v-if="errors.length" class="g1-auth-errors" role="alert">
    <p v-for="(error, idx) in errors" :key="idx" class="g1-auth-errors__item">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  errors: string[]
}>()
</script>

<style scoped>
.g1-auth-errors {
  padding: 12px 16px;
  border: 1px solid var(--g1-danger);
  border-radius: var(--g1-radius-md);
  background: color-mix(in srgb, var(--g1-danger) 6%, transparent);
  margin-bottom: 16px;
}

.g1-auth-errors__item {
  margin: 0;
  font-size: 14px;
  color: var(--g1-danger);
  line-height: 1.5;
}

.g1-auth-errors__item + .g1-auth-errors__item {
  margin-top: 6px;
}
</style>
