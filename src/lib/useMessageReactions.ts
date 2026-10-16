import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addReaction,
  fetchReactions,
  MessageReaction,
  ReactionMessageKind,
  removeReaction,
  subscribeToReactions,
} from '../api/reactions'

//화면에 보이는 메시지들의 리액션을 불러오고 실시간으로 반영하는 훅. roomKey가 바뀌면 처음부터 다시 불러옴
export const useMessageReactions = (
  kind: ReactionMessageKind,
  roomKey: string | undefined,
  messages: { id: number }[],
  myId: string,
) => {
  const messageIds = useMemo(() => messages.map((message) => message.id), [messages])
  const [reactions, setReactions] = useState<MessageReaction[]>([])
  const requestedIdsRef = useRef<Set<number>>(new Set())

  const addIfNew = useCallback(
    (reaction: MessageReaction) =>
      setReactions((prev) => (prev.some((r) => r.id === reaction.id) ? prev : [...prev, reaction])),
    [],
  )

  useEffect(() => {
    setReactions([])
    requestedIdsRef.current = new Set()
  }, [roomKey])

  //다른 방 메시지의 리액션 이벤트는 messageIds에 없으므로 화면에서 쓰이지 않는다
  useEffect(() => {
    const unsubscribe = subscribeToReactions(
      (reaction) => {
        if (reaction.message_kind === kind) addIfNew(reaction)
      },
      (reactionId) => setReactions((prev) => prev.filter((r) => r.id !== reactionId)),
    )
    return unsubscribe
  }, [kind, addIfNew])

  //아직 불러오지 않은 메시지의 리액션만 가져옴
  useEffect(() => {
    const newIds = messageIds.filter((messageId) => !requestedIdsRef.current.has(messageId))
    if (newIds.length === 0) return
    newIds.forEach((messageId) => requestedIdsRef.current.add(messageId))
    fetchReactions(kind, newIds)
      .then((fetched) => fetched.forEach(addIfNew))
      .catch((error) => {
        console.error(error)
        newIds.forEach((messageId) => requestedIdsRef.current.delete(messageId))
      })
  }, [kind, messageIds, addIfNew])

  const reactionsByMessageId = useMemo(() => {
    const map = new Map<number, MessageReaction[]>()
    reactions.forEach((reaction) => map.set(reaction.message_id, [...(map.get(reaction.message_id) ?? []), reaction]))
    return map
  }, [reactions])

  //내가 이미 단 이모티콘이면 취소하고, 아니면 추가
  const toggleReaction = async (messageId: number, emoji: string) => {
    const mine = reactions.find((r) => r.message_id === messageId && r.user_id === myId && r.emoji === emoji)
    if (mine) {
      await removeReaction(mine.id)
      setReactions((prev) => prev.filter((r) => r.id !== mine.id))
    } else {
      addIfNew(await addReaction(kind, messageId, myId, emoji))
    }
  }

  return { reactionsByMessageId, toggleReaction }
}
