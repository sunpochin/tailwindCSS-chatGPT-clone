/**
 * @file 負責 Nuxt 應用的配置
 * @description 包含模組、運行時配置和構建設置等
 */

import { defineNuxtConfig } from 'nuxt/config'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config()

export default defineNuxtConfig({
  // 開啟熱重載
  vite: {
    server: {
      hmr: true
    },
    optimizeDeps: {
      include: ['pdf-parse']
    },
    ssr: {
      // 避免某些模塊在SSR時出錯
      noExternal: ['pdf-parse', 'pinia']
    },
    // 改善 hydration 問題
    build: {
      ssrManifest: true
    }
  },

  // 開發工具配置
  devtools: {
    enabled: true
  },

  // 確保 typescript 編譯不阻斷熱重載
  typescript: {
    typeCheck: false // 關閉typeCheck以排除潛在的hydration問題來源
  },

  // 降低兼容性日期以使用更成熟的功能
  compatibilityDate: '2022-03-03',

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss', // 添加 Tailwind CSS 模組
  ],

  pinia: {
    autoImports: ['defineStore', 'storeToRefs'],
  },

  // Tailwind CSS 配置
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    injectPosition: 0,
    viewer: true,
  },

  // 添加 PostCSS 配置，替代獨立的 postcss.config.js 文件
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    }
  },

  runtimeConfig: {
    public: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      apiBase: '/api',
      recaptchaSiteKey: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY
    },
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    pdfProcessing: {
      enabled: true
    },
    recaptchaSecretKey: process.env.NUXT_PRIVATE_RECAPTCHA_SECRET_KEY
  },
  alias: {
    '@': resolve(__dirname, './'),
  },

  pages: true, // 確保啟用 Nuxt 的 pages 功能

  // 確保僅在客戶端運行 PDF.js 相關代碼
  build: {
    transpile: ['pdfjs-dist', 'vue-recaptcha'] // 添加 vue-recaptcha
  },

  // 明確指定渲染模式和強制提前處理 hydration 相關代碼
  ssr: true,
  app: {
    keepalive: true,
    head: {
      htmlAttrs: {
        lang: 'en'
      }
    },
    // 強制客戶端水合設置
    rootId: 'app'
  },

  // 調整實驗性功能以提高穩定性
  experimental: {
    asyncEntry: false, // 關閉可能導致SSR問題的實驗性功能
    reactivityTransform: false,
    payloadExtraction: false, // 關閉可能與hydration衝突的功能
    renderJsonPayloads: false,
    componentIslands: false // 避免使用可能不穩定的島嶼組件
  },
})