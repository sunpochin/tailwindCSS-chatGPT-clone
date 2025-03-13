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
 * @description 發送消息
 * @param {string} conversationId - 對話ID
 * @param {string} userMessage - 用戶消息
 * @param {string} model - 模型名稱
 * @returns {Promise} API響應
 */
export async function sendMessage(conversationId: string, userMessage: string, model: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId,
        model,
        userMessage
      })
    })
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return await response.json()
  } catch (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }
}

/**
 * @description 流式聊天
 * @param {string} conversationId - 對話ID
 * @param {string} userMessage - 用戶消息
 * @param {string} model - 模型名稱
 * @param {Function} onToken - 處理每個數據塊的回調
 * @returns {EventSource} 事件源
 */
export function streamChat(conversationId: string, userMessage: string, model: string, onToken: (token: string) => void) {
  const eventSource = new EventSource(`/api/chat?conversationId=${conversationId}&model=${model}&userMessage=${encodeURIComponent(userMessage)}`)

  eventSource.onmessage = (event) => {
    // 取得 SSE 傳回的 token
    const data = event.data
    onToken(data)  // 回呼給 UI 做即時顯示
  }

  eventSource.onerror = (err) => {
    console.error('SSE error', err)
    eventSource.close()
  }

  return eventSource
}

/**
 * @description 聊天組合式函數
 * @returns {Object} 聊天相關函數和狀態
 */
export function useChat() {
  const config = useRuntimeConfig()
  const apiKey = config.public.OPENAI_API_KEY
  console.log('API_KEY 配置:', apiKey ? '已設置' : '未設置')

  const currentModel = ref('gpt-4o')
  const isStreaming = ref(false)
  const chatStore = useChatStore()
  const streamingMessage = ref('')
  const lastResponse = ref(null)

  /**
   * @description 發送消息
   * @param {string} message - 消息文本
   * @param {Array} messages - 消息數組
   * @param {boolean} useStream - 是否使用流式響應
   * @returns {Promise} API響應
   */
  async function sendMessage(message, messages = [], useStream = false) {
    if (!message.trim()) return

    if (!apiKey) {
      console.error('API密鑰未設置')
      throw new Error('API_KEY 環境變量未設置')
    }

    const formattedMessages = messages.length > 0 
      ? messages.map(msg => ({
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

  /**
   * @description 發送普通消息
   * @param {Array} messages - 消息數組
   * @returns {Promise} API響應
   */
  async function sendRegularMessage(messages) {
    console.log('sendRegularMessage API 請求:', messages)
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
  async function sendStreamMessage(messages) {
    console.log('sendStreamMessage 使用模型:', currentModel.value)
    console.log('sendStreamMessage: ', messages)

    isStreaming.value = true
    streamingMessage.value = ''
    chatStore.streamingMessage = ''

    try {
      const response = await sendChatRequest(messages, apiKey, currentModel.value, true)

      lastResponse.value = {
        role: 'assistant',
        content: ''
      }

      await handleStreamResponse(
        response,
        (chunk) => {
          streamingMessage.value += chunk
          chatStore.streamingMessage += chunk
          console.log('useChat.ts streamingMessage.value:', streamingMessage.value, 'chunk: ', chunk)
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
      console.error('流式處理錯誤:', error)
      throw error
    }
  }

  /**
   * @description 切換模型
   * @param {string} modelName - 模型名稱
   */
  function switchModel(modelName) {
    currentModel.value = modelName
  }

  return {
    currentModel,
    isStreaming,
    streamingMessage,
    lastResponse,
    sendMessage,
    switchModel
  }
}
