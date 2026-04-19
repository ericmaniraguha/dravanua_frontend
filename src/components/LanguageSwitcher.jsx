import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, X, ChevronRight } from 'lucide-react';

const LanguageSwitcher = () => {
  const { lang, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' }
  ];

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <div className={`language-corner-switcher ${isOpen ? 'is-open' : ''}`}>
      <button 
        className="switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Language / Choisir la langue"
      >
        <div className="toggle-icon">
          {isOpen ? <X size={20} /> : <Globe size={20} />}
        </div>
        <span className="current-code">{lang.toUpperCase()}</span>
      </button>

      <div className="switcher-dropdown">
        <div className="dropdown-header">Select Language</div>
        <div className="lang-list">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setIsOpen(false);
              }}
              className={`lang-option-btn ${lang === l.code ? 'active' : ''}`}
            >
              <span className="lang-flag">{l.flag}</span>
              <span className="lang-label">{l.label}</span>
              {lang === l.code && <div className="active-dot"></div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
