import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import { Image, Plus, Trash2, Edit, Save, X, ExternalLink, Camera } from 'lucide-react';

const ManageGallery = () => {
  const { user: currentUser, secureFetch } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [formData, setFormData] = useState({ 
    title: '', 
    category: 'Studio', 
    description: '', 
    image: '', 
    isFeatured: false,
    portfolioYear: new Date().getFullYear().toString(),
    clientName: ''
  });

  const fetchGallery = async () => {
    try {
      const response = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/gallery');
      const data = await response.json();
      if (data.success) setItems(data.data);
    } catch (error) {
       console.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingItem ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/gallery/${editingItem.id}` : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/gallery';
    const method = editingItem ? 'PUT' : 'POST';
    
    try {
      const response = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ 
          title: '', 
          category: 'Studio', 
          description: '', 
          image: '', 
          isFeatured: false,
          portfolioYear: new Date().getFullYear().toString(),
          clientName: ''
        });
        fetchGallery();
      }
    } catch (error) {
      alert('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/gallery/${id}`, {
        method: 'DELETE'
      });
      fetchGallery();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  return (
    <div className="admin-page">
      <Header 
        title="Gallery Management" 
        subtitle="Curate the visual face of DRAVANUA HUB. Studio photos, Classic Fashion highlights, and more."
      />

      {isSuperAdmin && (
        <div style={{ marginBottom: '3rem', background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1B5E20' }}>Portfolio Provisioning</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Provision single assets or use the high-fidelity bulk importer for departmental clusters.</p>
           </div>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => { 
                setEditingItem(null); 
                setFormData({ 
                  title: '', category: 'Studio', description: '', image: '', isFeatured: false,
                  portfolioYear: new Date().getFullYear().toString(), clientName: '' 
                }); 
                setIsModalOpen(true); 
              }}>
                <Plus size={20} /> Provision Single Asset
              </button>
           </div>
        </div>

        <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
           <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Bulk Departmental Cluster Import (Multiple Files)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <select 
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 800, background: 'white' }}
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                 >
                    <option value="Studio">Studio Portfolio</option>
                    <option value="Classic Fashion">Classic Fashion</option>
                    <option value="Flower Gifts">Flower Store</option>
                    <option value="Stationery & Office Supplies">Stationery & Office</option>
                 </select>
                 
                 <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '44px', borderRadius: '12px', background: 'white' }}>
                    {isBulkLoading ? `Processing... ${bulkProgress}%` : <><Camera size={18} /> Select Up to 10+ Pictures</>}
                    <input 
                       type="file" multiple hidden accept="image/*"
                       disabled={isBulkLoading}
                       onChange={async (e) => {
                          const files = Array.from(e.target.files);
                          if (!files.length) return;
                          
                          setIsBulkLoading(true);
                          setBulkProgress(0);
                          
                          try {
                             let completed = 0;
                             for (const file of files) {
                                const fData = new FormData();
                                fData.append('image', file);
                                
                                // 1. Upload
                                const uploadRes = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/upload-image', {
                                   method: 'POST',
                                   body: fData
                                });
                                const uploadData = await uploadRes.json();
                                
                                if (uploadData.success) {
                                   // 2. Create Gallery Item
                                   await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/gallery', {
                                      method: 'POST',
                                      headers: { 
                                         'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                         title: file.name.split('.')[0].replace(/[-_]/g, ' '),
                                         category: formData.category,
                                         image: uploadData.url,
                                         description: `Bulk imported asset from ${file.name}`,
                                         portfolioYear: new Date().getFullYear().toString()
                                      })
                                   });
                                }
                                
                                completed++;
                                setBulkProgress(Math.round((completed / files.length) * 100));
                             }
                             
                             alert(`Successfully synchronized ${files.length} production assets to the ${formData.category} cluster.`);
                             fetchGallery();
                          } catch (err) {
                             alert('Bulk synchronization failed. Node interrupted.');
                          } finally {
                             setIsBulkLoading(false);
                             setBulkProgress(0);
                          }
                       }}
                    />
                 </label>
              </div>
           </div>
           <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right' }}>
            {items.length} Production Assets Managed<br/>
            <span style={{ fontSize: '0.7rem', color: '#1B5E20' }}>Live Network Status: Operational</span>
          </div>
        </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' }}>
        {items.map((item) => (
          <div key={item.id} className="admin-card gallery-item-card" style={{ padding: 0, overflow: 'hidden', border: item.isFeatured ? '2px solid #32CD32' : '1px solid #e2e8f0', background: 'white', borderRadius: '16px', transition: 'all 0.4s' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
              <img 
                 src={item.image} 
                 alt={item.title} 
                 onClick={() => setSelectedImage(item.image)}
                 style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.5s', cursor: 'zoom-in' }} 
              />
              {isSuperAdmin && (
                <div style={{ position: 'absolute', bottom: '15px', left: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
                   <button className="btn-icon-premium" style={{ width: '32px', height: '32px', padding: 0, background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} onClick={(e) => { e.stopPropagation(); handleEdit(item); }}><Edit size={14} /></button>
                   <button className="btn-icon-premium danger" style={{ width: '32px', height: '32px', padding: 0, background: 'rgba(255,255,255,0.95)', border: '1px solid #fee2e2', boxShadow: '0 4px 10px rgba(220,38,38,0.15)' }} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}><Trash2 size={14} color="#ef4444" /></button>
                </div>
              )}
              <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 10 }}>
                {item.isFeatured && (
                  <div style={{ background: '#32CD32', color: 'white', padding: '5px 12px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(50, 205, 50, 0.3)' }}>Featured</div>
                )}
                <div style={{ background: 'rgba(255,255,255,0.95)', color: '#1B5E20', padding: '5px 12px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', border: '1px solid #e2e8f0' }}>{item.category}</div>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ width: '100%' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#1B5E20', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h3>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>
                    <span>📅 {item.portfolioYear || '2026'}</span>
                    {item.clientName && <span>👤 Client: {item.clientName}</span>}
                  </div>
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: '0.75rem', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description || 'Professional portfolio documentation.'}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '680px', width: '95%', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: '#1B5E20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {editingItem ? <Edit size={22} /> : <Image size={22} />}
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#f9fafcff' }}>
                    {editingItem ? 'Refine Gallery Item' : 'New Gallery Entry'}
                  </h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Title / Caption *</label>
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outlineColor: '#32CD32' }} required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Summer Classic Fashion Highlights" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Service Category</label>
                    <select className="form-input" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600 }} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="Studio">📸 Studio Photography</option>
                      <option value="Classic Fashion">💍 Classic Fashion Services</option>
                      <option value="Flower Gifts">💐 Flower Store</option>
                      <option value="Stationery & Office Supplies">📄 Stationery & Office Supplies Portfolio</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Portfolio Year</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} 
                      value={formData.portfolioYear} 
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.length > 1 && val.startsWith('0')) {
                          val = val.replace(/^0+/, '');
                        }
                        setFormData({...formData, portfolioYear: val});
                      }} 
                      placeholder="e.g., 2026" 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Production Client (Optional)</label>
                    <input type="text" className="form-input" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} placeholder="e.g., Eric & Anna Classic Fashion" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Featured Asset</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: '#32CD32' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Mark as Highlight</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Image Asset (URL or Upload)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                      required 
                      placeholder="https://..." 
                      value={formData.image} 
                      onChange={(e) => setFormData({...formData, image: e.target.value})} 
                    />
                    <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 15px', borderRadius: '10px', height: '42px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #e2e8f0' }}>
                      <Camera size={16} /> Upload
                      <input 
                        type="file" 
                        hidden 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const fData = new FormData();
                          fData.append('image', file);
                          try {
                            const res = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/upload-image', {
                              method: 'POST',
                              body: fData
                            });
                            const data = await res.json();
                            if (data.success) setFormData({...formData, image: data.url});
                          } catch (err) { alert('Upload failed'); }
                        }} 
                      />
                    </label>
                  </div>
                  {formData.image && (
                    <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', height: '100px' }}>
                      <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Context / Caption Description</label>
                  <textarea className="form-input" rows="2" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', resize: 'none' }} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Provide some artistic context..."></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>{editingItem ? 'Publish Updates' : 'Launch to Gallery'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(15px)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setSelectedImage(null)}>
           <button style={{ position: 'absolute', top: '25px', right: '35px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 9999999 }} onMouseEnter={e => e.target.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.15)'}><X size={28} /></button>
           <img src={selectedImage} alt="Expanded View" style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain', zIndex: 9999990 }} onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
};

export default ManageGallery;
