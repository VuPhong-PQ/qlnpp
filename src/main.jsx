import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'antd/dist/reset.css'

// Silence console output in production OR when localStorage flag is set
// To enable logs in dev: localStorage.setItem('enableConsoleLogs', 'true')
// To disable logs in dev: localStorage.removeItem('enableConsoleLogs')
const shouldSilence = process.env.NODE_ENV === 'production' || 
                      localStorage.getItem('enableConsoleLogs') !== 'true';
if (shouldSilence) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  // Keep console.error for critical issues
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
