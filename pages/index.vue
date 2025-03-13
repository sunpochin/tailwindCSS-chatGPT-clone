/**
 * @file 首頁
 * @description 包含聊天組件的首頁
 */

<template>
  <ChatComponent />
</template>

<script setup lang="ts">
import ChatComponent from '@/components/ChatComponent.vue'
</script>

<style scoped>
/* Page styles */
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
}

header {
  margin-bottom: 20px;
}

main {
  display: flex;
  gap: 20px;
}
</style>
