/**
 * @file 聊天頁面
 * @description 顯示特定聊天的消息內容
 */

<template>
  <div class="chat-page">
    <!-- 聊天消息顯示區域 -->
    <div class="chat-page__messages" v-if="currentChat">
      <!-- 顯示每條消息 -->
      <div 
        v-for="(message, index) in currentChat.messages" 
        :key="index" 
        :class="['chat-page__message', message.role]"
      >
        {{ message.content }}
      </div>
    </div>
    <div v-else-if="loading">載入中...</div>
    <div v-else>找不到聊天內容</div>
    
    <ChatComponent :chat="currentChat" />
  </div>
</template>

<script setup>
import ChatComponent from '../../components/ChatComponent.vue';
const route = useRoute();
const chatId = ref(route.params.id);
const currentChat = ref(null);
const loading = ref(true);

/**
 * @description 組件掛載時加載聊天內容
 */
onMounted(async () => {
  await loadChatById(chatId.value);
});

/**
 * @description 監聽路由變化並加載新聊天內容
 */
watch(() => route.params.id, async (newId) => {
  chatId.value = newId;
  await loadChatById(newId);
});

/**
 * @description 根據ID加載聊天內容
 * @param {string} id - 聊天ID
 */
async function loadChatById(id) {
  loading.value = true;
  try {
    // 從本地存儲或API加載聊天內容
    // 這裡假設你使用localStorage存儲聊天數據
    const chatsJson = localStorage.getItem('chats') || '[]';
    const chats = JSON.parse(chatsJson);
    const chat = chats.find(c => c.id === id);
    
    if (chat) {
      currentChat.value = chat;
    } else {
      console.error('找不到對應ID的聊天');
      currentChat.value = null;
    }
  } catch (error) {
    console.error('載入聊天時發生錯誤:', error);
    currentChat.value = null;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* 聊天頁面主樣式 */
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
}

/* 聊天消息容器樣式 */
.chat-page__messages {
  flex: 1;
  overflow-y: auto;
}

/* 單條消息樣式 */
.chat-page__message {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  max-width: 80%;
}
</style>