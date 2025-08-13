<template>
  <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
    <!-- 無當前對話時顯示提示 -->
    <div v-if="!chatStore.currentChat" class="flex items-center justify-center h-full text-gray-500">
      請選擇或開始一個新的對話
    </div>
    <!-- 顯示每條消息 -->
    <div 
      v-else
      v-for="message in chatStore.currentChat.messages" 
      :key="message.id" 
      class="mb-4 p-3 rounded-lg max-w-4/5"
      :class="[
        message.role === 'user' 
          ? 'bg-blue-100 ml-auto rounded-br-none whitespace-pre-wrap' 
          : 'bg-gray-100 mr-auto rounded-bl-none whitespace-pre-wrap'
      ]"
    >
      {{ message.role === 'assistant' && chatStore.isStreaming && message === chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1] ? chatStore.streamingMessage : message.text || message.content }}
      <!-- 當消息正在生成時顯示光標效果 -->
      <span v-if="chatStore.isStreaming && message.role === 'assistant' && 
                 message === chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1]"
            class="inline-block w-[7px] h-4 bg-black ml-0.5 align-middle animate-[blink_1s_step-start_infinite]"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useChatStore } from '../stores/chatStore';
import type { Message } from '../stores/chatStore';

const chatStore = useChatStore();
const messagesContainer = ref<HTMLDivElement | null>(null);

const messageChanged = async () => {
  if (!chatStore.currentChat) return;
  
  if (messagesContainer.value) {
    await nextTick();
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 使用可選鏈運算符避免 currentChat 為 null 時出錯
watch(() => chatStore.currentChat?.messages, messageChanged, { deep: true });
watch(() => chatStore.streamingMessage, messageChanged);
</script>

<style>
@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
