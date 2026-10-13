import { createGlobalStyle } from 'styled-components'
import reset from 'styled-reset'
import { colors, themeCssVariables } from './style/colors'
import { ThemeToggleButton } from './components/ThemeToggleButton'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Chatting } from './pages/Chatting'
import { GroupChatting } from './pages/GroupChatting'
import { GroupCreate } from './pages/GroupCreate'
import Messenger from './pages/Messenger'
import { ProfileGate } from './components/ProfileGate'
import { RecoilRoot } from 'recoil'
import { MessageNotifier } from './components/MessageNotifier'

function App() {
  return (
    <RecoilRoot>
      <GlobalStyle />
      <ThemeToggleButton />
      <BrowserRouter>
        <ProfileGate>
          {window.electronAPI && <MessageNotifier />}
          <Routes>
            <Route path="/" element={<Messenger />}></Route>
            <Route path="/chatting/:id" element={<Chatting />}></Route>
            <Route path="/group/:id" element={<GroupChatting />}></Route>
            <Route path="/groups/new" element={<GroupCreate />}></Route>
          </Routes>
        </ProfileGate>
      </BrowserRouter>
    </RecoilRoot>
  )
}

export default App

const GlobalStyle = createGlobalStyle`
  
  ${reset}
  :root {
    ${themeCssVariables.light}
    color-scheme: light;
  }
  :root[data-theme='dark'] {
    ${themeCssVariables.dark}
    color-scheme: dark;
  }
  input, textarea {
    color: ${colors.grey_900};
  }
  :root[data-theme='dark'] img[src*='_Status_bar.'] {
    filter: invert(1);
  }
  html, body, #root {
    height: 100%;
  }
  #root {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  *, *::before, *::after{
        box-sizing: border-box;
    }
  body{
    display: flex;
        padding: 0;
        margin: 0;
        justify-content: center;
        font-family: "Pretendard-Regular";
        background-color: ${colors.outside};
    };
`
