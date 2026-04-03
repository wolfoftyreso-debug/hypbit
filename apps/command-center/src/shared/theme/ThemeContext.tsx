// ─── Theme Context — Light only (cream theme, locked) ────────────────────────

import React, { createContext, useContext, useEffect } from 'react'

type Theme = 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {}, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
