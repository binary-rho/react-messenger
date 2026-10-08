import { createGlobalStyle } from 'styled-components'
import reset from 'styled-reset'
import { colors } from './style/colors'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Chatting } from './pages/Chatting'
import Messenger from './pages/Messenger'
import { ProfileGate } from './components/ProfileGate'
import { RecoilRoot } from 'recoil'

function App() {
  return (
    <RecoilRoot>
      <GlobalStyle />
      <BrowserRouter>
        <ProfileGate>
          <Routes>
            <Route path="/" element={<Messenger />}></Route>
            <Route path="/chatting/:id" element={<Chatting />}></Route>
          </Routes>
        </ProfileGate>
      </BrowserRouter>
    </RecoilRoot>
  )
}

export default App

const GlobalStyle = createGlobalStyle`
  
  ${reset}
  *, *::before, *::after{
        box-sizing: border-box;
    }
  body{
    display: flex;
        padding: 0;
        margin: 0;
        justify-content: center;
        font-family: "Pretendard-Regular";
        background-color: ${colors.grey_900};
    };
`
