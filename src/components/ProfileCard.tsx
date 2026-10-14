import styled from 'styled-components'
import { colors } from '../style/colors'
import { Profile, resolveAvatarSrc } from '../api/profile'

//단톡에서 프로필 사진을 눌렀을 때 뜨는 카드 (프로필 + 개인채팅 보내기)
export const ProfileCard = ({
  profile,
  onChatStart,
  onClose,
}: {
  profile: Profile
  onChatStart: () => void
  onClose: () => void
}) => (
  <Backdrop onClick={onClose}>
    <Card onClick={(e) => e.stopPropagation()}>
      <Avatar src={resolveAvatarSrc(profile.avatar_url)} />
      <Name>{profile.name}</Name>
      <ChatButton type="button" onClick={onChatStart}>
        개인채팅 보내기
      </ChatButton>
    </Card>
  </Backdrop>
)

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
`
const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  padding: 1.5rem 1.25rem 1.25rem;
  border-radius: 1rem;
  background-color: ${colors.surface};
`
const Avatar = styled.img`
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.75rem;
`
const Name = styled.span`
  margin-bottom: 1.25rem;
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
  font-size: 1.125rem;
`
const ChatButton = styled.button`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-radius: 0.5rem;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
  cursor: pointer;
`
