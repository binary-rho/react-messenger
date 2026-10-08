import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { colors } from '../style/colors'
import { imgPath } from '../style/imgPath'
import { fetchOtherProfiles, Profile, resolveAvatarSrc } from '../api/profile'
import { createGroup, MAX_GROUP_NAME_LENGTH, MIN_GROUP_FRIEND_COUNT, validateGroupName } from '../api/groups'
import { useMyProfile } from '../states/profileAtom'

export const GroupCreate = () => {
  const me = useMyProfile()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    fetchOtherProfiles(me.id).then(setFriends).catch(console.error)
  }, [me.id])

  const toggleFriend = (friendId: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(friendId)) next.delete(friendId)
      else next.add(friendId)
      return next
    })

  const hasEnoughFriends = selectedIds.size >= MIN_GROUP_FRIEND_COUNT

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const invalidReason = validateGroupName(groupName)
    if (invalidReason) {
      setErrorMessage(invalidReason)
      return
    }
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const groupId = await createGroup(groupName.trim(), Array.from(selectedIds))
      navigate(`/group/${groupId}`, { replace: true })
    } catch (error) {
      console.error(error)
      setErrorMessage('단톡방을 만들지 못했어요. 잠시 후 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  return (
    <Container onSubmit={onSubmit}>
      <SafeAreaImg src={imgPath.path[0]} />
      <Header>
        <Link to="/" style={{ display: 'contents' }}>
          <BackIcon src={imgPath.path[3]} />
        </Link>
        <HeaderTitle>단톡방 만들기</HeaderTitle>
        <HeaderSpace />
      </Header>
      <NameInput
        placeholder="단톡방 이름"
        value={groupName}
        maxLength={MAX_GROUP_NAME_LENGTH}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <SelectGuide>
        함께할 친구를 {MIN_GROUP_FRIEND_COUNT}명 이상 선택해주세요 ({selectedIds.size}명 선택)
      </SelectGuide>
      <FriendScroll>
        {friends.map((friend) => (
          <FriendRow key={friend.id} onClick={() => toggleFriend(friend.id)}>
            <FriendAvatar src={resolveAvatarSrc(friend.avatar_url)} />
            <FriendName>{friend.name}</FriendName>
            <Checkbox type="checkbox" checked={selectedIds.has(friend.id)} readOnly />
          </FriendRow>
        ))}
      </FriendScroll>
      <ErrorText>{errorMessage}</ErrorText>
      <SubmitButton type="submit" disabled={isSubmitting || !hasEnoughFriends || groupName.trim() === ''}>
        {isSubmitting ? '만드는 중...' : '단톡방 만들기'}
      </SubmitButton>
    </Container>
  )
}

const Container = styled.form`
  display: flex;
  flex-direction: column;
  width: 375px;
  height: 812px;
  padding-bottom: 1.5rem;
  background-color: ${colors.grey_50};
`
const SafeAreaImg = styled.img`
  width: 100%;
`
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.25rem 1rem 1.25rem;
`
const BackIcon = styled.img`
  width: 24px;
  height: 24px;
  cursor: pointer;
`
const HeaderSpace = styled.div`
  width: 24px;
`
const HeaderTitle = styled.span`
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
  font-size: 1.375rem;
`
const NameInput = styled.input`
  height: 2.75rem;
  margin: 0 1.25rem;
  border: 1px solid ${colors.grey_100};
  outline: none;
  border-radius: 0.5rem;
  background: ${colors.surface};
  font-size: 1rem;
  font-family: 'Pretendard-Regular';
  padding: 0 1rem;
  &:focus {
    border-color: ${colors.purple};
  }
  &::placeholder {
    color: ${colors.grey_400};
  }
`
const SelectGuide = styled.p`
  margin: 1.25rem 1.25rem 0.5rem 1.25rem;
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
`
const FriendScroll = styled.div`
  flex: 1;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`
const FriendRow = styled.div`
  display: flex;
  align-items: center;
  height: 4rem;
  padding: 0 1.25rem;
  cursor: pointer;
`
const FriendAvatar = styled.img`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 0.75rem;
`
const FriendName = styled.span`
  flex: 1;
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 1.0625rem;
`
const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  accent-color: ${colors.purple};
  pointer-events: none;
`
const ErrorText = styled.p`
  min-height: 1.2rem;
  margin: 0.5rem 1.25rem;
  color: #e5484d;
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
`
const SubmitButton = styled.button`
  height: 3rem;
  margin: 0 1.25rem;
  border: none;
  border-radius: 0.5rem;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 1.0625rem;
  cursor: pointer;
  &:disabled {
    background-color: ${colors.grey_300};
    cursor: default;
  }
`
