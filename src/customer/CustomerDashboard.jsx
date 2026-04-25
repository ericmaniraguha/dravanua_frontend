import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Calendar, Clock, LogOut, User, CheckCircle, HelpCircle } from 'lucide-react';

const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('customerUser');
    const token = localStorage.getItem('customerToken');
    if (!token || !savedUser) return navigate('/client/login');
    
    setUser(JSON.parse(savedUser));
    fetchMyBookings(token);
  }, []);

  const fetchMyBookings = async (token) => {
    try {
      const resp = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/customer/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (data.success) setBookings(data.data);
    } catch (err) {
      console.error("Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    navigate('/client/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', padding: '2rem', position: 'relative' }}>
      
      {/* Dynamic Corner Clock - Synchronized with Hub */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '40px', 
        textAlign: 'right',
        zIndex: 100,
        padding: '8px 15px',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#32FC05', fontWeight: 900, fontSize: '1rem' }}>
            <Clock size={16} /> {formatTime(currentTime)}
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', marginTop: '2px' }}>
            <Calendar size={12} /> {formatDate(currentTime)}
         </div>
      </div>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: 'white', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#32FC05' }}>Hello, {user?.name || 'Valued Client'}</h1>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Welcome to your personal DRAVANUA workspace.</p>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4444', background: '#fff5f5', border: '1px solid #ffebeb', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
             <LogOut size={18} /> Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
          
          {/* Main: Bookings */}
          <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
               <ShoppingBag size={20} color="#32CD32" /> Your Service Bookings
            </h2>

            {loading ? (
              <p style={{ color: '#888' }}>Refreshing your records...</p>
            ) : bookings.length > 0 ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {bookings.map((b, i) => (
                   <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid #f0f0f0', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                         <div style={{ background: '#e8f5e9', color: '#32FC05', padding: '12px', borderRadius: '12px' }}>
                            <Calendar size={20} />
                         </div>
                         <div>
                            <p style={{ fontWeight: 700, margin: 0 }}>{b.serviceType}</p>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(b.bookingDate).toLocaleDateString()} at {b.bookingTime || 'TBA'}</span>
                         </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <p style={{ fontWeight: 800, color: '#32CD32', margin: 0 }}>${b.totalAmount || '0'}</p>
                         <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: b.status === 'confirmed' ? '#e8f5e9' : '#fff9e6', color: b.status === 'confirmed' ? '#32FC05' : '#856404', textTransform: 'uppercase', fontWeight: 800 }}>
                            {b.status}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fafafa', borderRadius: '16px' }}>
                <p style={{ color: '#888', marginBottom: '1.5rem' }}>You haven't booked any sessions yet.</p>
                <button onClick={() => navigate('/services')} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Explore Our Services</button>
              </div>
            )}
          </div>

          {/* Sidebar: Profile & Help */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Client Profile</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #32FC05, #32CD32)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <User size={24} />
                   </div>
                   <div>
                      <p style={{ fontWeight: 700, margin: 0 }}>{user?.name}</p>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>Member since {new Date().getFullYear()}</span>
                   </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <p>Email: {user?.email}</p>
                   <p>Membership: Exclusive Client</p>
                </div>
             </div>

             <div style={{ background: 'linear-gradient(135deg, #32FC05, #0D3B0D)', color: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 8px 25px rgba(27, 94, 32, 0.2)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <HelpCircle size={20} /> Need Assistance?
                </h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', opacity: 0.9 }}>
                   Got a question about your booking or a custom project? Our team is here to help.
                </p>
                <button className="btn btn-whatsapp btn-full" style={{ padding: '0.75rem' }}>
                   Chat on WhatsApp
                </button>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;
