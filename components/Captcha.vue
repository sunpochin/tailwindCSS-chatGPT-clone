<template>
  <div class="captcha-container">
    <ClientOnly>
      <component 
        :is="VueRecaptcha" 
        v-if="VueRecaptcha"
        :sitekey="sitekey"
        @verify="onVerify"
        @expired="onExpired"
        @error="onError"
      ></component>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const VueRecaptcha = ref(null);

onMounted(async () => {
  try {
    // 動態導入，只在客戶端執行
    const module = await import('vue-recaptcha');
    VueRecaptcha.value = module.VueRecaptcha;
  } catch (e) {
    console.error('Failed to load reCAPTCHA:', e);
  }
});

const props = defineProps({
  sitekey: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['verified', 'expired', 'error']);

const onVerify = (response) => {
  emit('verified', response);
};

const onExpired = () => {
  emit('expired');
};

const onError = () => {
  emit('error');
};
</script>

<style scoped>
.captcha-container {
  margin: 16px 0;
}
</style>
