/**
 * @file 側邊欄組件
 * @description 此組件顯示聊天歷史列表，並提供創建新對話、切換對話、刪除對話等功能
 */

<template>
  <aside class="chat-sidebar">
    <!-- 側邊欄頂部區域 -->
    <div class="sidebar-header">
      <!-- 新建對話按鈕 -->
      <button class="new-chat-button" @click="createNewChat">
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新對話
      </button>
    </div>
    
    <!-- 聊天歷史列表 -->
    <div class="chat-history">
      <div v-if="chatStore.chats.length === 0" class="empty-history">
        尚無對話紀錄
      </div>
      <template v-for="(chat, index) in sortedChats" :key="chat.id">
        <!-- 分隔線 -->
        <div v-if="shouldShowDivider(index)" class="divider">{{ getDividerText(index) }}</div>
        <button 
          class="chat-item" 
          :class="{ 'active': chatStore.currentChatId === chat.id }"
          @click="selectChat(chat.id)"
        >
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="chat-title">{{ chat.title }}</span>
          <span class="chat-timestamp">{{ formatTimestamp(chat.timestamp) }}</span> <!-- 顯示時間 -->
          <span class="delete-chat-button" @click.stop="chatStore.deleteChat(chat.id)">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        </button>
      </template>
    </div>
    
    <!-- 側邊欄底部區域 -->
    <div class="sidebar-footer">
      <!-- 設定按鈕 -->
      <button class="footer-button">
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="icon" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>設定</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * @file 側邊欄組件
 * @description 此組件顯示聊天歷史列表，並提供創建新對話、切換對話、刪除對話等功能
 */

/**
 * 引入聊天狀態管理 Store 和 Vue Router
 * 使用 Pinia 管理聊天狀態，使用 Vue Router 處理 URL 導航
 */
import { useChatStore } from '~/stores/chat';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

/**
 * 初始化聊天狀態 Store 和 Router
 */
const chatStore = useChatStore();
const router = useRouter();
const route = useRoute();

/**
 * 生命週期鉤子 - 組件掛載後
 * 檢查 URL 中是否包含聊天 ID，有則選擇對應聊天
 */
onMounted(() => {
  // 檢查 URL 是否已有聊天 ID
  const chatId = route.params.id as string;
  if (chatId && chatStore.chatExists(chatId)) {
    chatStore.selectChat(chatId);
  } else if (chatStore.chats.length > 0 && !chatStore.currentChatId) {
    // 如果 URL 中沒有 ID 但有聊天，選擇第一個聊天並更新 URL
    const firstChatId = chatStore.chats[0].id;
    router.replace(`/chat/${firstChatId}`);
  }
});

/**
 * 創建新對話的方法
 * 創建新聊天並導航到新聊天的 URL
 */
const createNewChat = async () => {
  await chatStore.createNewChat();
  if (chatStore.currentChatId) {
    router.push(`/chat/${chatStore.currentChatId}`);
  }
};

/**
 * 切換對話的方法
 * 更新 URL 以反映當前選擇的聊天
 */
const selectChat = (id: string) => {
  router.push(`/chat/${id}`);
  chatStore.selectChat(id);
};

/**
 * 格式化時間戳
 * @param {string} timestamp - ISO 格式的時間戳
 * @returns {string} 格式化後的時間字串
 */
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 將聊天按時間排序，最近的在最前面，無效日期的在最後面
 */
const sortedChats = computed(() => {
  return chatStore.chats.slice().sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    return dateB.getTime() - dateA.getTime();
  });
});

/**
 * 判斷是否需要顯示分隔線
 * @param {number} index - 當前聊天項目的索引
 * @returns {boolean} 是否顯示分隔線
 */
const shouldShowDivider = (index: number) => {
  if (index === 0) return true;
  const currentChat = sortedChats.value[index];
  const previousChat = sortedChats.value[index - 1];
  const currentDate = new Date(currentChat.timestamp);
  const previousDate = previousChat ? new Date(previousChat.timestamp) : null;

  if (isNaN(currentDate.getTime())) {
    return !sortedChats.value.slice(0, index).some(chat => isNaN(new Date(chat.timestamp).getTime()));
  }

  return !previousDate || currentDate.getDate() !== previousDate.getDate();
};

/**
 * 獲取分隔線文本
 * @param {number} index - 當前聊天項目的索引
 * @returns {string} 分隔線文本
 */
const getDividerText = (index: number) => {
  const currentChat = sortedChats.value[index];
  const currentDate = new Date(currentChat.timestamp);
  const previousChat = sortedChats.value[index - 1];
  const previousDate = previousChat ? new Date(previousChat.timestamp) : null;

  if (isNaN(currentDate.getTime())) {
    return '最近 30 天';
  }

  const now = new Date();
  const isToday = currentDate.toDateString() === now.toDateString();
  const isYesterday = currentDate.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();

  if (isToday && (!previousDate || previousDate.toDateString() !== currentDate.toDateString())) {
    return '今天';
  }

  if (isYesterday && (!previousDate || previousDate.toDateString() !== currentDate.toDateString())) {
    return '昨天';
  }

  return '';
};
</script>

<style scoped>
/* 側邊欄主容器樣式 */
.chat-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  background-color: #202123; /* 深色背景，類似於 ChatGPT 界面 */
  color: white;
  height: 100vh;
  overflow-y: auto;
}

/* 側邊欄頂部區域樣式 */
.sidebar-header {
  padding: 10px;
}

/* 新建對話按鈕樣式 */
.new-chat-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* 新建對話按鈕懸停效果 */
.new-chat-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 聊天歷史列表容器樣式 */
.chat-history {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

/* 無聊天歷史時的顯示樣式 */
.empty-history {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
}

/* 聊天歷史項目樣式 */
.chat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
  border: none;
  position: relative;
}

/* 聊天歷史項目懸停效果 */
.chat-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 當前選中的聊天項目樣式 */
.chat-item.active {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 聊天標題樣式 */
.chat-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 聊天時間樣式 */
.chat-timestamp {
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.6);
  margin-left: auto;
}

/* 刪除聊天按鈕樣式 */
.delete-chat-button {
  visibility: hidden; /* 默認隱藏，只在懸停時顯示 */
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 2px;
}

/* 當懸停在聊天項目上時顯示刪除按鈕 */
.chat-item:hover .delete-chat-button {
  visibility: visible;
}

/* 刪除按鈕懸停效果 */
.delete-chat-button:hover {
  color: white;
}

/* 側邊欄底部區域樣式 */
.sidebar-footer {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* 底部按鈕樣式（如設定按鈕） */
.footer-button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  background-color: transparent;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  text-align: left;
}

/* 底部按鈕懸停效果 */
.footer-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 圖標樣式，避免圖標變形 */
.icon {
  flex-shrink: 0;
}

/* 分隔線樣式 */
.divider {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 10px 0;
  font-size: 0.9em;
}
</style>
