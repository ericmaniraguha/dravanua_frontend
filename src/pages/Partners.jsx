import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Zap, Handshake, Building, Globe, Zap as SparklesIcon, HeartHandshake, Layers } from 'lucide-react';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/public/partners`);
        const data = await response.json();
        if (data.success) {
          setPartners(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch partners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  // Filter into categories for display if needed
  const strategicPartners = partners.filter(p => p.category !== 'Client Reference');
  const clientReferences = partners.filter(p => p.category === 'Client Reference');

  return (
    <div className="partners-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Our <span className="text-primary-dark">Partners</span> & References</h1>
          <p className="page-description">
            We believe in the power of collaboration. DRAVANUA HUB works with leading organizations and suppliers to deliver world-class creative services in Rwanda and beyond.
          </p>
        </div>
      </div>

      <section className="section" style={{ padding: '5rem 0', background: 'var(--background)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span className="section-label">🤝 Trusted By</span>
            <h2 className="section-title">Strategic <span style={{ color: 'var(--primary-dark)' }}>Partnerships</span></h2>
            <p className="section-subtitle" style={{ color: 'var(--text-light)' }}>Collaborating with industry leaders to bring excellence to our clients.</p>
          </div>

          {loading ? (
             <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p style={{ color: 'var(--text-light)', fontWeight: 600 }}>Loading partners...</p>
             </div>
          ) : strategicPartners.length > 0 ? (
            <div className="marquee-container" style={{ 
              overflow: 'hidden', 
              padding: '2rem 0',
              position: 'relative',
              width: '100%'
            }}>
              <div className="marquee-track" style={{ 
                display: 'flex', 
                width: 'max-content',
                gap: '2rem',
                animation: 'marquee 40s linear infinite'
              }}>
                {/* Duplicate the array to create a seamless loop */}
                {[...strategicPartners, ...strategicPartners].map((partner, idx) => (
                  <div key={`${partner.id}-${idx}`} className="partner-logo-card" style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '24px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    border: '1px solid var(--border)',
                    width: '280px',
                    flexShrink: 0
                  }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                >
                  <div style={{ marginBottom: '1.5rem', width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Building size={48} color="var(--primary-dark)" style={{ opacity: 0.2 }} />
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)' }}>{partner.name}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {partner.category}
                  </span>
                </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
               <Handshake size={48} style={{ margin: '0 auto 1rem auto' }} />
               <p>Our strategic partnership list is being updated.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured References Section */}
      <section className="section" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">📜 Our Track Record</span>
            <h2 className="section-title">Featured <span style={{ color: 'var(--primary-dark)' }}>References</span></h2>
            <p className="section-subtitle" style={{ color: 'var(--text-light)' }}>Successful projects and satisfied institutional clients.</p>
          </div>

          <div className="references-list" style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {!loading && clientReferences.length > 0 ? (
              clientReferences.map((ref, idx) => (
                <div key={ref.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 3.5fr', 
                  gap: '2.5rem',
                  padding: '2.5rem',
                  background: idx % 2 === 0 ? 'white' : 'var(--gray-50)',
                  borderRadius: '24px',
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }} className="ref-card-responsive">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '90px', 
                      height: '90px', 
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                      color: 'white', 
                      borderRadius: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem auto',
                      fontSize: '1.8rem',
                      fontWeight: 1000,
                      boxShadow: 'var(--shadow-green)',
                      transform: 'rotate(-3deg)'
                    }}>
                      {ref.name.charAt(0)}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-dark)' }}>{ref.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>REFERENCE CASE</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.4rem' }}>{ref.category} Engagement</h3>
                      {ref.websiteUrl && (
                        <a href={ref.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem' }}>
                          VIEW PROFILE ↗
                        </a>
                      )}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-light)', lineHeight: '1.8', fontSize: '1.05rem', fontWeight: 400 }}>
                      {ref.description || "Official institutional reference for creative service delivery and organizational collaboration."}
                    </p>
                  </div>
                </div>
              ))
            ) : !loading && (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--background)', borderRadius: '30px', border: '1px dashed var(--border)' }}>
                 <Layers size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                 <p style={{ color: 'var(--text-light)', fontWeight: 600 }}>Institutional references are available upon request during consultations.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <HeartHandshake size={64} style={{ marginBottom: '2rem', color: 'var(--primary)' }} />
          <h2>Start a <span style={{ color: 'var(--primary)' }}>Partnership</span> with Us</h2>
          <p>
            Are you interested in collaborating with DRAVANUA HUB? We are always looking for reliable partners and suppliers to join our creative network.
          </p>
          <div className="cta-buttons">
            <a href="/contact" className="btn btn-primary btn-lg">
              Connect With Us
            </a>
            <a href="https://wa.me/250795520554" target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-lg">
              💬 Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Partners;
