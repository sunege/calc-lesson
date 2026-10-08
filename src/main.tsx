import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/zen-maru-gothic/700.css'
import '@fontsource/zen-maru-gothic/900.css'
import './styles/global.css'
import './styles/themes.css'
import App from './App'
import { DataProvider } from './storage/DataContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
)
