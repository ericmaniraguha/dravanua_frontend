import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MarketingShowcase from '../components/MarketingShowcase';

const Services = () => {
  const services = [
    {
      emoji: '📸',
      title: "Studio Photography",
      desc: "Capturing high-quality, memorable moments through professional photography in our studio or in the field. We bring technical excellence to every shot.",
      features: ["Classic Fashion Photography", "Birthday Photoshoots", "Corporate Events", "Religious & Social Events", "Family Portraits", "Professional Editing"],
      whatsappMsg: "Hello DRAVANUA HUB! I'd like to book a Studio Photography session."
    },
    {
      emoji: '📄',
      title: "Stationery & Office Supplies",
      desc: "Providing affordable and reliable office materials and educational supplies for individuals, schools, and institutions across Kigali.",
      features: ["Office Supplies", "School Materials", "Printing Products", "Printer Accessories", "Bulk Supply", "Notebooks & Files"],
      whatsappMsg: "Hello DRAVANUA HUB! I'd like to order Stationery & Office Supplies/Office supplies."
    },
    {
      emoji: '💐',
      title: "Flower Selling & Decoration",
      desc: "Enhancing emotional and ceremonial experiences through beautiful natural floral designs and professional decoration services.",
      features: ["Classic Fashion Flower Decoration", "Funeral Arrangements", "Event Floral Design", "Custom Flower Bouquets", "Gift Arrangements", "Natural Flower Sales"],
      whatsappMsg: "Hello DRAVANUA HUB! I'd like to order Flower Gifts or decoration services."
    },
    {
      emoji: '💍',
      title: "Classic Fashion Dressing & Event Decoration",
      desc: "Creating elegant, well-organized, and memorable events through professional styling, dressing assistance, and thematic venue decoration.",
      features: ["Bridal & Groom Dressing", "Entourage Styling", "Engagements & Ceremonies", "Venue Setup", "Thematic Decoration", "Coordination Support"],
      whatsappMsg: "Hello DRAVANUA HUB! I need Classic Fashion Dressing or Event Decoration services."
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Our <span className="text-primary-dark">Services</span></h1>
          <p className="page-description">
            Four core creative services under one roof. From photography to Classic Fashion styling — DRAVANUA HUB has everything you need.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <section>
        <div className="container">
          <div className="services-detail-grid">
            {services.map((service, idx) => (
              <div key={idx} className="service-detail-card" id={`service-${idx}`}>
                <span className="service-detail-emoji">{service.emoji}</span>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <div className="service-features">
                  {service.features.map((feature, fIdx) => (
                    <div key={fIdx} className="service-feature">
                      <div className="service-feature-dot"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={`https://wa.me/250795520554?text=${encodeURIComponent(service.whatsappMsg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="service-book-btn"
                >
                  💬 Book via WhatsApp <ArrowRight size={16} />
                </a>

                {/* Promotional Highlights for this Service */}
                <div style={{ marginTop: '2rem' }}>
                  <MarketingShowcase category={['Studio', 'Stationery & Office Supplies', 'Flower Gifts', 'Classic Fashion'][idx]} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Need a Custom <span style={{ color: 'var(--primary)' }}>Package</span>?</h2>
          <p>We offer custom packages combining multiple services. Contact us to create the perfect solution for your event or business.</p>
          <div className="cta-buttons">
            <a href="https://wa.me/250795520554?text=Hello%20DRA%20VANUA%20HUB!%20I%20need%20a%20custom%20service%20package." target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-lg">
              💬 Chat on WhatsApp
            </a>
            <Link to="/contact" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              Contact Form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
