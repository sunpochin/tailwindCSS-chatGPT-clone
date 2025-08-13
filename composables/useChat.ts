/**
 * @file 負責聊天功能的組合式函數
 * @description 包含發送消息、獲取聊天歷史、流式聊天等功能
 */

import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { sendChatRequest, handleStreamResponse } from '~/utils/service-OpenAI-API'
import { useChatStore } from '../stores/chatStore'

/**
 * @description 獲取聊天歷史
 * @param {string} conversationId - 對話ID
 * @returns {Promise} 聊天歷史
 */
export async function fetchChatHistory(conversationId: string) {
  try {
    const response = await fetch(`/api/chat/history?conversationId=${conversationId}`, {
      method: 'GET'
    })
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching chat history:', error)
    throw new Error('Failed to fetch chat history')
  }
}

/**
 * @description 聊天組合式函數
 * @returns {Object} 聊天相關函數和狀態
 */
export function useChat() {
  // 獲取運行時配置和 API 金鑰
  const config = useRuntimeConfig()
  const apiKey = config.public.OPENAI_API_KEY
  
  // 響應式狀態變數
  const currentModel = ref('gpt-4o')        // 當前使用的 AI 模型
  const isStreaming = ref(false)            // 是否正在串流回應
  const chatStore = useChatStore()          // 聊天狀態管理 store
  const streamingMessage = ref('')          // 串流中的訊息內容
  const lastResponse = ref<any>(null)       // 最後一次 API 回應

  /**
   * 發送普通（非串流）訊息到 OpenAI API
   * @param {Array} messages - 訊息陣列，包含對話歷史
   * @returns {Promise} API 回應的訊息物件
   */
  async function sendRegularMessage(messages: any[]) {
    console.log('sendRegularMessage:', messages)
    // 發送請求到 OpenAI API（非串流模式）
    const response = await sendChatRequest(messages, apiKey, currentModel.value, false)
    
    // 檢查回應格式並提取訊息
    if (response.choices && response.choices[0].message) {
      lastResponse.value = response.choices[0].message
      return response.choices[0].message
    }
    return null
  }

  /**
   * 發送串流訊息到 OpenAI API（即時顯示 AI 回應）
   * @param {Array} messages - 訊息陣列，包含對話歷史
   * @returns {Promise} 完整的 API 回應訊息物件
   */
  async function sendStreamMessage(messages: any[]) {
    console.log('sendStreamMessage:', messages)
    // 初始化串流狀態
    isStreaming.value = true
    streamingMessage.value = ''
    chatStore.streamingMessage = ''
    
    try {
      // 發送串流請求到 OpenAI API
      const response = await sendChatRequest(messages, apiKey, currentModel.value, true)
      lastResponse.value = { role: 'assistant', content: '' }
      
      // 處理串流回應 - 即時更新訊息內容
      await handleStreamResponse(
        response,
        (chunk) => {
          // 每收到一個字符片段就更新顯示
          streamingMessage.value += chunk
          chatStore.streamingMessage += chunk
          if (lastResponse.value) {
            lastResponse.value.content = streamingMessage.value
          }
        },
        () => {
          // 串流完成時的回調
          isStreaming.value = false
        }
      )
      return lastResponse.value
    } catch (error) {
      isStreaming.value = false
      throw error
    }
  }

  /**
   * 發送訊息到 OpenAI API 的主要入口點
   * @param {string} message - 使用者輸入的訊息文本
   * @param {Array|Object} messages - 對話歷史訊息陣列或單一訊息物件
   * @param {boolean} useStream - 是否使用串流模式回應
   * @returns {Promise} OpenAI API 的回應物件
   */
  async function sendMessageToOpenAI(message: string, messages: any = [], useStream = false) {
    // 檢查輸入有效性
    if (!message.trim()) return
    if (!apiKey) {
      console.error('API密鑰未設置')
      throw new Error('API_KEY 環境變量未設置')
    }
    
    // 防呆處理：確保 messages 參數格式正確
    let safeMessages: Array<any> = []
    if (Array.isArray(messages)) {
      // 如果是陣列，直接使用
      safeMessages = messages
    } else if (messages && typeof messages === 'object' && messages.role && messages.content) {
      // 如果是單一訊息物件，轉為陣列
      safeMessages = [messages]
    } else {
      // 其他情況設為空陣列
      safeMessages = []
    }
    
    // 格式化訊息陣列為 OpenAI API 期望的格式
    const formattedMessages = safeMessages.length > 0 
      ? safeMessages.map((msg: any) => ({
          role: msg.role,
          content: msg.content || msg.text  // 支援 content 或 text 欄位
        }))
      : [{ role: 'user', content: message }]  // 如果沒有歷史訊息，只發送當前訊息
    

    console.log('formattedMessages:', formattedMessages)
    console.log('useStream:', useStream)
    console.log('currentModel:', currentModel.value)

    try {
      // 根據參數決定使用串流或普通模式
      if (useStream) {
        await sendStreamMessage(formattedMessages)
      } else {
        await sendRegularMessage(formattedMessages)
      }
      return lastResponse.value
    } catch (error) {
      // 錯誤處理：重置狀態並返回錯誤訊息
      console.error('發送消息失敗:', error)
      isStreaming.value = false
      lastResponse.value = {
        role: 'assistant',
        content: '抱歉，請求發生錯誤。'
      }
      return lastResponse.value
    }
  }

  /**
   * 切換 AI 模型
   * @param {string} modelName - 要切換到的模型名稱（如 'gpt-4', 'gpt-3.5-turbo'）
   */
  function switchModel(modelName: string) {
    currentModel.value = modelName
  }

  // 返回組合式函數的公開 API
  return {
    currentModel,        // 當前使用的 AI 模型
    isStreaming,         // 串流狀態
    streamingMessage,    // 串流中的訊息內容
    lastResponse,        // 最後一次 API 回應
    sendMessageToOpenAI, // 發送訊息的主要方法
    switchModel          // 切換模型的方法
  }
}
