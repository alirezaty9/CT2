import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  const [industrialUI, setIndustrialUI] = useState(() => {
    const saved = localStorage.getItem('industrialUI');
    return saved === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('industrial', industrialUI);
    localStorage.setItem('industrialUI', industrialUI);
  }, [industrialUI]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, industrialUI, setIndustrialUI }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
