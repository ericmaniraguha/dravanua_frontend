import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, 
  RefreshCw, CheckCircle, X, Tag, Layers, 
  DollarSign, Info, AlertCircle, Bookmark, Calendar
} from 'lucide-react';

const ManageItems = () => {
  const { secureFetch, user } = useAuth();
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90); // Default to last 90 days for items
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Service',
    quality: 'Standard',
    price: '',
    departmentId: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsResp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/items?start=${startDate}&end=${endDate}`);
      const itemsData = await itemsResp.json();
      if (itemsData.success) setItems(itemsData.data);

      const deptResp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/departments`);
      const deptData = await deptResp.json();
      if (deptData.success) {
        setDepartments(deptData.data);
        if (deptData.data.length > 0 && !formData.departmentId) {
          setFormData(prev => ({ ...prev, departmentId: deptData.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/items/${editingItem.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/items`;

      const resp = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (resp.ok) {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
          name: '', type: 'Service', quality: 'Standard', 
          price: '', departmentId: departments[0]?.id || '', description: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Submit Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type || 'Service',
      quality: item.quality || 'Standard',
      price: item.price.toString(),
      departmentId: item.departmentId,
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/items/${id}`, {
        method: 'DELETE'
      });
      if (resp.ok) fetchData();
    } catch (error) {
      console.error('Delete Error:', error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || item.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (loading && items.length === 0) return <div className="admin-page center"><RefreshCw className="spin" /></div>;

  return (
    <div className="admin-page animate-fadeIn">
      <Header 
        title="Departmental Item Management" 
        subtitle="Configure services, products, and operational items for each business unit."
      />

      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <Calendar size={14} className="text-muted" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }} 
              />
              <span style={{ color: '#94a3b8', fontWeight: 900 }}>→</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }} 
              />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <select 
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: '150px' }}
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {isSuperAdmin && (
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> ADD NEW ITEM
            </button>
          )}
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>OFFICIAL ITEM REGISTRY</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{filteredItems.length} Items Listed</div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>ITEM NAME</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>DEPARTMENT</th>
                <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>TYPE / QUALITY</th>
                <th style={{ padding: '15px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>UNIT PRICE (RWF)</th>
                 <th style={{ padding: '15px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>REGISTERED ON</th>
                {isSuperAdmin && <th style={{ padding: '15px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <Package size={48} opacity={0.2} />
                      <div>No items found matching your filters.</div>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{item.description || 'No description provided'}</div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#eef2ff', color: '#4338ca', fontSize: '0.65rem', fontWeight: 800 }}>
                      {item.Department?.name || 'General'}
                    </span>
                  </td>
                   <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ padding: '3px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', fontSize: '0.6rem', fontWeight: 800 }}>{item.type}</span>
                      <span style={{ padding: '3px 6px', borderRadius: '4px', background: '#fef2f2', color: '#991b1b', fontSize: '0.6rem', fontWeight: 800 }}>{item.quality}</span>
                    </div>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 900, color: 'var(--primary-dark)' }}>
                    {parseFloat(item.price).toLocaleString()} RWF
                  </td>
                   <td style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
                    {new Date(item.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  {isSuperAdmin && (
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEdit(item)} className="btn-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}><Edit size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="btn-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '450px', padding: '1.5rem', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{editingItem ? 'Edit Item' : 'New Departmental Item'}</h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Configure service or product details</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Item Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="form-input" 
                  placeholder="e.g. Studio Portrait Session" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department</label>
                  <select 
                    required
                    value={formData.departmentId}
                    onChange={e => setFormData({...formData, departmentId: e.target.value})}
                    className="form-input"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Unit Price (RWF)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="form-input" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Item Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="form-input"
                  >
                    <option value="Service">Service</option>
                    <option value="Product">Physical Product</option>
                    <option value="Equipment">Equipment Hire</option>
                    <option value="Bundle">Service Bundle</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Quality / Level</label>
                  <select 
                    value={formData.quality}
                    onChange={e => setFormData({...formData, quality: e.target.value})}
                    className="form-input"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury / Executive</option>
                    <option value="A+">A+ Grade</option>
                    <option value="Bulk">Bulk / Wholesale</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Narrative / Comments</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="form-input" 
                  placeholder="Additional specifications or documentation comments..."
                  style={{ height: '80px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ padding: '12px', borderRadius: '12px' }}>CANCEL</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary" 
                  style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))' }}
                >
                  {isSubmitting ? <RefreshCw className="spin" size={18} /> : (editingItem ? 'SAVE CHANGES' : 'CREATE ITEM')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageItems;
