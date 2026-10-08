import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProfileById, Profile } from '../api/profile'
import { fetchConversation, isMessageOfConversation, Message, sendMessage, subscribeToMyMessages } from '../api/messages'
import { useMyProfile } from '../states/profileAtom'
import { ChatRoomView } from '../components/ChatRoomView'

export const Chatting = () => {
  const { id } = useParams()
  const me = useMyProfile()
  const [opposite, setOpposite] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  //id 중복 없이 메시지 추가 (직접 보낸 메시지가 realtime으로도 들어오기 때문)
  const appendMessage = (message: Message) =>
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))

  useEffect(() => {
    if (!id) return
    fetchProfileById(id).then(setOpposite).catch(console.error)
    fetchConversation(me.id, id).then(setMessages).catch(console.error)
    return subscribeToMyMessages(me.id, (message) => {
      if (isMessageOfConversation(message, me.id, id)) appendMessage(message)
    })
  }, [id, me.id])

  const senders = useMemo(() => {
    const map = new Map<string, Profile>([[me.id, me]])
    if (opposite) map.set(opposite.id, opposite)
    return map
  }, [me, opposite])

  const onSend = async (content: string) => {
    if (!opposite) return
    appendMessage(await sendMessage(me.id, opposite.id, content))
  }

  return <ChatRoomView title={opposite?.name ?? ''} messages={messages} senders={senders} myId={me.id} onSend={onSend} />
}
