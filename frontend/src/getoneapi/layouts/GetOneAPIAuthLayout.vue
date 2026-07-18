<template>
  <div data-surface="getoneapi-auth" class="flex min-h-screen flex-col">
    <main class="flex flex-1 items-center justify-center p-4">
      <slot />
    </main>
    <footer v-if="$slots.footer" class="p-4 text-center">
      <slot name="footer" />
    </footer>
  </div>
</template>
