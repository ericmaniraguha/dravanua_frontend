import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('customerToken', data.token);
        localStorage.setItem('customerUser', JSON.stringify(data.user));
        navigate('/client/dashboard');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#f8faf8' }}>
      <div className="admin-login-container" style={{ display: 'flex', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', maxWidth: '800px', width: '100%', maxHeight: '460px' }}>
        
        {/* Left Side: Client Branding */}
        <div className="admin-login-info" style={{ flex: 1, background: 'linear-gradient(rgba(13, 59, 13, 0.8), rgba(27, 94, 32, 0.9)), url("/logo-dvs.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', padding: '1.75rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '300px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#90EE90', fontWeight: 800 }}>Client Portal</h2>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: '#fff', opacity: 0.9 }}>
             Experience the art of creation. Manage your bookings and creative projects at <strong>DRAVANUA STUDIO</strong>.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
              <span>✨</span> <span>Personalized Design Sessions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
              <span>📅</span> <span>Real-time Appointment Management</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="admin-login-card" style={{ width: '360px', padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'none' }}>
          <div className="admin-login-header" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0, color: '#111' }}>Welcome Back</h1>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>Sign in to your client account</p>
          </div>

          {error && (
            <div className="admin-login-error" style={{ marginBottom: '0.75rem', padding: '0.4rem', fontSize: '0.75rem' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form" style={{ gap: '0.75rem' }}>
            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Email Address</label>
              <div className="admin-login-input-wrapper">
                <Mail size={14} className="admin-login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }}
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Password</label>
              <div className="admin-login-input-wrapper">
                <Lock size={14} className="admin-login-input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ height: '40px', fontSize: '0.9rem' }}>
              {loading ? 'Entering...' : 'Sign In Now'}
            </button>
          </form>

          <div className="admin-login-footer" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem' }}>Not a member? <Link to="/client/signup" style={{ color: '#1B5E20', fontWeight: 700 }}>Join Dr Studio</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
