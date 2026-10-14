import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchProfilesByIds, Profile } from '../api/profile'
import {
  addGroupMembers,
  fetchGroupById,
  fetchGroupMembers,
  fetchGroupMessagesPage,
  Group,
  GroupMessage,
  leaveGroup,
  sendGroupMessage,
  subscribeToGroupMessages,
} from '../api/groups'
import { usePagedMessages } from '../lib/usePagedMessages'
import { useMyProfile } from '../states/profileAtom'
import { ChatRoomView } from '../components/ChatRoomView'
import { GroupMenu } from '../components/GroupMenu'

export const GroupChatting = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = useMyProfile()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  //나간 사람 등 현재 멤버가 아닌 발신자의 프로필
  const [formerSenders, setFormerSenders] = useState<Profile[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  const { messages, hasMore, loadOlder, appendMessage } = usePagedMessages<GroupMessage>(id, (beforeId) =>
    fetchGroupMessagesPage(id!, beforeId),
  )

  const loadMembers = (groupId: string) => fetchGroupMembers(groupId).then(setMembers).catch(console.error)

  useEffect(() => {
    if (!id) return
    fetchGroupById(id).then(setGroup).catch(console.error)
    loadMembers(id)
    return subscribeToGroupMessages((message) => {
      if (message.group_id === id) appendMessage(message)
    })
  }, [id, appendMessage])

  //멤버 목록에 없는 발신자(나간 사람, 방금 초대된 사람)의 프로필을 따로 불러옴
  useEffect(() => {
    const knownIds = new Set([...members, ...formerSenders].map((profile) => profile.id))
    const unknownIds = Array.from(new Set(messages.map((message) => message.sender_id))).filter(
      (senderId) => !knownIds.has(senderId),
    )
    if (unknownIds.length === 0) return
    fetchProfilesByIds(unknownIds)
      .then((profiles) => setFormerSenders((prev) => [...prev, ...profiles]))
      .catch(console.error)
  }, [messages, members, formerSenders])

  const senders = useMemo(
    () => new Map([...formerSenders, ...members].map((profile) => [profile.id, profile])),
    [members, formerSenders],
  )

  const onSend = async (content: string) => {
    if (!id) return
    appendMessage(await sendGroupMessage(id, me.id, content))
  }

  const onInvite = async (friendIds: string[]) => {
    if (!id) return
    await addGroupMembers(id, friendIds)
    await loadMembers(id)
  }

  const onLeave = async () => {
    if (!id) return
    try {
      await leaveGroup(id)
      navigate('/', { replace: true })
    } catch (error) {
      console.error(error)
      alert('단톡방을 나가지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  const title = group ? `${group.name} (${members.length})` : ''

  return (
    <ChatRoomView
      title={title}
      messages={messages}
      senders={senders}
      myId={me.id}
      onSend={onSend}
      hasMore={hasMore}
      onLoadOlder={loadOlder}
      onMenuClick={() => setIsMenuOpen(true)}
      overlay={
        isMenuOpen && (
          <GroupMenu
            members={members}
            myId={me.id}
            onInvite={onInvite}
            onLeave={onLeave}
            onClose={() => setIsMenuOpen(false)}
          />
        )
      }
    />
  )
}
