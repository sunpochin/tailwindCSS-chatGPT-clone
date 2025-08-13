<template>
  <div class="chat-container">
    <!-- 歡迎界面，當沒有選擇聊天時顯示 -->
    <div v-if="!chatStore.currentChat" class="welcome-screen">
      <p>點擊側邊欄的「新對話」開始聊天</p>
    </div>
    <!-- 當有選擇聊天時顯示聊天界面 -->
    <template v-else>
      <LLMSelectorComponent />
      <MessagesContainer />
      <InputContainer />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '../stores/chatStore';
import MessagesContainer from './MessagesContainer.vue';
import InputContainer from './InputContainer.vue';
import LLMSelectorComponent from './LLMSelectorComponent.vue';

const chatStore = useChatStore();
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #444;
}
</style>
