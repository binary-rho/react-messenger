import { supabase } from '../lib/supabase'

export const MIN_PASSWORD_LENGTH = 6

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  //이메일 인증이 켜져 있으면 session이 없음
  return { needsEmailConfirmation: !data.session }
}

export const signInWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

//로그인/로그아웃 변화를 구독, 반환값은 구독 해제 함수
export const subscribeToAuthUserId = (onChange: (userId: string | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session?.user.id ?? null))
  return () => data.subscription.unsubscribe()
}
