import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Key, Lock, ArrowLeft, ShieldAlert, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: Code/New Password, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccessMessage('Reset code sent to your email. Please check your inbox.');
        setStep(2);
      } else {
        // Handle specific error messages
        if (res.status === 404 || data.error?.includes('No account found')) {
          setError('This email is not registered in our system. Please contact your administrator.');
        } else {
          setError(data.error || 'Failed to send reset code. Please try again.');
        }
      }
    } catch (err) {
      setError('Connection failed. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStep(3);
      } else {
        // Handle specific error messages
        if (data.error?.includes('Invalid code')) {
          setError('Invalid reset code. Please check and try again.');
        } else if (data.error?.includes('expired')) {
          setError('Reset code has expired. Please request a new one.');
        } else {
          setError(data.error || 'Password reset failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Connection failed. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: '', color: '' };
    if (password.length < 6) return { strength: 'Weak', color: '#d32f2f' };
    if (password.length < 10) return { strength: 'Medium', color: '#f57c00' };
    return { strength: 'Strong', color: '#2e7d32' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="admin-login-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1rem 4rem', background: 'transparent' }}>
      <div className="admin-login-card" style={{ maxWidth: '380px', padding: '1.75rem' }}>
        <div className="admin-login-header" style={{ marginBottom: '1rem' }}>
          <div style={{ color: '#1B5E20', marginBottom: '0.4rem' }}>
            <ShieldAlert size={28} style={{ margin: '0 auto' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem' }}>Recovery</h1>
          <p style={{ fontSize: '0.8rem' }}>User Access Restoration</p>
        </div>

        {error && (
          <div className="admin-login-error" style={{ 
            fontSize: '0.75rem', 
            padding: '0.65rem 0.75rem', 
            marginBottom: '1rem',
            backgroundColor: '#ffebee',
            border: '1px solid #ef5350',
            borderRadius: '6px',
            color: '#c62828',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{ 
            fontSize: '0.75rem', 
            padding: '0.65rem 0.75rem', 
            marginBottom: '1rem',
            backgroundColor: '#e8f5e9',
            border: '1px solid #66bb6a',
            borderRadius: '6px',
            color: '#2e7d32',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestCode} className="admin-login-form" style={{ gap: '0.6rem' }}>
            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Staff Email</label>
              <div className="admin-login-input-wrapper">
                <Mail size={14} className="admin-login-input-icon" />
                <input 
                  type="email" 
                  placeholder="staff@dravanua.com" 
                  required 
                  value={email} 
                  onChange={e => {
                    setEmail(e.target.value);
                    setError(''); // Clear error when typing
                  }} 
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} 
                />
              </div>
              <p style={{ 
                fontSize: '0.68rem', 
                color: '#64748b', 
                marginTop: '6px', 
                marginBottom: '0',
                lineHeight: '1.4'
              }}>
                Enter your registered email address to receive a password reset code.
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-sm" disabled={loading} style={{ height: '40px' }}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="admin-login-form" style={{ gap: '0.6rem' }}>
            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Recovery Code</label>
              <div className="admin-login-input-wrapper">
                <Key size={14} className="admin-login-input-icon" />
                <input 
                  type="text" 
                  placeholder="6-digit code" 
                  required 
                  value={code} 
                  onChange={e => {
                    setCode(e.target.value);
                    setError(''); // Clear error when typing
                  }} 
                  maxLength={6}
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1rem 0.65rem 2.5rem' }} 
                />
              </div>
              <p style={{ 
                fontSize: '0.68rem', 
                color: '#64748b', 
                marginTop: '6px', 
                marginBottom: '0'
              }}>
                Check your email for the 6-digit code. Code expires in 15 minutes.
              </p>
            </div>

            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>New Password</label>
              <div className="admin-login-input-wrapper" style={{ position: 'relative' }}>
                <Lock size={14} className="admin-login-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Min 8 characters" 
                  required 
                  value={newPassword} 
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setError(''); // Clear error when typing
                  }} 
                  style={{ fontSize: '0.85rem', padding: '0.65rem 2.5rem 0.65rem 2.5rem' }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && (
                <div style={{ 
                  fontSize: '0.7rem', 
                  marginTop: '4px', 
                  color: passwordStrength.color,
                  fontWeight: 500
                }}>
                  Strength: {passwordStrength.strength}
                </div>
              )}
            </div>

            <div className="admin-login-field">
              <label style={{ fontSize: '0.7rem' }}>Confirm New Password</label>
              <div className="admin-login-input-wrapper" style={{ position: 'relative' }}>
                <Lock size={14} className="admin-login-input-icon" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Re-enter password" 
                  required 
                  value={confirmPassword} 
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setError(''); // Clear error when typing
                  }} 
                  style={{ 
                    fontSize: '0.85rem', 
                    padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    borderColor: confirmPassword ? (passwordsMatch ? '#2e7d32' : '#d32f2f') : undefined
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <div style={{ 
                  fontSize: '0.7rem', 
                  marginTop: '4px', 
                  color: passwordsMatch ? '#2e7d32' : '#d32f2f',
                  fontWeight: 500
                }}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full btn-sm" 
              disabled={loading || !passwordsMatch || newPassword.length < 8} 
              style={{ height: '40px', marginTop: '0.5rem' }}
            >
              {loading ? 'Resetting...' : 'Update Password'}
            </button>

            {/* Resend Code Option */}
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                  setSuccessMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1B5E20',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 500
                }}
              >
                Didn't receive code? Resend
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: '#2e7d32', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#1B5E20', marginBottom: '0.5rem', fontWeight: 600 }}>
              Password Reset Successful
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <Link to="/admin/login" className="btn btn-primary btn-full btn-sm" style={{ height: '42px' }}>
              Sign In Now
            </Link>
          </div>
        )}

        {step !== 3 && (
          <div className="admin-login-footer" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <Link to="/admin/login" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#1B5E20', fontWeight: 600 }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;