import { Fragment, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { colors } from '../style/colors'
import { imgPath } from '../style/imgPath'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Profile, resolveAvatarSrc } from '../api/profile'

const TIME_FORMAT = 'hh:mma'
const UNKNOWN_SENDER_NAME = '알 수 없음'

export interface ChatRoomMessage {
  id: number
  sender_id: string
  content: string
  created_at: string
}

//1:1 채팅과 단톡이 함께 쓰는 채팅방 화면
export const ChatRoomView = ({
  title,
  messages,
  senders,
  myId,
  onSend,
  onMenuClick,
  overlay,
}: {
  title: string
  messages: ChatRoomMessage[]
  senders: Map<string, Profile>
  myId: string
  onSend: (content: string) => Promise<void>
  onMenuClick?: () => void
  overlay?: React.ReactNode
}) => {
  const [inputValue, setInputValue] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const chatListRef = useRef<HTMLDivElement>(null)

  //새 메시지가 오면 가장 아래로 스크롤
  useEffect(() => {
    const element = chatListRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  //inputRef설정 함수
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault()
    e.stopPropagation()
    inputRef.current?.focus()
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    //입력한 값이 없을 때 alert 추가
    if (inputValue.trim() === '') {
      alert('메시지를 입력해주세요.')
      return
    }
    const content = inputValue
    setInputValue('')
    try {
      await onSend(content)
    } catch (error) {
      console.error(error)
      setInputValue(content)
      alert('메시지를 보내지 못했어요. 다시 시도해주세요.')
    }
  }

  const isChatOn = messages.length > 0

  return (
    <ChattingContainer>
      <TopHeading>
        <SafeAreaImg src={imgPath.path[0]} />
        <UserContainer>
          <Link to="/" style={{ display: 'contents' }}>
            <BackIcon src={imgPath.path[3]} />
          </Link>
          <UserNameBox>
            <UserName>{title}</UserName>
            {isChatOn && <GreenCircle />}
          </UserNameBox>
          <DotsIcon src={imgPath.path[6]} onClick={onMenuClick} style={{ cursor: onMenuClick ? 'pointer' : 'default' }} />
        </UserContainer>
      </TopHeading>
      {isChatOn ? (
        <ChattingList ref={chatListRef}>
          {messages.map((chat, index, arr) => {
            const chatTime = format(new Date(chat.created_at), 'hh:mm')
            const prev = arr[index - 1]
            const next = arr[index + 1]
            //만약 그 전 채팅시간과 같다면 그 전 채팅시간이 사라지고 마지막 채팅에만
            const showTime: boolean =
              !next || chatTime !== format(new Date(next.created_at), 'hh:mm') || chat.sender_id !== next.sender_id
            //만약 그 전 채팅시간과 같다면 첫 채팅에만 프로필, 이후에는 프로필 없도록
            const showProfile: boolean =
              !prev || chatTime !== format(new Date(prev.created_at), 'hh:mm') || chat.sender_id !== prev.sender_id

            const chatDate = format(new Date(chat.created_at), 'yyyy-MM-dd')
            const prevChatDate = prev ? format(new Date(prev.created_at), 'yyyy-MM-dd') : ''
            const timeText = format(new Date(chat.created_at), TIME_FORMAT).replace(' ', '')
            const sender = senders.get(chat.sender_id)

            return (
              <Fragment key={chat.id}>
                {chatDate !== prevChatDate && (
                  //다음 날에 채팅을 보낼 경우 날짜를 표시
                  <NextDayBox>
                    <NextDay>{chatDate}</NextDay>
                  </NextDayBox>
                )}
                {chat.sender_id === myId ? (
                  <MyChatList>
                    <MyChatContainer>
                      <ChattingBox1>{chat.content}</ChattingBox1>
                    </MyChatContainer>
                    {showTime ? <ChatTime>{timeText}</ChatTime> : null}
                  </MyChatList>
                ) : (
                  <FriendContainer style={{ marginTop: showProfile ? '0.3rem' : 0 }}>
                    {showProfile ? <ProfileImg src={resolveAvatarSrc(sender?.avatar_url)} /> : <NoProfileImg />}
                    <FriendChatList>
                      <FriendChatContainer>
                        {showProfile ? <FriendName>{sender?.name ?? UNKNOWN_SENDER_NAME}</FriendName> : null}
                        <ChattingBox2>{chat.content}</ChattingBox2>
                      </FriendChatContainer>
                      {showTime ? <ChatTime>{timeText}</ChatTime> : null}
                    </FriendChatList>
                  </FriendContainer>
                )}
              </Fragment>
            )
          })}
        </ChattingList>
      ) : (
        <NoChattingList>
          <NoChatImg src={imgPath.path[7]} />
          <NoChatText>작성된 메시지가 없습니다.</NoChatText>
        </NoChattingList>
      )}
      <BottomBox>
        <ChatArea>
          <InputContainer onSubmit={onSubmit}>
            <PlusIcon src={imgPath.path[4]} />
            <InputBox
              placeholder="메시지를 작성해주세요"
              ref={inputRef}
              value={inputValue}
              onChange={onChange}
              onClick={handleInputClick}
            />
            <button
              type="submit"
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                width: 24,
                height: 24,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <AirplainIcon src={imgPath.path[5]} />
            </button>
          </InputContainer>
        </ChatArea>
      </BottomBox>
      <SafeAreaImg2 src={imgPath.path[2]} />
      {overlay}
    </ChattingContainer>
  )
}

const ChattingContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: ${colors.grey_50};
  align-items: center;
  width: 375px;
  height: 812px;
`

const SafeAreaImg = styled.img`
  width: 100%;
`
const SafeAreaImg2 = styled.img`
  width: 100%;
  background-color: ${colors.white};
`

const TopHeading = styled.div`
  display: flex;
  flex-direction: column;
  height: 2.3;
  width: 100%;
  align-items: center;
  justify-content: center;
`

const UserContainer = styled.div`
  display: flex;
  width: 21rem;
  height: 1.5rem;
  justify-content: space-between;
  align-items: center;
  margin: 0rem 1.25rem 0.9rem 1.25rem;
`
const UserNameBox = styled.div`
  display: inline-flex;
  align-items: flex-start;
  width: 283px;
  height: 28px;
`
const UserName = styled.span`
  color: ${colors.grey_900};
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: 28px;
  margin-left: 11px;
  font-family: 'Pretendard-Regular';
`

const GreenCircle = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background-color: ${colors.green};
`

const BackIcon = styled.img`
  width: 24px;
  height: 24px;
  cursor: pointer;
`

const DotsIcon = styled.img`
  width: 24px;
  height: 24px;
  cursor: pointer;
`
const BottomBox = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 60px;
  justify-content: center;
  align-items: center;
  background-color: ${colors.white};
`
const ChattingList = styled.div`
  display: flex;
  flex-direction: column;
  height: 40rem;
  width: 100%;
  padding: 0rem 1.25rem;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`
const NoChattingList = styled(ChattingList)`
  align-items: center;
  justify-content: center;
`

const NoChatText = styled.div`
  color: ${colors.grey_700};
  text-align: center;
  font-family: 'Pretendard-SemiBold';
  font-size: 20px;
  font-style: normal;
  line-height: 140%;
  width: 12.875rem;
`

const NoChatImg = styled.img`
  width: 155px;
  height: 100px;
  margin-bottom: 41px;
`

const MyChatList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
`

const MyChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`

const ChattingBox1 = styled.span`
  display: flex;
  width: fit-content;
  max-width: 16rem;
  background-color: ${colors.purple};
  border-radius: 0.6rem;
  padding: 0.63rem 0.75rem 0.63rem 0.75rem;
  color: ${colors.white};
  line-height: 120%;
  font-family: 'Pretendard-Light';
  margin-bottom: 0.5rem;
  word-break: break-all;
`

const ChattingBox2 = styled.span`
  background-color: ${colors.white};
  border-radius: 0.6rem;
  padding: 0.63rem 0.75rem 0.63rem 0.75rem;
  color: ${colors.grey_900};
  max-width: 20rem;
  width: fit-content;
  line-height: 120%;
  font-family: 'Pretendard-Light';
  margin-bottom: 0.5rem;
  word-break: break-all;
`

const FriendChatList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const FriendContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-start;
`

const ProfileImg = styled.img`
  width: 3.125rem;
  height: 3.125rem;
  border-radius: 50px;
  object-fit: cover;
  margin-right: 0.5rem;
`

const NoProfileImg = styled.div`
  width: 3.125rem;
  margin: 0rem 0.5rem 0rem 0.5rem;
`

const FriendChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 240px;
`

const FriendName = styled.span`
  color: ${colors.grey_900};
  font-family: 'Pretendard';
  font-size: 14px;
  line-height: 120%; /* 16.8px */
  margin-bottom: 0.5rem;
`

const ChatTime = styled.span`
  color: ${colors.grey_400};
  font-family: 'Pretendard-Light';
  font-size: 14px;
  line-height: 120%; /* 16.8px */
  margin-bottom: 0.6rem;
`

const ChatArea = styled.div`
  display: flex;
  width: 100%;
  height: 60px;
  padding: 14px 16px 0px 16px;
  background-color: ${colors.white};
  box-sizing: border-box;
`

const InputContainer = styled.form`
  display: flex;
  width: 100%;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  height: 36px;
`

const PlusIcon = styled.img`
  height: 28px;
  width: 28px;
  cursor: pointer;
`

const InputBox = styled.input`
  width: 264px;
  outline: none;
  border: none;
  border-radius: 6px;
  padding: 9px 0px 8px 14px;
  font-size: 16px;
  font-family: 'Pretendard-Regular';

  &::placeholder {
    /* Chrome, Firefox, Opera, Safari */
    color: ${colors.grey_300};
  }

  &::-ms-input-placeholder {
    /* Internet Explorer */
    color: ${colors.grey_300};
  }

  background-color: ${colors.grey_50};
`

const AirplainIcon = styled.img`
  height: 24px;
  width: 24px;
  cursor: pointer;
`
const NextDayBox = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.2rem 0rem 1.5rem 0rem;
`
const NextDay = styled.span`
  width: fit-content;
  align-items: center;
  text-align: center;
  color: ${colors.grey_700};
  font-family: 'Pretendard-Light';
  font-size: 13px;
  /* border: 0.1rem solid ;
  border-radius: 5rem; */
  padding: 0.35rem 1.7rem 0.35rem 1.7rem;
`
