import styled from 'styled-components'
import { colors } from '../style/colors'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fetchOtherProfiles, Profile, resolveAvatarSrc } from '../api/profile'
import { fetchMyMessages, Message, subscribeToMyMessages } from '../api/messages'
import { useMyProfile } from '../states/profileAtom'

const CONTENT_PREVIEW_LENGTH = 14

//채팅 목록에서 14글자가 넘어가면 ...표시 되도록
const editContent = (content: string) =>
  content.length >= CONTENT_PREVIEW_LENGTH ? content.substring(0, CONTENT_PREVIEW_LENGTH) + '...' : content

export const ChatList = ({ searchValue }: { searchValue: string }) => {
  const me = useMyProfile()
  const [messages, setMessages] = useState<Message[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const today = format(new Date(), 'yyyy/MM/dd')

  const load = useCallback(async () => {
    try {
      const [myMessages, others] = await Promise.all([fetchMyMessages(me.id), fetchOtherProfiles(me.id)])
      setMessages(myMessages)
      setProfiles(others)
    } catch (error) {
      console.error(error)
    }
  }, [me.id])

  useEffect(() => {
    load()
    return subscribeToMyMessages(me.id, load)
  }, [me.id, load])

  //상대별 마지막 메시지 (메시지는 시간순 정렬이므로 덮어쓰면 마지막 메시지가 남음)
  const lastMessageByPartner = new Map<string, Message>()
  messages.forEach((message) => {
    const partnerId = message.sender_id === me.id ? message.receiver_id : message.sender_id
    lastMessageByPartner.set(partnerId, message)
  })

  return (
    <ChatContainer>
      {profiles
        .filter((friend) => lastMessageByPartner.has(friend.id))
        .filter((friend) => friend.name.toLowerCase().includes(searchValue.toLowerCase()))
        .sort(
          //마지막에 보낸 채팅방이 가장 위로 올 수 있도록
          (a, b) =>
            new Date(lastMessageByPartner.get(b.id)!.created_at).getTime() -
            new Date(lastMessageByPartner.get(a.id)!.created_at).getTime(),
        )
        .map((friend) => {
          const lastMessage = lastMessageByPartner.get(friend.id)!
          const lastTime = new Date(lastMessage.created_at)
          const isToday = today === format(lastTime, 'yyyy/MM/dd')
          return (
            <Link key={friend.id} to={`/chatting/${friend.id}`} style={{ display: 'contents' }}>
              <ChatBox>
                <InfoBox>
                  <ChatProfileBox>
                    <ChatProfileImg src={resolveAvatarSrc(friend.avatar_url)} />
                  </ChatProfileBox>
                  <ChatTextBox>
                    <ChatName>{friend.name}</ChatName>
                    <ChatContent>{editContent(lastMessage.content)}</ChatContent>
                  </ChatTextBox>
                </InfoBox>
                <ChatTime>{format(lastTime, isToday ? 'hh:mma' : 'MM/dd').replace(' ', '')}</ChatTime>
              </ChatBox>
            </Link>
          )
        })}
    </ChatContainer>
  )
}

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
