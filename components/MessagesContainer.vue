<template>
  <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
    <!-- 顯示每條消息 -->
    <div 
      v-for="message in chatStore.currentChat.messages" 
      :key="message.id" 
      class="mb-4 p-3 rounded-lg max-w-4/5"
      :class="[
        message.role === 'user' 
          ? 'bg-blue-100 ml-auto rounded-br-none whitespace-pre-wrap' 
          : 'bg-gray-100 mr-auto rounded-bl-none whitespace-pre-wrap'
      ]"
    >
      {{ message.role === 'assistant' && chatStore.isStreaming && message === chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1] ? chatStore.streamingMessage : message.text }}
      <!-- 當消息正在生成時顯示光標效果 -->
      <span v-if="chatStore.isStreaming && message.role === 'assistant' && 
                 message === chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1]"
            class="inline-block w-[7px] h-4 bg-black ml-0.5 align-middle animate-[blink_1s_step-start_infinite]"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useChatStore } from '~/stores/chat';

const chatStore = useChatStore();
const messagesContainer = ref(null);

const messageChanged = async () => {
  console.log('useChat: messageChanged: ', chatStore.currentChat.messages);
  console.log('useChat: streamingMessage: ', chatStore.streamingMessage);

  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }

  // await nextTick();
};

watch(() => chatStore.currentChat.messages, messageChanged);
watch(() => chatStore.streamingMessage, messageChanged); // 監聽 streamingMessage 的變化
</script>

<style>
@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
