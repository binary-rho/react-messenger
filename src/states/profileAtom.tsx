import { atom, useRecoilValue } from 'recoil'
import { Profile } from '../api/profile'

export const myProfileState = atom<Profile | null>({
  key: 'myProfileState',
  default: null,
})

//ProfileGate 안쪽(프로필 등록이 끝난 화면)에서만 사용
export const useMyProfile = (): Profile => {
  const profile = useRecoilValue(myProfileState)
  if (!profile) throw new Error('useMyProfile은 프로필 등록 이후 화면에서만 사용할 수 있습니다.')
  return profile
}
