import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import App from './App'
import { DatenProvider } from './lib/daten'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DatenProvider>
        <App />
      </DatenProvider>
    </BrowserRouter>
  </StrictMode>,
)
