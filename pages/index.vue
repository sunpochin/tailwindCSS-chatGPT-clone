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

// 定義 API 回應介面
interface AuthResponse {
  success: boolean
  user?: any
  message?: string
}

const config = useRuntimeConfig()
const recaptchaSiteKey = config.public.recaptchaSiteKey
const captchaVerified = ref(false)
const captchaResponse = ref('')
const message = ref('') // 添加 message 定義
const isLoading = ref(false)

const signInWithGoogle = async () => {
  console.log('url: ', `${window.location.origin}/auth/callback`)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Google 登入失敗：', error)
    // 這裡你可以顯示錯誤訊息給使用者
  } else {
    console.log('已前往 Google 授權頁面：', data)
    // 之後畫面會被導到 Supabase 的授權頁面
  }
}
// 處理 Google 登錄回應
const handleGoogleResponse = async (response: any) => {
  try {
    console.log('Google 登錄成功:', response)

    // 將 Google JWT token 發送到後端進行驗證
    const result = (await $fetch('/api/auth/google', {
      method: 'POST',
      body: {
        credential: response.credential,
      },
    })) as AuthResponse

    if (result.success) {
      // 登錄成功，可以重定向或更新用戶狀態
      console.log('用戶登錄成功:', result.user)
      // 可以使用 navigateTo 重定向到聊天頁面
      // await navigateTo('/chat');
    }
  } catch (error) {
    console.error('處理 Google 登錄回應時發生錯誤:', error)
    alert('登錄處理失敗')
  }
}

const onCaptchaVerified = (response) => {
  captchaVerified.value = true
  captchaResponse.value = response
}

const onCaptchaExpired = () => {
  captchaVerified.value = false
  captchaResponse.value = ''
}

const onCaptchaError = () => {
  captchaVerified.value = false
  captchaResponse.value = ''
}

const handleSubmit = async () => {
  if (!captchaVerified.value) {
    alert('請完成 CAPTCHA 驗證')
    return
  }

  // 將 captcha 回應送到服務器進行驗證
  const formData = {
    message: message.value,
    recaptchaResponse: captchaResponse.value,
  }

  // 發送表單數據
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
