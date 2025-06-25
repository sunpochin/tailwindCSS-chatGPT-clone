/** * @file 首頁 * @description 包含聊天組件的首頁 */

<template>
  <div>
    <!-- Google Login Button -->
    <div class="google-login-container">
      <button
        @click="signInWithGoogle"
        class="google-login-btn"
        :disabled="isLoading"
      >
        <svg
          class="google-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span v-if="!isLoading">使用 Google 登錄</span>
        <span v-else>登錄中...</span>
      </button>
    </div>
    <div v-if="user" class="user-info" style="text-align:center; margin-bottom:1rem;">
      <div>已登入：{{ user.email }}</div>
      <div v-if="user.user_metadata && user.user_metadata.full_name">姓名：{{ user.user_metadata.full_name }}</div>
    </div>
    <ChatComponent />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient, useRuntimeConfig } from '#imports'
import ChatComponent from '../components/ChatComponent.vue'

const supabase = useSupabaseClient()
const router = useRouter()
// Supabase OAuth 完成後它會攜帶參數到這頁
onMounted(async () => {
  // 預設已經自動處理完交換流程，直接拿當前 session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session) {
    console.error('取得 Session 失敗', error)
    return
  }
  router.replace('/')
})

/**
 * user 狀態：存放目前登入的使用者資訊（如 email、姓名、ID）
 * fetchUser：呼叫 supabase.auth.getSession() 取得 session，並將 user 存到 user.value
 * onMounted：頁面載入時自動取得目前登入者資訊
 * signInWithGoogle：執行 Google OAuth 登入，登入後自動更新 user 狀態
 *
 * <template> 會根據 user 狀態顯示目前登入者的 email、姓名、ID
 */
const isLoading = ref(false)
const user = ref<any>(null)

// 取得目前登入者資訊，存到 user 狀態
const fetchUser = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    user.value = null
    return
  }
  user.value = data.session.user
}

// 頁面載入時自動取得登入者資訊
onMounted(async () => {
  await fetchUser()
  // router.replace('/') // 不要自動重導，避免無限循環
})

// Google 登入流程，成功後自動更新 user 狀態
const signInWithGoogle = async () => {
  console.log('開始 Google 登入流程...')
  isLoading.value = true
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Google 登入失敗：', error)
    } else {
      console.log('已前往 Google 授權頁面：', data)
    }
  } catch (e) {
    console.error('Google 登入流程發生錯誤：', e)
  } finally {
    isLoading.value = false
    await fetchUser()
  }
}


</script>

<style scoped>
/* Page styles */
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
}

header {
  margin-bottom: 20px;
}

main {
  display: flex;
  gap: 20px;
}

/* Google Login Button Styles */
.google-login-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
}

.google-login-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background-color: white;
  border: 2px solid #dadce0;
  border-radius: 0.5rem;
  color: #3c4043;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.google-login-btn:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #dadce0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.google-login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 響應式設計 */
@media (max-width: 640px) {
  .google-login-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .google-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
