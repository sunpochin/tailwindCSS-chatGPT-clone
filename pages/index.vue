/**
 * @file 首頁
 * @description 包含聊天組件的首頁
 */

<template>
  <div>
    <ChatComponent />
    <form @submit.prevent="handleSubmit">
      <!-- 添加 CAPTCHA -->
      <ClientOnly>
        <Captcha 
          :sitekey="recaptchaSiteKey"
          @verified="onCaptchaVerified"
          @expired="onCaptchaExpired"
          @error="onCaptchaError"
        />
      </ClientOnly>
      <button 
        type="submit" 
        :disabled="!message.trim() || !captchaVerified" 
        class="...">
        發送
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import ChatComponent from '@/components/ChatComponent.vue'
import { ref } from 'vue';
const config = useRuntimeConfig();
const recaptchaSiteKey = config.public.recaptchaSiteKey;
const captchaVerified = ref(false);
const captchaResponse = ref('');
const message = ref(''); // 添加 message 定義

const onCaptchaVerified = (response) => {
  captchaVerified.value = true;
  captchaResponse.value = response;
};

const onCaptchaExpired = () => {
  captchaVerified.value = false;
  captchaResponse.value = '';
};

const onCaptchaError = () => {
  captchaVerified.value = false;
  captchaResponse.value = '';
};

const handleSubmit = async () => {
  if (!captchaVerified.value) {
    alert('請完成 CAPTCHA 驗證');
    return;
  }
  
  // 將 captcha 回應送到服務器進行驗證
  const formData = {
    message: message.value,
    recaptchaResponse: captchaResponse.value
  };
  
  // 發送表單數據
};
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
</style>
