import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import { 
  Image, Plus, Trash2, Edit2, Check, X, 
  Search, Filter, Megaphone, Link as LinkIcon, 
  Eye, EyeOff, Info, ExternalLink, Zap
} from 'lucide-react';

const ManageMarketing = () => {
  const { secureFetch } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Studio',
    imageUrl: '',
    ctaLink: '/contact',
    isActive: true,
    displayOrder: 0
  });

  const categories = ['Studio', 'Papeterie', 'Flower Gifts', 'Classic Fashion', 'Other'];

  const fetchAssets = async () => {
    try {
      const response = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/marketing');
      const data = await response.json();
      if (data.success) setAssets(data.data);
    } catch (error) {
      console.error('Failed to fetch marketing assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingAsset 
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/marketing/${editingAsset.id}`
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/marketing';
    const method = editingAsset ? 'PUT' : 'POST';

    try {
      const resp = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await resp.json();
      if (result.success) {
        fetchAssets();
        closeModal();
      }
    } catch (error) {
      alert('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this advertising card?')) return;
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/marketing/${id}`, {
        method: 'DELETE'
      });
      fetchAssets();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const toggleStatus = async (asset) => {
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/marketing/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !asset.isActive })
      });
      fetchAssets();
    } catch (error) {
      alert('Status update failed');
    }
  };

  const openModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        title: asset.title,
        category: asset.category,
        imageUrl: asset.imageUrl,
        ctaLink: asset.ctaLink,
        isActive: asset.isActive,
        displayOrder: asset.displayOrder
      });
    } else {
      setEditingAsset(null);
      setFormData({
        title: '',
        category: 'Studio',
        imageUrl: '',
        ctaLink: '/contact',
        isActive: true,
        displayOrder: assets.length
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const filteredAssets = assets.filter(a => 
    (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="admin-page flex-center h-400">
       <div className="loading-spinner"></div>
       <p style={{ marginTop: '1rem', color: '#888' }}>Initializing Marketing Suite...</p>
    </div>
  );

  return (
    <div className="admin-page animate-fadeIn">
      <Header 
        title="Stationery & Office Supplies" 
        subtitle="Command center for your categories' advertising cards and promotional visuals."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)', padding: '1.25rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(27,94,32,0.25)' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="admin-search">
            <Search className="admin-search-icon" size={18} color="#1B5E20" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              className="admin-search-input" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '300px', backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', color: '#1B5E20', borderRadius: '10px' }}
            />
          </div>
        </div>
        <button className="btn btn-lg" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: '#1B5E20', border: 'none', fontWeight: 800 }}>
          <Zap size={18} /> Create New Campaign
        </button>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
        {filteredAssets.length > 0 ? filteredAssets.map(asset => (
          <div key={asset.id} className={`admin-card admin-ad-card ${!asset.isActive ? 'faded' : ''}`}>
             <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
                <img 
                  src={asset.imageUrl} 
                  alt={asset.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL'}
                />
                <div style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', gap: '6px' }}>
                   <span className="badge" style={{ background: '#1B5E20', color: 'white', border: 'none', padding: '4px 12px', fontWeight: 800 }}>{asset.category.toUpperCase()}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '15px', right: '15px' }}>
                   {asset.isActive ? (
                     <span className="badge" style={{ background: '#32CD32', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> Active</span>
                   ) : (
                     <span className="badge" style={{ background: '#888', color: 'white', border: 'none' }}>Paused</span>
                   )}
                </div>
             </div>
             
             <div style={{ padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: 800 }}>{asset.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.8rem', background: '#f8faf8', padding: '8px 12px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                   <LinkIcon size={14} /> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{asset.ctaLink}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="admin-action-btn view" title="Preview Link" onClick={() => window.open(asset.ctaLink, '_blank')}><ExternalLink size={16} /></button>
                      <button className="admin-action-btn edit" title="Modify Card" onClick={() => openModal(asset)}><Edit2 size={16} /></button>
                      <button 
                        className={`admin-action-btn ${asset.isActive ? 'view' : 'edit'}`} 
                        title={asset.isActive ? "Pause" : "Live"} 
                        onClick={() => toggleStatus(asset)}
                      >
                        {asset.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                   </div>
                   <button className="admin-action-btn delete" title="Remove" onClick={() => handleDelete(asset.id)}><Trash2 size={16} /></button>
                </div>
             </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '24px', border: '1px dashed #ccc' }}>
            <p style={{ fontSize: '1.2rem', color: '#999', margin: 0 }}>No marketing campaigns found.</p>
            <p style={{ color: '#bbb' }}>Click "Create New Campaign" to start advertising your services.</p>
          </div>
        )}
      </div>

      {/* Glassmorphic Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAsset ? 'Modify Campaign' : 'New Dynamic Ad Card'}</h2>
              <button className="admin-action-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
               <div className="form-group">
                  <label>Campaign Heading</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Display Priority</label>
                    <input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value)})} />
                  </div>
               </div>

               <div className="form-group">
                  <label>Media Image URL</label>
                  <input type="text" required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                  <p style={{ marginTop: '0.25rem', color: '#888', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Info size={14} /> Prefer Dropbox or direct CDN links.</p>
               </div>

               <div className="form-group">
                  <label>Call to Action (CTA) Link</label>
                  <input type="text" value={formData.ctaLink} onChange={e => setFormData({...formData, ctaLink: e.target.value})} />
               </div>

               <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn-primary">
                    {editingAsset ? 'Update Campaign' : 'Launch Asset'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .h-400 { height: 400px; }
        .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .loading-spinner { width: 32px; height: 32px; border: 3px solid #e8f5e9; border-top-color: #32CD32; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ManageMarketing;
