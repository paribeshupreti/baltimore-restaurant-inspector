import '../styles/globals.css'
import { useEffect, useState } from 'react'
import Script from 'next/script'

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
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        strategy="afterInteractive"
      />
      <Component {...pageProps} darkMode={darkMode} setDarkMode={setDarkMode} />
    </>
  )
}
