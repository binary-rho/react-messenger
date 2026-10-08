import { useEffect, useState } from 'react'
import { useRecoilState } from 'recoil'
import { getCurrentUserId, subscribeToAuthUserId } from '../api/auth'
import { fetchProfileById } from '../api/profile'
import { myProfileState } from '../states/profileAtom'
import { AuthPage } from './AuthPage'
import { ProfileSetup } from './ProfileSetup'

//로그인 -> 프로필 등록 순서로 모두 끝나야 children(메신저/채팅)을 보여줌
export const ProfileGate = ({ children }: { children: React.ReactNode }) => {
  const [myProfile, setMyProfile] = useRecoilState(myProfileState)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true)
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false)

  useEffect(() => {
    getCurrentUserId().then((id) => {
      setUserId(id)
      setIsAuthLoading(false)
    })
    return subscribeToAuthUserId(setUserId)
  }, [])

  useEffect(() => {
    if (!userId) {
      setMyProfile(null)
      return
    }
    let isCancelled = false
    setIsProfileLoading(true)
    fetchProfileById(userId)
      .then((profile) => !isCancelled && setMyProfile(profile))
      .catch(console.error)
      .finally(() => !isCancelled && setIsProfileLoading(false))
    return () => {
      isCancelled = true
    }
  }, [userId, setMyProfile])

  if (isAuthLoading || isProfileLoading) return null
  if (!userId) return <AuthPage />
  if (!myProfile) return <ProfileSetup userId={userId} onComplete={setMyProfile} />
  return <>{children}</>
}
