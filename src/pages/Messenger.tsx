import styled from 'styled-components'
import { colors } from '../style/colors'
import { imgPath } from '../style/imgPath'
import { appFrame } from '../style/layout'
import { TapBar } from '../components/TapBar'

const Messenger = () => {
  return (
    <Container>
      <TapBar />
      <SafeAreaImg2 src={imgPath.path[2]} />
    </Container>
  )
}

export default Messenger

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: ${colors.grey_50};
  align-items: center;
  ${appFrame}
`

const SafeAreaImg2 = styled.img`
  width: 100%;
  background-color: ${colors.surface};
`
