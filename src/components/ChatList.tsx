import styled from 'styled-components'
import { colors } from '../style/colors'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchOtherProfiles, Profile, resolveAvatarSrc } from '../api/profile'
import { fetchMyMessages, Message, subscribeToMyMessages } from '../api/messages'
import { fetchMyGroupMessages, fetchMyGroups, Group, GroupMessage, subscribeToGroupMessages } from '../api/groups'
import { useMyProfile } from '../states/profileAtom'

const CONTENT_PREVIEW_LENGTH = 14
const NEW_GROUP_CONTENT = '단톡방이 만들어졌어요.'

//채팅 목록에서 14글자가 넘어가면 ...표시 되도록
const editContent = (content: string) =>
  content.length >= CONTENT_PREVIEW_LENGTH ? content.substring(0, CONTENT_PREVIEW_LENGTH) + '...' : content

//1:1 채팅과 단톡을 한 목록에서 보여주기 위한 형태
interface ChatListItem {
  key: string
  to: string
  name: string
  avatarUrl: string | null
  isGroup: boolean
  content: string
  time: Date
}

export const ChatList = ({ searchValue }: { searchValue: string }) => {
  const me = useMyProfile()
  const [messages, setMessages] = useState<Message[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([])
  const today = format(new Date(), 'yyyy/MM/dd')

  const load = useCallback(async () => {
    try {
      const [myMessages, others, myGroups, myGroupMessages] = await Promise.all([
        fetchMyMessages(me.id),
        fetchOtherProfiles(me.id),
        fetchMyGroups(),
        fetchMyGroupMessages(),
      ])
      setMessages(myMessages)
      setProfiles(others)
      setGroups(myGroups)
      setGroupMessages(myGroupMessages)
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

  //상대별 마지막 메시지 (메시지는 시간순 정렬이므로 덮어쓰면 마지막 메시지가 남음)
  const lastMessageByPartner = new Map<string, Message>()
  messages.forEach((message) => {
    const partnerId = message.sender_id === me.id ? message.receiver_id : message.sender_id
    lastMessageByPartner.set(partnerId, message)
  })
  const lastMessageByGroup = new Map<string, GroupMessage>()
  groupMessages.forEach((message) => lastMessageByGroup.set(message.group_id, message))

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
      }
    })

  //대화가 없는 새 단톡방도 목록에 보이도록 생성 시각을 기준으로 함
  const groupItems: ChatListItem[] = groups.map((group) => {
    const lastMessage = lastMessageByGroup.get(group.id)
    return {
      key: `group-${group.id}`,
      to: `/group/${group.id}`,
      name: group.name,
      avatarUrl: null,
      isGroup: true,
      content: lastMessage?.content ?? NEW_GROUP_CONTENT,
      time: new Date(lastMessage?.created_at ?? group.created_at),
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
                <ChatContent>{editContent(item.content)}</ChatContent>
              </ChatTextBox>
            </InfoBox>
            <ChatTime>
              {format(item.time, today === format(item.time, 'yyyy/MM/dd') ? 'hh:mma' : 'MM/dd').replace(' ', '')}
            </ChatTime>
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
  height: 54.2rem;
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
const ChatTime = styled.span`
  color: ${colors.grey_400};
  font-family: 'Pretendard-Regular';
  font-size: 0.75rem;
  line-height: 0.875rem;
  margin-top: 0.56rem;
`
