import { createClient } from '@supabase/supabase-js'

// Nuxt 3 專案中，請用 useRuntimeConfig() 取得公開環境變數
const config = useRuntimeConfig()
const supabaseUrl = config.public.supabaseUrl
const supabaseKey = config.public.supabaseKey

export const supabase = createClient(supabaseUrl, supabaseKey)
