import { StrictMode } from 'react'
import App from './App.tsx'
import './pages/index.css'
import { ChakraProvider } from '@chakra-ui/react'
import * as ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ChakraProvider>
    {/* <StrictMode> */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    {/* </StrictMode> */}
  </ChakraProvider>
  ,
)
