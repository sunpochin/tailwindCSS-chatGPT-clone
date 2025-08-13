/**
 * @file 聊天狀態管理 Store
 * @description 使用 Pinia 管理聊天相關的狀態，包括聊天歷史、當前聊天、發送消息等功能
 */

import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import { useSupabase } from '../composables/useSupabase'
import { useChat } from '../composables/useChat'

export interface Message {
  // 建議 id 的類型與資料庫主鍵一致，通常是 string (UUID) 或 number (serial)
  id: number | string
  text: string // 'text' 似乎與 'content' 重複，建議統一使用 'content'
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
    user: null as User | null // 使用從 @supabase/supabase-js 匯入的 User 型別，增強型別安全
  }),

  getters: {
    /**
     * 獲取當前聊天對話
     */
    currentChat: (state): ChatHistory | null => {
      return state.currentChatId ? state.chats.find((chat) => chat.id === state.currentChatId) || null : null
    },
    /**
     * 取得目前登入的 Google user
     */
    currentUser: (state) => state.user
  },

  actions: {
    /**
     * 確保使用者已登入並設定 user 狀態，避免重複的 session 檢查
     * @returns User object or null
     */
    async _ensureUserSession() {
      if (this.user) return this.user

      const supabase = useSupabase()
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session?.user) {
        console.warn('使用者未登入')
        this.user = null
        return null
      }
      this.user = session.user
      return this.user
    },

    // 取得使用者的所有聊天歷史
    async fetchChatHistories() {
      const user = await this._ensureUserSession()
      if (!user) {
        this.chats = []
        this.currentChatId = null
        return
      }

      const supabase = useSupabase()
      const { data, error } = await supabase
        .from('chat_histories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // 為每個聊天初始化 messages 陣列，避免後續操作出錯
      this.chats = data.map(chat => ({ ...chat, messages: chat.messages || [] }))

      // 如果沒有當前聊天但有歷史記錄，選擇第一個
      if (!this.currentChatId && this.chats.length > 0) {
        await this.selectChat(this.chats[0].id)
      }
    },

    // 取得特定聊天的所有訊息
    async fetchMessages(chatId: string) {
      const chat = this.chats.find(c => c.id === chatId)
      // 如果訊息已經載入過，就不用重新獲取，提升效能
      if (chat && chat.messages.length > 0) {
        return
      }

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
    async createNewChat(title: string = '新對話') {
      const user = await this._ensureUserSession()
      if (!user) {
        console.error('未登入，無法建立新對話')
        return null  // 明確返回 null 表示失敗
      }

      const supabase = useSupabase()
      try {
        const { data, error } = await supabase
          .from('chat_histories')
          .insert({ title, user_id: user.id })
          .select()
          .single()

        if (error) {
          console.error('建立聊天失敗:', error)
          return null
        }

        // 採用「樂觀更新」，直接將新對話加入 state，而不是重新 fetch 全部歷史紀錄
        const newChat = { ...data, messages: [] }
        this.chats.unshift(newChat)
        this.currentChatId = newChat.id
        
        console.log('成功建立新聊天:', newChat.id)
        return newChat
      } catch (error) {
        console.error('建立聊天時發生例外:', error)
        return null
      }
    },

    // 儲存新訊息
    async saveMessage(message: Pick<Message, 'role' | 'content'>) {
      if (!this.currentChatId || !this.currentChat) {
        console.error('儲存訊息失敗：沒有選擇聊天', { currentChatId: this.currentChatId, currentChat: !!this.currentChat })
        return null
      }
      
      // 額外檢查：確保 currentChatId 不是 undefined 字串
      if (this.currentChatId === 'undefined' || this.currentChatId === undefined) {
        console.error('儲存訊息失敗：currentChatId 是 undefined')
        return null
      }

      const supabase = useSupabase()
      
      // 1. 儲存訊息到資料庫
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert({ chat_id: this.currentChatId, ...message })
        .select()
        .single()

      if (error) throw error

      // 2. 更新聊天的 updated_at 時間戳（重要：讓聊天在側邊欄中正確排序）
      const { error: updateError } = await supabase
        .from('chat_histories')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', this.currentChatId)

      if (updateError) {
        console.warn('更新聊天時間戳失敗:', updateError)
      } else {
        // 3. 樂觀更新本地狀態：更新聊天的 updated_at
        this.currentChat.updated_at = new Date().toISOString()
      }

      // 4. 樂觀更新：直接將儲存成功的新訊息推入當前對話的 messages 陣列
      this.currentChat.messages.push(savedMessage)
      return savedMessage
    },

    /**
     * 發送訊息並處理 LLM 回應（主要入口點）
     * 此方法是處理使用者訊息和 AI 回應的核心邏輯
     * @param text 使用者輸入的訊息內容
     */
    async sendMessage(text: string) {
      // 如果沒有當前聊天，自動建立新聊天
      if (!this.currentChatId) {
        console.log('沒有選擇聊天，自動建立新聊天')
        const newChat = await this.createNewChat('新對話')
        if (!newChat || !this.currentChatId) {
          console.error('無法建立新聊天，可能是使用者未登入')
          throw new Error('無法建立聊天：使用者未登入或建立失敗')
        }
      }
      
      // 1. 先儲存使用者訊息到 Supabase
      await this.saveMessage({ role: 'user', content: text })

      // 2. 呼叫 OpenAI API 取得 AI 回應
      const chatComposable = useChat()
      try {
        this.isStreaming = true // 顯示載入狀態
        const aiResponse = await chatComposable.sendMessageToOpenAI(text, this.currentModel)

        console.log('AI response:', aiResponse)
        
        // 3. 解析 AI 回應並儲存到 Supabase（修復：提取 content 字段）
        const aiContent = typeof aiResponse === 'string' ? aiResponse : aiResponse?.content || JSON.stringify(aiResponse)
        await this.saveMessage({ role: 'assistant', content: aiContent })
      } catch (e) {
        console.error('OpenAI 回應失敗:', e)
        // 4. 錯誤處理：儲存錯誤訊息到對話記錄
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.'
        await this.saveMessage({ role: 'assistant', content: `抱歉，發生錯誤：${errorMessage}` })
      } finally {
        this.isStreaming = false // 結束載入狀態
      }
    },

    /**
     * 初始化聊天 Store
     */
    async init() {
      if (this.initialized) return
      await this.fetchChatHistories()
      this.initialized = true
    },

    // 選擇聊天
    async selectChat(chatId: string) {
      this.currentChatId = chatId
      // fetchMessages 內部會檢查是否需要重新獲取數據
      await this.fetchMessages(chatId)
    },

    // 檢查聊天是否存在
    chatExists(chatId: string): boolean {
      return this.chats.some((chat: ChatHistory) => chat.id === chatId)
    }
  }
})
