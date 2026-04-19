import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';

const CustomerSignup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await resp.json();
      if (data.success) {
        navigate('/client/login', { state: { message: 'Signup successful! Please login.' } });
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#f8faf8' }}>
      <div className="admin-login-container" style={{ display: 'flex', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', maxWidth: '800px', width: '100%', maxHeight: '520px' }}>
        
        <div className="admin-login-info" style={{ flex: 1, background: 'linear-gradient(rgba(13, 59, 13, 0.8), rgba(27, 94, 32, 0.9)), url("/logo-dvs.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', padding: '1.75rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '300px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#90EE90', fontWeight: 800 }}>Join the HUB</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: '#fff', opacity: 0.9 }}>
             Create your account to start your creative journey with DRAVANUA.
          </p>
        </div>

        <div className="admin-login-card" style={{ width: '400px', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'none' }}>
          <div className="admin-login-header" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0, color: '#111' }}>Registration</h1>
          </div>

          {error && <div className="admin-login-error" style={{ marginBottom: '0.75rem', padding: '0.4rem', fontSize: '0.75rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="admin-login-form" style={{ gap: '0.6rem' }}>
             <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Full Name</label>
              <div className="admin-login-input-wrapper">
                <User size={14} className="admin-login-input-icon" />
                <input type="text" placeholder="John Doe" required onChange={e => setFormData({...formData, name: e.target.value})} style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} />
              </div>
            </div>

            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Email Account</label>
              <div className="admin-login-input-wrapper">
                <Mail size={14} className="admin-login-input-icon" />
                <input type="email" placeholder="john@example.com" required onChange={e => setFormData({...formData, email: e.target.value})} style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} />
              </div>
            </div>

            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Phone Number</label>
              <div className="admin-login-input-wrapper">
                <Phone size={14} className="admin-login-input-icon" />
                <input type="text" placeholder="+250..." required onChange={e => setFormData({...formData, phone: e.target.value})} style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} />
              </div>
            </div>

            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Create Password</label>
              <div className="admin-login-input-wrapper">
                <Lock size={14} className="admin-login-input-icon" />
                <input type="password" placeholder="••••••••" required onChange={e => setFormData({...formData, password: e.target.value})} style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ height: '40px', fontSize: '0.9rem' }}>
              {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </form>

          <div className="admin-login-footer" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
             <Link to="/client/login" style={{ fontSize: '0.8rem', color: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', fontWeight: 700 }}>
                <ArrowLeft size={14} /> Back to Login
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;
