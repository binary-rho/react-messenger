import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProfileById, Profile } from '../api/profile'
import {
  fetchConversationPage,
  isMessageOfConversation,
  Message,
  sendMessage,
  subscribeToMyMessages,
} from '../api/messages'
import { usePagedMessages } from '../lib/usePagedMessages'
import { useMyProfile } from '../states/profileAtom'
import { ChatRoomView } from '../components/ChatRoomView'

export const Chatting = () => {
  const { id } = useParams()
  const me = useMyProfile()
  const [opposite, setOpposite] = useState<Profile | null>(null)
  const { messages, hasMore, loadOlder, appendMessage } = usePagedMessages<Message>(id, (beforeId) =>
    fetchConversationPage(me.id, id!, beforeId),
  )

  useEffect(() => {
    if (!id) return
    fetchProfileById(id).then(setOpposite).catch(console.error)
    return subscribeToMyMessages(me.id, (message) => {
      if (isMessageOfConversation(message, me.id, id)) appendMessage(message)
    })
  }, [id, me.id, appendMessage])

  const senders = useMemo(() => {
    const map = new Map<string, Profile>([[me.id, me]])
    if (opposite) map.set(opposite.id, opposite)
    return map
  }, [me, opposite])

  const onSend = async (content: string) => {
    if (!opposite) return
    appendMessage(await sendMessage(me.id, opposite.id, content))
  }

  return (
    <ChatRoomView
      title={opposite?.name ?? ''}
      messages={messages}
      senders={senders}
      myId={me.id}
      onSend={onSend}
      hasMore={hasMore}
      onLoadOlder={loadOlder}
    />
  )
}
