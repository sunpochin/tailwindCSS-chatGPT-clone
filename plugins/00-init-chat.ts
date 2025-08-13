import { defineNuxtPlugin } from '#app'
import { useChatStore } from '../stores/chatStore'

export default defineNuxtPlugin(nuxtApp => {
  console.log('Init-chat 外掛已載入')
  
  // 等待應用程式掛載完成後再初始化 store
  nuxtApp.hook('app:mounted', () => {
    console.log('App 掛載完成，初始化聊天 Store')
    // 初始化聊天 store，確保有一個新的聊天如果需要的話
    const chatStore = useChatStore()
    chatStore.init()
  })
  
  return {
    provide: {
      // 提供一個簡單的函數供其他元件確認外掛存在
      initChatLoaded: () => true
    }
  }
})
