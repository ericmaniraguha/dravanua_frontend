import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Camera, Heart, Award, Users, Sparkles, CheckCircle, MapPin, Search, X, Globe } from 'lucide-react';
import LogoWithZoom from '../components/LogoWithZoom';
import MarketingShowcase from '../components/MarketingShowcase';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  en: {
    heroBadge: "Your Creative Hub in Kigali 🇷🇼",
    heroDesc: "Photography, Papeterie, Flower Gifts, and Classic Fashion styling — everything you need under one roof. We bring your vision to life.",
    searchPlaceholder: "What service are you looking for?",
    exploreBtn: "Explore Services",
    bookBtn: "Book a Service",
    scrollDown: "Scroll Down",
    stats: { happy: "Happy Clients", photo: "Photo Sessions", events: "Events Decorated", hub: "Services in 1 Hub" },
    whatWeOffer: "🌿 What We Offer",
    ourServices: "Our Services",
    servicesDesc: "From capturing precious moments to decorating dream Classic Fashions — we do it all with passion and creativity.",
    aboutLabel: "About Us",
    whyChoose: "Why Choose",
    aboutText: "We are more than just a shop — we are a creative hub that connects photography, events, papeterie, and natural beauty services all in one place. Based in Kigali, Rwanda, we serve individuals, families, and businesses with excellence.",
    highlights: ["4 Services, 1 Hub", "Professional Team", "Affordable Prices", "WhatsApp Orders"],
    learnMore: "Learn More",
    findUsLabel: "Find Us",
    visitTitle: "Visit",
    visitDesc: "Located in the heart of Kigali. Use the link below for precise GPS navigation.",
    gpsBtn: "Open GPS Location (Google Maps)",
    ctaTitle: "Ready to Create Something Beautiful?",
    ctaDesc: "Book a studio session, order papeterie, plan your Classic Fashion, or shop Flower Gifts — all from one place.",
    orderBtn: "💬 Order via WhatsApp",
    contactBtn: "Contact Us",
    noServices: "No services found matching",
    showAll: "Show All Services",
    findIn: "Find in",
    noMatch: "No services match your request...",
    servicesConfig: [
      { emoji: '📸', title: 'Studio Photo', desc: 'Professional photography sessions for Classic Fashions, birthdays, and public events.' },
      { emoji: '📄', title: 'Stationery & Office Supplies', desc: 'Office materials, school supplies, and bulk paper products for businesses.' },
      { emoji: '💐', title: 'Flower Shop', desc: 'Natural flower sales and floral decoration for emotionally rich ceremonial experiences.' },
      { emoji: '💍', title: 'Classic Fashion & Event Styling', desc: 'Complete Classic Fashion dressing and professional decoration services for memorable events.' },
    ]
  },
  fr: {
    heroBadge: "Votre Centre Créatif à Kigali 🇷🇼",
    heroDesc: "Photographie, Papeterie, Fleurs et Stylisme de Mode Classique — tout ce dont vous avez besoin sous un même toit. Nous donnons vie à votre vision.",
    searchPlaceholder: "Quel service recherchez-vous?",
    exploreBtn: "Explorer nos Services",
    bookBtn: "Réserver un Service",
    scrollDown: "Défiler vers le bas",
    stats: { happy: "Clients Satisfaits", photo: "Séances Photo", events: "Événements Décorés", hub: "Services en 1 seul Centre" },
    whatWeOffer: "🌿 Ce Que Nous Offrons",
    ourServices: "Nos Services",
    servicesDesc: "De la capture de moments précieux à la décoration paradisiaque — nous faisons tout avec passion et créativité.",
    aboutLabel: "À Propos",
    whyChoose: "Pourquoi Choisir",
    aboutText: "Nous sommes plus qu'une simple boutique — nous sommes un centre créatif qui relie la photographie, les événements, la papeterie et les services de beauté naturelle en un seul endroit. Basés à Kigali, au Rwanda, nous servons les particuliers, les familles et les entreprises avec excellence.",
    highlights: ["4 Services, 1 Centre", "Équipe Professionnelle", "Prix Abordables", "Commandes WhatsApp"],
    learnMore: "En Savoir Plus",
    findUsLabel: "Trouvez-nous",
    visitTitle: "Visitez",
    visitDesc: "Situé au cœur de Kigali. Utilisez le lien ci-dessous pour une navigation GPS précise.",
    gpsBtn: "Ouvrir la Carte GPS (Google Maps)",
    ctaTitle: "Prêt à Créer Quelque Chose de Beau?",
    ctaDesc: "Réservez une séance studio, commandez de la papeterie, planifiez votre événement ou achetez des Fleurs — au même endroit.",
    orderBtn: "💬 Commander via WhatsApp",
    contactBtn: "Nous Contacter",
    noServices: "Aucun service trouvé pour",
    showAll: "Afficher tous les services",
    findIn: "Rechercher dans",
    noMatch: "Aucun service ne correspond à votre demande...",
    servicesConfig: [
      { emoji: '📸', title: 'Studio Photo', desc: 'Séances de photographie professionnelles pour événements, anniversaires et événements publics.' },
      { emoji: '📄', title: 'Papeterie & Fournitures', desc: 'Matériel de bureau, fournitures scolaires et produits en papier en vrac pour les entreprises.' },
      { emoji: '💐', title: 'Boutique de Fleurs', desc: 'Ventes de fleurs naturelles et décoration florale pour des expériences cérémonielles riches en émotions.' },
      { emoji: '💍', title: 'Mode Classique & Événements', desc: 'Services complets d\'habillage classique et de décoration professionnelle.' },
    ]
  },
  sw: {
    heroBadge: "Kituo Chako cha Ubunifu Kigali 🇷🇼",
    heroDesc: "Picha, Vifaa vya Ofisi, Maua, na Mitindo ya Kawaida — kila kitu unachohitaji. Tunatekeleza maono yako.",
    searchPlaceholder: "Je, unatafuta huduma gani?",
    exploreBtn: "Chunguza Huduma zetu",
    bookBtn: "Hifadhi Huduma",
    scrollDown: "Sogeza Chini",
    stats: { happy: "Wateja Furaha", photo: "Vipindi vya Picha", events: "Matukio Yaliyopambwa", hub: "Huduma katika Kituo 1" },
    whatWeOffer: "🌿 Tunachotoa",
    ourServices: "Huduma Zetu",
    servicesDesc: "Kutoka kunasa nyakati za thamani hadi kupamba ndoto za Mitindo ya Kawaida — tunafanya yote kwa shauku na ubunifu.",
    aboutLabel: "Kuhusu Sisi",
    whyChoose: "Kwa nini Uchague",
    aboutText: "Sisi ni zaidi ya duka tu — sisi ni kituo cha ubunifu kinachounganisha upigaji picha, matukio, vifaa vya ofisi, na huduma za urembo wa asili katika sehemu moja. Tukipatikana Kigali, Rwanda, tunahudumia watu binafsi, familia, na kampuni kwa ubora.",
    highlights: ["Huduma 4, Kituo 1", "Timu ya Kitaalamu", "Bei Nafuu", "Agizo Kupitia WhatsApp"],
    learnMore: "Jifunze Zaidi",
    findUsLabel: "Tupate",
    visitTitle: "Tembelea",
    visitDesc: "Inapatikana katikati mwa Kigali. Tumia kiungo hapa chini kwa urambazaji sahihi wa GPS.",
    gpsBtn: "Fungua Mahali kwa GPS (Google Maps)",
    ctaTitle: "Uko Tayari Kuunda Kitu Kizuri?",
    ctaDesc: "Hifadhi kikao cha studio, agiza vifaa vya ofisi, panga Mitindo yako, au nunua Maua — vyote kutoka sehemu moja.",
    orderBtn: "💬 Agiza Kupitia WhatsApp",
    contactBtn: "Wasiliana Nasi",
    noServices: "Hakuna huduma inayolingana",
    showAll: "Onyesha huduma zote",
    findIn: "Tafuta ndani ya",
    noMatch: "Hakuna huduma inayoendana na ombi lako...",
    servicesConfig: [
      { emoji: '📸', title: 'Picha ya Studio', desc: 'Vipindi vya upigaji picha wa kitaalamu kwa mitindo ya kawaida, siku za kuzaliwa na matukio ya umma.' },
      { emoji: '📄', title: 'Vifaa vya Ofisi', desc: 'Vifaa vya ofisini, vifaa vya shuleni, na bidhaa za karatasi nyingi kwa wafanyabiashara.' },
      { emoji: '💐', title: 'Duka la Maua', desc: 'Mauzo ya maua asilia na mapambo ya maua kwa uzoefu wa hisia za sherehe.' },
      { emoji: '💍', title: 'Mitindo ya Kawaida', desc: 'Huduma kamili za uvaaji wa mitindo ya kawaida na mapambo ya kitaalamu.' },
    ]
  }
};


