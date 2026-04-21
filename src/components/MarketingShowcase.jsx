import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const MarketingShowcase = ({ category = null }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/public/marketing');
        const data = await res.json();
        if (data.success) {
          // If category is provided, filter by category
          const filtered = category 
            ? data.data.filter(a => a.category === category)
            : data.data;
          setAds(filtered);
        }
      } catch (err) {
        console.error('Marketing assets failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [category]);

  if (loading || ads.length === 0) return null;

  return (
    <div className="marketing-showcase">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <span className="section-label"><Sparkles size={14} /> Seasonal Highlights</span>
        <h2 className="section-title">Special <span className="text-primary-dark">Offers</span></h2>
      </div>
      
      <div className="marketing-grid">
        {ads.map((ad) => (
          <div key={ad.id} className="marketing-card animate-fadeIn">
            <div className="marketing-card-image">
              <img src={ad.imageUrl} alt={ad.title} />
              <div className="marketing-card-badge">{ad.category}</div>
            </div>
            <div className="marketing-card-content">
              <h3>{ad.title}</h3>
              <Link to={ad.ctaLink} className="marketing-card-btn">
                View Offer <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .marketing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          padding: 1rem 0;
        }
        .marketing-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: transform 0.3s ease;
          border: 1px solid #f0f0f0;
        }
        .marketing-card:hover { transform: translateY(-10px); }
        .marketing-card-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .marketing-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .marketing-card-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--primary);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .marketing-card-content { padding: 1.5rem; }
        .marketing-card-content h3 { 
          margin: 0 0 1.2rem 0; 
          font-size: 1.2rem;
          color: #2d5a27;
        }
        .marketing-card-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-dark);
          text-decoration: none;
          font-weight: 700;
          font-size: 0.9rem;
          transition: gap 0.2s;
        }
        .marketing-card-btn:hover { gap: 0.8rem; }
      `}</style>
    </div>
  );
};

export default MarketingShowcase;
