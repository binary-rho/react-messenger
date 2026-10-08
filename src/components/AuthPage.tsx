import styled from 'styled-components'
import { useState } from 'react'
import { colors } from '../style/colors'
import { MIN_PASSWORD_LENGTH, signInWithEmail, signUpWithEmail } from '../api/auth'

type AuthMode = 'signIn' | 'signUp'

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const isSignUp = mode === 'signUp'

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`)
      return
    }
    setIsSubmitting(true)
    setMessage('')
    try {
      if (isSignUp) {
        const { needsEmailConfirmation } = await signUpWithEmail(email.trim(), password)
        if (needsEmailConfirmation) setMessage('인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요.')
      } else {
        await signInWithEmail(email.trim(), password)
      }
    } catch (error) {
      console.error(error)
      setMessage(isSignUp ? '회원가입에 실패했어요. 이미 가입된 이메일일 수 있어요.' : '이메일 또는 비밀번호가 올바르지 않아요.')
    }
    setIsSubmitting(false)
  }

  return (
    <AuthContainer onSubmit={onSubmit}>
      <Title>{isSignUp ? '회원가입' : '로그인'}</Title>
      <Input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Message>{message}</Message>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSignUp ? '가입하기' : '로그인'}
      </SubmitButton>
      <SwitchButton type="button" onClick={() => setMode(isSignUp ? 'signIn' : 'signUp')}>
        {isSignUp ? '이미 계정이 있어요' : '계정이 없어요 (회원가입)'}
      </SwitchButton>
    </AuthContainer>
  )
}

const AuthContainer = styled.form`
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
  margin-bottom: 2rem;
`
const Input = styled.input`
  width: 100%;
  height: 2.75rem;
  border: none;
  outline: none;
  border-radius: 0.375rem;
  background: ${colors.white};
  font-size: 1.125rem;
  font-family: 'Pretendard-Regular';
  padding: 0 0.9rem;
  margin-bottom: 0.6rem;
  &::placeholder {
    color: ${colors.grey_400};
  }
`
const Message = styled.p`
  min-height: 1.2rem;
  margin: 0.4rem 0 0.8rem 0;
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
  text-align: center;
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
const SwitchButton = styled.button`
  margin-top: 1rem;
  border: none;
  background: none;
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
  cursor: pointer;
`
