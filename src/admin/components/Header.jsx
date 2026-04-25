import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Search, ChevronDown, User, CreditCard, AlertTriangle, X, ExternalLink, Activity } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;

const Header = ({ title, subtitle, searchQuery, onSearchChange }) => {
  const { user, secureFetch } = useAuth(); // Enhanced from useAuth directly
  const navigate = useNavigate();

  const [subAlerts, setSubAlerts] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' or 'reminders'
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ── Fetch alerts and reminders ──────────────────────────
  const fetchAllNotifications = async () => {
    try {
      // Fetch Subscriptions
      const subRes = await secureFetch(`${API}/api/v1/admin/subscriptions/alerts`);
      const subData = await subRes.json();
      if (subData.success) setSubAlerts(subData.data || []);

      // Fetch Reminders
      const remRes = await secureFetch(`${API}/api/v1/admin/reminders/due-today`);
      const remData = await remRes.json();
      if (remData.success) setReminders(remData.data || []);
    } catch (err) { console.error("Notification fetch failed", err); }
  };

  useEffect(() => {
    fetchAllNotifications();
    const interval = setInterval(fetchAllNotifications, 5 * 60 * 1000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  // ── Close dropdown when clicking outside ────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return Infinity;
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    return Math.ceil((d - today) / (1000*60*60*24));
  };

  const handleAvatarClick = () => {
    document.getElementById('profile-upload').click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const resp = await secureFetch(`${API}/api/v1/admin/upload-image`, {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();
      if (data.success) {
        const profileResp = await secureFetch(`${API}/api/v1/admin/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: data.url })
        });
        const profileData = await profileResp.json();
        if (profileData.success) {
          const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
          currentUser.profilePicture = data.url;
          localStorage.setItem('adminUser', JSON.stringify(currentUser));
          window.location.reload();
        }
      }
    } catch (err) { console.error("Upload failed", err); }
  };

  const alertCount = subAlerts.length + reminders.length;
  const hasUrgent = subAlerts.some(a => getDaysUntil(a.nextBillingDate) <= 1) || reminders.some(r => r.priority === 'Urgent');

  return (
    <header className="admin-header">
      <input type="file" id="profile-upload" hidden accept="image/*" onChange={handleFileChange} />

      <div className="admin-header-left">
        <h1 className="admin-header-title">{title}</h1>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>

      <div className="admin-header-right">
        {onSearchChange && (
          <div className="admin-search">
            <Search size={18} className="admin-search-icon" />
            <input
              type="text" placeholder="Search..."
              className="admin-search-input"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {/* ── Subscription Alarm Bell ─────────────────────────────── */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="admin-notification-btn"
            onClick={() => setShowDropdown(v => !v)}
            title={alertCount > 0 ? `${alertCount} active notification${alertCount > 1 ? 's' : ''}` : 'No active alerts'}
            style={{ position: 'relative' }}
          >
            {alertCount > 0
              ? <BellRing size={20} color={hasUrgent ? '#dc2626' : '#b45309'} style={{ animation: hasUrgent ? 'bellRing 1s ease infinite' : 'none' }} />
              : <Bell size={20} />
            }
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: hasUrgent ? '#dc2626' : '#b45309',
                color: 'white', borderRadius: '50%', width: '18px', height: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 900, lineHeight: 1,
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}>{alertCount}</span>
            )}
          </button>

          {/* Dropdown Panel */}
          {showDropdown && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, zIndex: 99999,
              background: 'white', borderRadius: '16px', width: '340px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0',
              animation: 'fadeInUp 0.2s ease', overflow: 'hidden'
            }}>
              {/* Header with Tabs */}
              <div style={{ background: 'linear-gradient(135deg, #32FC05, #2E7D32)', padding: '0' }}>
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>Notification Hub</span>
                  <button onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
                {/* Tab Switcher */}
                <div style={{ display: 'flex', padding: '0 10px 0 10px' }}>
                  <button 
                    onClick={() => setActiveTab('subscriptions')}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'subscriptions' ? '3px solid white' : '3px solid transparent', color: activeTab === 'subscriptions' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}
                  >
                    Subscriptions ({subAlerts.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('reminders')}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === 'reminders' ? '3px solid white' : '3px solid transparent', color: activeTab === 'reminders' ? 'white' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}
                  >
                    Reminders ({reminders.length})
                  </button>
                </div>
              </div>

              {/* Alert List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {activeTab === 'subscriptions' ? (
                  subAlerts.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                      <CreditCard size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      No upcoming renewals
                    </div>
                  ) : (
                    subAlerts.map(a => {
                      const days = getDaysUntil(a.nextBillingDate);
                      const isOverdue = days < 0;
                      const isCritical = days <= 1 && days >= 0;
                      const bgColor = isOverdue ? '#fef2f2' : isCritical ? '#fffbeb' : '#f8fafc';
                      const accentColor = isOverdue ? '#dc2626' : isCritical ? '#b45309' : '#475569';
                      return (
                        <div key={a.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', background: bgColor, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isOverdue ? '#fee2e2' : isCritical ? '#fef3c7' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isOverdue || isCritical ? <AlertTriangle size={16} color={accentColor} /> : <CreditCard size={16} color="#16a34a" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{Number(a.cost).toLocaleString()} {a.currency} · {a.billingCycle}</div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 900, marginTop: '4px', color: accentColor }}>
                              {isOverdue ? `🚨 OVERDUE by ${Math.abs(days)}d` : days === 0 ? '⚡ DUE TODAY' : `📅 ${days}d left`}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  reminders.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                      <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      No reminders due today
                    </div>
                  ) : (
                    reminders.map(r => {
                      const color = { Urgent: '#dc2626', High: '#b45309' }[r.priority] || '#475569';
                      return (
                        <div key={r.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', background: r.priority === 'Urgent' ? '#fef2f2' : 'white', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: r.priority === 'Urgent' ? '#fee2e2' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Activity size={16} color={color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                            <p style={{ fontSize: '0.68rem', color: '#64748b', margin: '2px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.message}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 900, color: color, textTransform: 'uppercase' }}>{r.priority}</span>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8' }}>🕒 {r.reminderTime || 'No time set'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>

              {/* Footer CTA */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'right' }}>
                <button
                  onClick={() => { setShowDropdown(false); navigate(activeTab === 'subscriptions' ? '/admin/subscriptions' : '/admin/reminders'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#32FC05', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  Go to {activeTab === 'subscriptions' ? 'Subscriptions' : 'Reminders'} <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="admin-profile" onClick={handleAvatarClick} style={{ cursor: 'pointer' }} title="Click to Change Profile Picture">
          <div className="admin-profile-avatar" style={{ overflow: 'hidden', padding: 0 }}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="admin-profile-info">
            {user?.name !== 'Super Admin' && (
              <span className="admin-profile-name">{user?.name || 'Admin User'}</span>
            )}
            <span className="admin-profile-role" style={{
              color: (user?.role === 'super_admin' || user?.role === 'service_admin') ? 'white' : '#32FC05',
              background: (user?.role === 'super_admin' || user?.role === 'service_admin') ? '#dc3545' : '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px', fontWeight: 900, fontSize: '0.65rem'
            }}>
              {user?.role === 'super_admin' ? 'SUPER ADMIN' : (user?.role === 'service_admin' ? 'ADMINISTRATOR' : 'STAFF MEMBER')}
              {user?.assignedService && (
                <span style={{
                  fontSize: '0.65rem', opacity: (user?.assignedService === 'all') ? 1 : 0.8,
                  fontWeight: (user?.assignedService === 'all') ? 900 : 500,
                  display: 'block', marginTop: '2px', textTransform: 'uppercase',
                  background: (user?.assignedService === 'all') ? '#32FC05' : 'transparent',
                  color: (user?.assignedService === 'all') ? 'white' : 'inherit',
                  padding: (user?.assignedService === 'all') ? '1px 4px' : '0', borderRadius: '2px'
                }}>
                  {user?.assignedService === 'Stationery & Office Supplies' ? 'Stationery & Office Supplies' : (user?.assignedService === 'all' ? '' : user?.assignedService)}
                </span>
              )}
            </span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
};

export default Header;
