import styled from 'styled-components'
import { colors } from '../style/colors'
import { useRef, useState } from 'react'
import { useSetRecoilState } from 'recoil'
import { imgPath } from '../style/imgPath'
import { ReactComponent as PencilIcon } from '../assets/svgs/pencil.svg'
import { ReactComponent as LinkIcon } from '../assets/svgs/link.svg'
import { signOut } from '../api/auth'
import { resolveAvatarSrc, updateProfile, validateAvatarFile, validateName } from '../api/profile'
import { myProfileState, useMyProfile } from '../states/profileAtom'

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
      <StatusBar src={imgPath.path[1]} />
      <BackgroundImg src={imgPath.path[8]} />
      <MyPageContainer>
        <ProfileBox>
          <ProfileImg src={resolveAvatarSrc(me.avatar_url)} onClick={() => fileInputRef.current?.click()} />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectAvatar} style={{ display: 'none' }} />
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
        <SNSBox>
          <GoText>바로가기</GoText>
          <SNSLine>
            <SNSIconBox>
              <SNSImg src={imgPath.path[9]} />
              <SNSTitle>github</SNSTitle>
            </SNSIconBox>
            <a
              href="https://github.com/leejin-rho"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', width: '1.5rem', height: '1.5rem' }}
            >
              <LinkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            </a>
          </SNSLine>
          <SNSLine>
            <SNSIconBox>
              <SNSImg src={imgPath.path[10]} />
              <SNSTitle>instagram</SNSTitle>
            </SNSIconBox>
            <a
              href="https://www.instagram.com/binar2y.ro/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', width: '1.5rem', height: '1.5rem' }}
            >
              <LinkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            </a>
          </SNSLine>
        </SNSBox>
        <LogoutButton type="button" onClick={() => signOut().catch(console.error)}>
          로그아웃
        </LogoutButton>
      </MyPageContainer>
    </>
  )
}

const LogoutButton = styled.button`
  margin: 1.5rem 1.25rem 0 1.25rem;
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
  height: 54.2rem;
  background-color: ${colors.grey_50};
`
const StatusBar = styled.img`
  width: 375px;
  position: absolute;
  top: 0rem;
  z-index: 1;
`
const BackgroundImg = styled.img`
  width: 375px;
  height: 9.5rem;
  position: absolute;
  top: 0rem;
`
const ProfileBox = styled.div`
  width: 23.4375rem;
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
const SNSBox = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0rem 1.25rem 0rem 1.25rem;
`
const GoText = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Medium';
  font-size: 1.125rem;
  line-height: 140%; /* 1.575rem */
  margin: 2.5rem 0rem 0.75rem 0rem;
`
const SNSLine = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  background-color: ${colors.surface};
  border-radius: 0.375rem;
  padding: 0.6875rem 0.5625rem 0.6875rem 1.125rem;
  margin-bottom: 0.5rem;
`
const SNSTitle = styled.span`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 1rem;
  line-height: 140%; /* 1.4rem */
`
const SNSImg = styled.img`
  width: 1.75rem;
  height: 1.75rem;
`
const SNSIconBox = styled.div`
  display: flex;
  height: 1.75rem;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
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
