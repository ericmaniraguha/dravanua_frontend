import React, { useState, useEffect } from 'react';
import { Target, Eye, Lightbulb, Heart, Award, Sparkles, Users } from 'lucide-react';

const About = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/public/team');
        const data = await response.json();
        if (data.success) {
          setTeam(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch team');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">About <span className="text-primary-dark">DRAVANUA HUB</span></h1>
          <p className="page-description">
            We are a creative hub based in <a href="https://maps.app.goo.gl/GkErn7UAFp2yLxMg9" target="_blank" rel="noreferrer" style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>Kigali, Rwanda 🇷🇼</a> — dedicated to bringing your vision to life through photography, floral design, Classic Fashion decoration, and quality Stationery & Office Supplies supplies.
          </p>
        </div>
      </div>

      {/* About Content */}
      <section className="about-section">
        <div className="container">
          {/* Mission & Vision */}
          <div className="about-grid">
            <div className="about-text">
              <h2>Our <span className="text-primary-dark">Mission</span></h2>
              <p>
                At DRAVANUA HUB, our mission is to empower creativity and celebration. We provide a one-stop destination
                where photography, events, floral design, and Stationery & Office Supplies come together to serve our clients with excellence.
              </p>
              <p>
                Founded with a passion for beauty and service, we work alongside every customer to understand their needs
                and deliver memorable experiences — from Classic Fashion decoration to everyday Stationery & Office Supplies shopping.
              </p>
            </div>
            <div className="about-image">
              <Target size={120} color="var(--primary-dark)" strokeWidth={1} />
            </div>
          </div>

          <div className="about-grid">
            <div className="about-image">
              <Eye size={120} color="var(--secondary)" strokeWidth={1} />
            </div>
            <div className="about-text">
              <h2>Our <span className="text-primary-dark">Vision</span></h2>
              <p>
                We envision becoming Rwanda's leading creative services hub — where every customer finds
                inspiration, quality, and convenience. From studio photography to floral arrangements,
                we aim to be the first place people think of for creative services.
              </p>
              <p>
                Through continuous growth and innovation, we strive to expand our services while maintaining
                the personal touch and quality craftsmanship that defines DRAVANUA HUB.
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="section-header" style={{ marginTop: '4rem' }}>
            <span className="section-label">🌿 Our Values</span>
            <h2 className="section-title">What We <span className="text-primary-dark">Stand For</span></h2>
            <p className="section-subtitle">The principles that guide everything we do.</p>
          </div>

          <div className="values-grid">
            {[
              { icon: <Lightbulb size={28} />, title: "Creativity", desc: "We bring fresh, innovative ideas to every project — from bouquets to Classic Fashion decoration." },
              { icon: <Heart size={28} />, title: "Passion", desc: "We love what we do. Every photo, every flower arrangement is crafted with care and dedication." },
              { icon: <Award size={28} />, title: "Quality", desc: "We deliver nothing less than excellent quality in every product and service." },
              { icon: <Users size={28} />, title: "Community", desc: "We believe in building lasting relationships with our clients and community in Rwanda." },
              { icon: <Sparkles size={28} />, title: "Beauty", desc: "We see beauty in every creation and strive to make every experience visually stunning." },
              { icon: <Target size={28} />, title: "Reliability", desc: "We deliver on time, every time. Your trust is our greatest asset." },
            ].map((value, idx) => (
              <div key={idx} className="value-card">
                <div className="value-card-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>

          {/* Team Section */}
          <div className="team-section">
            <div className="section-header">
              <span className="section-label">👥 Our Team</span>
              <h2 className="section-title">Meet the <span className="text-primary-dark">Team</span></h2>
              <p className="section-subtitle">The talented people behind DRAVANUA HUB.</p>
            </div>

            <div className="team-grid">
              {team.length > 0 ? team.map((member, idx) => (
                <div key={idx} className="team-card">
                  <div 
                    className="team-avatar" 
                    style={{
                      ...(member.image ? { backgroundImage: `url(${member.image})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : {}),
                      cursor: member.image ? 'pointer' : 'default'
                    }}
                    onClick={() => member.image && setSelectedImage(member.image)}
                    title={member.image ? "Click to view full image" : ""}
                  >
                    {!member.image && member.initials}
                  </div>
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  
                  {(member.email || member.phone) && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                      {member.email && <div style={{ marginBottom: '4px' }}><a href={`mailto:${member.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>📧 {member.email}</a></div>}
                      {member.phone && <div><a href={`tel:${member.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {member.phone}</a></div>}
                    </div>
                  )}

                  {member.linkedin && (
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="team-linkedin"
                      aria-label={`${member.name} LinkedIn Profile`}
                      style={{ marginTop: '10px', display: 'inline-block' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                    </a>
                  )}
                </div>
              )) : (
                !loading && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b' }}>No team members to display.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', 
            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)',
            cursor: 'zoom-out'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            style={{
              maxHeight: '90vh', maxWidth: '90vw', borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default About;
