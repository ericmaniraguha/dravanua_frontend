import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Key, Lock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefillEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(prefillEmail);
  const isEmailPrefilled = Boolean(prefillEmail); // lock field only when coming from invite link
  
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password })
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="admin-login-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1rem 4rem', background: 'transparent' }}>
        <div className="admin-login-card" style={{ textAlign: 'center', maxWidth: '380px', padding: '1.5rem' }}>
          <div className="admin-login-logo" style={{ background: '#e8f5e9', color: '#2e7d32', width: '60px', height: '60px', margin: '0 auto 1rem' }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Activation Complete!</h2>
          <p style={{ color: '#666', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            Welcome back! Your user profile is ready.
          </p>
          <Link to="/admin/login" className="btn btn-primary btn-full btn-sm">
            Proceed to Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        
        {/* Left Info Panel */}
        <div className="admin-login-info">
          <h2 className="admin-login-info-title">Join Dr Studio Hub</h2>
          <p className="admin-login-info-text">
             User access for <strong>DRAVANUA HUB</strong>.
             Verified operations and financial intelligence at your fingertips.
          </p>
          
          <div className="admin-login-info-features">
             <div className="admin-login-info-feature">
               <div className="feature-emoji">💼</div>
               <span>Operations Management</span>
             </div>
             <div className="admin-login-info-feature">
               <div className="feature-emoji">📈</div>
               <span>Financial Intelligence</span>
             </div>
          </div>

          <div className="admin-login-info-footer">
            <p>Support:</p>
            <span className="admin-login-support-phone">
               +250 795 520 554
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1 className="admin-login-title">Activation</h1>
            <p className="admin-login-subtitle">Set up your workspace</p>
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <form onSubmit={handleSignup} className="admin-login-form">
            <div className="admin-login-field">
              <label>Staff Account (Email)</label>
              <div className="admin-login-input-wrapper">
                <User size={14} className="admin-login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@dravanua.com"
                  required
                  disabled={isEmailPrefilled}
                  style={isEmailPrefilled ? { background: '#f8faf8', color: '#64748b', cursor: 'not-allowed' } : {}}
                />
              </div>
              {isEmailPrefilled && (
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px' }}>
                  ✉️ Pre-filled from your invitation link.
                </p>
              )}
            </div>

            <div className="admin-login-field">
              <label>Verification Code</label>
              <div className="admin-login-input-wrapper">
                <Key size={14} className="admin-login-input-icon" />
                <input 
                  type="text" 
                  placeholder="6-digit code from email" 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label>Create Password</label>
              <div className="admin-login-input-wrapper">
                <Lock size={14} className="admin-login-input-icon" />
                <input 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label>Confirm Password</label>
              <div className="admin-login-input-wrapper">
                <Lock size={14} className="admin-login-input-icon" />
                <input 
                  type="password" 
                  placeholder="Repeat your password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full admin-login-submit" disabled={loading}>
              {loading ? 'Activating Hub...' : 'Complete Activation'}
            </button>
          </form>

          <div className="admin-login-footer">
             <Link to="/admin/login" className="back-to-login">
                <ArrowLeft size={14} /> Back to Login
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
