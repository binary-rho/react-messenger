import styled from 'styled-components'
import { useEffect, useRef, useState } from 'react'
import { colors } from '../style/colors'
import { createProfile, MAX_NAME_LENGTH, resolveAvatarSrc, validateAvatarFile, validateName } from '../api/profile'
import { Profile } from '../api/profile'

export const ProfileSetup = ({ userId, onComplete }: { userId: string; onComplete: (profile: Profile) => void }) => {
  const [name, setName] = useState<string>('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!avatarFile) return
    const url = URL.createObjectURL(avatarFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const invalidReason = validateAvatarFile(file)
    if (invalidReason) {
      setErrorMessage(invalidReason)
      return
    }
    setErrorMessage('')
    setAvatarFile(file)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const invalidReason = validateName(name)
    if (invalidReason) {
      setErrorMessage(invalidReason)
      return
    }
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const profile = await createProfile({ id: userId, name, avatarFile })
      onComplete(profile)
    } catch (error) {
      console.error(error)
      setErrorMessage('프로필을 만들지 못했어요. 잠시 후 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  return (
    <SetupContainer onSubmit={onSubmit}>
      <Title>프로필을 만들어주세요</Title>
      <Description>프로필을 등록해야 대화에 참여할 수 있어요.</Description>
      <AvatarButton type="button" onClick={() => fileInputRef.current?.click()}>
        <AvatarImg src={resolveAvatarSrc(previewUrl)} />
        <AvatarBadge>{avatarFile ? '변경' : '사진 추가'}</AvatarBadge>
      </AvatarButton>
      <HiddenFileInput ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} />
      <NameInput
        placeholder="이름"
        value={name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(e) => setName(e.target.value)}
      />
      <ErrorText>{errorMessage}</ErrorText>
      <SubmitButton type="submit" disabled={isSubmitting || name.trim() === ''}>
        {isSubmitting ? '만드는 중...' : '시작하기'}
      </SubmitButton>
    </SetupContainer>
  )
}

const SetupContainer = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 375px;
  height: 812px;
  padding: 0 1.25rem;
  background-color: ${colors.grey_50};
`
const Title = styled.h1`
  color: ${colors.grey_900};
  font-family: 'Pretendard-Medium';
  font-size: 1.5rem;
`
const Description = styled.p`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 1rem;
  margin: 0.5rem 0 2rem 0;
`
const AvatarButton = styled.button`
  position: relative;
  width: 7.5rem;
  height: 7.5rem;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  margin-bottom: 1.5rem;
`
const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`
const AvatarBadge = styled.span`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 0.75rem;
  white-space: nowrap;
`
const HiddenFileInput = styled.input`
  display: none;
`
const NameInput = styled.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  outline: none;
  border-radius: 0.375rem;
  background: ${colors.surface};
  font-size: 1.125rem;
  font-family: 'Pretendard-Regular';
  padding: 0 0.9rem;
  &::placeholder {
    color: ${colors.grey_400};
  }
`
const ErrorText = styled.p`
  height: 1.2rem;
  margin: 0.6rem 0;
  color: #e5484d;
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
`
const SubmitButton = styled.button`
  width: 100%;
  height: 2.75rem;
  border: none;
  border-radius: 0.375rem;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-family: 'Pretendard-Medium';
  font-size: 1.125rem;
  cursor: pointer;
  &:disabled {
    background-color: ${colors.grey_300};
    cursor: default;
  }
`
