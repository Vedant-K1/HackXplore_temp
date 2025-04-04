import { StrictMode } from 'react'
import App from './App.tsx'
import './pages/index.css'
import { ChakraProvider } from '@chakra-ui/react'
import * as ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import ChatProvider from "./contexts/chatProvider";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ChatProvider>
  <ChakraProvider>
    {/* <StrictMode> */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    {/* </StrictMode> */}
  </ChakraProvider>
  </ChatProvider>
  ,
)
