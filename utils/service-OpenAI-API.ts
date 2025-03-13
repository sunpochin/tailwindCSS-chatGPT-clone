/**
 * @file 負責與 OpenAI API 進行交互的函數
 * @description 包含發送聊天請求和處理流式響應等功能
 */

/**
 * @description 檢查API金鑰是否有效
 * @param {string} apiKey - API 密鑰
 * @returns {boolean} 是否有效
 */
function isValidApiKey(apiKey) {
  // OpenAI API金鑰通常以"sk-"開頭，且長度較長
  return typeof apiKey === 'string' && apiKey.startsWith('sk-') && apiKey.length > 20;
}

/**
 * @description 發送聊天請求到 OpenAI API
 * @param {Array} messages - 聊天消息數組
 * @param {string} apiKey - API 密鑰
 * @param {string} model - 模型名稱，例如 "gpt-4", "gpt-3.5-turbo" 等
 * @param {boolean} stream - 是否使用流式響應
 * @param {Object} options - 其他選項如溫度、最大長度等
 * @returns {Promise} API響應
 */
export async function sendChatRequest(messages, apiKey, model, stream = false, options = {}) {
  // 檢查API金鑰是否有效
  if (!isValidApiKey(apiKey)) {
    throw new Error('無效的 API 金鑰格式。OpenAI API 金鑰應以 "sk-" 開頭。');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  
  const requestBody = {
    model: model,
    messages: messages,
    stream: stream,
    ...options  // 添加其他可能的選項如溫度、最大tokens等
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  // 添加組織ID頭（如果存在）
  if (options.organization) {
    headers['OpenAI-Organization'] = options.organization;
  }
  
  // 添加beta特性頭（如果存在）
  if (options.beta) {
    headers['OpenAI-Beta'] = options.beta;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorMessage = `OpenAI API 錯誤: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` ${JSON.stringify(errorData)}`;
        
        // 針對常見錯誤提供特定訊息
        if (response.status === 401) {
          errorMessage = '認證失敗: API 金鑰似乎無效或已過期。請檢查您的 OpenAI API 金鑰。';
        } else if (response.status === 429) {
          errorMessage = '請求過多或超出限額: 您已超過 OpenAI API 速率限制或餘額不足。';
        }
      } catch (e) {
        errorMessage += ` (無法解析錯誤詳情)`;
      }
      throw new Error(errorMessage);
    }
    
    return stream ? response : await response.json();
  } catch (error) {
    console.error('OpenAI API 請求發生錯誤:', error);
    throw error;
  }
}

/**
 * @description 延遲函數
 * @param {number} ms - 毫秒數
 * @returns {Promise} 延遲的 Promise
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @description 處理 OpenAI 流式響應
 * @param {Response} response - fetch API 響應對象
 * @param {Function} onChunk - 處理每個數據塊的回調
 * @param {Function} onDone - 流結束時的回調
 */
export async function handleStreamResponse(response, onChunk, onDone) {
  if (!response.body) {
    throw new Error('回應沒有可讀取的內容')
  }
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        onDone()
        break
      }
      
      // 解碼接收到的數據
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      // 處理完整的 SSE 數據行
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最後一個不完整的行
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6)
          
          // 跳過 [DONE] 消息
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            
            // 提取消息內容 - OpenAI 格式
            if (parsed.choices && parsed.choices[0].delta) {
              // 檢查是否有 content 屬性
              if (parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content
                onChunk(content)
              }
            }
          } catch (e) {
            console.warn('解析 OpenAI 流數據時出錯:', line, e)
          }
        }
      }
    }
  } catch (error) {
    console.error('讀取 OpenAI 流時出錯:', error)
    throw error
  }
}

/**
 * @description 設置 OpenAI API 請求的選項
 * @param {Object} options - 其他選項如溫度、最大長度等
 * @returns {Object} 完整的 API 請求選項
 */
export function buildOpenAIRequestOptions(options = {}) {
  return {
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000,
    top_p: options.topP || 1,
    frequency_penalty: options.frequencyPenalty || 0,
    presence_penalty: options.presencePenalty || 0,
    ...options
  }
}

/**
 * @description 發送包含高級選項的 OpenAI 聊天請求
 * @param {Array} messages - 聊天消息數組
 * @param {string} apiKey - API 密鑰
 * @param {string} modelName - 模型名稱
 * @param {Object} additionalOptions - 額外選項
 * @returns {Promise} API響應
 */
export const sendAdvancedOpenAIChatRequest = async (messages, apiKey, modelName, additionalOptions = {}) => {
  const url = 'https://api.openai.com/v1/chat/completions'
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  // // 添加組織ID頭（如果存在）
  // if (additionalOptions.organization) {
  //   headers['OpenAI-Organization'] = additionalOptions.organization;
  //   // 從選項中刪除，避免作為請求體參數傳送
  //   delete additionalOptions.organization;
  // }
  
  // // 添加beta特性頭（如果存在）
  // if (additionalOptions.beta) {
  //   headers['OpenAI-Beta'] = additionalOptions.beta;
  //   // 從選項中刪除，避免作為請求體參數傳送
  //   delete additionalOptions.beta;
  // }

  const requestOptions = buildOpenAIRequestOptions(additionalOptions)
  const body = JSON.stringify({
    model: modelName,
    messages: messages,
    ...requestOptions
  })

  console.log('body: ', body)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    })

    if (!response.ok) {
      console.error('OpenAI API 請求失敗:', response.status, response.statusText)
      throw new Error(`OpenAI API 請求失敗: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('發送 OpenAI 請求時發生錯誤:', error)
    throw error
  }
}
