import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Shield, UserCheck, UserX, Trash2, Plus, X, CheckCircle, Clock, Search, User, Building2, RefreshCw, Key, UserPlus, Globe, Camera, Save, Edit, QrCode, Eye, EyeOff, Info } from 'lucide-react';

const LinkedinIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" 
    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const ManageUsers = () => {
  const { user: currentUser, secureFetch } = useAuth();
  const isSuper = currentUser?.role === 'super_admin';
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBalances, setShowBalances] = useState(true);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    role: 'service_admin',
    departmentId: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Team Website Profile states
  const [teamMembers, setTeamMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [teamFormData, setTeamFormData] = useState({ id: null, name: '', role: '', initials: '', linkedin: '', image: '', isHired: true, order: 0, adminUserId: null, email: '', phone: '' });

  const fetchUsersAndTeam = async () => {
    try {
      setLoading(true);
      const [userRes, teamRes, deptRes] = await Promise.all([
        secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users`),
        secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/team`),
        secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/departments`)
      ]);
      const userData = await userRes.json();
      const teamData = await teamRes.json();
      const deptData = await deptRes.json();

      if (userData.success) setUsers(userData.data);
      if (teamData.success) setTeamMembers(teamData.data);
      if (deptData.success) setDepartments(deptData.data);
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndTeam();
    if (window.history.state?.usr?.openInvite) {
      setIsModalOpen(true);
    }
  }, []);

  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this user? An email notification will be sent to them.`)) return;

    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (resp.ok) fetchUsersAndTeam();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleToggleAdminStatus = async (user) => {
    const isCurrentlyAdmin = user.role === 'super_admin' || user.role === 'service_admin';
    const newRole = isCurrentlyAdmin ? 'user' : 'service_admin';
    const actionDesc = isCurrentlyAdmin ? 'revoke administrative privileges from' : 'grant administrative privileges to';

    if (!window.confirm(`Are you sure you want to ${actionDesc} this user?`)) return;

    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsersAndTeam();
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${id}`, {
        method: 'DELETE',
      });
      fetchUsersAndTeam();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleResendCode = async (user) => {
    if (!window.confirm(`Resend activation code to ${user.email}?`)) return;
    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${user.id}/resend-code`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedCode(data.registrationCode);
        setShowSuccessModal(true);
      } else {
        console.error('Resend Code Error:', data);
        alert(data.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend Code Network Error:', error);
      alert('Error connecting to server');
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode && !isSuper) {
        alert('Permission Denied: Only Super Admin can modify existing staff accounts.');
        return;
      }

      const url = isEditMode 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${formData.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users`;
      const method = isEditMode ? 'PUT' : 'POST';

      const submissionData = { ...formData };
      delete submissionData.id; // Backend uses params.id
      if (!submissionData.departmentId) submissionData.departmentId = null;
      
      const response = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      const data = await response.json();
      if (data.success) {
        if (!isEditMode) {
          setGeneratedCode(data.registrationCode);
          setShowSuccessModal(true);
        }
        setIsModalOpen(false);
        setIsEditMode(false);
        setFormData({ id: null, name: '', email: '', role: 'service_admin', departmentId: '' });
        fetchUsersAndTeam();
      } else {
        alert(data.error || data.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || ''
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const form = new FormData();
    form.append('image', file);

    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/upload-image`, {
        method: 'POST',
        body: form
      });
      const data = await response.json();
      if (data.success) {
        setTeamFormData({ ...teamFormData, image: data.url });
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      alert('Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTeamProfile = async (e) => {
    e.preventDefault();
    const url = teamFormData.id
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/team/${teamFormData.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/team';
    const method = teamFormData.id ? 'PUT' : 'POST';

    if (!teamFormData.initials && teamFormData.name) {
      teamFormData.initials = teamFormData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    try {
      const response = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamFormData)
      });
      if (response.ok) {
        setIsTeamModalOpen(false);
        fetchUsersAndTeam();
      } else {
        alert('Failed to save profile');
      }
    } catch (error) {
      alert('Operation failed');
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = users.filter(u => u.isActive).length;
  const superCount = users.filter(u => u.role === 'super_admin').length;
  const pendingCount = users.filter(u => !u.isEmailConfirmed).length;

  const getDeptBadge = (deptId) => {
    if (!deptId) return { bg: '#f1f5f9', color: '#64748b', label: 'General / Unassigned' };
    const dept = departments.find(d => String(d.id) === String(deptId));
    return { 
      bg: '#e8f5e9', 
      color: 'var(--primary-dark)', 
      label: dept ? dept.name : 'Unknown Department' 
    };
  };

  if (loading) {
    return (
      <div className="admin-page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Loading staff directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <Header
        title="Staff Directory & Management"
        subtitle="View administrative personnel, department-level staff, and organizational access permissions."
      />

      {/* Summary Cards */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>TOTAL STAFF</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{users.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>ACTIVE NOW</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{activeCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>SUPER ADMINS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{superCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>PENDING SETUP</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="admin-search-wrapper" style={{ width: '280px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{
                padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
              {showBalances ? 'Hide' : 'Show'}
            </button>

            {isSuper && (
              <button
                className="btn btn-primary"
                onClick={() => setIsModalOpen(true)}
                style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Invite Staff
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-deeper), var(--primary-dark))', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — STAFF DIRECTORY & MANAGEMENT
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              ORGANIZATIONAL PERSONNEL & ACCESS CONTROL · {filteredUsers.length} ACTIVE MEMBERS
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: 'var(--primary-dark)' }}>
                {['STAFF MEMBER', isSuper ? 'STAFF ID' : null, isSuper ? 'SYSTEM UUID' : null, 'ROLE / DEPARTMENT', 'VERIFICATION', 'STATUS', isSuper ? 'WEBSITE PROFILE' : null, 'ACTIONS'].filter(Boolean).map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: (h === 'ACTIONS' || h === 'STATUS' || h === 'VERIFICATION') ? 'center' : 'left',
                    whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, var(--primary-dark), var(--primary-deeper))'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map((user, idx) => {
                const svc = getDeptBadge(user.departmentId);
                return (
                  <tr key={user.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? 'white' : '#fafcfb'
                  }} className="hover-row">
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{user.name}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={10} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    {isSuper && (
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary-dark)', background: '#f0faf0', padding: '4px 10px', borderRadius: '6px', fontWeight: 900, fontFamily: 'monospace', border: '1px solid #dcfce7', width: 'fit-content' }}>
                          {user.staffCode || 'EMP-ID'}
                        </div>
                      </td>
                    )}
                    {isSuper && (
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.05em', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.uuid || 'N/A'}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '50px',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          background: (user.role === 'super_admin' || user.role === 'service_admin') ? '#dc3545' : '#f1f5f9',
                          color: (user.role === 'super_admin' || user.role === 'service_admin') ? 'white' : '#64748b',
                          width: 'fit-content'
                        }}>
                          {user.role === 'super_admin' ? '👑 Super Admin' : (user.role === 'service_admin' ? '🛡️ Admin' : '👤 Staff')}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '50px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          background: svc.bg,
                          color: svc.color,
                          width: 'fit-content'
                        }}>
                          {svc.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.isEmailConfirmed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.75rem', fontWeight: 800 }}>
                          <CheckCircle size={14} /> Confirmed
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ea580c', fontSize: '0.75rem', fontWeight: 800 }}>
                            <Clock size={14} /> Pending
                          </div>
                          {user.registrationCode && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--primary-dark)', background: '#f0faf0', padding: '2px 6px', borderRadius: '4px', fontWeight: 900, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Key size={10} /> {user.registrationCode}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '50px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        background: user.isActive ? '#e8f5e9' : '#fef2f2',
                        color: user.isActive ? 'var(--primary-dark)' : '#dc3545',
                      }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: user.isActive ? 'var(--primary)' : '#dc3545' }}></div>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </div>
                    </td>
                    {isSuper && (
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {(() => {
                          const profile = teamMembers.find(t => t.adminUserId === user.id || t.name === user.name);
                          return (
                            <button
                              onClick={() => {
                                if (profile) {
                                  setTeamFormData({ ...profile, isHired: user.isActive, email: profile.email || '', phone: profile.phone || '' });
                                } else {
                                  const inits = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                                  setTeamFormData({ id: null, name: user.name, role: user.role === 'super_admin' ? 'Super Admin' : 'Staff', initials: inits, linkedin: '', image: '', isHired: user.isActive, order: teamMembers.length, adminUserId: user.id, email: user.email, phone: '' });
                                }
                                setIsTeamModalOpen(true);
                              }}
                              className="btn btn-outline"
                              style={{
                                padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px',
                                background: profile ? '#f0fdf4' : 'transparent',
                                borderColor: profile ? '#bbf7d0' : '#e2e8f0',
                                color: profile ? '#16a34a' : '#64748b',
                                fontWeight: 800
                              }}
                            >
                              {profile ? <CheckCircle size={14} color="#16a34a" /> : <Globe size={14} color="#94a3b8" />}
                              {profile ? '✓ Done' : 'Add'}
                            </button>
                          );
                        })()}
                      </td>
                    )}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{
                        display: 'flex',
                        gap: '0.4rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}>
                         <button
                           type="button"
                           onClick={() => openEditModal(user)}
                           title="Edit User"
                           style={{ padding: '6px 8px', borderRadius: '6px', background: '#f1f5f9', color: 'var(--primary-dark)', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                         >
                           <Edit size={14} />
                         </button>

                         <button
                           type="button"
                           onClick={() => navigate('/admin/messages-admin', { state: { recipient: user.name } })}
                          title="Send Message"
                          style={{ padding: '6px 8px', borderRadius: '6px', background: '#f1f5f9', color: 'var(--primary-dark)', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <Mail size={14} />
                        </button>

                        {isSuper && (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate('/admin/id-cards', { state: { userId: user.id } })}
                              title="ID Card"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: '#f5f3ff', color: '#6366f1', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              <QrCode size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(user)}
                              title="Change Role"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: user.role === 'user' ? '#f0faf0' : '#fff7ed', color: user.role === 'user' ? '#16a34a' : '#ea580c', border: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              <Shield size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              title="Toggle Status"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: user.isActive ? '#6366f1' : '#16a34a', border: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>

                            {!user.isEmailConfirmed && (
                              <button
                                type="button"
                                onClick={() => handleResendCode(user)}
                                title="Resend Invitation"
                                style={{ padding: '6px 8px', borderRadius: '6px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              title="Delete User"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: '#fff1f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>No staff members found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '680px', width: '95%', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isEditMode ? <Edit size={22} /> : <UserPlus size={22} />}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{isEditMode ? 'Update Staff Member' : 'Invite New Staff'}</h3>
                  {!isEditMode && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#e2e8f0' }}>A registration email will be sent automatically</p>}
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <form onSubmit={handleSubmitUser} style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 700, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary-dark)'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 700, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary-dark)'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Access Role</label>
                    <select
                      className="form-input"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary-dark)'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="user">👤 Normal User</option>
                      <option value="service_admin">🛡️ Service Admin</option>
                      <option value="super_admin">👑 Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
                    <select
                      className="form-input"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary-dark)'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="">🏢 General</option>
                      {departments.map(d => (
                         <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="#888" />
                <span style={{ fontSize: '0.75rem', color: '#666' }}>An invitation email with a registration code will be sent to the new user.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isEditMode ? <Save size={16} /> : <Mail size={16} />} {isEditMode ? 'Save Changes' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '400px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ background: '#e8f5e9', color: 'var(--secondary)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle size={28} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary-dark)' }}>Staff Invited Successfully!</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                An invitation email has been sent to <strong>{formData.email}</strong>.
                Share the code below via <strong>WhatsApp / Phone</strong>.
              </p>

              <div style={{ background: '#f8faf8', padding: '1.25rem', borderRadius: '14px', marginBottom: '1.25rem', border: '2px dashed var(--primary)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '6px', color: 'var(--primary-dark)' }}>
                  {generatedCode}
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#dc3545', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                <Clock size={12} /> This code will expire in 15 minutes.
              </p>

              <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)} style={{ width: '100%', height: '44px', borderRadius: '12px', fontWeight: 800 }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Profile Modal */}
      {isTeamModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Public Website Profile</h3>
              </div>
              <button onClick={() => setIsTeamModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <form onSubmit={handleSaveTeamProfile} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <label style={{
                  width: '100px', height: '100px', borderRadius: '50%', background: teamFormData.image ? `url(${teamFormData.image}) center/cover` : '#f1f5f9',
                  border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                  {!teamFormData.image && !isUploading && <Camera size={24} color="#94a3b8" />}
                  {isUploading && <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--primary-dark)' }}>Uploading...</span>}
                </label>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Display Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={teamFormData.name}
                      onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Public Role / Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={teamFormData.role}
                      onChange={(e) => setTeamFormData({ ...teamFormData, role: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Initials</label>
                  <input
                    type="text"
                    className="form-input"
                    value={teamFormData.initials}
                    onChange={(e) => setTeamFormData({ ...teamFormData, initials: e.target.value })}
                    placeholder="e.g. JD"
                    maxLength={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>LinkedIn URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={teamFormData.linkedin}
                    onChange={(e) => setTeamFormData({ ...teamFormData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Public Email (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    value={teamFormData.email}
                    onChange={(e) => setTeamFormData({ ...teamFormData, email: e.target.value })}
                    placeholder="contact@example.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Public Phone (Optional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={teamFormData.phone}
                    onChange={(e) => setTeamFormData({ ...teamFormData, phone: e.target.value })}
                    placeholder="+250 788 000 000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Profile Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={teamFormData.image}
                  onChange={(e) => setTeamFormData({ ...teamFormData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="hiredBox"
                    checked={teamFormData.isHired}
                    onChange={(e) => setTeamFormData({ ...teamFormData, isHired: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-dark)', cursor: 'pointer' }}
                  />
                  <label htmlFor="hiredBox" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary-dark)', cursor: 'pointer' }}>Visible on Website</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                  <label htmlFor="orderInput" style={{ fontWeight: 800, fontSize: '0.85rem', color: '#64748b' }}>Display Order:</label>
                  <input
                    type="number"
                    id="orderInput"
                    className="form-input"
                    value={teamFormData.order}
                    onChange={(e) => setTeamFormData({ ...teamFormData, order: parseInt(e.target.value) || 0 })}
                    style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsTeamModalOpen(false)} style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hover-row:hover { background: #f8fafc !important; }
      `}</style>
    </div>
  );
};

export default ManageUsers;
