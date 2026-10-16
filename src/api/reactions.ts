import { supabase } from '../lib/supabase'

export type ReactionMessageKind = 'dm' | 'group'

export interface MessageReaction {
  id: number
  message_kind: ReactionMessageKind
  message_id: number
  user_id: string
  emoji: string
}

export const fetchReactions = async (kind: ReactionMessageKind, messageIds: number[]): Promise<MessageReaction[]> => {
  if (messageIds.length === 0) return []
  const { data, error } = await supabase
    .from('message_reactions')
    .select('id, message_kind, message_id, user_id, emoji')
    .eq('message_kind', kind)
    .in('message_id', messageIds)
  if (error) throw error
  return (data ?? []) as MessageReaction[]
}

export const addReaction = async (
  kind: ReactionMessageKind,
  messageId: number,
  userId: string,
  emoji: string,
): Promise<MessageReaction> => {
  const { data, error } = await supabase
    .from('message_reactions')
    .insert({ message_kind: kind, message_id: messageId, user_id: userId, emoji })
    .select('id, message_kind, message_id, user_id, emoji')
    .single()
  if (error) throw error
  return data as MessageReaction
}

export const removeReaction = async (reactionId: number): Promise<void> => {
  const { error } = await supabase.from('message_reactions').delete().eq('id', reactionId)
  if (error) throw error
}

//리액션 추가/삭제를 구독, 반환값은 구독 해제 함수. DELETE는 RLS가 적용되지 않아 id만 전달됨
export const subscribeToReactions = (
  onAdd: (reaction: MessageReaction) => void,
  onRemove: (reactionId: number) => void,
) => {
  const channel = supabase
    .channel(`message_reactions:${Math.random()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, (payload) =>
      onAdd(payload.new as MessageReaction),
    )
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, (payload) =>
      onRemove((payload.old as { id: number }).id),
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
