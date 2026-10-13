import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGroupById, subscribeToGroupMessages } from '../api/groups'
import { subscribeToMyMessages } from '../api/messages'
import { fetchProfilesByIds } from '../api/profile'
import { useMyProfile } from '../states/profileAtom'

//데스크톱 앱(Electron)에서만 마운트됨. 창에 포커스가 없을 때 새 메시지를 네이티브 알림으로 띄움
export const MessageNotifier = () => {
  const me = useMyProfile()
  const navigate = useNavigate()
  const notify = window.electronAPI?.notify

  useEffect(() => {
    if (!window.electronAPI) return
    return window.electronAPI.onNotificationClick(navigate)
  }, [navigate])

  useEffect(() => {
    if (!notify) return
    const unsubscribeMessages = subscribeToMyMessages(me.id, async (message) => {
      if (message.sender_id === me.id || document.hasFocus()) return
      const [sender] = await fetchProfilesByIds([message.sender_id])
      notify({ title: sender?.name ?? '새 메시지', body: message.content, path: `/chatting/${message.sender_id}` })
    })
    const unsubscribeGroupMessages = subscribeToGroupMessages(async (message) => {
      if (message.sender_id === me.id || document.hasFocus()) return
      const [sender] = await fetchProfilesByIds([message.sender_id])
      const group = await fetchGroupById(message.group_id)
      notify({
        title: group?.name ?? '단톡방',
        body: `${sender?.name ?? ''}: ${message.content}`,
        path: `/group/${message.group_id}`,
      })
    })
    return () => {
      unsubscribeMessages()
      unsubscribeGroupMessages()
    }
  }, [me.id, notify])

  return null
}
