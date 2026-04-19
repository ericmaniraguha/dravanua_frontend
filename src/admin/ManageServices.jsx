import React, { useState } from 'react';
import Header from './components/Header';
import Table from './components/Table';
import { Plus, X } from 'lucide-react';

const ManageServices = () => {
  const [services, setServices] = useState([
    { id: 1, title: 'AI & Machine Learning', status: 'Active', clients: 18 },
    { id: 2, title: 'Data Analytics & BI', status: 'Active', clients: 24 },
    { id: 3, title: 'Software Development', status: 'Active', clients: 32 },
    { id: 4, title: 'Cloud Solutions', status: 'Active', clients: 15 },
    { id: 5, title: 'Cybersecurity', status: 'Active', clients: 12 },
    { id: 6, title: 'Research & Innovation', status: 'Inactive', clients: 8 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', status: 'Active' });

  const columns = [
    { key: 'id', label: '#' },
    { key: 'title', label: 'Service Name' },
    {
      key: 'status', label: 'Status',
      render: (val) => (
        <span className={`admin-badge ${val === 'Active' ? 'success' : 'danger'}`}>
          {val}
        </span>
      )
    },
    { key: 'clients', label: 'Active Clients' },
  ];

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, status: item.status });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editItem) {
      setServices(services.map(s => s.id === editItem.id ? { ...s, ...form } : s));
    } else {
      setServices([...services, { id: Date.now(), ...form, clients: 0 }]);
    }
    setShowModal(false);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete service "${item.title}"?`)) {
      setServices(services.filter(s => s.id !== item.id));
    }
  };

  return (
    <div className="admin-page">
      <Header title="Manage Services" subtitle="Add, update, or remove service offerings." />

      <div className="admin-toolbar">
        <span className="admin-toolbar-count">{services.length} services</span>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add Service
        </button>
      </div>

      <Table columns={columns} data={services} onEdit={openEdit} onDelete={handleDelete} />

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editItem ? 'Edit Service' : 'New Service'}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter service name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editItem ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
