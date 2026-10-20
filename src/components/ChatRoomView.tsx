import { Fragment, useEffect, useState, useLayoutEffect, useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { colors } from '../style/colors'
import { imgPath } from '../style/imgPath'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { appFrame } from '../style/layout'
import { Profile, resolveAvatarSrc } from '../api/profile'
import { EMOJI_FILES, parseEmojiContent, resolveEmojiSrc, toEmojiContent } from '../lib/emoji'
import { parseImageContent, toImageContent } from '../lib/image'
import { uploadChatImage, validateChatImageFile } from '../api/chatImages'
import { AttachMenu, AttachMenuItem } from './AttachMenu'
import { ChatImageMessage } from './ChatImageMessage'
import { PhotoIcon, SmileIcon } from './icons'
import { MessageReaction } from '../api/reactions'
import { MessageReactionChips, MiniEmojiPicker } from './MessageReactions'
import { ReplyComposerBar, ReplyQuote, ReplyTarget } from './ReplyQuote'
import { findMentionQuery, insertMention, splitMentions } from '../lib/mention'
import { MessageActionToolbar, Toolbar as MessageToolbar } from './MessageActionToolbar'

const TIME_FORMAT = 'hh:mma'
const UNKNOWN_SENDER_NAME = '알 수 없음'
const LOAD_OLDER_SCROLL_THRESHOLD_PX = 80
const HIGHLIGHT_DURATION_MS = 1500

export interface ChatRoomMessage {
  id: number
  sender_id: string
  content: string
  reply_to_id: number | null
  created_at: string
}

//1:1 채팅과 단톡이 함께 쓰는 채팅방 화면
export const ChatRoomView = ({
  title,
  messages,
  senders,
  myId,
  onSend,
  hasMore,
  onLoadOlder,
  onSenderClick,
  onMenuClick,
  overlay,
  reactions,
  onToggleReaction,
}: {
  title: string
  messages: ChatRoomMessage[]
  senders: Map<string, Profile>
  myId: string
  onSend: (content: string, replyToId?: number) => Promise<void>
  hasMore: boolean
  onLoadOlder: () => Promise<void>
  onSenderClick?: (senderId: string) => void
  onMenuClick?: () => void
  overlay?: React.ReactNode
  reactions: Map<number, MessageReaction[]>
  onToggleReaction: (messageId: number, emoji: string) => Promise<void>
}) => {
  const [inputValue, setInputValue] = useState<string>('')
  //첨부 메뉴와 이모티콘 피커는 같은 자리를 쓰므로 한 번에 하나만 열린다
  const [openPanel, setOpenPanel] = useState<'attach' | 'emoji' | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  //미니 이모티콘 선택 줄이 열려 있는 메시지 (한 번에 하나만)
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<number | null>(null)
  //답장 중인 메시지 (다음에 보내는 메시지 한 건에 붙고 전송하면 해제)
  const [replyingTo, setReplyingTo] = useState<ChatRoomMessage | null>(null)
  //'@'를 입력 중일 때 보여줄 멘션 검색어 (null이면 멘션 목록을 닫음)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  //답장 원본으로 이동 중인 메시지 id (아직 안 불러왔으면 이전 메시지를 더 불러오며 찾는다)
  const [jumpTargetId, setJumpTargetId] = useState<number | null>(null)
  //이동한 뒤 잠깐 강조할 메시지 id
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const chatListRef = useRef<HTMLDivElement>(null)

  const prevScrollHeightRef = useRef<number>(0)
  const prevFirstMessageIdRef = useRef<number | undefined>(undefined)

  //이전 메시지가 위에 붙으면 보던 위치를 유지하고, 그 외(첫 로드, 새 메시지)에는 가장 아래로 스크롤
  useLayoutEffect(() => {
    const element = chatListRef.current
    if (!element) return
    const firstMessageId = messages[0]?.id
    const prevFirstMessageId = prevFirstMessageIdRef.current
    const isOlderPrepended =
      prevFirstMessageId !== undefined && firstMessageId !== undefined && firstMessageId < prevFirstMessageId
    if (isOlderPrepended) element.scrollTop += element.scrollHeight - prevScrollHeightRef.current
    else element.scrollTop = element.scrollHeight
    prevScrollHeightRef.current = element.scrollHeight
    prevFirstMessageIdRef.current = firstMessageId
  }, [messages])

  useEffect(() => {
    if (jumpTargetId === null) return
    const target = chatListRef.current?.querySelector(`[data-message-id="${jumpTargetId}"]`)
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setHighlightedMessageId(jumpTargetId)
      setJumpTargetId(null)
    } else if (hasMore) {
      onLoadOlder()
    } else {
      setJumpTargetId(null)
    }
  }, [jumpTargetId, messages, hasMore, onLoadOlder])

  useEffect(() => {
    if (highlightedMessageId === null) return
    const timer = setTimeout(() => setHighlightedMessageId(null), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [highlightedMessageId])

  const onChatListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasMore && e.currentTarget.scrollTop < LOAD_OLDER_SCROLL_THRESHOLD_PX) onLoadOlder()
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setMentionQuery(findMentionQuery(e.target.value.slice(0, e.target.selectionStart ?? e.target.value.length)))
  }

  //나를 뺀 채팅방 사람들 중 '@' 뒤 검색어로 시작하는 이름
  const mentionCandidates =
    mentionQuery === null
      ? []
      : Array.from(senders.values()).filter(
          (profile) => profile.id !== myId && profile.name.toLowerCase().startsWith(mentionQuery.toLowerCase()),
        )

  const onMentionSelect = (name: string) => {
    const caret = inputRef.current?.selectionStart ?? inputValue.length
    const inserted = insertMention(inputValue, caret, name)
    setInputValue(inserted.text)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(inserted.caret, inserted.caret)
    })
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery === null) return
    if (e.key === 'Escape') setMentionQuery(null)
    //IME 조합 중 Enter는 무시하고, 후보가 있으면 첫 후보를 멘션으로 넣는다
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && mentionCandidates.length > 0) {
      e.preventDefault()
      onMentionSelect(mentionCandidates[0].name)
    }
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
    setMentionQuery(null)
    try {
      await sendWithReply(content)
    } catch (error) {
      console.error(error)
      setInputValue(content)
      alert('메시지를 보내지 못했어요. 다시 시도해주세요.')
    }
  }

  const toReplyTarget = (message: ChatRoomMessage): ReplyTarget => ({
    senderName: senders.get(message.sender_id)?.name ?? UNKNOWN_SENDER_NAME,
    content: message.content,
    createdAt: message.created_at,
  })

  //답장 중이면 그 메시지에 대한 답장으로 보내고 답장 상태를 해제
  const sendWithReply = async (content: string) => {
    const replyToId = replyingTo?.id
    setReplyingTo(null)
    try {
      await onSend(content, replyToId)
    } catch (error) {
      setReplyingTo(replyingTo)
      throw error
    }
  }

  const onReplySelect = (message: ChatRoomMessage) => {
    setReactionPickerMessageId(null)
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const togglePanel = (panel: 'attach' | 'emoji') => setOpenPanel((current) => (current === panel ? null : panel))

  const onEmojiSelect = async (fileName: string) => {
    setOpenPanel(null)
    try {
      await sendWithReply(toEmojiContent(fileName))
    } catch (error) {
      console.error(error)
      alert('이모티콘을 보내지 못했어요. 다시 시도해주세요.')
    }
  }

  const onReactionSelect = async (messageId: number, emoji: string) => {
    setReactionPickerMessageId(null)
    try {
      await onToggleReaction(messageId, emoji)
    } catch (error) {
      console.error(error)
      alert('이모티콘을 달지 못했어요. 다시 시도해주세요.')
    }
  }

  const sendImageFile = async (file: File) => {
    const invalidReason = validateChatImageFile(file)
    if (invalidReason) {
      alert(invalidReason)
      return
    }
    setOpenPanel(null)
    setIsUploading(true)
    try {
      await sendWithReply(toImageContent(await uploadChatImage(myId, file)))
    } catch (error) {
      console.error(error)
      alert('사진을 보내지 못했어요. 다시 시도해주세요.')
    } finally {
      setIsUploading(false)
    }
  }

  const onImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    //같은 사진을 다시 골라도 change 이벤트가 오도록 초기화
    e.target.value = ''
    if (file) sendImageFile(file)
  }

  //클립보드에 이미지가 있으면 바로 전송 (텍스트만 있으면 기본 붙여넣기 동작 유지)
  const onInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const imageFile = Array.from(e.clipboardData.files).find((file) => file.type.startsWith('image/'))
    if (!imageFile) return
    e.preventDefault()
    sendImageFile(imageFile)
  }

  const attachMenuItems: AttachMenuItem[] = [
    { key: 'album', label: '앨범', icon: <PhotoIcon size={28} />, onSelect: () => imageFileInputRef.current?.click() },
  ]

  //이모티콘/사진 메시지는 말풍선 없이 이미지로, 일반 메시지는 말풍선으로 표시
  const renderContent = (content: string, Bubble: typeof ChattingBox1) => {
    const emojiFileName = parseEmojiContent(content)
    if (emojiFileName) return <EmojiMessageImg src={resolveEmojiSrc(emojiFileName)} alt="이모티콘" />
    const imagePath = parseImageContent(content)
    if (imagePath) return <ChatImageMessage path={imagePath} />
    const mentionNames = Array.from(senders.values()).map((profile) => profile.name)
    return (
      <Bubble>
        {splitMentions(content, mentionNames).map((segment, index) =>
          segment.isMention ? <MentionText key={index}>{segment.text}</MentionText> : segment.text,
        )}
      </Bubble>
    )
  }

  //불러온 메시지 중에서 답장 원본을 찾음 (더 이전 페이지에 있어 아직 없으면 null)
  const getReplyTarget = (replyToId: number): ReplyTarget | null => {
    const original = messages.find((message) => message.id === replyToId)
    return original ? toReplyTarget(original) : null
  }

  //메시지에 마우스를 올리면 [이모티콘 | 답장] 버튼이 뜨고, 달린 이모티콘은 메시지 아래에 칩으로 표시
  const renderMessageBody = (chat: ChatRoomMessage, Bubble: typeof ChattingBox1, isMine: boolean) => (
    <>
      {chat.reply_to_id !== null && chat.reply_to_id !== undefined && (
        <ReplyQuote
          target={getReplyTarget(chat.reply_to_id)}
          onClick={() => setJumpTargetId(chat.reply_to_id)}
        />
      )}
      <ReactionTarget $isMine={isMine} $isHighlighted={highlightedMessageId === chat.id} data-message-id={chat.id}>
        <MessageActionToolbar
          onReactionClick={() => setReactionPickerMessageId((current) => (current === chat.id ? null : chat.id))}
          onReplyClick={() => onReplySelect(chat)}
        />
        {renderContent(chat.content, Bubble)}
        {reactionPickerMessageId === chat.id && (
          <MiniEmojiPicker
            isMine={isMine}
            boundsRef={chatListRef}
            onSelect={(emoji) => onReactionSelect(chat.id, emoji)}
            onClose={() => setReactionPickerMessageId(null)}
          />
        )}
      </ReactionTarget>
      <MessageReactionChips
        reactions={reactions.get(chat.id) ?? []}
        myId={myId}
        senders={senders}
        onToggle={(emoji) => onReactionSelect(chat.id, emoji)}
      />
    </>
  )

  const isChatOn = messages.length > 0

  return (
    <ChattingContainer>
      <TopHeading>
        <UserContainer>
          <Link to="/" style={{ display: 'contents' }}>
            <BackIcon src={imgPath.path[3]} />
          </Link>
          <UserNameBox>
            <UserName>{title}</UserName>
          </UserNameBox>
          <DotsIcon src={imgPath.path[6]} onClick={onMenuClick} style={{ cursor: onMenuClick ? 'pointer' : 'default' }} />
        </UserContainer>
      </TopHeading>
      {isChatOn ? (
        <ChattingList ref={chatListRef} onScroll={onChatListScroll}>
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
                      {renderMessageBody(chat, ChattingBox1, true)}
                    </MyChatContainer>
                    {showTime ? <ChatTime>{timeText}</ChatTime> : null}
                  </MyChatList>
                ) : (
                  <FriendContainer style={{ marginTop: showProfile ? '0.3rem' : 0 }}>
                    {showProfile ? (
                      <ProfileImg
                        src={resolveAvatarSrc(sender?.avatar_url)}
                        onClick={() => onSenderClick?.(chat.sender_id)}
                        style={{ cursor: onSenderClick ? 'pointer' : 'default' }}
                      />
                    ) : (
                      <NoProfileImg />
                    )}
                    <FriendChatList>
                      <FriendChatContainer>
                        {showProfile ? <FriendName>{sender?.name ?? UNKNOWN_SENDER_NAME}</FriendName> : null}
                        {renderMessageBody(chat, ChattingBox2, false)}
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
      {replyingTo && <ReplyComposerBar target={toReplyTarget(replyingTo)} onCancel={() => setReplyingTo(null)} />}
      {openPanel === 'attach' && <AttachMenu items={attachMenuItems} />}
      {openPanel === 'emoji' && (
        <EmojiPicker>
          {EMOJI_FILES.length === 0 ? (
            <EmojiEmptyText>등록된 이모티콘이 없어요.</EmojiEmptyText>
          ) : (
            EMOJI_FILES.map((fileName) => (
              <EmojiButton key={fileName} type="button" onClick={() => onEmojiSelect(fileName)}>
                <EmojiPickerImg src={resolveEmojiSrc(fileName)} alt={fileName} />
              </EmojiButton>
            ))
          )}
        </EmojiPicker>
      )}
      <BottomBox>
        {mentionCandidates.length > 0 && (
          <MentionList>
            {mentionCandidates.map((profile) => (
              <MentionItem key={profile.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onMentionSelect(profile.name)}>
                <MentionAvatar src={resolveAvatarSrc(profile.avatar_url)} />
                {profile.name}
              </MentionItem>
            ))}
          </MentionList>
        )}
        <ChatArea>
          <InputContainer onSubmit={onSubmit}>
            <PlusIcon
              src={imgPath.path[4]}
              onClick={() => togglePanel('attach')}
              style={{ transform: openPanel === 'attach' ? 'rotate(45deg)' : 'none' }}
            />
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageFileChange}
              style={{ display: 'none' }}
            />
            <InputWrapper>
              <InputBox
                placeholder={isUploading ? '사진을 보내는 중...' : '메시지를 작성해주세요'}
                ref={inputRef}
                value={inputValue}
                onChange={onChange}
                onKeyDown={onInputKeyDown}
                onClick={handleInputClick}
                onPaste={onInputPaste}
              />
              <EmojiToggleButton type="button" onClick={() => togglePanel('emoji')} aria-label="이모티콘">
                <SmileIcon size={EMOJI_TOGGLE_ICON_SIZE_PX} />
              </EmojiToggleButton>
            </InputWrapper>
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
  ${appFrame}
`

const SafeAreaImg2 = styled.img`
  width: 100%;
  background-color: ${colors.surface};
`

const TopHeading = styled.div`
  display: flex;
  flex-direction: column;
  height: 2.3;
  width: 100%;
  padding-top: calc(1rem + 8px);
  align-items: center;
  justify-content: center;
`

const UserContainer = styled.div`
  display: flex;
  align-self: stretch;
  height: 1.5rem;
  justify-content: space-between;
  align-items: center;
  margin: 0rem 1.25rem 0.9rem 1.25rem;
`
const UserNameBox = styled.div`
  display: inline-flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
  height: 28px;
`
const UserName = styled.span`
  color: ${colors.grey_900};
  font-size: 20px;
  font-style: normal;
  line-height: 28px;
  margin-left: 11px;
  font-family: 'Pretendard-Medium';
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
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 60px;
  justify-content: center;
  align-items: center;
  background-color: ${colors.surface};
`
const ChattingList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
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
  background-color: ${colors.surface};
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

const highlightFlash = keyframes`
  from {
    background-color: ${colors.grey_100};
  }
  to {
    background-color: transparent;
  }
`

const ReactionTarget = styled.div<{ $isMine: boolean; $isHighlighted: boolean }>`
  position: relative;
  border-radius: 0.6rem;
  ${({ $isHighlighted }) =>
    $isHighlighted &&
    css`
      animation: ${highlightFlash} ${HIGHLIGHT_DURATION_MS}ms ease-out;
    `}
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-self: ${({ $isMine }) => ($isMine ? 'flex-end' : 'flex-start')};

  &:hover ${MessageToolbar}, &:focus-within ${MessageToolbar} {
    display: flex;
  }
`

const EMOJI_MESSAGE_SIZE_PX = 100
const EMOJI_PICKER_ITEM_SIZE_PX = 64
const EMOJI_PICKER_MAX_HEIGHT_PX = 220

const EmojiMessageImg = styled.img`
  width: ${EMOJI_MESSAGE_SIZE_PX}px;
  height: ${EMOJI_MESSAGE_SIZE_PX}px;
  object-fit: contain;
  margin-bottom: 0.5rem;
`

//입력창 바로 위에 붙는 이모티콘 선택 패널 (열리면 채팅 목록이 그만큼 줄어든다)
const EmojiPicker = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${EMOJI_PICKER_ITEM_SIZE_PX}px, 1fr));
  gap: 8px;
  flex-shrink: 0;
  width: 100%;
  max-height: ${EMOJI_PICKER_MAX_HEIGHT_PX}px;
  padding: 12px 16px;
  overflow-y: auto;
  background-color: ${colors.surface};
  border-top: 1px solid ${colors.grey_100};
`

const EmojiEmptyText = styled.span`
  grid-column: 1 / -1;
  text-align: center;
  color: ${colors.grey_400};
  font-family: 'Pretendard-Light';
  font-size: 14px;
`

const EmojiButton = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
`

const EmojiPickerImg = styled.img`
  width: ${EMOJI_PICKER_ITEM_SIZE_PX}px;
  height: ${EMOJI_PICKER_ITEM_SIZE_PX}px;
  object-fit: contain;
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
  width: 100%;
  max-width: 15rem;
`

const FriendName = styled.span`
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
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
  background-color: ${colors.surface};
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
  transition: transform 0.15s;
`

//이모티콘 버튼을 입력창 안쪽 오른쪽 끝에 겹쳐 놓기 위한 래퍼
const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
`

const EMOJI_TOGGLE_ICON_SIZE_PX = 22

const EmojiToggleButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  display: flex;
  transform: translateY(-50%);
  border: none;
  padding: 0;
  background: transparent;
  color: ${colors.grey_400};
  cursor: pointer;
`

const InputBox = styled.input`
  flex: 1;
  min-width: 0;
  outline: none;
  border: none;
  border-radius: 6px;
  padding: 9px 36px 8px 14px;
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

const MentionText = styled.strong`
  font-family: 'Pretendard-SemiBold';
  text-decoration: underline;
`

const MentionList = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 180px;
  overflow-y: auto;
  background-color: ${colors.surface};
  border-top: 1px solid ${colors.grey_100};
`

const MentionItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${colors.grey_50};
  }
`

const MentionAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`
