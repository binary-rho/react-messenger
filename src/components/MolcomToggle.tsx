import { useRecoilState } from 'recoil'
import { molcomModeState } from '../states/themeAtom'
import { SettingToggleRow } from './SettingToggleRow'

//몰컴 테마(GPT 스타일 채팅) 켜기/끄기 스위치
export const MolcomToggle = () => {
  const [isMolcom, setIsMolcom] = useRecoilState(molcomModeState)

  return <SettingToggleRow title="몰컴 모드" hint="GPT처럼 내 메시지만 말풍선으로 보여요" isOn={isMolcom} onToggle={() => setIsMolcom(!isMolcom)} />
}
