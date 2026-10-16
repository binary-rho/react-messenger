import { supabase } from '../lib/supabase'
import { Profile } from './profile'
import { MESSAGE_PAGE_SIZE } from './messages'

export interface Group {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface GroupMessage {
  id: number
  group_id: string
  sender_id: string
  content: string
  created_at: string
}

export const MAX_GROUP_NAME_LENGTH = 20
export const MIN_GROUP_FRIEND_COUNT = 2

export const validateGroupName = (name: string): string | null => {
  const trimmed = name.trim()
  if (trimmed === '') return '단톡방 이름을 입력해주세요.'
  if (trimmed.length > MAX_GROUP_NAME_LENGTH) return `이름은 ${MAX_GROUP_NAME_LENGTH}자 이하로 입력해주세요.`
  return null
}

//만든 사람은 서버에서 자동으로 멤버에 포함됨
export const createGroup = async (name: string, memberIds: string[]): Promise<string> => {
  const { data, error } = await supabase.rpc('create_group', { group_name: name, member_ids: memberIds })
  if (error) throw error
  return data as string
}

export const addGroupMembers = async (groupId: string, memberIds: string[]): Promise<void> => {
  const { error } = await supabase.rpc('add_group_members', { gid: groupId, member_ids: memberIds })
  if (error) throw error
}

//마지막 멤버가 나가면 서버에서 그룹도 삭제됨
export const leaveGroup = async (groupId: string): Promise<void> => {
  const { error } = await supabase.rpc('leave_group', { gid: groupId })
  if (error) throw error
}

//RLS로 내가 속한 그룹만 조회됨
export const fetchMyGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase.from('groups').select('*')
  if (error) throw error
  return data ?? []
}

export const fetchGroupById = async (groupId: string): Promise<Group | null> => {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle()
  if (error) throw error
  return data
}

export const fetchGroupMembers = async (groupId: string): Promise<Profile[]> => {
  const { data, error } = await supabase.from('group_members').select('profiles(*)').eq('group_id', groupId)
  if (error) throw error
  return ((data ?? []) as unknown as { profiles: Profile }[]).map((row) => row.profiles)
}

//최신 메시지부터 GROUP_MESSAGE_PAGE_SIZE개를 가져오고, beforeId가 있으면 그보다 이전 메시지를 가져옴 (반환은 오래된 순)
export const fetchGroupMessagesPage = async (groupId: string, beforeId?: number): Promise<GroupMessage[]> => {
  let query = supabase
    .from('group_messages')
    .select('*')
    .eq('group_id', groupId)
    .order('id', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE)
  if (beforeId !== undefined) query = query.lt('id', beforeId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reverse()
}

//내가 속한 각 그룹의 마지막 메시지 하나씩 (supabase/last_messages.sql의 함수 필요)
export const fetchMyLastGroupMessages = async (): Promise<GroupMessage[]> => {
  const { data, error } = await supabase.rpc('my_last_group_messages')
  if (error) throw error
  return (data ?? []) as GroupMessage[]
}

export const fetchGroupMessageById = async (messageId: number): Promise<GroupMessage | null> => {
  const { data, error } = await supabase.from('group_messages').select('*').eq('id', messageId).maybeSingle()
  if (error) throw error
  return data
}

export const sendGroupMessage = async (groupId: string, senderId: string, content: string): Promise<GroupMessage> => {
  const { data, error } = await supabase
    .from('group_messages')
    .insert({ group_id: groupId, sender_id: senderId, content })
    .select()
    .single()
  if (error) throw error
  return data as GroupMessage
}

//내가 속한 그룹의 새 메시지를 구독 (RLS로 내 그룹 것만 전달됨), 반환값은 구독 해제 함수
export const subscribeToGroupMessages = (onMessage: (message: GroupMessage) => void) => {
  const channel = supabase
    .channel(`group_messages:${Math.random()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) =>
      onMessage(payload.new as GroupMessage),
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
