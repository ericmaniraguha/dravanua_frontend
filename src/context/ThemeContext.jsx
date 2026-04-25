import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'green';
  });

  useEffect(() => {
    localStorage.setItem('appTheme', theme);

    const root = document.documentElement;

    const themes = {
      green: {
        primary: '#32FC05',
        secondary: '#32CD32',
        accent: '#A5D6A7',
        background: '#F8FAFC',
        text: '#0F172A',
        card: '#FFFFFF',
        border: '#E2E8F0'
      },
      blue: {
        primary: '#1565C0',
        secondary: '#42A5F5',
        accent: '#BBDEFB',
        background: '#F8FAFC',
        text: '#0F172A',
        card: '#FFFFFF',
        border: '#E2E8F0'
      },
      purple: {
        primary: '#6A1B9A',
        secondary: '#AB47BC',
        accent: '#E1BEE7',
        background: '#F8FAFC',
        text: '#0F172A',
        card: '#FFFFFF',
        border: '#E2E8F0'
      },
      dark: {
        primary: '#111827',
        secondary: '#374151',
        accent: '#6B7280',
        background: '#0F172A',
        text: '#F8FAFC',
        card: '#1E293B',
        border: '#334155'
      }
    };

    const selectedTheme = themes[theme] || themes.green;

    root.style.setProperty('--primary-color', selectedTheme.primary);
    root.style.setProperty('--secondary-color', selectedTheme.secondary);
    root.style.setProperty('--accent-color', selectedTheme.accent);
    root.style.setProperty('--background-color', selectedTheme.background);
    root.style.setProperty('--text-color', selectedTheme.text);
    root.style.setProperty('--card-background', selectedTheme.card);
    root.style.setProperty('--border-color', selectedTheme.border);
    
    // Add a transition-all class to root for smooth theme changes
    root.classList.add('theme-transition');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
