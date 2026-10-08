import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY 환경변수를 .env에 설정해주세요.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const AVATAR_BUCKET = 'avatars'
