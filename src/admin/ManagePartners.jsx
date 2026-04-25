import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import { 
  Handshake, Plus, Search, Edit, Trash2, 
  ExternalLink, CheckCircle, X, Globe, Tag,
  LayoutGrid, List, Layers, Info, AlertCircle,
  Upload, ImageIcon, Link as LinkIcon
} from 'lucide-react';

const ManagePartners = () => {
  const { secureFetch, user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Corporate Partner',
    logo: '',
    websiteUrl: '',
    description: '',
    order: 0,
    isActive: true
  });

  const isSuper = user?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/partners`);
      const data = await resp.json();
      if (data.success) setPartners(data.data);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setIsUploading(true);
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/upload-image`, {
        method: 'POST',
        body: formDataUpload, // secureFetch should handle multipart if body is FormData
      });

      const data = await resp.json();
      if (data.success) {
        setFormData({ ...formData, logo: data.url });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSuper) return alert('Only Super Admins can manage partners');
    
    setIsSubmitting(true);
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/partners/${editingItem.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/partners`;

      const resp = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (resp.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        resetForm();
        fetchData();
      } else {
        const error = await resp.json();
        alert(error.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isSuper) return alert('Permissions restricted');
    if (!window.confirm('Remove this partner permanently?')) return;

    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/partners/${id}`, {
        method: 'DELETE'
      });
      if (resp.ok) fetchData();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'Partner',
      logo: item.logo || '',
      websiteUrl: item.websiteUrl || '',
      description: item.description || '',
      order: item.order || 0,
      isActive: item.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Corporate Partner',
      logo: '',
      websiteUrl: '',
      description: '',
      order: 0,
      isActive: true
    });
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container animate-fade-in">
      <Header 
        title="COLLABORATIONS & PARTNERS" 
        subtitle="MANAGE CLIENT REFERENCES, CORPORATE PARTNERS AND STRATEGIC COLLABORATIONS"
        icon={<Handshake size={24} />}
      />

      {/* Statistics Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--primary-soft)' }}>
            <Handshake size={20} color="var(--primary-dark)" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Partners</span>
            <span className="stat-value">{partners.length}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#eef2ff' }}>
            <Globe size={20} color="#6366f1" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active References</span>
            <span className="stat-value">{partners.filter(p => p.isActive).length}</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7' }}>
            <Tag size={20} color="#d97706" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{new Set(partners.map(p => p.category)).size}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="admin-search-wrapper" style={{ flex: 1, minWidth: '300px' }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Filter by name or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isSuper && (
            <button 
              className="btn btn-primary"
              onClick={() => { resetForm(); setEditingItem(null); setIsModalOpen(true); }}
              style={{ padding: '10px 20px', borderRadius: '12px' }}
            >
              <Plus size={18} /> New Partner
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Loading collaborations...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredPartners.map(partner => (
            <div key={partner.id} className="admin-card partner-admin-card" style={{ 
              padding: 0, 
              overflow: 'hidden',
              opacity: partner.isActive ? 1 : 0.6,
              border: partner.isActive ? '1px solid var(--border)' : '1px dashed #cbd5e1'
            }}>
              <div style={{ 
                height: '140px', 
                background: '#f8fafc', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem',
                borderBottom: '1px solid var(--border)',
                position: 'relative'
              }}>
                {partner.logo ? (
                  <img 
                    src={partner.logo} 
                    alt={partner.name} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                    <Layers size={40} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '0.65rem', marginTop: '8px', fontWeight: 900 }}>NO LOGO UPLOADED</span>
                  </div>
                )}
                <div style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '12px',
                  background: partner.isActive ? 'var(--primary-soft)' : '#f1f5f9',
                  color: partner.isActive ? 'var(--primary-dark)' : '#64748b',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}>
                  {partner.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)' }}>{partner.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-dark)', fontWeight: 800, textTransform: 'uppercase' }}>{partner.category}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEdit(partner)}
                      style={{ padding: '6px', background: '#f8fafc', borderRadius: '8px', color: '#1e293b' }}
                      title="Edit details"
                    >
                      <Edit size={14} />
                    </button>
                    {isSuper && (
                      <button 
                        onClick={() => handleDelete(partner.id)}
                        style={{ padding: '6px', background: '#fff1f2', borderRadius: '8px', color: '#dc2626' }}
                        title="Delete reference"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#64748b', 
                  lineHeight: 1.5, 
                  margin: '0 0 12px 0',
                  height: '45px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {partner.description || 'No description provided for this reference.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {partner.websiteUrl ? (
                    <a 
                      href={partner.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}
                    >
                      Visit Website <ExternalLink size={10} />
                    </a>
                  ) : <div></div>}
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>Order: {partner.order}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px', borderRadius: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', padding: '1.25rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Handshake size={22} />
                <h3 style={{ margin: 0, fontWeight: 900 }}>{editingItem ? 'Edit Collaboration' : 'New Reference'}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">PARTNER NAME *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">CATEGORY</label>
                  <select 
                    className="form-input"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Corporate Partner">Corporate Partner</option>
                    <option value="Strategic Ally">Strategic Ally</option>
                    <option value="Client Reference">Client Reference</option>
                    <option value="External Service">External Service</option>
                    <option value="Affiliate">Affiliate</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">DISPLAY ORDER</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.order}
                    onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">PARTNER LOGO</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Logo URL (https://...)" 
                          style={{ paddingLeft: '38px' }}
                          value={formData.logo}
                          onChange={e => setFormData({...formData, logo: e.target.value})}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById('logo-upload').click()}
                        className="btn btn-secondary"
                        disabled={isUploading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', borderRadius: '12px', whiteSpace: 'nowrap' }}
                      >
                        {isUploading ? <div className="spinner-xs"></div> : <Upload size={18} />}
                        {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                      </button>
                      <input 
                        id="logo-upload"
                        type="file" 
                        hidden 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </div>
                    
                    {formData.logo && (
                      <div style={{ 
                        padding: '12px', 
                        background: '#f8fafc', 
                        borderRadius: '16px', 
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}>
                        <div style={{ 
                          width: '60px', 
                          height: '60px', 
                          background: 'white', 
                          borderRadius: '10px', 
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border)'
                        }}>
                          <img src={formData.logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>Logo Preview</p>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b', wordBreak: 'break-all' }}>{formData.logo}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, logo: ''})}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">WEBSITE URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://www.example.com"
                    value={formData.websiteUrl}
                    onChange={e => setFormData({...formData, websiteUrl: e.target.value})}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">DESCRIPTION</label>
                  <textarea 
                    className="form-input" 
                    style={{ height: '80px', resize: 'none' }}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>PUBLICLY ACTIVE & VISIBLE</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '12px 24px', borderRadius: '14px' }}
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ padding: '12px 30px', borderRadius: '14px' }}
                >
                  {isSubmitting ? 'SAVING...' : editingItem ? 'UPDATE PARTNER' : 'SAVE PARTNER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePartners;
