import { useCallback, useEffect, useRef, useState } from 'react'
import { MESSAGE_PAGE_SIZE } from '../api/messages'

//최신 메시지 한 페이지를 불러오고, loadOlder로 이전 메시지를 이어서 불러오는 훅
//fetchPage(beforeId)는 오래된 순으로 정렬된 한 페이지를 반환해야 함. roomKey가 바뀌면 처음부터 다시 불러옴
export const usePagedMessages = <T extends { id: number }>(
  roomKey: string | undefined,
  fetchPage: (beforeId?: number) => Promise<T[]>,
) => {
  const [messages, setMessages] = useState<T[]>([])
  const [hasMore, setHasMore] = useState<boolean>(false)
  const isLoadingOlderRef = useRef<boolean>(false)
  const fetchPageRef = useRef(fetchPage)
  fetchPageRef.current = fetchPage

  useEffect(() => {
    setMessages([])
    setHasMore(false)
    isLoadingOlderRef.current = false
    if (!roomKey) return
    let isStale = false
    fetchPageRef
      .current()
      .then((page) => {
        if (isStale) return
        setMessages(page)
        setHasMore(page.length === MESSAGE_PAGE_SIZE)
      })
      .catch(console.error)
    return () => {
      isStale = true
    }
  }, [roomKey])

  const loadOlder = useCallback(async () => {
    const oldestId = messages[0]?.id
    if (!hasMore || isLoadingOlderRef.current || oldestId === undefined) return
    isLoadingOlderRef.current = true
    try {
      const page = await fetchPageRef.current(oldestId)
      setHasMore(page.length === MESSAGE_PAGE_SIZE)
      setMessages((prev) => {
        const knownIds = new Set(prev.map((message) => message.id))
        return [...page.filter((message) => !knownIds.has(message.id)), ...prev]
      })
    } catch (error) {
      console.error(error)
    } finally {
      isLoadingOlderRef.current = false
    }
  }, [messages, hasMore])

  //id 중복 없이 메시지 추가 (직접 보낸 메시지가 realtime으로도 들어오기 때문)
  const appendMessage = useCallback(
    (message: T) => setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message])),
    [],
  )

  return { messages, hasMore, loadOlder, appendMessage }
}
