import styled from 'styled-components'
import { useState } from 'react'
import { colors } from '../style/colors'
import { MIN_PASSWORD_LENGTH, signInWithEmail, signUpWithEmail } from '../api/auth'

type AuthMode = 'signIn' | 'signUp'
type FormMessage = { kind: 'error' | 'notice'; text: string } | null

const AUTH_MODE_LABEL: { [mode in AuthMode]: string } = {
  signIn: '로그인',
  signUp: '회원가입',
}

const getAuthErrorMessage = (error: unknown, mode: AuthMode): string => {
  const code = (error as { code?: string }).code
  if (code === 'over_email_send_rate_limit') return '인증 메일을 너무 많이 보냈어요. 잠시 후 다시 시도해주세요.'
  if (code === 'email_not_confirmed') return '이메일 인증이 아직 안 됐어요. 메일의 인증 링크를 눌러주세요.'
  if (code === 'user_already_exists') return '이미 가입된 이메일이에요. 로그인해주세요.'
  if (code === 'invalid_credentials') return '이메일 또는 비밀번호가 올바르지 않아요.'
  return mode === 'signUp'
    ? '회원가입에 실패했어요. 잠시 후 다시 시도해주세요.'
    : '로그인에 실패했어요. 잠시 후 다시 시도해주세요.'
}

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [message, setMessage] = useState<FormMessage>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const isSignUp = mode === 'signUp'

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setMessage(null)
  }

  //가입 직후 바로 로그인 -> 성공하면 ProfileGate가 다음 화면(프로필 등록/메인)으로 넘김
  //메일 인증이 필요한 설정이라 로그인이 안 되면 로그인 탭으로 안내
  const signUpAndSignIn = async () => {
    await signUpWithEmail(email.trim(), password)
    try {
      await signInWithEmail(email.trim(), password)
    } catch {
      setMode('signIn')
      setMessage({ kind: 'notice', text: '가입이 완료됐어요. 메일로 보낸 인증 링크를 누른 뒤 로그인해주세요.' })
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage({ kind: 'error', text: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.` })
      return
    }
    setIsSubmitting(true)
    setMessage(null)
    try {
      if (isSignUp) await signUpAndSignIn()
      else await signInWithEmail(email.trim(), password)
    } catch (error) {
      console.error(error)
      setMessage({ kind: 'error', text: getAuthErrorMessage(error, mode) })
    }
    setIsSubmitting(false)
  }

  return (
    <AuthContainer onSubmit={onSubmit}>
      <Logo>Messenger</Logo>
      <LogoDescription>친구들과 실시간으로 대화해보세요</LogoDescription>
      <ModeTabs>
        {(Object.keys(AUTH_MODE_LABEL) as AuthMode[]).map((tabMode) => (
          <ModeTab key={tabMode} type="button" $active={mode === tabMode} onClick={() => changeMode(tabMode)}>
            {AUTH_MODE_LABEL[tabMode]}
          </ModeTab>
        ))}
      </ModeTabs>
      <Input
        type="email"
        placeholder="이메일"
        value={email}
        autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="비밀번호 (6자 이상)"
        value={password}
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <MessageText $kind={message?.kind ?? 'notice'}>{message?.text}</MessageText>
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? '잠시만요...' : AUTH_MODE_LABEL[mode]}
      </SubmitButton>
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
  padding: 0 1.5rem;
  background-color: ${colors.grey_50};
`
const Logo = styled.h1`
  color: ${colors.purple};
  font-family: 'Pretendard-Bold';
  font-size: 2.25rem;
`
const LogoDescription = styled.p`
  color: ${colors.grey_700};
  font-family: 'Pretendard-Regular';
  font-size: 0.9375rem;
  margin: 0.5rem 0 2.5rem 0;
`
const ModeTabs = styled.div`
  display: flex;
  width: 100%;
  padding: 0.25rem;
  margin-bottom: 1.25rem;
  border-radius: 0.5rem;
  background-color: ${colors.grey_100};
`
const ModeTab = styled.button<{ $active: boolean }>`
  flex: 1;
  height: 2.25rem;
  border: none;
  border-radius: 0.375rem;
  background-color: ${({ $active }) => ($active ? colors.surface : 'transparent')};
  color: ${({ $active }) => ($active ? colors.purple : colors.grey_700)};
  font-family: 'Pretendard-Medium';
  font-size: 1rem;
  cursor: pointer;
`
const Input = styled.input`
  width: 100%;
  height: 3rem;
  border: 1px solid ${colors.grey_100};
  outline: none;
  border-radius: 0.5rem;
  background: ${colors.surface};
  font-size: 1rem;
  font-family: 'Pretendard-Regular';
  padding: 0 1rem;
  margin-bottom: 0.625rem;
  &:focus {
    border-color: ${colors.purple};
  }
  &::placeholder {
    color: ${colors.grey_400};
  }
`
const MessageText = styled.p<{ $kind: 'error' | 'notice' }>`
  width: 100%;
  min-height: 2.4rem;
  margin: 0.25rem 0 1rem 0;
  color: ${({ $kind }) => ($kind === 'error' ? '#e5484d' : colors.purple)};
  font-family: 'Pretendard-Regular';
  font-size: 0.875rem;
  line-height: 140%;
`
const SubmitButton = styled.button`
  width: 100%;
  height: 3rem;
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
