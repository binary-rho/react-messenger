import styled from 'styled-components'
import { colors } from '../style/colors'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchOtherProfiles, Profile, resolveAvatarSrc } from '../api/profile'
import {
  fetchMyLastMessages,
  fetchUnreadCounts,
  getDmRoomKey,
  getGroupRoomKey,
  Message,
  subscribeToMyMessages,
} from '../api/messages'
import { fetchMyLastGroupMessages, fetchMyGroups, Group, GroupMessage, subscribeToGroupMessages } from '../api/groups'
import { useMyProfile } from '../states/profileAtom'
import { EMOJI_PREVIEW_TEXT, parseEmojiContent } from '../lib/emoji'

const CONTENT_PREVIEW_LENGTH = 14
const NEW_GROUP_CONTENT = '단톡방이 만들어졌어요.'
const MAX_UNREAD_DISPLAY = 99
const UNKNOWN_SENDER_NAME = '알 수 없음'

const formatUnreadCount = (count: number) => (count > MAX_UNREAD_DISPLAY ? `${MAX_UNREAD_DISPLAY}+` : String(count))

//채팅 목록에서 14글자가 넘어가면 ...표시 되도록
const editContent = (content: string) => {
  if (parseEmojiContent(content)) return EMOJI_PREVIEW_TEXT
  return content.length >= CONTENT_PREVIEW_LENGTH ? content.substring(0, CONTENT_PREVIEW_LENGTH) + '...' : content
}

//1:1 채팅과 단톡을 한 목록에서 보여주기 위한 형태
interface ChatListItem {
  key: string
  to: string
  name: string
  avatarUrl: string | null
  isGroup: boolean
  content: string
  senderName?: string | null
  time: Date
  unreadCount: number
}

