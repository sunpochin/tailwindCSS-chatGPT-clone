/**
 * @file 聊天狀態管理 Store
 * @description 使用 Pinia 管理聊天相關的狀態，包括聊天歷史、當前聊天、發送消息等功能
 */

import { defineStore } from 'pinia'
import { useSupabase } from '../composables/useSupabase'
import { useChat } from '../composables/useChat'

export interface Message {
  id: number
  text: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  chat_id?: string
}

export interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * 聊天狀態管理 Store
 * 使用 Pinia defineStore 創建具有狀態管理功能的 store
 */
export const useChatStore = defineStore('chat', {
  state: () => ({
    chats: [] as ChatHistory[], // 所有聊天對話
    isStreaming: false, // 是否正在進行流式傳輸
    initialized: false, // 追踪是否已初始化
    currentModel: 'gpt-4-mini', // 當前使用的模型，設定預設值
    streamingMessage: '',
    currentChatId: null as string | null,  // 當前聊天 ID
    messages: [] as Message[],
    user: null as any // 新增 user 狀態
  }),

  getters: {
    /**
     * 獲取當前聊天對話
     */
    currentChat: (state): ChatHistory | null => {
      if (!state.currentChatId) return null
      const chat = state.chats.find((chat) => chat.id === state.currentChatId)
      return chat || null
    },
    /**
     * 取得目前登入的 Google user
     */
    currentUser: (state) => state.user
  },

  actions: {
    // 取得使用者的所有聊天歷史
    async fetchChatHistories() {
      const supabase = useSupabase()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session || !sessionData.session.user) {
        console.warn('尚未登入')
        this.user = null
        return
      }
      const user = sessionData.session.user
      this.user = user // 存進 state
      const { data, error } = await supabase
        .from('chat_histories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      this.chats = data
      // 如果沒有當前聊天但有歷史記錄，選擇第一個
      if (!this.currentChatId && this.chats.length > 0) {
        this.currentChatId = this.chats[0].id
        await this.fetchMessages(this.currentChatId)
      }
    },

    // 取得特定聊天的所有訊息
    async fetchMessages(chatId: string) {
      const supabase = useSupabase()
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at')
      
      if (error) throw error
      
      // 將獲取的消息附加到對應的聊天歷史中
      const chatIndex = this.chats.findIndex(chat => chat.id === chatId)
      if (chatIndex !== -1) {
        this.chats[chatIndex].messages = data
      }
    },

    // 建立新的聊天
    async createNewChat(title: string) {
      const supabase = useSupabase()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session || !sessionData.session.user) {
        console.warn('未登入，無法建立新對話:', sessionError)
        return
      }
      const user = sessionData.session.user
      if (!title) title = '新對話'
      const { data, error } = await supabase
        .from('chat_histories')
        .insert({
          title,
          user_id: user.id
        })
        .select()
        .single()
      if (error) throw error
      this.currentChatId = data.id
      await this.fetchChatHistories()  // 重新載入包含新建對話的歷史記錄
    },

    // 儲存新訊息
    async saveMessage(message: Message) {
      if (!this.currentChatId) {
        console.warn('No current chat selected')
        return
      }

      const supabase = useSupabase()
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: this.currentChatId,
          role: message.role,
          content: message.text || message.content
        })
      
      if (error) throw error
      await this.fetchMessages(this.currentChatId)
    },

    // 發送訊息（給 InputContainer.vue 用，並呼叫 OpenAI API）
    async sendMessage(text: string) {
      if (!this.currentChatId) {
        console.warn('No chat selected')
        return
      }
      // 先存 user 訊息
      await this.saveMessage({
        id: Date.now(),
        text,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
        chat_id: this.currentChatId
      })
      // 呼叫 useChat composable 發送到 OpenAI
      const chat = useChat()
      try {
        this.isStreaming = true
        const aiContent = await chat.sendMessageToOpenAI(text, this.currentModel)
        // 存 AI 回應
        await this.saveMessage({
          id: Date.now() + 1,
          text: aiContent,
          role: 'assistant',
          content: aiContent,
          created_at: new Date().toISOString(),
          chat_id: this.currentChatId
        })
      } catch (e) {
        console.error('OpenAI 回應失敗:', e)
      } finally {
        this.isStreaming = false
      }
    },

    /**
     * 初始化聊天 Store
     */
    async init() {
      if (!this.initialized) {
        await this.fetchChatHistories()
        this.initialized = true
      }
    },

    // 選擇聊天
    async selectChat(chatId: string) {
      // 如果已存在該聊天，直接切換
      const exists = this.chats.some(chat => chat.id === chatId)
      if (exists) {
        this.currentChatId = chatId
        await this.fetchMessages(chatId)
        return
      }
      // 若不存在，則自動建立新對話（用預設標題）
      const supabase = useSupabase()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session || !sessionData.session.user) {
        console.warn('未登入，無法建立新對話:', sessionError)
        return
      }
      const user = sessionData.session.user
      const { data, error } = await supabase
        .from('chat_histories')
        .insert({
          id: chatId, // 用指定的 chatId
          title: '新對話',
          user_id: user.id
        })
        .select()
        .single()
      if (error) throw error
      this.currentChatId = data.id
      await this.fetchChatHistories()
      await this.fetchMessages(this.currentChatId)
    }
  }
})
