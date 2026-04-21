import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Mail, Phone, MapPin, Tag, 
  Trash2, Edit, X, TrendingUp, DollarSign, Target, 
  BarChart3, PieChart, Activity, UserCheck, RefreshCw,
  AlertCircle, ChevronLeft, ChevronRight, Check, AlertTriangle, 
  Printer, Shield, FileText, MessageCircle, Download, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import { generateReport } from '../utils/generateReport';
import ContractGenerator from './Contractgenerator';
import ExportToolbar from './components/ExportToolbar';
import { exportToExcel, fmtAmt } from '../utils/exportUtils';
import { ALL_COUNTRIES } from '../utils/countryData';

const ManageCustomers = () => {
  const navigate = useNavigate();
  const { user: currentUser, secureFetch } = useAuth();
  const isSuper = currentUser?.role === 'super_admin';
  
  // The department assigned to the logged-in user (e.g., 'Studio', 'Classic Fashion')
  const userDepartment = currentUser?.department || ''; 

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currency, setCurrency] = useState(() => localStorage.getItem('dvs_currency') || 'RWF');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', address: '', channel: 'Website', 
    notes: '', services: [], referredBy: '', countryCode: '+250', countryName: 'Rwanda' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Customer details modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  


  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [initialContractData, setInitialContractData] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  const [requestData, setRequestData] = useState({ date: new Date().toISOString().split('T')[0], itemNeeded: '', quantity: 1, department: 'Studio', currency: 'RWF', unitPrice: 0, personRequested: 'Manager' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Toast notifications
  const [toast, setToast] = useState(null);
  
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCustomers = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/customers');
      
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data || []);
      } else {
        setError(data.message || 'Failed to load customers');
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setError('Connection to server failed. Please ensure the backend is running.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (deleteConfirm) setDeleteConfirm(null);
        else if (isModalOpen) setIsModalOpen(false);
        else if (isDetailsOpen) setIsDetailsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, deleteConfirm, isDetailsOpen]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!/^[\d\s\-+()]{5,20}$/.test(formData.phone)) {
      errors.phone = 'Enter a valid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const url = editingCustomer 
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/customers/${editingCustomer.id}` 
      : import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/customers';
    const method = editingCustomer ? 'PUT' : 'POST';
    
    const finalPhone = `${formData.countryCode}${formData.phone.trim()}`;
    
    try {
      const response = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: finalPhone,
          services: formData.services.join(',')
        })
      });
      
      if (!response.ok) throw new Error('Operation failed');
      
      setIsModalOpen(false);
      setEditingCustomer(null);
      showToast(editingCustomer ? 'Customer updated successfully' : 'Customer registered successfully');
      fetchCustomers();
    } catch (error) {
      showToast(error.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    setIsDeleting(true);
    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/customers/${customer.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      setDeleteConfirm(null);
      showToast(`${customer.name} has been removed`);
      fetchCustomers();
    } catch (error) {
      showToast('Failed to delete customer', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    const initialServices = (!isSuper && userDepartment) ? [userDepartment] : [];
    setFormData({ name: '', email: '', phone: '', address: '', channel: 'Website', notes: '', services: initialServices, referredBy: '', countryCode: '+250', countryName: 'Rwanda' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    const phone = customer.phone || '';
    const matchedCountry = ALL_COUNTRIES.find(c => phone.startsWith(c.code)) || ALL_COUNTRIES.find(x => x.name === 'Rwanda');
    const localPhone = phone.startsWith(matchedCountry.code) ? phone.slice(matchedCountry.code.length).trim() : phone.trim();

    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: localPhone,
      countryCode: customer.countryCode || matchedCountry.code,
      countryName: customer.countryName || matchedCountry.name,
      address: customer.address || '',
      channel: customer.channel || 'Website',
      notes: customer.notes || '',
      services: customer.services ? customer.services.split(',') : [],
      referredBy: customer.referredBy || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openMessageCenter = (customer) => {
    navigate('/admin/messages-admin', {
      state: {
        prefillEmail: customer.email,
        prefillName: customer.name,
        prefillSubject: `Service Inquiry - ${customer.name}`,
        prefillMessage: `Dear ${customer.name},\n\nThank you for being a valued member of DRAVANUA HUB.\n\nWe wanted to reach out regarding your recent services...\n\nBest regards,\nDRAVANUA HUB Team`
      }
    });
  };

  const generateCustomerReport = (customer) => {
    const reportWindow = window.open('', '_blank');
    
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Profile - ${customer.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1B5E20; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 900; color: #1B5E20; margin-bottom: 5px; }
          .tagline { font-size: 14px; color: #64748b; font-style: italic; }
          .customer-id { font-size: 24px; font-weight: 800; color: #1B5E20; margin: 20px 0; }
          .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 12px; }
          .section-title { font-size: 16px; font-weight: 800; color: #1B5E20; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { padding: 10px 0; }
          .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 600; color: #1e293b; }
          .stats-summary { background: linear-gradient(135deg, #1B5E20, #2E7D32); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
          .stats-item { display: inline-block; margin: 0 20px; }
          .stats-value { font-size: 32px; font-weight: 900; display: block; }
          .stats-label { font-size: 12px; opacity: 0.8; text-transform: uppercase; }
          .services-section { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px; }
          .service-tag { display: inline-block; background: #1B5E20; color: white; padding: 6px 12px; border-radius: 6px; margin: 4px; font-size: 12px; font-weight: 700; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">DRAVANUA HUB</div>
          <div class="tagline">Here to Create</div>
          <div class="customer-id">Customer Profile - ${customer.name}</div>
          <span style="background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800;">
            ACTIVE MEMBER
          </span>
        </div>

        <div class="stats-summary">
          <div class="stats-item">
            <span class="stats-value">RWF ${(customer.totalSpent || 0).toLocaleString()}</span>
            <span class="stats-label">Total Lifetime Value</span>
          </div>
          <div class="stats-item">
            <span class="stats-value">${customer.channel || 'N/A'}</span>
            <span class="stats-label">Acquisition Channel</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contact Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${customer.name}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email Address</div>
              <div class="info-value">${customer.email || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone Number</div>
              <div class="info-value">${customer.phone || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Physical Address</div>
              <div class="info-value">${customer.address || 'N/A'}</div>
            </div>
          </div>
        </div>

        ${customer.services ? `
          <div class="services-section">
            <div class="section-title" style="color: #92400e; margin-bottom: 15px;">Registered Services</div>
            ${customer.services.split(',').map(s => `<span class="service-tag">${s.trim()}</span>`).join('')}
          </div>
        ` : ''}

        ${customer.notes ? `
          <div class="section">
            <div class="section-title">Customer Notes</div>
            <div style="line-height: 1.8; color: #475569;">${customer.notes}</div>
          </div>
        ` : ''}

        ${customer.referredBy ? `
          <div class="section">
            <div class="section-title">Referral Information</div>
            <div class="info-value">Referred by: ${customer.referredBy}</div>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>DRAVANUA HUB</strong> | Kigali, Rwanda</p>
          <p>Email: info@dravanuahub.com | Phone: +250 795 520 554</p>
          <p style="margin-top: 10px; font-style: italic;">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background: #1B5E20; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer; margin-right: 10px;">PRINT REPORT</button>
          <button onclick="window.close()" style="background: white; color: #1B5E20; border: 2px solid #1B5E20; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer;">CLOSE</button>
        </div>
      </body>
      </html>
    `;
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

  // --- FILTERING LOGIC ---
  
  // Step 1: Filter by Role/Department
  const roleFilteredCustomers = useMemo(() => {
    if (isSuper) return customers;
    
    // Only show customers who have the logged-in user's department in their services list
    return customers.filter(c => {
      if (!c.services) return false;
      return c.services.includes(userDepartment);
    });
  }, [customers, isSuper, userDepartment]);

  // Step 2: Filter by Search Term (applied over role-filtered data)
  const filteredCustomers = roleFilteredCustomers.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- STATS LOGIC (Based on Role-Filtered Data) ---
  const totalRevenue = roleFilteredCustomers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
  const avgLTVNum = roleFilteredCustomers.length > 0 ? (totalRevenue / roleFilteredCustomers.length) : 0;
  const avgLTV = avgLTVNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const highValueCount = roleFilteredCustomers.filter(c => Number(c.totalSpent || 0) > 1000).length;
  const highValuePct = roleFilteredCustomers.length > 0 
    ? ((highValueCount / roleFilteredCustomers.length) * 100).toFixed(1) 
    : '0';
  
  const channelCounts = roleFilteredCustomers.reduce((acc, c) => {
    const ch = c.channel || 'Unknown';
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});
  
  const topChannel = Object.keys(channelCounts).length > 0
    ? Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  const handlePrint = () => {
    const bodyHtml = `
      <div class="section-title">CRM Intelligence Summary ${!isSuper ? `(${userDepartment})` : ''}</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${roleFilteredCustomers.length}</span><span class="metric-lbl">Total Clients</span></div>
        <div class="metric-card"><span class="metric-val">RWF ${totalRevenue.toLocaleString()}</span><span class="metric-lbl">Total Revenue</span></div>
        <div class="metric-card"><span class="metric-val">RWF ${avgLTV}</span><span class="metric-lbl">Avg Lifetime Value</span></div>
        <div class="metric-card"><span class="metric-val">${highValuePct}%</span><span class="metric-lbl">High-Value Rate</span></div>
      </div>

      <div class="section-title">Acquisition Channel Breakdown</div>
      <table>
        <thead><tr><th>Channel</th><th>Client Count</th><th>Share</th><th>Status</th></tr></thead>
        <tbody>
          ${Object.entries(channelCounts).sort((a,b) => b[1]-a[1]).map(([ch, count]) => `
            <tr>
              <td><strong>${ch}</strong></td>
              <td>${count}</td>
              <td>${roleFilteredCustomers.length > 0 ? ((count/roleFilteredCustomers.length)*100).toFixed(1) : 0}%</td>
              <td><span class="badge badge-green">${ch === topChannel ? 'Top Channel' : 'Active'}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    const page2Html = `
      <div class="section-title">Full Client Directory (${roleFilteredCustomers.length} records)</div>
      <table>
        <thead><tr><th>#</th><th>Client Name</th><th>Email</th><th>Phone</th><th>Channel</th><th style="text-align:right">Lifetime Value</th></tr></thead>
        <tbody>
          ${roleFilteredCustomers.slice(0, 40).map((c, i) => `
            <tr>
              <td style="color:#999">${i + 1}</td>
              <td><strong>${c.name}</strong><br/><span style="font-size:9px;color:#999">DVS-${String(c.id).slice(-4).padStart(4,'0')}</span></td>
              <td style="font-size:10px;color:#666">${c.email || '—'}</td>
              <td style="font-size:10px;color:#666">${c.phone || '—'}</td>
              <td><span class="badge badge-blue">${c.channel || 'Unknown'}</span></td>
              <td style="text-align:right; font-weight:900; color:#1B5E20">RWF ${Number(c.totalSpent || 0).toLocaleString()}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    generateReport({ title: 'Customer Intelligence Report', moduleCode: 'CRM', bodyHtml, page2Html });
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-page flex-center h-400" role="status">
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem', color: '#666' }}>Loading customer database...</span>
      </div>
    );
  }

  // Error state (full page)
  if (error && customers.length === 0) {
    return (
      <div className="admin-page">
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <AlertCircle size={48} color="#dc3545" style={{ marginBottom: '1rem' }} />
          <h3>Unable to Load Customers</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchCustomers}>
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`toast toast-${toast.type}`}
          style={{
            position: 'fixed', top: '20px', right: '20px', padding: '1rem 1.5rem',
            borderRadius: '12px', background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: toast.type === 'error' ? '#dc2626' : '#16a34a',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'slideIn 0.3s ease'
          }}
          role="alert"
        >
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          {toast.message}
        </div>
      )}

      <Header 
        title="Customer Intelligence Command" 
        subtitle={isSuper ? "Executive CRM • Global Client Directory" : `Departmental CRM • ${userDepartment} Portfolio`}
      />

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: isSuper ? 'Total Database' : 'Department Clients', val: roleFilteredCustomers.length, icon: Users, color: '#1B5E20', bg: '#f0fdf4' },
          { label: 'Avg. LTV', val: `RWF ${avgLTV}`, icon: DollarSign, color: '#0369a1', bg: '#f0f9ff' },
          { label: 'High-Value Rate', val: `${highValuePct}%`, icon: TrendingUp, color: '#15803d', bg: '#f0fdf4' },
          { label: 'Top Channel', val: topChannel, icon: Target, color: '#92400e', bg: '#fffbeb' }
        ].map((s, i) => (
          <div key={i} className="admin-card" style={{ padding: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Banner (stale data warning) */}
      {error && customers.length > 0 && (
        <div style={{ background: '#fef3cd', border: '1px solid #ffc107', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="#856404" />
          <span style={{ color: '#856404' }}>Could not refresh data. Showing cached results.</span>
          <button className="btn btn-sm" onClick={fetchCustomers} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* ── Dashboard Toolbar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', width: '450px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Filter by name, email or mobile..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', background: 'white', fontWeight: 600 }} 
            />
            {searchTerm && (
              <X size={16} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <ExportToolbar 
            onPDF={handlePrint}
            onExcel={() => exportToExcel([{
              name: 'Customer Directory',
              rows: filteredCustomers.map(c => ({
                ID: `DVS-${String(c.id).padStart(4,'0')}`,
                Name: c.name,
                Email: c.email || '—',
                Phone: c.phone || '—',
                Channel: c.channel || 'Unknown',
                Services: c.services || '—',
                [`Total Spent (${currency})`]: Number(c.totalSpent || 0)
              }))
            }], `Customer_Ledger_${new Date().toISOString().slice(0,10)}`)}
            currency={currency}
            onCurrency={(code) => { setCurrency(code); localStorage.setItem('dvs_currency', code); }}
            moduleCode="CRM"
          />

          <button 
            onClick={fetchCustomers}
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B5E20' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>

          <button 
            onClick={openCreateModal}
            style={{ height: '42px', padding: '0 20px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <UserPlus size={18} /> ADD MEMBER
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>CUSTOMER MASTER LEDGER</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>REGISTRY AUDIT · {filteredCustomers.length} RECORDS</div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div style={{ color: '#90EE90' }}>CONFIDENTIAL CRM</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1000px' }}>
            <thead>
              <tr>
                {['CUSTOMER IDENTITY', 'CONTACT CONNECT', 'SERVICES/INTERESTS', 'CHANNEL', 'LIFETIME VALUE', 'ACTIONS'].map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: (h === 'LIFETIME VALUE') ? 'right' : (h === 'ACTIONS' ? 'center' : 'left'),
                    background: 'linear-gradient(180deg, #1B5E20, #166534)',
                    borderRight: i < 5 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length > 0 ? paginatedCustomers.map((customer, idx) => (
                <tr key={customer.id} className="hover-row" style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9 transition: background 0.2s' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1B5E20, #32CD32)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem' }}>
                        {(customer.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{customer.name}</div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>ID: DVS-{String(customer.id).padStart(4, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}><Mail size={12} /> {customer.email || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600, marginTop: '2px' }}><Phone size={12} /> {customer.phone || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {customer.services ? customer.services.split(',').map((s, i) => (
                        <span key={i} style={{ fontSize: '0.58rem', fontWeight: 900, background: '#f1f5f9', color: '#1B5E20', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{s.trim()}</span>
                      )) : <span style={{ color: '#94a3b8' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '10px', border: '1px solid #fde047', textTransform: 'uppercase' }}>
                      {customer.channel || 'DIRECT'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#1B5E20' }}>{fmtAmt(customer.totalSpent || 0, currency)}</div>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Gross Contribution</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button onClick={() => openMessageCenter(customer)} title="Send Message" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#d97706', cursor: 'pointer' }}><Mail size={14} /></button>
                      <button onClick={() => generateCustomerReport(customer)} title="Detailed Report" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1B5E20', cursor: 'pointer' }}><FileText size={14} /></button>
                      <button onClick={() => { setSelectedCustomer(customer); setIsDetailsOpen(true); }} title="Profile Overview" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0369a1', cursor: 'pointer' }}><Eye size={14} /></button>
                      <button onClick={() => { setInitialContractData({ clientName: customer.name, clientEmail: customer.email, clientPhone: customer.phone, clientAddress: customer.address }); setShowContractGenerator(true); }} title="Legal Contract" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1B5E20', cursor: 'pointer' }}><Shield size={14} /></button>
                      <button onClick={() => openEditModal(customer)} title="Modify Profile" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e40af', cursor: 'pointer' }}><Edit size={14} /></button>
                      {isSuper && <button onClick={() => setDeleteConfirm(customer)} title="Delete Master Record" style={{ padding: '6px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 800 }}>
                    <div style={{ marginBottom: '10px' }}><Users size={40} style={{ opacity: 0.2 }} /></div>
                    NO CUSTOMER RECORDS FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid #eee' }}>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="btn btn-outline btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Customer Details Modal */}
      {isDetailsOpen && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '550px', width: '90%', borderRadius: '24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.8, textTransform: 'uppercase', marginBottom: '6px' }}>Customer Profile</div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>{selectedCustomer.name}</h3>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.3rem' }}>&times;</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px' }}><Mail size={14} /></div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedCustomer.email || 'N/A'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px' }}><Phone size={14} /></div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedCustomer.phone || 'N/A'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px' }}><MapPin size={14} /></div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedCustomer.address || 'N/A'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px' }}><Tag size={14} /></div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedCustomer.channel || 'Unknown'}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'white', flex: 1, overflowY: 'auto' }}>
              {isSuper && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                      <DollarSign size={12} /> Lifetime Value
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1B5E20' }}>RWF {(selectedCustomer.totalSpent || 0).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {selectedCustomer.services && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Services</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedCustomer.services.split(',').map((s, idx) => (
                      <span key={idx} style={{ background: '#1B5E20', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCustomer.notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
                  <div style={{ padding: '1rem', background: '#fcfdfc', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                    {selectedCustomer.notes}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => { setIsDetailsOpen(false); openMessageCenter(selectedCustomer); }} style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#92400e', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <MessageCircle size={14} /> MESSAGE
                </button>
                <button onClick={() => generateCustomerReport(selectedCustomer)} style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FileText size={14} /> REPORT
                </button>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsDetailsOpen(false)} style={{ background: '#1B5E20', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !isDeleting && setDeleteConfirm(null)} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="modal-content animate-fadeIn" style={{ maxWidth: '420px', borderRadius: '20px', textAlign: 'center', padding: '2.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Trash2 size={28} color="#dc2626" />
            </div>
            <h3 id="delete-modal-title" style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Delete Customer?</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Cancel</button>
              <button className="btn" style={{ background: '#dc2626', color: 'white' }} onClick={() => handleDelete(deleteConfirm)} disabled={isDeleting}>
                {isDeleting ? <><RefreshCw size={16} className="spin" /> Deleting...</> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '680px', width: '95%', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {editingCustomer ? <Edit size={22} /> : <UserPlus size={22} />}
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#f9fafcff' }}>
                  {editingCustomer ? `Update Customer #DVS-${String(editingCustomer.id).slice(-4).padStart(4, '0')}` : 'Member Registration'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }} noValidate>
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label htmlFor="name" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Full Name *</label>
                  <input 
                    ref={firstInputRef} id="name" type="text" required className={`${formErrors.name ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: formErrors.name ? '1px solid #dc2626' : '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', background: '#fcfdfc' }}
                    value={formData.name} 
                    onChange={(e) => { setFormData({...formData, name: e.target.value}); if (formErrors.name) setFormErrors({...formErrors, name: null}); }}
                    placeholder="Enter full legal name..."
                  />
                  {formErrors.name && <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.name}</span>}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label htmlFor="phone" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Primary Contact (Phone) *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={formData.countryCode} 
                      onChange={e => {
                        const c = ALL_COUNTRIES.find(x => x.code === e.target.value);
                        setFormData({...formData, countryCode: e.target.value, countryName: c?.name || 'Other'});
                      }}
                      style={{ width: '280px', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#f8fafc', fontWeight: 900 }}
                    >
                      {ALL_COUNTRIES.map(c => (
                        <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                      ))}
                    </select>
                    <input 
                      id="phone" type="tel" required className={`${formErrors.phone ? 'input-error' : ''}`}
                      style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: formErrors.phone ? '1px solid #dc2626' : '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                      value={formData.phone}
                      onChange={(e) => { setFormData({...formData, phone: e.target.value}); if (formErrors.phone) setFormErrors({...formErrors, phone: null}); }}
                      placeholder="788 000 000"
                    />
                  </div>
                  {formErrors.phone && <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.phone}</span>}
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px', fontWeight: 700 }}>
                    Selected: {formData.countryName} ({formData.countryCode})
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label htmlFor="email" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Email Address</label>
                  <input 
                    id="email" type="email" className={`${formErrors.email ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: formErrors.email ? '1px solid #dc2626' : '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                    value={formData.email} 
                    onChange={(e) => { setFormData({...formData, email: e.target.value}); if (formErrors.email) setFormErrors({...formErrors, email: null}); }}
                  />
                  {formErrors.email && <span style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="address" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Client Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input 
                      id="address" type="text" 
                      style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                      value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Kigali, Rwanda..."
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label htmlFor="channel" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Discovery Channel</label>
                  <select 
                    id="channel"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', background: '#fcfdfc', fontWeight: 600, outline: 'none' }}
                    value={formData.channel} onChange={(e) => setFormData({...formData, channel: e.target.value})}
                  >
                    <option value="Website">Global Website</option>
                    <option value="WhatsApp">Direct WhatsApp</option>
                    <option value="Instagram">Instagram Network</option>
                    <option value="Facebook">FB Marketplace</option>
                    <option value="Walk-in">Studio Walk-in</option>
                    <option value="Referral">Private Referral</option>
                    <option value="Referral Link">External Referral Link</option>
                  </select>
                </div>

                {(formData.channel === 'Referral' || formData.channel === 'Referral Link') && (
                  <div className="form-group">
                    <label htmlFor="referredBy" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Referral Source Name</label>
                    <input 
                      id="referredBy" type="text" 
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                      value={formData.referredBy} onChange={(e) => setFormData({...formData, referredBy: e.target.value})} placeholder="Who referred this client?"
                    />
                  </div>
                )}
              </div>

              <div style={{ padding: '1.25rem', background: '#fcfdfc', border: '1px solid #efefef', borderRadius: '14px', marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Requested Services (Select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {['Studio', 'Stationery & Office Supplies', 'Flower Gifts', 'Classic Fashion'].map(service => (
                    <label 
                      key={service} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', padding: '10px 14px', 
                        background: formData.services.includes(service) ? '#f0fdf4' : 'white', borderRadius: '10px', border: '1px solid', 
                        borderColor: formData.services.includes(service) ? '#1B5E20' : '#e2e8f0', transition: 'all 0.2s ease', fontWeight: formData.services.includes(service) ? 700 : 600
                      }}
                    >
                      <input 
                        type="checkbox" checked={formData.services.includes(service)} 
                        onChange={(e) => {
                          const newServices = e.target.checked ? [...formData.services, service] : formData.services.filter(s => s !== service);
                          setFormData({...formData, services: newServices});
                        }}
                        style={{ accentColor: '#1B5E20', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="notes" style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Strategic Notes</label>
                <textarea 
                  id="notes" value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={4} 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', resize: 'vertical', lineHeight: '1.6', outline: 'none' }} 
                  placeholder="Add client preferences, special requirements, or any administrative notes here..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                  style={{ background: 'white', border: '1px solid #e2e8f0', padding: '12px 24px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  CANCEL
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  style={{ background: '#1B5E20', color: 'white', border: 'none', padding: '12px 36px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? <><RefreshCw size={18} className="spin" /> {editingCustomer ? 'UPDATING...' : 'REGISTERING...'}</> : editingCustomer ? 'UPDATE CRM PROFILE' : 'AUTHORIZE MEMBER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Generator Modal Overlays (Cross-Linked) */}
      {showContractGenerator && (
        <ContractGenerator 
          initialData={initialContractData}
          onCancel={() => { setShowContractGenerator(false); setInitialContractData(null); }}
          onSave={(contract) => { setShowContractGenerator(false); setInitialContractData(null); showToast('Legal contract actively generated & pushed to vault.'); }}
        />
      )}

      {/* Operational Request Embedded Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register Operational Request</h2>
              <button className="admin-action-btn" onClick={() => setShowRequestModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowRequestModal(false); showToast('Request submitted to daily operations buffer.'); }}>
              <div className="form-group">
                <label>Item Needed *</label>
                <input type="text" required value={requestData.itemNeeded} onChange={e => setRequestData({...requestData, itemNeeded: e.target.value})} placeholder="Describe operational request..." />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={requestData.date} onChange={e => setRequestData({...requestData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select value={requestData.department} onChange={e => setRequestData({...requestData, department: e.target.value})}>
                    <option value="Studio">Studio</option>
                    <option value="Flower Gifts">Flower Gifts</option>
                    <option value="Classic Fashion">Classic Fashion</option>
                    <option value="Stationery & Office Supplies">Stationery & Office Supplies</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" value={requestData.quantity} onChange={e => setRequestData({...requestData, quantity: parseInt(e.target.value)})} min="1" />
                </div>
                <div className="form-group">
                  <label>Requester Name</label>
                  <input type="text" value={requestData.personRequested} onChange={e => setRequestData({...requestData, personRequested: e.target.value})} placeholder="Who is asking?" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Currency</label>
                <select value={requestData.currency} onChange={e => setRequestData({...requestData, currency: e.target.value})}>
                  <option value="RWF">RWF (Francs)</option>
                  <option value="USD">USD (Dollars)</option>
                  <option value="EUR">EUR (Euros)</option>
                </select>
              </div>
              
              <div className="form-group">
                  <label>Unit Price</label>
                  <input type="number" value={requestData.unitPrice} onChange={e => setRequestData({...requestData, unitPrice: parseFloat(e.target.value) || 0})} />
              </div>
              
              <div className="form-group">
                <label>Total Price (Auto-Calculated)</label>
                <input type="number" readOnly value={(requestData.unitPrice * requestData.quantity) || 0} style={{ background: '#f8fafc', color: '#1B5E20', fontWeight: 800 }} />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#F59E0B' }}>Submit Rapid Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .hover-row:hover { background: #f0f9ff !important; }
        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .admin-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .admin-modal { background: white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

export default ManageCustomers;