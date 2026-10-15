import { useEffect } from 'react'
import { markRoomRead } from '../api/messages'

//채팅방을 열어 둔 동안 가장 최근 메시지까지 읽은 것으로 기록 (새 메시지가 오면 다시 기록)
export const useMarkRoomRead = (roomKey: string | undefined, messages: { id: number }[]) => {
  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    if (!roomKey || lastMessageId === undefined) return
    markRoomRead(roomKey, lastMessageId).catch(console.error)
  }, [roomKey, lastMessageId])
}
