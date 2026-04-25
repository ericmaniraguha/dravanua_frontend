import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, FileText, Settings,
  Leaf, LogOut, Mail, Image, ShoppingBag, Users, Shield, TrendingUp,
  Calendar, Clock, MessageSquare, DollarSign, Megaphone, Cloud, CreditCard, BellRing, QrCode, Landmark, Handshake
} from 'lucide-react';
import LogoWithZoom from '../../components/LogoWithZoom';

const Sidebar = ({ onLogout, user, isOpen }) => {
  const isSuperAdmin = user?.role === 'super_admin';

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin/dashboard', color: '#6366f1' }, // Indigo
    { icon: <ShoppingBag size={18} />, label: 'Bookings', path: '/admin/bookings', color: '#14b8a6' }, // Teal
    { icon: <Users size={18} />, label: 'Customer CRM', path: '/admin/customers', color: '#a855f7' }, // Purple
    { icon: <FileText size={18} />, label: 'Receipts & Docs', path: '/admin/dropbox', color: '#f59e0b' }, // Amber
    { icon: <FileText size={18} />, label: 'Daily Operations', path: '/admin/operations', color: '#22c55e' }, // Green
    { icon: <Users size={18} />, label: 'Staff Directory', path: '/admin/users', color: '#3b82f6' }, // Blue
    { icon: <MessageSquare size={18} />, label: 'Message Center', path: '/admin/messages-admin', color: '#06b6d4' }, // Cyan
    { icon: <Calendar size={18} />, label: 'Attendance Log', path: '/admin/attendance', color: '#84cc16' }, // Lime
    { icon: <BellRing size={18} />, label: 'Reminders', path: '/admin/reminders', color: '#eab308' }, // Yellow
    { icon: <DollarSign size={18} />, label: 'Financial Ledger', path: '/admin/finance', color: '#10b981' }, // Emerald
    { icon: <CreditCard size={18} />, label: 'Subscriptions', path: '/admin/subscriptions', color: '#fbbf24' }, // Gold
    { icon: <DollarSign size={18} />, label: 'Payroll Intelligence', path: '/admin/payroll', color: '#32FC05' },
    { icon: <Landmark size={18} />, label: 'Corporate Treasury', path: '/admin/org-finance', color: '#696d79ff' },
    { icon: <ShoppingBag size={18} />, label: 'Item Registry', path: '/admin/items', color: '#f97316' },
  ];

  const superAdminItems = [
    { icon: <Image size={18} />, label: 'Gallery Admin', path: '/admin/gallery-admin', color: '#ec4899' }, // Pink
    { icon: <QrCode size={18} />, label: 'Staff ID Cards', path: '/admin/id-cards', color: '#6366f1' }, // Indigo
    { icon: <TrendingUp size={18} />, label: 'Staff Performance', path: '/admin/performance', color: '#08ece1ff'  }, // Red
    { icon: <LayoutDashboard size={18} />, label: 'Business Analytics', path: '/admin/analytics', color: '#8b5cf6' }, // Violet
    { icon: <Shield size={18} />, label: 'Service Modules', path: '/admin/modules', color: '#ef4444'}, // Deep Purple
    { icon: <Handshake size={18} />, label: 'Partner Admin', path: '/admin/partners-admin', color: '#10b981' }, 
    { icon: <Cloud size={18} />, label: 'Dropbox Vault', path: '/admin/vault', color: '#0ea5e9' },
  ];

  const sidebarClass = `admin-sidebar ${isOpen ? 'mob-open' : ''}`;

  return (
    <aside className={sidebarClass}>
      <div className="admin-sidebar-brand">
        <LogoWithZoom 
          src="/logo-dvs.jpg" 
          alt="DVS Logo" 
          style={{ width: '45px', height: '45px', borderRadius: '8px', marginBottom: '0.5rem' }} 
        />
        <div className="admin-sidebar-title" style={{ color: '#fcfdffff', fontWeight: 900 }}>
          DRAVANUA HUB
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-group">
          <label className="admin-sidebar-group-label" style={{ color: '#6b7280' }}>General</label>
          <div className="admin-nav-list">
            {menuItems.map((item, idx) => (
              <NavLink 
                key={idx} 
                to={item.path} 
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  color: isActive ? 'white' : item.color,
                  backgroundColor: isActive ? item.color : 'transparent',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease'
                })}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label" style={{ fontWeight: 800 }}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="admin-sidebar-group">
            <label className="admin-sidebar-group-label" style={{ color: '#374151', borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>Administration</label>
            <div className="admin-nav-list">
              {superAdminItems.map((item, idx) => (
                <NavLink 
                  key={idx} 
                  to={item.path} 
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    color: isActive ? 'white' : item.color,
                    backgroundColor: isActive ? item.color : 'transparent',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    transition: 'all 0.3s ease'
                  })}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label" style={{ fontWeight: 800 }}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="admin-sidebar-footer">
        <button onClick={onLogout} className="admin-logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
