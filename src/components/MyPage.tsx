import styled from 'styled-components'
import { colors } from '../style/colors'
import { useRef, useState } from 'react'
import { useSetRecoilState } from 'recoil'
import { imgPath } from '../style/imgPath'
import { ReactComponent as PencilIcon } from '../assets/svgs/pencil.svg'
import { signOut } from '../api/auth'
import { resolveAvatarSrc, updateProfile, validateAvatarFile, validateName } from '../api/profile'
import { myProfileState, useMyProfile } from '../states/profileAtom'
import { NotificationToggle } from './NotificationToggle'
import { ThemeToggle } from './ThemeToggle'

export const MyPage = () => {
  const me = useMyProfile()
  const setMyProfile = useSetRecoilState(myProfileState)
  const [editName, setEditName] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const saveProfile = async (changes: { name?: string; avatarFile?: File }) => {
    try {
      setMyProfile(await updateProfile(me.id, changes))
    } catch (error) {
      console.error(error)
      alert('프로필을 저장하지 못했어요. 다시 시도해주세요.')
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    //입력한 값이 없을 때 alert 추가
    const invalidReason = validateName(inputValue)
    if (invalidReason) {
      alert(invalidReason)
      return
    }
    await saveProfile({ name: inputValue })
    setInputValue('')
    setEditName(false)
  }

  const onSelectAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalidReason = validateAvatarFile(file)
    if (invalidReason) {
      alert(invalidReason)
      return
    }
    await saveProfile({ avatarFile: file })
  }

  return (
    <>
      <BackgroundImg src={imgPath.path[8]} />
      <MyPageContainer>
        <ProfileBox>
          <ProfileImg src={resolveAvatarSrc(me.avatar_url)} onClick={() => fileInputRef.current?.click()} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onSelectAvatar}
            style={{ display: 'none' }}
          />
          <TextBox>
            <NameBox>
              {editName ? (
                <InputContainer onSubmit={onSubmit}>
                  <InputBox placeholder="이름" value={inputValue} onChange={onChange} />
                </InputContainer>
              ) : (
                <>
                  <ProfileName>{me.name}</ProfileName>{' '}
                  <PencilIcon
                    onClick={() => {
                      setInputValue(me.name)
                      setEditName(true)
                    }}
                  />
                </>
              )}
            </NameBox>
          </TextBox>
        </ProfileBox>
        <SettingList>
          <NotificationToggle />
          <ThemeToggle />
        </SettingList>
        <LogoutButton type="button" onClick={() => signOut().catch(console.error)}>
          로그아웃
        </LogoutButton>
      </MyPageContainer>
    </>
  )
}

//프로필 사진 윗부분이 배경 위에 걸쳐 보이는 높이
const BACKGROUND_HEIGHT_REM = 8

const SettingList = styled.div`
  margin-top: 1rem;
`
const LogoutButton = styled.button`
  margin: 0.5rem 1.25rem 0 1.25rem;
  height: 2.75rem;
  border: none;
  border-radius: 0.375rem;
  background-color: ${colors.surface};
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
  cursor: pointer;
`
const MyPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  background-color: ${colors.grey_50};
`
const BackgroundImg = styled.img`
  width: 100%;
  height: ${BACKGROUND_HEIGHT_REM}rem;
  object-fit: cover;
  position: absolute;
  top: 0rem;
  left: 0rem;
`
const ProfileBox = styled.div`
  width: 100%;
  height: 6.625rem;
  display: flex;
  z-index: 1;
  margin-top: 1.66rem;
`
const ProfileImg = styled.img`
  width: 6.25rem;
  height: 6.25rem;
  border-radius: 6.25rem;
  object-fit: cover;
  cursor: pointer;
  margin-left: 1.25rem;
`
const NameBox = styled.div`
  display: flex;
  align-items: end;
`
const ProfileName = styled.span`
  color: ${colors.grey_900};
  font-family: 'Pretendard-Regular';
  font-size: 1.75rem;
  line-height: 1.5rem;
  margin-right: 0.38rem;
`
const TextBox = styled.div`
  display: flex;
  flex-direction: column;
  height: 3.125rem;
  margin: 3.19rem 0rem 0rem 1rem;
`
const InputContainer = styled.form`
  width: fit-content;
  display: flex;
`

const InputBox = styled.input`
  width: 10rem;
  height: 2.2rem;
  outline: none;
  border: none;
  border-radius: 0.375rem;
  background: ${colors.surface};
  font-size: 1rem;
  font-family: 'Pretendard-Regular';
  padding: 0.6rem 0.2rem 0.6rem 0.5rem;

  &::placeholder {
    /* Chrome, Firefox, Opera, Safari */
    color: ${colors.grey_400};
  }
`
