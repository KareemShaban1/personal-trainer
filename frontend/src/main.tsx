import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { applyCachedAppearance } from '@/lib/appearance'
import '@/i18n'
import '@/index.css'
import App from '@/App'

applyCachedAppearance()

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
