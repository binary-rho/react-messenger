import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from '../style/colors'
import { fetchChatImageUrl } from '../api/chatImages'

//크기를 고정해두면 이미지가 로드돼도 채팅 목록의 높이가 변하지 않아 스크롤이 튀지 않는다
const CHAT_IMAGE_SIZE_PX = 200

type ImageState = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error' }

//사진 메시지: 말풍선 없이 썸네일로 보여주고, 누르면 크게 본다
export const ChatImageMessage = ({ path }: { path: string }) => {
  const [state, setState] = useState<ImageState>({ status: 'loading' })
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)

  useEffect(() => {
    let isCancelled = false
    setState({ status: 'loading' })
    fetchChatImageUrl(path)
      .then((url) => !isCancelled && setState({ status: 'ready', url }))
      .catch((error) => {
        console.error(error)
        if (!isCancelled) setState({ status: 'error' })
      })
    return () => {
      isCancelled = true
    }
  }, [path])

  if (state.status === 'loading') return <Placeholder />
  if (state.status === 'error') return <Placeholder>사진을 불러오지 못했어요.</Placeholder>

  return (
    <>
      <Thumbnail src={state.url} alt="사진" onClick={() => setIsViewerOpen(true)} />
      {isViewerOpen && (
        <Viewer onClick={() => setIsViewerOpen(false)}>
          <ViewerImg src={state.url} alt="사진 크게 보기" />
        </Viewer>
      )}
    </>
  )
}

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${CHAT_IMAGE_SIZE_PX}px;
  height: ${CHAT_IMAGE_SIZE_PX}px;
  margin-bottom: 0.5rem;
  border-radius: 0.6rem;
  background-color: ${colors.grey_100};
  color: ${colors.grey_400};
  font-family: 'Pretendard-Light';
  font-size: 14px;
`

const Thumbnail = styled.img`
  width: ${CHAT_IMAGE_SIZE_PX}px;
  height: ${CHAT_IMAGE_SIZE_PX}px;
  margin-bottom: 0.5rem;
  border-radius: 0.6rem;
  object-fit: cover;
  cursor: pointer;
`

const Viewer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
`

const ViewerImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`