const Home = () => {
  const { lang } = useLanguage();
  const t = translations[lang];
  const services = t.servicesConfig;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState(false);

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) setActiveSearch(true);
    else setActiveSearch(false);
  };

  const mapLink = "https://maps.app.goo.gl/GkErn7UAFp2yLxMg9";

  return (
    <div>
      {/* Hero Section */}
      <section className="hero" style={{ position: 'relative' }}>
        <div className="container hero-content">
          
          {/* Global Switcher is now floating in App.jsx */}

          <div className="hero-text">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>{t.heroBadge}</span>
            </div>
            <h1 className="hero-title">
              <span className="brand-name">DRAVANUA HUB</span>
            </h1>
            <p className="hero-subtitle">"Here to Create"</p>
            <p className="hero-description">
              {t.heroDesc}
            </p>

            {/* Hero Search Bar */}
            <div className="hero-search-container" style={{ marginBottom: '2.5rem', position: 'relative', maxWidth: '520px' }}>
              <div style={{ position: 'relative' }}>
                <Search className="hero-search-icon" size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-dark)', opacity: 0.7 }} />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ 
                    width: '100%', 
                    padding: '1.25rem 1.25rem 1.25rem 3.5rem', 
                    borderRadius: '50px', 
                    border: activeSearch ? '2px solid var(--primary)' : '2px solid transparent', 
                    background: 'white', 
                    fontSize: '1rem', 
                    fontWeight: 500,
                    outline: 'none',
                    boxShadow: '0 10px 30px rgba(50, 205, 50, 0.1)',
                    transition: 'var(--transition)'
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => {setSearchQuery(''); setActiveSearch(false);}}
                    style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', color: '#999', fontSize: '1.1rem' }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {activeSearch && searchQuery.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '105%', 
                  left: 0, 
                  width: '100%', 
                  background: 'white', 
                  borderRadius: '1.5rem', 
                  boxShadow: '0 15px 45px rgba(0,0,0,0.1)', 
                  zIndex: 100,
                  overflow: 'hidden',
                  padding: '0.5rem'
                }}>
                  {filteredServices.length > 0 ? (
                    filteredServices.slice(0, 4).map((s, idx) => (
                      <Link 
                        key={idx} 
                        to="/services" 
                        state={{ searchQuery: s.title }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          padding: '0.75rem 1.25rem',
                          borderRadius: '1rem',
                          transition: 'var(--transition)'
                        }}
                        className="search-suggestion-item"
                      >
                        <span style={{ fontSize: '1.25rem' }}>{s.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9rem' }}>{s.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>{t.findIn} {s.title}</div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#999', fontSize: '0.95rem' }}>
                       {t.noMatch}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="hero-buttons">
              <Link to="/services" className="btn btn-primary btn-lg" id="explore-services-btn">
                {t.exploreBtn} <ArrowRight size={20} />
              </Link>
              <Link to="/contact" className="btn btn-outline btn-lg">
                {t.bookBtn}
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-service-cards">
              {services.map((service, idx) => (
                <Link to="/services" key={idx} className="hero-service-item">
                  <span className="hero-service-icon">{service.emoji}</span>
                  <span className="hero-service-label">{service.title}</span>
                </Link>
              ))}
            </div>
            <div className="hero-glow hero-glow-1"></div>
            <div className="hero-glow hero-glow-2"></div>
          </div>
        </div>

        <div className="hero-scroll">
          <span>{t.scrollDown}</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {[
              { count: '500+', label: t.stats.happy, icon: <Heart size={40} /> },
              { count: '1,200+', label: t.stats.photo, icon: <Camera size={40} /> },
              { count: '300+', label: t.stats.events, icon: <Award size={40} /> },
              { count: '4', label: t.stats.hub, icon: <Users size={40} /> }
            ].map((stat, idx) => (
              <div key={idx} className="stat-item">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.count}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="services-section" id="services-preview">
        <div className="container">
          <div className="section-header">
            <span className="section-label">{t.whatWeOffer}</span>
            <h2 className="section-title">{t.ourServices.split(' ')[0]} <span className="text-primary-dark">{t.ourServices.split(' ')[1]}</span></h2>
            <p className="section-subtitle">{t.servicesDesc}</p>
          </div>

          <div className="services-grid">
            {filteredServices.length > 0 ? (
              filteredServices.map((service, idx) => (
                <ServiceCard key={idx} lang={lang} learnMore={t.learnMore} {...service} />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}>
                <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <h3>{t.noServices} "{searchQuery}"</h3>
                <button onClick={() => setSearchQuery('')} className="btn btn-outline" style={{ marginTop: '1rem' }}>{t.showAll}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Marketing Section */}
      <section className="marketing-highlights" style={{ background: '#fcfdfc', padding: '5rem 0' }}>
        <div className="container">
          <MarketingShowcase />
        </div>
      </section>

      {/* About Preview */}
      <section className="about-preview">
        <div className="container">
          <div className="about-preview-grid">
            <div className="about-preview-image">
              <div className="about-icon-grid">
                <div className="about-icon-item">
                  <span>📸</span>
                  <span>{services[0].title.split(' ')[0]}</span>
                </div>
                <div className="about-icon-item">
                  <span>💐</span>
                  <span>{services[2].title.split(' ')[0]}</span>
                </div>
                <div className="about-icon-item">
                  <span>💍</span>
                  <span>{services[3].title.split(' ')[0]}</span>
                </div>
                <div className="about-icon-item">
                  <span>📄</span>
                  <span>{services[1].title.split(' ')[0]}</span>
                </div>
              </div>
            </div>

            <div className="about-preview-text">
              <span className="section-label">{t.aboutLabel}</span>
              <h2>{t.whyChoose} <span className="text-primary-dark">DRAVANUA HUB</span>?</h2>
              <p>
                {t.aboutText}
              </p>
              <div className="about-highlights">
                {t.highlights.map((highlight, i) => (
                   <div key={i} className="about-highlight-item">
                     <CheckCircle size={20} className="about-highlight-icon" />
                     <span className="about-highlight-text">{highlight}</span>
                   </div>
                ))}
              </div>
              <Link to="/about" className="btn btn-outline" style={{ marginTop: '1.5rem' }}>
                {t.learnMore} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="location-preview" style={{ background: '#f8faf8', padding: '5rem 0', borderTop: '1px solid #eee' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="section-label">{t.findUsLabel}</span>
          <h2 className="section-title">{t.visitTitle} <span className="text-primary-dark">DRAVANUA HUB</span></h2>
          <p className="section-subtitle">{t.visitDesc}</p>
          <div style={{ marginTop: '2rem' }}>
             <a 
               href={mapLink} 
               target="_blank" 
               rel="noreferrer" 
               className="btn btn-primary btn-lg" 
               style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
             >
               <MapPin size={20} /> {t.gpsBtn}
             </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>{t.ctaTitle.replace('Create', '')} <span style={{ color: 'var(--primary)' }}>Create</span> {t.ctaTitle.split('Create')[1] || ''}</h2>
          <p>{t.ctaDesc}</p>
          <div className="cta-buttons">
            <a href="https://wa.me/250795520554?text=Hello%20DRA%20VANUA%20HUB!%20I%20would%20like%20to%20book%20a%20service." target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-lg" id="cta-whatsapp-btn">
              💬 {t.orderBtn.replace('💬 ', '')}
            </a>
            <Link to="/contact" className="btn btn-outline btn-lg">
              {t.contactBtn}
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
};

const ServiceCard = ({ emoji, title, desc, learnMore }) => (
  <div className="service-card">
    <span className="service-card-emoji">{emoji}</span>
    <h3 className="service-card-title">{title}</h3>
    <p className="service-card-desc">{desc}</p>
    <Link to="/services" className="service-card-link">
      {learnMore} <ArrowRight size={16} />
    </Link>
  </div>
);

export default Home;
