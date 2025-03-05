import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for dark mode preference
const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
  (localStorage.getItem('darkMode') === null && 
   window.matchMedia('(prefers-color-scheme: dark)').matches);

// Apply dark mode class if needed
if (isDarkMode) {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
