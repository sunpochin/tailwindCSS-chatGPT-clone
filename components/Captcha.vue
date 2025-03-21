<template>
  <div class="captcha-container">
    <div v-if="scriptLoaded">
      <div ref="recaptchaContainer"></div>
    </div>
    <div v-else>
      正在加載驗證碼...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  sitekey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['verified', 'expired', 'error']);
const scriptLoaded = ref(false);
const recaptchaContainer = ref(null);
let recaptchaInstance = null;

// 當組件掛載時加載 reCAPTCHA 腳本
onMounted(() => {
  console.log("嘗試加載 reCAPTCHA，站點金鑰:", props.sitekey);
  
  // 如果站點金鑰是默認值，顯示警告
  if (props.sitekey === 'your_site_key_here') {
    console.error("警告：使用的是默認 reCAPTCHA 站點金鑰。請在 .env 文件中設置正確的金鑰。");
  }
  
  // 檢查 reCAPTCHA 腳本是否已加載
  if (window.grecaptcha) {
    initializeRecaptcha();
    return;
  }
  
  // 加載 reCAPTCHA 腳本
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    console.log("reCAPTCHA 腳本加載成功");
    scriptLoaded.value = true;
    initializeRecaptcha();
  };
  
  script.onerror = (error) => {
    console.error("reCAPTCHA 腳本加載失敗:", error);
    emit('error');
  };
  
  document.head.appendChild(script);
});

// 初始化 reCAPTCHA
function initializeRecaptcha() {
  console.log("初始化 reCAPTCHA...");
  if (!window.grecaptcha || !window.grecaptcha.render) {
    console.error("grecaptcha 未正確加載");
    return;
  }
  
  // 等待 DOM 元素準備好
  setTimeout(() => {
    try {
      if (recaptchaContainer.value) {
        recaptchaInstance = window.grecaptcha.render(recaptchaContainer.value, {
          sitekey: props.sitekey,
          callback: onVerify,
          'expired-callback': onExpired,
          'error-callback': onError
        });
        console.log("reCAPTCHA 渲染成功");
      } else {
        console.error("recaptchaContainer 未找到");
      }
    } catch (e) {
      console.error("reCAPTCHA 渲染失敗:", e);
    }
  }, 100);
}

function onVerify(response) {
  console.log("CAPTCHA 驗證成功，響應:", response);
  emit('verified', response);
}

function onExpired() {
  console.log("CAPTCHA 已過期");
  emit('expired');
}

function onError() {
  console.log("CAPTCHA 出錯");
  emit('error');
}
</script>

<style scoped>
.captcha-container {
  margin: 16px 0;
  min-height: 78px; /* 避免加載時佈局跳動 */
  display: flex;
  justify-content: center;
  border: 1px dashed #ccc;
  padding: 10px;
}
</style>
