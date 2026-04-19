import React, { useState, useEffect } from 'react';

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filters = ['All', 'Studio', 'Flower Gifts', 'Classic Fashion', 'Stationery & Office Supplies'];

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/public/gallery');
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const mappedData = data.data.map(item => ({
            ...item,
            image: item.imageUrl || item.image
          }));
          setGalleryItems(mappedData);
        } else {
          // Robust Fallback Inventory with multiple images for Albums
          setGalleryItems([
            { id: 'f1', title: 'Modern Classic Fashion Arch', category: 'Classic Fashion', description: 'White floral masterpiece with lush greenery.', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800', images: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800'] },
            { id: 'f2', title: 'Executive Paper Suite', category: 'Stationery & Office Supplies', description: 'Letterheads and handcrafted notebooks for corporate use.', image: 'https://images.unsplash.com/photo-1586075010633-2442dc3d8c8f?auto=format&fit=crop&q=80&w=800', images: ['https://images.unsplash.com/photo-1586075010633-2442dc3d8c8f?auto=format&fit=crop&q=80&w=800'] },
            { id: 'f3', title: 'Studio Birthday Bash', category: 'Studio', description: 'Fun and bright birthday photography for small ones.', image: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=800', images: ['https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800'] },
            { id: 'f4', title: 'Luxe Vase Art', category: 'Flower Gifts', description: 'Single-source rose arrangement in designer vases.', image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=800', images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=800'] }
          ]);
        }
      } catch (error) {
        // Safe Fallback on Network Error
        setGalleryItems([
          { id: 'f1', title: 'Ceremonial Design', category: 'Classic Fashion', description: 'Bespoke event styling.', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800', images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800'] }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = activeFilter === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeFilter);

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Creative <span className="text-primary-dark">Hub Gallery</span></h1>
          <p className="page-description">
            Discover our portfolio of professional photography, organic floral arrangements, and premium event styling.
          </p>
        </div>
      </div>

      {/* Gallery Section */}
      <section className="gallery-section">
        <div className="container">
          {/* Filter Navigation */}
          <div className="gallery-filters" style={{ justifyContent: 'center', marginBottom: '3rem' }}>
            {filters.map((filter) => (
              <button
                key={filter}
                className={`gallery-filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Dynamic Grid */}
          {loading ? (
             <div style={{ textAlign: 'center', padding: '100px 0', color: '#888' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p>Developing our latest captures...</p>
             </div>
          ) : galleryItems.length > 0 ? (
            <div className="gallery-grid">
              {filteredItems.map((item) => (
                <div key={item.id} className="gallery-card animate-fadeIn" onClick={() => { setSelectedImage(item); setCurrentImageIndex(0); }} style={{ cursor: 'pointer' }}>
                  <div className="gallery-image">
                    {item.image ? (
                       <img src={item.image} alt={item.title} className="gallery-actual-img" />
                    ) : (
                      <div className="gallery-image-placeholder">🖼️</div>
                    )}
                    <div className="gallery-overlay">
                       <span className="gallery-badge">{item.category}</span>
                       {item.images && item.images.length > 1 && (
                          <div style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {item.images.length} Photos
                          </div>
                       )}
                    </div>
                  </div>
                  <div className="gallery-body">
                    <h3 className="gallery-title">{item.title}</h3>
                    <p className="gallery-desc" style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
               <h3 style={{ color: '#aaa' }}>The vault is briefly empty.</h3>
               <p>Check back soon for new creative works!</p>
            </div>
          )}
        </div>
      </section>
      
      <style>{`
        .gallery-actual-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .gallery-card:hover .gallery-actual-img {
          transform: scale(1.1);
        }
        .gallery-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.2);
          opacity: 0;
          transition: 0.3s;
          display: flex;
          align-items: flex-start;
          padding: 1rem;
        }
        .gallery-card:hover .gallery-overlay {
          opacity: 1;
        }
        .gallery-badge {
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>

      {/* Full-Screen Lightbox Modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onClick={() => setSelectedImage(null)}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            &times;
          </button>
          
          <img 
            src={selectedImage.images && selectedImage.images.length > 0 ? selectedImage.images[currentImageIndex] : selectedImage.image} 
            alt={selectedImage.title} 
            style={{
              maxWidth: '95vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Navigation Controls */}
          {selectedImage.images && selectedImage.images.length > 1 && (
            <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', display: 'flex', justifyContent: 'space-between', padding: '0 2rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <button 
                style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? selectedImage.images.length - 1 : prev - 1)); }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                &#10094;
              </button>
              <button 
                style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === selectedImage.images.length - 1 ? 0 : prev + 1)); }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                &#10095;
              </button>
            </div>
          )}

          <div style={{ color: 'white', marginTop: '1.5rem', textAlign: 'center', maxWidth: '600px' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{selectedImage.title}</h3>
            <p style={{ margin: '8px 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>{selectedImage.description}</p>
          </div>
          
          {/* Dot Indicators */}
          {selectedImage.images && selectedImage.images.length > 1 && (
             <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '10px' }}>
                {selectedImage.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: currentImageIndex === idx ? 'white' : 'rgba(255,255,255,0.4)', 
                      cursor: 'pointer',
                      transition: 'background 0.3s'
                    }}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                  />
                ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gallery;
