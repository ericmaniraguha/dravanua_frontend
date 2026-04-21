import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf } from 'lucide-react';
import LogoWithZoom from './LogoWithZoom';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  en: {
    home: 'Home',
    about: 'About',
    services: 'Services',
    gallery: 'Gallery',
    contact: 'Contact',
    login: 'Login',
    signup: 'Signup',
    bookService: 'Book a Service'
  },
  fr: {
    home: 'Accueil',
    about: 'À propos',
    services: 'Services',
    gallery: 'Galerie',
    contact: 'Contact',
    login: 'Connexion',
    signup: "S'inscrire",
    bookService: 'Réserver'
  },
  sw: {
    home: 'Nyumbani',
    about: 'Kuhusu',
    services: 'Huduma',
    gallery: 'Matunzio',
    contact: 'Mawasiliano',
    login: 'Ingia',
    signup: 'Jisajili',
    bookService: 'Weka Huduma'
  }
};


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { lang = 'en' } = useLanguage();
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t.home, path: '/' },
    { name: t.about, path: '/about' },
    { name: t.services, path: '/services' },
    { name: t.gallery, path: '/gallery' },
    { name: t.contact, path: '/contact' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <LogoWithZoom 
            src="/logo-dvs.jpg" 
            alt="DVS Logo" 
            style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }} 
          />
          <span className="navbar-brand-text">
            DRAVANUA<span className="text-primary"> HUB</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          <Link to="/admin/login" className="navbar-link">
            {t.login}
          </Link>
          <Link to="/admin/signup" className="navbar-link">
            {t.signup}
          </Link>
          <Link to="/contact" className="btn btn-primary navbar-cta">
            {t.bookService}
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="navbar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-mobile ${isOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {link.name}
          </Link>
        ))}
        <Link to="/admin/login" className="navbar-link" onClick={() => setIsOpen(false)}>
          {t.login}
        </Link>
        <Link to="/admin/signup" className="navbar-link" onClick={() => setIsOpen(false)}>
          {t.signup}
        </Link>
        <Link to="/contact" className="btn btn-primary" onClick={() => setIsOpen(false)}>
          {t.bookService}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
