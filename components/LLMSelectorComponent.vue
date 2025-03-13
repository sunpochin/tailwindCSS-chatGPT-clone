/**
 * @file LLM 選擇組件
 * @description 提供選擇聊天模型的功能
 */

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useChatStore } from '../stores/chat'

const chatStore = useChatStore()

// 可用的模型列表
const models = ref([
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
])

// 當前選擇的模型，從 store 初始化
const selectedModel = ref(chatStore.currentModel)

/**
 * @description 當使用者在 UI 選擇模型時，更新 store
 */
const handleModelChange = () => {
  chatStore.setModel(selectedModel.value)
}

// 監聽 store 中模型的變化，確保雙向同步
watch(() => chatStore.currentModel, (newModel) => {
  selectedModel.value = newModel
})

// 初始化時確保從 store 載入正確的模型
onMounted(() => {
  selectedModel.value = chatStore.currentModel
})
</script>

<template>
  <div class="chat-components">
    <!-- 模型選擇器 -->
    <div class="model-selector">
      <select 
        id="model-select" 
        v-model="selectedModel" 
        @change="handleModelChange"
        class="model-select"
      >
        <option v-for="model in models" :key="model.id" :value="model.id">
          {{ model.name }} ({{ model.provider }})
        </option>
      </select>
    </div>
    
    <slot></slot> <!-- 提供插槽讓父組件可以插入內容 -->
  </div>
</template>

<style scoped>
/* 主容器樣式 */
.chat-components {
  width: 100%;
}

/* 模型選擇器樣式 */
.model-selector {
  padding: 10px;
  margin-bottom: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 40%;
}

/* 模型選擇下拉框樣式 */
.model-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  font-size: 14px;
  flex-grow: 1;
  cursor: pointer;
}

/* 深色模式樣式 */
@media (prefers-color-scheme: dark) {
  .model-selector {
    background-color: #2a2a2a;
  }
  
  .model-select {
    background-color: #333;
    color: #fff;
    border-color: #444;
  }
}
</style>
