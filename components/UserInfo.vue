<!-- 使用者資訊顯示元件 -->
<template>
  <!-- 顯示已登入使用者的基本資訊 -->
  <div v-if="user" class="user-info" style="text-align:center; margin-bottom:1rem;">
    <div>已登入：{{ user.email }}</div>
    <div v-if="user.user_metadata && user.user_metadata.full_name">姓名：{{ user.user_metadata.full_name }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSupabaseClient } from '#imports';

// 初始化 Supabase 客戶端
const supabase = useSupabaseClient();
// 使用者資料響應式變數
const user = ref<any>(null);

// 取得目前登入使用者資訊
const fetchUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  // 檢查是否有錯誤或無會話
  if (error || !data.session) {
    user.value = null;
    return;
  }
  // 設定使用者資料
  user.value = data.session.user;
};

// 元件載入時自動取得使用者資訊
onMounted(async () => {
  await fetchUser();
});
</script>
