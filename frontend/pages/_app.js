import '../styles/globals.css'
import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'

export default function App({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
  }, [])

  useEffect(() => {
    // Save dark mode preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  return (
    <>
      <Component {...pageProps} darkMode={darkMode} setDarkMode={setDarkMode} />
      <Analytics />
    </>
  )
}
