<template>
  <div class="default-layout">
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
// You can add script setup code here if needed
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
