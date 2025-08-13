/**
 * @file 負責定義輸入容器組件
 * @description 包含處理用戶輸入和文件上傳等功能
 */

<template>
  <div class="flex flex-col p-4 border-t border-gray-200 gap-2 relative">
    <!-- 串流生成指示器 - 當AI正在生成回應時顯示 -->
    <div v-if="chatStore.isStreaming" class="bg-blue-50 rounded-xl py-1 px-3 text-sm text-blue-600 inline-flex items-center mb-1 max-w-fit shadow-sm">
      <span>生成中</span>
      <span class="inline-block w-6 overflow-hidden text-left animate-dotAnimation">...</span>
    </div>
    <!-- 輸入區域容器 - 包含文本輸入框和上傳按鈕 -->
    <div class="relative flex-1">
      <!-- 
        多行文本輸入框 - 使用者主要輸入區域
        - v-model：雙向綁定輸入內容
        - Enter：發送訊息，Shift+Enter：換行
        - 支援自動高度調整（60px-300px）
        - 串流生成時會被禁用
      -->
      <textarea 
        v-model="messageText" 
        placeholder="Send a message..."
        @keydown.enter="onEnter"
        class="w-full p-3 pb-10 border border-gray-300 rounded-lg min-h-[60px] max-h-[300px] overflow-y-auto resize-none font-inherit text-inherit leading-normal whitespace-pre-wrap box-border transition-colors duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-80"
        :disabled="chatStore.isStreaming"
        ref="textareaRef"
      ></textarea>
      <!-- PDF上傳按鈕 - 允許用戶上傳PDF文件供AI分析 -->
      <!-- <button 
        @click="triggerFileUpload" 
        class="absolute bottom-2 left-2 py-1 px-3 bg-transparent text-blue-600 border border-blue-600 rounded hover:bg-blue-50 text-sm cursor-pointer z-10 transition-colors duration-200"
      >
        上傳 PDF
      </button> -->
    </div>
    <!-- 隱藏的檔案輸入框 - 實際處理文件上傳但不直接顯示 -->
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileUpload" 
      accept="application/pdf" 
      class="hidden"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useChatStore } from '~/stores/chat'
import { extractTextFromPDF } from '~/utils/pdfUtils'

// 引入聊天狀態管理 - 用於發送消息和追踪生成狀態
const chatStore = useChatStore()

// 用戶輸入和元素引用
const messageText = ref<string>('') // 存儲用戶輸入的消息文本
const fileInput = ref<HTMLInputElement | null>(null) // 引用隱藏的文件輸入元素
const textareaRef = ref<HTMLTextAreaElement | null>(null) // 引用文本輸入區域元素

// 自動調整文本區域高度的函數 - 確保輸入框高度適應內容
const adjustTextareaHeight = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  // 重置高度以便獲取正確的 scrollHeight
  textarea.style.height = 'auto'
  
  // 設置高度為內容高度（最小 60px）- 確保足夠的輸入空間
  const newHeight = Math.max(60, textarea.scrollHeight)
  textarea.style.height = `${newHeight}px`
}

// 監聽messageText變化以調整高度 - 當用戶輸入文字時自動擴展輸入框
watch(messageText, () => {
  // 在下一個視圖更新後調整高度 - 確保DOM已更新
  setTimeout(adjustTextareaHeight, 0)
})

// 組件掛載時調整文本區域高度 - 確保初始渲染正確
onMounted(() => {
  adjustTextareaHeight()
})

// 發送消息函數 - 將用戶輸入發送到聊天存儲並清空輸入框
const sendMessage = () => {
  if (!messageText.value.trim()) return // 防止發送空白消息
  chatStore.sendMessage(messageText.value)
  messageText.value = '' // 清空輸入框
}

// 處理 Enter/Shift+Enter 行為
const onEnter = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
  // 有 shiftKey 則預設換行
}

// 觸發檔案上傳點擊 - 當用戶點擊上傳按鈕時激活隱藏的文件輸入
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// 聚焦文本區域並將游標放置在文本末尾 - 提高用戶體驗
const focusTextarea = () => {
  setTimeout(() => {
    textareaRef.value?.focus()
    // 將游標放置在文本的末尾 - 方便用戶繼續編輯
    if (textareaRef.value) {
      const len = textareaRef.value.value.length
      textareaRef.value.setSelectionRange(len, len)
    }
    // 調整高度 - 確保輸入框適應新內容
    adjustTextareaHeight()
  }, 100) // 短暫延遲確保DOM已更新
}

// 處理檔案上傳 - 解析PDF內容並將其添加到輸入框
const handleFileUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    try {
      // 從PDF提取文本
      const text = await extractTextFromPDF(file)
      console.log('PDF 內容:', text)
      // 將 PDF 內容放置到 textarea 中，而不是直接發送
      messageText.value = `${text}\n======\n以上是從「${file.name}」提取的內容，按下 Enter 送出 prompt。`
      // 清除 file input 的值，以便可以重新上傳相同檔案
      if (fileInput.value) fileInput.value.value = ''
      // 聚焦到 textarea - 讓用戶可以編輯提取的內容
      focusTextarea()
    } catch (error) {
      console.error('PDF 解析失敗:', error)
    }
  }
}
</script>

<style>
@keyframes dotAnimation {
  0% { content: "." }
  33% { content: ".." }
  66% { content: "..." }
  100% { content: "" }
}

/* 
  Define the animation directly without @layer utilities
  because component-scoped styles don't have access to Tailwind's layer system
*/
.animate-dotAnimation::after {
  content: "";
  animation: dotAnimation 1.5s infinite;
}
</style>
