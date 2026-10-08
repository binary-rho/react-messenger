import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { colors } from '../style/colors'
import { fetchOtherProfiles, Profile, resolveAvatarSrc } from '../api/profile'

type MenuView = 'members' | 'invite'

export const GroupMenu = ({
  members,
  myId,
  onInvite,
  onLeave,
  onClose,
}: {
  members: Profile[]
  myId: string
  onInvite: (friendIds: string[]) => Promise<void>
  onLeave: () => void
  onClose: () => void
}) => {
  const [view, setView] = useState<MenuView>('members')
  const [invitableFriends, setInvitableFriends] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isInviting, setIsInviting] = useState<boolean>(false)

  //이미 방에 있는 사람은 초대 목록에서 제외
  useEffect(() => {
    const memberIds = new Set(members.map((member) => member.id))
    fetchOtherProfiles(myId)
      .then((friends) => setInvitableFriends(friends.filter((friend) => !memberIds.has(friend.id))))
      .catch(console.error)
  }, [members, myId])

  const toggleFriend = (friendId: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(friendId)) next.delete(friendId)
      else next.add(friendId)
      return next
    })

  const submitInvite = async () => {
    setIsInviting(true)
    try {
      await onInvite(Array.from(selectedIds))
      setSelectedIds(new Set())
      setView('members')
    } catch (error) {
      console.error(error)
      alert('초대하지 못했어요. 잠시 후 다시 시도해주세요.')
    }
    setIsInviting(false)
  }

  const confirmLeave = () => {
    if (window.confirm('단톡방을 나갈까요? 나가면 대화 내용을 볼 수 없어요.')) onLeave()
  }

  return (
    <Backdrop onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        {view === 'members' ? (
          <>
            <SheetTitle>대화상대 ({members.length})</SheetTitle>
            <PersonList>
              {members.map((member) => (
                <PersonRow key={member.id}>
                  <PersonAvatar src={resolveAvatarSrc(member.avatar_url)} />
                  <PersonName>{member.name}</PersonName>
                  {member.id === myId && <MeBadge>나</MeBadge>}
                </PersonRow>
              ))}
            </PersonList>
            <PrimaryButton type="button" onClick={() => setView('invite')}>
              친구 초대하기
            </PrimaryButton>
            <LeaveButton type="button" onClick={confirmLeave}>
              단톡방 나가기
            </LeaveButton>
          </>
        ) : (
          <>
            <SheetTitle>친구 초대 ({selectedIds.size}명 선택)</SheetTitle>
            <PersonList>
              {invitableFriends.length === 0 && <EmptyText>초대할 수 있는 친구가 없어요.</EmptyText>}
              {invitableFriends.map((friend) => (
                <PersonRow key={friend.id} onClick={() => toggleFriend(friend.id)} style={{ cursor: 'pointer' }}>
                  <PersonAvatar src={resolveAvatarSrc(friend.avatar_url)} />
                  <PersonName>{friend.name}</PersonName>
                  <Checkbox type="checkbox" checked={selectedIds.has(friend.id)} readOnly />
                </PersonRow>
              ))}
            </PersonList>
            <PrimaryButton type="button" disabled={isInviting || selectedIds.size === 0} onClick={submitInvite}>
              {isInviting ? '초대하는 중...' : '초대하기'}
            </PrimaryButton>
            <LeaveButton type="button" onClick={() => setView('members')}>
              뒤로
            </LeaveButton>
          </>
        )}
      </Sheet>
    </Backdrop>
  )
}

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  background-color: rgba(0, 0, 0, 0.4);
`
const Sheet = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 70%;
  padding: 1.25rem;
  border-radius: 1rem 1rem 0 0;
  background-color: ${colors.white};
`
const SheetTitle = styled.h2`
  margin-bottom: 0.75rem;
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
  font-size: 1.125rem;
`
const PersonList = styled.div`
  flex: 1;
  overflow: auto;
  margin-bottom: 0.75rem;
  &::-webkit-scrollbar {
    display: none;
  }
`
const PersonRow = styled.div`
  display: flex;
  align-items: center;
  height: 3.5rem;
`
const PersonAvatar = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
`
const PersonName = styled.span`
  flex: 1;
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
`
const MeBadge = styled.span`
  padding: 0.1rem 0.5rem;
  border-radius: 1rem;
  background-color: ${colors.grey_100};
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 0.75rem;
`
const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  accent-color: ${colors.purple};
  pointer-events: none;
`
const EmptyText = styled.p`
  padding: 1rem 0;
  color: ${colors.grey_400};
  font-family: 'Pretendard-Regular';
  font-size: 0.9375rem;
`
const PrimaryButton = styled.button`
  height: 2.75rem;
  border: none;
  border-radius: 0.5rem;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
  cursor: pointer;
  &:disabled {
    background-color: ${colors.grey_300};
    cursor: default;
  }
`
const LeaveButton = styled.button`
  height: 2.75rem;
  margin-top: 0.5rem;
  border: none;
  background: none;
  color: #e5484d;
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
  cursor: pointer;
`
