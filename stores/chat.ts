import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useChat } from '~/composables/useChat';

/**
 * @file 聊天狀態管理 Store
 * @description 使用 Pinia 管理聊天相關的狀態，包括聊天歷史、當前聊天、發送消息等功能
 */

/**
 * 消息介面定義
 * @interface Message
 * @property {number} id - 消息唯一標識符
 * @property {string} text - 消息文本內容
 * @property {'user' | 'assistant'} role - 消息發送者角色（用戶或助手）
 */
interface Message {
  id: number;
  text: string;
  role: 'user' | 'assistant';
}

/**
 * 聊天對話介面定義
 * @interface Chat
 * @property {string} id - 聊天唯一標識符
 * @property {string} title - 聊天標題
 * @property {Message[]} messages - 聊天中的消息列表
 * @property {string} timestamp - 聊天創建時間
 */
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string; // 新增 timestamp 屬性
}

/**
 * 聊天狀態管理 Store
 * 使用 Pinia defineStore 創建具有狀態管理功能的 store
 */
export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [], // 所有聊天對話
    currentChatId: null, // 當前聊天ID
    isStreaming: false, // 是否正在進行流式傳輸
    initialized: false, // 追踪是否已初始化
    currentModel: 'gpt-4o-mini', // 當前使用的模型，設定預設值
    streamingMessage: '', 
  }),

  getters: {
    /**
     * @description 獲取當前聊天對話
     */
    currentChat: (state) => {
      if (!state.currentChatId) return null;
      return state.chats.find((chat) => chat.id === state.currentChatId);
    },
  },

  actions: {
    /**
     * @description 初始化聊天 Store
     */
    init() {
      // 只在未初始化時創建新聊天
      if (!this.initialized) {
        if (process.client) {
          this.loadChatsFromLocalStorage(); // 從 LocalStorage 載入對話
        }
        if (this.chats.length === 0 && !this.currentChatId) {
          this.createNewChat();
        }
        this.initialized = true;
      }
      return this;
    },

    /**
     * @description 水合狀態
     */
    hydrate(initialState) {
      // 先呼叫 init 初始化
      this.init()
      
      // 再水合初始狀態
      if (initialState) {
        this.$patch(initialState)
      }
      
      // 確保有對話存在，如果沒有則建立新的
      if (this.chats.length === 0 || !this.currentChatId) {
        this.createNewChat()
      }
    },

    /**
     * @description 創建新聊天
     */
    createNewChat() {
      const chatId = uuidv4();
      this.chats.push({
        id: chatId,
        title: `新對話 ${this.chats.length + 1}`,
        messages: [],
        timestamp: new Date().toISOString(), // 設定創建時間
      });
      this.currentChatId = chatId;
      if (process.client) {
        this.saveChatsToLocalStorage(); // 儲存對話到 LocalStorage
      }
      return chatId;
    },

    /**
     * @description 切換到指定ID的聊天
     */
    selectChat(id) {
      if (this.chatExists(id)) {
        this.currentChatId = id;
      }
      if (process.client) {
        this.saveChatsToLocalStorage();
      }
    },

    /**
     * @description 設置當前使用的模型
     * @param {string} modelId - 模型ID
     */
    setModel(modelId) {
      console.log('改用模型:', modelId)
      this.currentModel = modelId;
      if (process.client) {
        localStorage.setItem('currentModel', modelId);
      }
    },

    /**
     * @description 發送消息
     * @param {string} text - 用戶輸入的文本
     */
    async sendMessage(text) {
      if (!this.currentChatId) {
        this.createNewChat();
      }

      const chat = this.currentChat;

      // 檢查是否為第一次對話
      const isFirstMessage = chat.messages.length === 0;

      // 添加用戶消息
      chat.messages = [...chat.messages, {
        id: Date.now(),
        text,
        role: 'user',
      }];

      // 標記開始流式傳輸
      this.isStreaming = true;

      // 初始化空的助手回應
      const assistantMessageId = Date.now() + 1;
      chat.messages = [...chat.messages, {
        id: assistantMessageId,
        text: '',
        role: 'assistant',
      }];

      try {
        // 使用 useChat composable
        const chatter = useChat();
        chatter.switchModel(this.currentModel);

        // 提取當前對話並格式化為API的格式
        const apiMessages = chat.messages.slice(0, -1).map(msg => ({
          role: msg.role,
          content: msg.text
        }));
        console.log('發送訊息給API:', apiMessages);
        // 使用API發送消息並獲取流式回應
        chatter.streamingMessage.value = '';

        // 傳入當前選擇的模型
        const response = await chatter.sendMessage(text, apiMessages, true, this.currentModel);

        // 在流式傳輸過程中實時更新訊息
        const assistantIndex = chat.messages.findIndex(msg => msg.id === assistantMessageId);
        if (assistantIndex !== -1 && response) {
          chat.messages = [
            ...chat.messages.slice(0, assistantIndex),
            { ...chat.messages[assistantIndex], text: response.content || '' },
            ...chat.messages.slice(assistantIndex + 1)
          ];
          console.log('chat.ts: chat.messages.slice(0, assistantIndex): ', chat.messages.slice(0, assistantIndex))

          // 如果是第一次對話，使用助手的回應作為標題
          if (isFirstMessage && response.content) {
            const contentLength = response.content.length;
            const start = Math.max(0, Math.floor(Math.random() * (contentLength - 20)));
            chat.title = response.content.slice(start, start + 20); // 使用隨機 20 個字作為標題
          }
        }

        console.log('chat.ts: 回應已完成:', response);
      } catch (error) {
        console.error('chat.ts: 發送消息失敗:', error);

        // 更新助手消息為錯誤信息
        const assistantIndex = chat.messages.findIndex(msg => msg.id === assistantMessageId);
        if (assistantIndex !== -1) {
          chat.messages = [
            ...chat.messages.slice(0, assistantIndex),
            { ...chat.messages[assistantIndex], text: '抱歉，請求發生錯誤。' },
            ...chat.messages.slice(assistantIndex + 1)
          ];
        }
      } finally {
        // 標記流式傳輸結束
        this.isStreaming = false;
        if (process.client) {
          this.saveChatsToLocalStorage(); // 儲存對話到 LocalStorage
        }
      }
    },

    /**
     * @description 從 LocalStorage 載入對話
     */
    loadChatsFromLocalStorage() {
      if (process.client) {
        const storedChats = localStorage.getItem('chats');
        if (storedChats) {
          this.chats = JSON.parse(storedChats);
        }
        console.log('載入對話:', this.chats);
        const storedCurrentChatId = localStorage.getItem('currentChatId');
        if (storedCurrentChatId) {
          this.currentChatId = storedCurrentChatId;
        }
        
        // 載入儲存的模型設定
        const storedModel = localStorage.getItem('currentModel');
        if (storedModel) {
          this.currentModel = storedModel;
        }
      }
    },

    /**
     * @description 儲存對話到 Local Storage
     */
    saveChatsToLocalStorage() {
      if (process.client) {
        localStorage.setItem('chats', JSON.stringify(this.chats));
        localStorage.setItem('currentChatId', this.currentChatId);
      }
    },

    /**
     * @description 刪除聊天
     * @param {string} id - 聊天ID
     */
    deleteChat(id: string) {
      const index = this.chats.findIndex(chat => chat.id === id);
      if (index !== -1) {
        this.chats.splice(index, 1);
        
        // If we deleted the current chat, select another one
        if (this.currentChatId === id) {
          if (this.chats.length > 0) {
            this.currentChatId = this.chats[0].id;
            return this.chats[0].id; // Return ID for navigation
          } else {
            this.currentChatId = null;
            return null;
          }
        }
      }
      if (process.client) {
        this.saveChatsToLocalStorage();
      }
    },

    /**
     * @description 檢查聊天是否存在
     * @param {string} id - 聊天ID
     * @returns {boolean} 是否存在
     */
    chatExists(id) {
      return this.chats.some(chat => chat.id === id);
    },
  }
});
