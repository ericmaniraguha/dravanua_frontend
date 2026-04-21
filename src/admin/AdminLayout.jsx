import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { Clock, Calendar, Menu, X } from 'lucide-react';

const AdminLayout = ({ onLogout, user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close sidebar on navigation in mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="admin-layout">
      {/* Mobile Header Bar */}
      <div className="admin-mobile-header">
         <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           style={{ background: 'none', color: '#111', padding: '10px' }}
         >
           {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
         <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary-dark)' }}>DRAVANUA HUB</div>
         <div style={{ width: '44px' }}></div> {/* Spacer */}
      </div>

      {/* Overlay for mobile sidebar */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'mob-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <Sidebar onLogout={onLogout} user={user} isOpen={isSidebarOpen} />
      
      <div className="admin-main">
        {/* GLOBAL HUB CHRONOMETRY - Fixed outside all cards/scroll areas */}
        <div style={{ 
          position: 'fixed', 
          top: '12px', 
          right: '25px', 
          zIndex: 9999, 
          textAlign: 'right',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '6px 14px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none',
          transition: 'all 0.3s ease'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em' }}>
              <Clock size={16} color="var(--primary)" /> {formatTime(currentTime)}
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', marginTop: '2px' }}>
              <Calendar size={12} /> {formatDate(currentTime)}
           </div>
        </div>

        <Outlet context={{ user }} />
      </div>
    </div>
  );
};

export default AdminLayout;
