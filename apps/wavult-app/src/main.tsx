import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Auto-reload om lazy chunk failar (Vite deploy hash mismatch)
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

// Global unhandled rejection för chunk-fel
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
    event.reason?.message?.includes('Importing a module script failed')
  ) {
    console.warn('Chunk load failed — reloading...')
    event.preventDefault()
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
