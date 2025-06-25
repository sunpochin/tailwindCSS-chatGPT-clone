// Nuxt 3 plugin: 自動同步 Supabase session，確保 Pinia store 可正確取得 user
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const supabase = useSupabaseClient()
  // 頁面載入時主動同步 session
  await supabase.auth.getSession()
  // 監聽 session 變化（如登入/登出），可根據需要自動刷新 store 狀態
  supabase.auth.onAuthStateChange((_event, _session) => {
    // 這裡可根據需要觸發 pinia store 的 fetchUser 或 fetchChatHistories
    // 例如：useChatStore().fetchChatHistories()
  })
})
