import React from 'react'
import ReactDOM from 'react-dom/client'
import AppShell from './App'
import './styles/globals.css'
import { HashRouter as Router } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Router>
        <AuthProvider><AppShell /></AuthProvider>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
)
