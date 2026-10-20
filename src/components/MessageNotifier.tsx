import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGroupById, fetchGroupMessageById, subscribeToGroupMessages } from '../api/groups'
import { fetchMessageById, subscribeToMyMessages } from '../api/messages'
import { fetchProfilesByIds } from '../api/profile'
import { MessageReaction, subscribeToReactions } from '../api/reactions'
import { isMentioned } from '../lib/mention'
import { toPreviewText } from '../lib/messagePreview'
import { isRegisteredMiniEmoji } from '../lib/miniEmoji'
import { AppNotification, showNotification } from '../lib/notification'
import { useMyProfile } from '../states/profileAtom'

const ignoreReactionRemoval = () => {}

//내 메시지에 달린 리액션이면 알림 내용을 만들고, 아니면 null
const buildReactionNotification = async (reaction: MessageReaction, myId: string): Promise<AppNotification | null> => {
  const [reactor] = await fetchProfilesByIds([reaction.user_id])
  const reactorName = reactor?.name ?? '누군가'
  if (reaction.message_kind === 'dm') {
    const message = await fetchMessageById(reaction.message_id)
    if (message?.sender_id !== myId) return null
    return {
      title: reactorName,
      body: `회원님의 메시지에 반응했어요: ${toPreviewText(message.content)}`,
      path: `/chatting/${reaction.user_id}`,
    }
  }
  const message = await fetchGroupMessageById(reaction.message_id)
  if (message?.sender_id !== myId) return null
  const group = await fetchGroupById(message.group_id)
  return {
    title: group?.name ?? '단톡방',
    body: `${reactorName}님이 회원님의 메시지에 반응했어요: ${toPreviewText(message.content)}`,
    path: `/group/${message.group_id}`,
  }
}

//창/탭에 포커스가 없을 때 새 메시지와 내 메시지에 달린 리액션을 알림으로 띄움 (Electron 앱이면 네이티브, 아니면 웹 Notification)
export const MessageNotifier = () => {
  const me = useMyProfile()
  const navigate = useNavigate()

  useEffect(() => {
    if (!window.electronAPI) return
    return window.electronAPI.onNotificationClick(navigate)
  }, [navigate])

  useEffect(() => {
    const unsubscribeMessages = subscribeToMyMessages(me.id, async (message) => {
      if (message.sender_id === me.id || document.hasFocus()) return
      const [sender] = await fetchProfilesByIds([message.sender_id])
      const mentioned = isMentioned(message.content, me.name)
      showNotification(
        {
          title: sender?.name ?? '새 메시지',
          body: `${mentioned ? '회원님을 언급했어요: ' : ''}${toPreviewText(message.content)}`,
          path: `/chatting/${message.sender_id}`,
        },
        navigate,
      )
    })
    const unsubscribeGroupMessages = subscribeToGroupMessages(async (message) => {
      if (message.sender_id === me.id || document.hasFocus()) return
      const [sender] = await fetchProfilesByIds([message.sender_id])
      const group = await fetchGroupById(message.group_id)
      showNotification(
        {
          title: group?.name ?? '단톡방',
          body: isMentioned(message.content, me.name)
            ? `${sender?.name ?? ''}님이 회원님을 언급했어요: ${toPreviewText(message.content)}`
            : `${sender?.name ?? ''}: ${toPreviewText(message.content)}`,
          path: `/group/${message.group_id}`,
        },
        navigate,
      )
    })
    const unsubscribeReactions = subscribeToReactions(async (reaction) => {
      const isIgnorable = reaction.user_id === me.id || !isRegisteredMiniEmoji(reaction.emoji) || document.hasFocus()
      if (isIgnorable) return
      const notification = await buildReactionNotification(reaction, me.id)
      if (notification) showNotification(notification, navigate)
    }, ignoreReactionRemoval)
    return () => {
      unsubscribeMessages()
      unsubscribeGroupMessages()
      unsubscribeReactions()
    }
  }, [me.id, me.name, navigate])

  return null
}
