import { supabase } from '../lib/supabase'

export interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export const isMessageOfConversation = (message: Message, userA: string, userB: string): boolean =>
  (message.sender_id === userA && message.receiver_id === userB) ||
  (message.sender_id === userB && message.receiver_id === userA)

export const MESSAGE_PAGE_SIZE = 50

//최신 메시지부터 MESSAGE_PAGE_SIZE개를 가져오고, beforeId가 있으면 그보다 이전 메시지를 가져옴 (반환은 오래된 순)
export const fetchConversationPage = async (myId: string, otherId: string, beforeId?: number): Promise<Message[]> => {
  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
    .order('id', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE)
  if (beforeId !== undefined) query = query.lt('id', beforeId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reverse()
}

//상대별 마지막 메시지 하나씩만 가져옴 (supabase/last_messages.sql의 함수 필요)
export const fetchMyLastMessages = async (): Promise<Message[]> => {
  const { data, error } = await supabase.rpc('my_last_messages')
  if (error) throw error
  return (data ?? []) as Message[]
}

export const sendMessage = async (senderId: string, receiverId: string, content: string): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single()
  if (error) throw error
  return data as Message
}

//내가 보내거나 받은 새 메시지를 구독, 반환값은 구독 해제 함수
export const subscribeToMyMessages = (myId: string, onMessage: (message: Message) => void) => {
  const channel = supabase
    .channel(`messages:${myId}:${Math.random()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const message = payload.new as Message
      if (message.sender_id === myId || message.receiver_id === myId) onMessage(message)
    })
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
