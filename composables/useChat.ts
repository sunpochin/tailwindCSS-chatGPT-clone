/**
 * @file 負責聊天功能的組合式函數
 * @description 包含發送消息、獲取聊天歷史、流式聊天等功能
 */

import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { sendChatRequest, handleStreamResponse } from '~/utils/service-OpenAI-API'
import { useChatStore } from '~/stores/chat'

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
  const config = useRuntimeConfig()
  const apiKey = config.public.OPENAI_API_KEY
  const currentModel = ref('gpt-4o')
  const isStreaming = ref(false)
  const chatStore = useChatStore()
  const streamingMessage = ref('')
  const lastResponse = ref<any>(null)

  /**
   * @description 發送普通消息
   * @param {Array} messages - 消息數組
   * @returns {Promise} API響應
   */
  async function sendRegularMessage(messages: any[]) {
    const response = await sendChatRequest(messages, apiKey, currentModel.value, false)
    if (response.choices && response.choices[0].message) {
      lastResponse.value = response.choices[0].message
      return response.choices[0].message
    }
    return null
  }

  /**
   * @description 發送流式消息
   * @param {Array} messages - 消息數組
   * @returns {Promise} API響應
   */
  async function sendStreamMessage(messages: any[]) {
    isStreaming.value = true
    streamingMessage.value = ''
    chatStore.streamingMessage = ''
    try {
      const response = await sendChatRequest(messages, apiKey, currentModel.value, true)
      lastResponse.value = { role: 'assistant', content: '' }
      await handleStreamResponse(
        response,
        (chunk) => {
          streamingMessage.value += chunk
          chatStore.streamingMessage += chunk
          if (lastResponse.value) {
            lastResponse.value.content = streamingMessage.value
          }
        },
        () => {
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
   * @description 發送消息
   * @param {string} message - 消息文本
   * @param {Array} messages - 消息數組
   * @param {boolean} useStream - 是否使用流式響應
   * @returns {Promise} API響應
   */
  async function sendMessageToOpenAI(message: string, messages: any = [], useStream = false) {
    if (!message.trim()) return
    if (!apiKey) {
      console.error('API密鑰未設置')
      throw new Error('API_KEY 環境變量未設置')
    }
    // 防呆：確保 messages 一定是 array
    let safeMessages: Array<any> = []
    if (Array.isArray(messages)) {
      safeMessages = messages
    } else if (messages && typeof messages === 'object' && messages.role && messages.content) {
      safeMessages = [messages]
    } else {
      safeMessages = []
    }
    const formattedMessages = safeMessages.length > 0 
      ? safeMessages.map((msg: any) => ({
          role: msg.role,
          content: msg.content || msg.text
        }))
      : [{ role: 'user', content: message }]
    try {
      if (useStream) {
        await sendStreamMessage(formattedMessages)
      } else {
        await sendRegularMessage(formattedMessages)
      }
      return lastResponse.value
    } catch (error) {
      console.error('發送消息失敗:', error)
      isStreaming.value = false
      lastResponse.value = {
        role: 'assistant',
        content: '抱歉，請求發生錯誤。'
      }
      return lastResponse.value
    }
  }

  function switchModel(modelName: string) {
    currentModel.value = modelName
  }

  return {
    currentModel,
    isStreaming,
    streamingMessage,
    lastResponse,
    sendMessageToOpenAI,
    switchModel
  }
}
