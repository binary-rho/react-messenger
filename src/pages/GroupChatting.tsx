import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Profile } from '../api/profile'
import {
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupMessages,
  Group,
  GroupMessage,
  sendGroupMessage,
  subscribeToGroupMessages,
} from '../api/groups'
import { useMyProfile } from '../states/profileAtom'
import { ChatRoomView } from '../components/ChatRoomView'

export const GroupChatting = () => {
  const { id } = useParams()
  const me = useMyProfile()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])

  //id 중복 없이 메시지 추가 (직접 보낸 메시지가 realtime으로도 들어오기 때문)
  const appendMessage = (message: GroupMessage) =>
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))

  useEffect(() => {
    if (!id) return
    fetchGroupById(id).then(setGroup).catch(console.error)
    fetchGroupMembers(id).then(setMembers).catch(console.error)
    fetchGroupMessages(id).then(setMessages).catch(console.error)
    return subscribeToGroupMessages((message) => {
      if (message.group_id === id) appendMessage(message)
    })
  }, [id])

  const senders = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])

  const onSend = async (content: string) => {
    if (!id) return
    appendMessage(await sendGroupMessage(id, me.id, content))
  }

  const title = group ? `${group.name} (${members.length})` : ''

  return <ChatRoomView title={title} messages={messages} senders={senders} myId={me.id} onSend={onSend} />
}
