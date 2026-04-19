import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import { Shield, CheckCircle, XCircle, RefreshCw, Pin, AlertCircle } from 'lucide-react';

const ManageModules = () => {
  const { secureFetch } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = async () => {
    try {
      const response = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/modules');
      const data = await response.json();
      if (data.success) setModules(data.data);
    } catch (error) {
      console.error('Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleToggleModule = async (module) => {
    if (module.isActive) {
      const confirmDisable = window.confirm(
        `CRITICAL WARNING: You are about to disable the [${module.name}] department.\n\n` +
        `This is a DESTURCTIVE action. All public access to this department will be immediately cut off, and no bookings or operations will be possible.\n\n` +
        `Are you absolutely sure you want to proceed?`
      );
      if (!confirmDisable) return;
    }

    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/modules/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !module.isActive })
      });
      fetchModules();
    } catch (error) {
      alert('Failed to update module');
    }
  };

  const handleUpdateHubGPS = async (module) => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!window.confirm(`Set Official Hub Location for ${module.name} to your current position?\nLat: ${latitude}\nLon: ${longitude}`)) return;

      try {
        const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/modules/${module.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            hub_lat: latitude, 
            hub_lon: longitude 
          })
        });
        const data = await response.json();
        if (data.success) {
          alert('Hub GPS Coordinates Updated Successfully!');
          fetchModules();
        }
      } catch (error) {
        alert('Failed to update GPS');
      }
    }, (err) => alert(`GPS Error: ${err.message}`), { enableHighAccuracy: true });
  };

  return (
    <div className="admin-page">
      <Header 
        title="Service Modules" 
        subtitle="Operational control center for DRAVANUA HUB business units."
      />

      <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ backgroundColor: 'rgba(50, 205, 50, 0.1)', color: '#32CD32' }}>
            <Shield size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Modules</span>
            <span className="admin-stat-value">{modules.length} Units</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">System Status</span>
            <span className="admin-stat-value" style={{ color: '#32CD32' }}>HEALTHY</span>
          </div>
        </div>
      </div>

      <div className="admin-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2rem' 
      }}>
        {modules.map((mod) => (
          <div key={mod.id} className="admin-card module-card-premium" style={{ 
             padding: '2rem',
             position: 'relative',
             borderLeft: `5px solid ${mod.isActive ? '#32CD32' : '#ff4d4d'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{mod.name}</h3>
                <code style={{ fontSize: '0.75rem', color: '#888' }}>ID: {mod.slug.toUpperCase()}</code>
              </div>
              <label className="admin-toggle">
                <input 
                  type="checkbox" 
                  checked={mod.isActive} 
                  onChange={() => handleToggleModule(mod)}
                  style={{ display: 'none' }}
                />
                <div className={`admin-toggle-slider ${mod.isActive ? 'on' : 'off'}`}>
                  <div className="admin-toggle-circle"></div>
                </div>
              </label>
            </div>

            <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem', minHeight: '3.2rem' }}>
              {mod.description}
            </p>

            {!mod.isActive && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700, lineHeight: '1.4' }}>
                  DANGER: DEPARTMENT OFFLINE. Public access and commercial transactions for this unit are currently blocked.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${mod.isActive ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.5rem 1rem' }}>
                {mod.isActive ? 'Operational' : 'Offline'}
              </span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-icon" 
                  title="Capture Hub GPS (Your Current Location)"
                  style={{ background: '#e1f5fe', color: '#0288D1', border: '1px solid #b3e5fc' }}
                  onClick={() => handleUpdateHubGPS(mod)}
                >
                  <Pin size={16} />
                </button>
                <button className="btn-icon" style={{ background: '#f5f5f5' }}>
                  <RefreshCw size={16} color="#888" />
                </button>
              </div>
            </div>

            {mod.hub_lat && (
              <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: '#888', background: '#f9f9f9', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }}>
                 📍 Hub Verified: <code>{mod.hub_lat.toString().slice(0,8)}, {mod.hub_lon.toString().slice(0,8)}</code>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ marginTop: '3rem', padding: '2rem', background: '#111', color: '#fff' }}>
        <h3 style={{ color: '#32CD32', marginBottom: '1rem' }}>Module Integration Safety</h3>
        <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
          Deactivating a service module immediately restricts public access and booking capabilities for that department. Employee access to historical data remains intact. Always notify department leads before toggling operational status.
        </p>
      </div>
    </div>
  );
};

export default ManageModules;
