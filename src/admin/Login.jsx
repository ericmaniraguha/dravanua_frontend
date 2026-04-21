import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user, data.token); // Pass token to context
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please check server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        
        {/* Left Info Panel */}
        <div className="admin-login-info">
          <h2 className="admin-login-info-title">Dr Studio Hub</h2>
          <p className="admin-login-info-text">
             Premium creative management for <strong>DRAVANUA STUDIO</strong>.
          </p>
          
          <div className="admin-login-info-features">
            <div className="admin-login-info-feature">
              <span>📸</span>
              <span>Studio Photo Sessions</span>
            </div>
            <div className="admin-login-info-feature">
              <span>💐</span>
              <span>Flower Store Management</span>
            </div>
            <div className="admin-login-info-feature">
              <span>💍</span>
              <span>Classic Fashion Coordination</span>
            </div>
          </div>

          <div className="admin-login-info-footer">
            <p>Contact Support:</p>
            <span className="admin-login-support-phone">
              +250 795 520 554
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1 className="admin-login-title">Management Login</h1>
            <p className="admin-login-subtitle">Enter credentials for access</p>
          </div>

          {error && (
            <div className="admin-login-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-login-field">
              <label>Staff Email</label>
              <div className="admin-login-input-wrapper">
                <Mail size={14} className="admin-login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@dravanua.com"
                  required
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label>Password</label>
              <div className="admin-login-input-wrapper">
                <Lock size={14} className="admin-login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="admin-login-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="admin-login-forgot-link">
                <Link to="/admin/forgot-password">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full admin-login-submit" disabled={loading}>
              {loading ? 'Entering...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>New staff? <Link to="/admin/signup">Invite Activation</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
