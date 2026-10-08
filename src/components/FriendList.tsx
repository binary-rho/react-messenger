import styled from 'styled-components'
import { colors } from '../style/colors'
import { useEffect, useState } from 'react'
import { ReactComponent as ArrowIcon } from '../assets/svgs/arrow.svg'
import { Link } from 'react-router-dom'
import { fetchOtherProfiles, Profile, resolveAvatarSrc } from '../api/profile'
import { useMyProfile } from '../states/profileAtom'

export const FriendList = ({ searchValue }: { searchValue: string }) => {
  const me = useMyProfile()
  const [friends, setFriends] = useState<Profile[]>([])

  useEffect(() => {
    fetchOtherProfiles(me.id).then(setFriends).catch(console.error)
  }, [me.id])

  return (
    <FriendContainer>
      {friends
        .filter((friend) => friend.name.toLowerCase().includes(searchValue.toLowerCase()))
        .map((friend) => (
          <Link key={friend.id} to={`/chatting/${friend.id}`} style={{ display: 'contents' }}>
            <FriendBox>
              <ProfileImg src={resolveAvatarSrc(friend.avatar_url)} />
              <FriendName>{friend.name}</FriendName> <ArrowIcon />
            </FriendBox>
          </Link>
        ))}
    </FriendContainer>
  )
}

const FriendContainer = styled.div`
  width: 100%;
  height: 54.2rem;
  background-color: ${colors.grey_50};
  overflow: auto;
  list-style-type: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const FriendBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0rem 0.75rem 0rem 1.25rem;
  width: 100%;
  height: 4.375rem;
  background-color: ${colors.grey_50};
`
const ProfileImg = styled.img`
  width: 3.125rem;
  height: 3.125rem;
  border-radius: 3.125rem;
  object-fit: cover;
  margin-right: 0.63rem;
`
const FriendName = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 1.125rem;
  line-height: 1.575rem;
  width: 16.5rem;
`
