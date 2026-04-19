import React, { useState } from 'react';
import { X } from 'lucide-react';

const LogoWithZoom = ({ src, alt, className, style }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const toggleZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <>
      <div 
        onClick={toggleZoom} 
        style={{ cursor: 'zoom-in', ...style }} 
        className={className}
      >
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {isZoomed && (
        <div className="logo-zoom-overlay" onClick={toggleZoom}>
          <div className="logo-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="logo-zoom-close" onClick={toggleZoom}>
              <X size={24} />
            </button>
            <img src={src} alt={alt} className="logo-zoom-image" />
          </div>
        </div>
      )}
    </>
  );
};

export default LogoWithZoom;
