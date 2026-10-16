import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGroupById, subscribeToGroupMessages } from '../api/groups'
import { subscribeToMyMessages } from '../api/messages'
import { fetchProfilesByIds } from '../api/profile'
import { toPreviewText } from '../lib/messagePreview'
import { showNotification } from '../lib/notification'
import { useMyProfile } from '../states/profileAtom'

//창/탭에 포커스가 없을 때 새 메시지를 알림으로 띄움 (Electron 앱이면 네이티브, 아니면 웹 Notification)
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
      showNotification(
        {
          title: sender?.name ?? '새 메시지',
          body: toPreviewText(message.content),
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
          body: `${sender?.name ?? ''}: ${toPreviewText(message.content)}`,
          path: `/group/${message.group_id}`,
        },
        navigate,
      )
    })
    return () => {
      unsubscribeMessages()
      unsubscribeGroupMessages()
    }
  }, [me.id, navigate])

  return null
}
