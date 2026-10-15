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

export const getDmRoomKey = (partnerId: string) => `dm:${partnerId}`
export const getGroupRoomKey = (groupId: string) => `group:${groupId}`

//방별 안 읽은 개수, 키는 room key (supabase/read_state.sql의 함수 필요)
export const fetchUnreadCounts = async (): Promise<Map<string, number>> => {
  const { data, error } = await supabase.rpc('my_unread_counts')
  if (error) throw error
  const rows = (data ?? []) as { room_key: string; unread_count: number }[]
  return new Map(rows.map((row) => [row.room_key, Number(row.unread_count)]))
}

//해당 방을 lastMessageId까지 읽은 것으로 기록
export const markRoomRead = async (roomKey: string, lastMessageId: number): Promise<void> => {
  const { error } = await supabase.rpc('mark_room_read', { key: roomKey, read_id: lastMessageId })
  if (error) throw error
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
