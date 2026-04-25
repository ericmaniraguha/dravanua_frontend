import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Globe, Share2, MessageCircle, Mail, Phone, MapPin, Camera, Music } from 'lucide-react';
import LogoWithZoom from './LogoWithZoom';

const Footer = () => {
  const navigate = useNavigate();
  const [subscribeEmail, setSubscribeEmail] = useState('');

  const handleSubscribe = () => {
    navigate('/contact', { state: { email: subscribeEmail } });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div>
            <Link to="/" className="footer-brand">
              <LogoWithZoom 
                src="/logo-dvs.jpg" 
                alt="DVS Logo" 
                style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden' }} 
              />
              <span className="footer-brand-text">
                DRAVANUA<span className="text-primary"> HUB</span>
              </span>
            </Link>
            <p className="footer-description">
              A creative hub that connects photography, events, Stationery & Office Supplies, and natural beauty services in one place. Here to Create.
            </p>
            <div className="footer-socials">
              {/* Instagram — inline SVG gradient */}
              <a href="https://www.instagram.com/dravanua/" target="_blank" rel="noreferrer" className="footer-social-img-link" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36">
                  <defs>
                    <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#ffd879"/>
                      <stop offset="20%" stopColor="#f9a241"/>
                      <stop offset="40%" stopColor="#f2581a"/>
                      <stop offset="60%" stopColor="#e6255b"/>
                      <stop offset="80%" stopColor="#b02896"/>
                      <stop offset="100%" stopColor="#6e3cbf"/>
                    </radialGradient>
                  </defs>
                  <rect width="512" height="512" rx="120" fill="url(#ig-grad)"/>
                  <rect x="128" y="128" width="256" height="256" rx="72" fill="none" stroke="white" strokeWidth="36"/>
                  <circle cx="256" cy="256" r="78" fill="none" stroke="white" strokeWidth="36"/>
                  <circle cx="360" cy="152" r="24" fill="white"/>
                </svg>
              </a>

              {/* X (Twitter) */}
              <a href="https://x.com/dravanuahub" target="_blank" rel="noreferrer" className="footer-social-img-link" aria-label="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 19" width="36" height="36" style={{ background: '#000', fill: 'white', borderRadius: '50%', padding: '8px' }}>
                  <path fillRule="evenodd" d="M1.893 1.98c.052.072 1.245 1.769 2.653 3.77l2.892 4.114c.183.261.333.48.333.486s-.068.089-.152.183l-.522.593-.765.867-3.597 4.087c-.375.426-.734.834-.798.905a1 1 0 0 0-.118.148c0 .01.236.017.664.017h.663l.729-.83c.4-.457.796-.906.879-.999a692 692 0 0 0 1.794-2.038c.034-.037.301-.34.594-.675l.551-.624.345-.392a7 7 0 0 1 .34-.374c.006 0 .93 1.306 2.052 2.903l2.084 2.965.045.063h2.275c1.87 0 2.273-.003 2.266-.021-.008-.02-1.098-1.572-3.894-5.547-2.013-2.862-2.28-3.246-2.273-3.266.008-.019.282-.332 2.085-2.38l2-2.274 1.567-1.782c.022-.028-.016-.03-.65-.03h-.674l-.3.342a871 871 0 0 1-1.782 2.025c-.067.075-.405.458-.75.852a100 100 0 0 1-.803.91c-.148.172-.299.344-.99 1.127-.304.343-.32.358-.345.327-.015-.019-.904-1.282-1.976-2.808L6.365 1.85H1.8zm1.782.91 8.078 11.294c.772 1.08 1.413 1.973 1.425 1.984.016.017.241.02 1.05.017l1.03-.004-2.694-3.766L7.796 5.75 5.722 2.852l-1.039-.004-1.039-.004z" clipRule="evenodd"/>
                </svg>
              </a>

              {/* Facebook */}
              <a href="https://facebook.com/dravanuahub" target="_blank" rel="noreferrer" className="footer-social-img-link" aria-label="Facebook">
                <img src="/facebook-icon.png" alt="Facebook" width="36" height="36" style={{ borderRadius: '50%' }} />
              </a>



              {/* LinkedIn */}
              <a href="https://linkedin.com/company/dravanuahub" target="_blank" rel="noreferrer" className="footer-social-img-link" aria-label="LinkedIn">
                <img src="/linkedin-icon.png" alt="LinkedIn" width="36" height="36" style={{ borderRadius: '12px' }} />
              </a>

              {/* WhatsApp */}
              <a href="https://wa.me/250795520554" target="_blank" rel="noreferrer" className="footer-social-img-link" aria-label="WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36">
                  <circle cx="256" cy="256" r="256" fill="#25D366"/>
                  <path d="M347 297c-8-4-47-23-54-26s-13-4-18 4-21 26-26 32-10 6-18 2c-50-22-83-66-86-70s-3-13 4-18c6-5 13-13 20-20s8-12 12-20 2-15-1-22-18-43-25-59c-6-15-13-13-18-13h-15c-5 0-13 2-20 10s-26 26-26 62 27 72 31 77c3 5 52 83 128 113 18 7 32 11 43 14 18 5 34 4 47 3 14-2 47-20 54-38s7-35 5-38c-2-3-7-5-15-9z" fill="white"/>
                </svg>
              </a>
            </div>
          </div>


          {/* Our Services */}
          <div>
            <h4 className="footer-heading">Our Services</h4>
            <div className="footer-links">
              <Link to="/services" className="footer-link">📸 Studio Photo</Link>
              <Link to="/services" className="footer-link">📄 Stationery & Office Supplies</Link>
              <Link to="/services" className="footer-link">💐 Flower Shop</Link>
              <Link to="/services" className="footer-link">💍 Classic Fashion Styling</Link>
            </div>
            
            <h4 className="footer-heading" style={{ marginTop: '2rem' }}>About Us</h4>
            <div className="footer-links">
              <Link to="/about" className="footer-link">🌿 Our Story</Link>
              <Link to="/partners" className="footer-link">🤝 References & Partners</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="footer-heading">Contact Us</h4>
            <div className="footer-contact-item">
              <MapPin size={18} className="footer-contact-icon" />
              <a 
                href="https://maps.app.goo.gl/GkErn7UAFp2yLxMg9" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-link-inline"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                Kigali, Rwanda 🇷🇼
              </a>
            </div>
            <div className="footer-contact-item">
              <Phone size={18} className="footer-contact-icon" />
              <span>+250 795 520 554</span>
            </div>
            <div className="footer-contact-item">
              <Mail size={18} className="footer-contact-icon" />
              <span>info@dravanuahub.com</span>
            </div>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter">
            <h4 className="footer-heading">Stay Connected</h4>
            <p>Get updates on our latest services, studio sessions, and special offers.</p>
            <div className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Your email"
                className="footer-newsletter-input"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
              />
              <button onClick={handleSubscribe} className="footer-newsletter-btn">Subscribe</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} DRAVANUA HUB. All rights reserved. | "Here to Create" 🌿</p>
          <p style={{ marginTop: '5px', fontSize: '0.75rem', opacity: 0.8 }}>Designed & Developed by <strong>BrightSeed Hub Ltd</strong></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