export const ChatList = ({ searchValue }: { searchValue: string }) => {
  const me = useMyProfile()
  const [messages, setMessages] = useState<Message[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
  const today = format(new Date(), 'yyyy/MM/dd')

  const load = useCallback(async () => {
    try {
      const [myMessages, others, myGroups, myGroupMessages, myUnreadCounts] = await Promise.all([
        fetchMyLastMessages(),
        fetchOtherProfiles(me.id),
        fetchMyGroups(),
        fetchMyLastGroupMessages(),
        fetchUnreadCounts(),
      ])
      setMessages(myMessages)
      setProfiles(others)
      setGroups(myGroups)
      setGroupMessages(myGroupMessages)
      setUnreadCounts(myUnreadCounts)
    } catch (error) {
      console.error(error)
    }
  }, [me.id])

  useEffect(() => {
    load()
    const unsubscribeMessages = subscribeToMyMessages(me.id, load)
    const unsubscribeGroupMessages = subscribeToGroupMessages(load)
    return () => {
      unsubscribeMessages()
      unsubscribeGroupMessages()
    }
  }, [me.id, load])

  //상대별 마지막 메시지 (서버에서 상대별 마지막 메시지만 내려옴)
  const lastMessageByPartner = new Map<string, Message>()
  messages.forEach((message) => {
    const partnerId = message.sender_id === me.id ? message.receiver_id : message.sender_id
    lastMessageByPartner.set(partnerId, message)
  })
  const lastMessageByGroup = new Map<string, GroupMessage>()
  groupMessages.forEach((message) => lastMessageByGroup.set(message.group_id, message))

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))

  const friendItems: ChatListItem[] = profiles
    .filter((friend) => lastMessageByPartner.has(friend.id))
    .map((friend) => {
      const lastMessage = lastMessageByPartner.get(friend.id)!
      return {
        key: `friend-${friend.id}`,
        to: `/chatting/${friend.id}`,
        name: friend.name,
        avatarUrl: friend.avatar_url,
        isGroup: false,
        content: lastMessage.content,
        time: new Date(lastMessage.created_at),
        unreadCount: unreadCounts.get(getDmRoomKey(friend.id)) ?? 0,
      }
    })

  //대화가 없는 새 단톡방도 목록에 보이도록 생성 시각을 기준으로 함
  const groupItems: ChatListItem[] = groups.map((group) => {
    const lastMessage = lastMessageByGroup.get(group.id)
    //단톡은 누가 말했는지 알 수 있도록 본인이 아니면 발신자 이름을 앞에 붙임
    const isSentByOthers = lastMessage !== undefined && lastMessage.sender_id !== me.id
    const senderName = isSentByOthers ? (profileById.get(lastMessage.sender_id)?.name ?? UNKNOWN_SENDER_NAME) : null
    return {
      key: `group-${group.id}`,
      to: `/group/${group.id}`,
      name: group.name,
      avatarUrl: null,
      isGroup: true,
      content: lastMessage?.content ?? NEW_GROUP_CONTENT,
      senderName,
      time: new Date(lastMessage?.created_at ?? group.created_at),
      unreadCount: unreadCounts.get(getGroupRoomKey(group.id)) ?? 0,
    }
  })

  const items = [...friendItems, ...groupItems]
    .filter((item) => item.name.toLowerCase().includes(searchValue.toLowerCase()))
    //마지막에 보낸 채팅방이 가장 위로 올 수 있도록
    .sort((a, b) => b.time.getTime() - a.time.getTime())

  return (
    <ChatContainer>
      {items.map((item) => (
        <Link key={item.key} to={item.to} style={{ display: 'contents' }}>
          <ChatBox>
            <InfoBox>
              <ChatProfileBox>
                {item.isGroup ? (
                  <GroupProfile>{item.name.charAt(0)}</GroupProfile>
                ) : (
                  <ChatProfileImg src={resolveAvatarSrc(item.avatarUrl)} />
                )}
              </ChatProfileBox>
              <ChatTextBox>
                <ChatName>{item.name}</ChatName>
                <ChatContent>
                  {item.senderName ? `${item.senderName}: ` : ''}
                  {editContent(item.content)}
                </ChatContent>
              </ChatTextBox>
            </InfoBox>
            <ChatMeta>
              <ChatTime>
                {format(item.time, today === format(item.time, 'yyyy/MM/dd') ? 'hh:mma' : 'MM/dd').replace(' ', '')}
              </ChatTime>
              {item.unreadCount > 0 && <UnreadBadge>{formatUnreadCount(item.unreadCount)}</UnreadBadge>}
            </ChatMeta>
          </ChatBox>
        </Link>
      ))}
    </ChatContainer>
  )
}

const GroupProfile = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 1.5rem;
`
const ChatContainer = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  background-color: ${colors.grey_50};
  overflow: auto;
  list-style-type: none;
  &::-webkit-scrollbar {
    display: none;
  }
`
const ChatBox = styled.div`
  display: flex;
  width: 100%;
  height: 4.375rem;
  justify-content: space-between;
  padding: 0.31rem 1.94rem 0.31rem 1.25rem;
`
const InfoBox = styled.div`
  display: flex;
  width: 16.5rem;
  height: 3.75rem;
  align-items: center;
`
const ChatProfileBox = styled.div`
  display: flex;
  position: relative;
  width: 3.75rem;
  height: 3.75rem;
  margin-right: 0.81rem;
`
const ChatProfileImg = styled.img`
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  object-fit: cover;
`

const ChatTextBox = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 2.63rem;
`
const ChatName = styled.span`
  width: 100%;
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
  font-size: 1.125rem;
  line-height: 140%; /* 1.575rem */
`
const ChatContent = styled.div`
  color: ${colors.grey_400};
  width: 100%;
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
  line-height: 0.875rem;
  margin-top: 0.19rem;
`
const ChatMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  margin-top: 0.56rem;
`
const ChatTime = styled.span`
  color: ${colors.grey_400};
  font-family: 'Pretendard-Regular';
  font-size: 0.75rem;
  line-height: 0.875rem;
`
const UnreadBadge = styled.span`
  min-width: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 0.625rem;
  background-color: ${colors.red};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 0.75rem;
  line-height: 1.25rem;
  text-align: center;
`
