<template>
  <div class="app" id="app">
    <ClientOnly>
      <!-- Loading indicator for non-hydrated state -->
      <template #fallback>
        <div class="app__loading-state">Loading application...</div>
      </template>
      
      <NuxtLayout>
        <div class="app__container">
          <ChatSidebar />
          <div class="app__main-content">
            <NuxtPage />
          </div>
        </div>
      </NuxtLayout>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
/**
 * @file 應用程式的主要入口點
 * @description 這個檔案是整個應用程式的根元件，定義了基本的頁面佈局結構
 */

/**
 * 引入側邊欄組件
 * 側邊欄組件負責顯示聊天歷史和提供新建聊天的功能
 */
import { useChatStore } from '../stores/chatStore';
import ChatSidebar from './components/ChatSidebar.vue';

// 確保 hydration 不會中斷，使用 onMounted
onMounted(() => {
  const chatStore = useChatStore();
  chatStore.fetchMessages();
});

</script>

<style scoped>
/* 應用程式主樣式 */
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 應用程式容器樣式 */
.app__container {
  display: flex;
  height: 100%;
  flex: 1;
  overflow: hidden;
}

/* 主內容區域樣式 */
.app__main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 全局樣式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 加載狀態樣式 */
.app__loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
}
</style>