import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, Sun, Moon, Droplets, Sparkles } from 'lucide-react';

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'green', name: 'Emerald', icon: <Sparkles size={14} />, color: '#32FC05' },
    { id: 'blue', name: 'Ocean', icon: <Droplets size={14} />, color: '#1565C0' },
    { id: 'purple', name: 'Royal', icon: <Palette size={14} />, color: '#6A1B9A' },
    { id: 'dark', name: 'Midnight', icon: <Moon size={14} />, color: '#111827' }
  ];

  return (
    <div className="theme-selector-container" style={{
      padding: '15px 10px',
      margin: '10px 0',
      background: 'rgba(0,0,0,0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <label style={{ 
        display: 'block', 
        fontSize: '11px', 
        fontWeight: 800, 
        color: '#6b7280', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        marginBottom: '10px'
      }}>
        Hub Aesthetics
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              background: theme === t.id ? t.color : 'rgba(255,255,255,0.05)',
              color: theme === t.id ? 'white' : '#94a3b8',
              border: '1px solid',
              borderColor: theme === t.id ? 'transparent' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex' }}>{t.icon}</span>
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
