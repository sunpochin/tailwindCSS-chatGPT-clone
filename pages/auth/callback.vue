<template>
  <div class="flex items-center justify-center h-screen">
    <p>正在處理登入…</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

const supabase = useSupabaseClient()
const router = useRouter()

onMounted(async () => {
  // 透過 auth.detectSessionInUrl=true 自動交換 code 並儲存 session
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session) {
    console.error('取得 Session 失敗：', error)
    return
  }
  router.replace('/')
})
</script>
