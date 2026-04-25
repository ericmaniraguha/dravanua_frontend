import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import {
  CreditCard, Plus, Edit, Trash2, Bell, BellRing, Search,
  CheckCircle, AlertCircle, X, RefreshCw, Pause, XCircle,
  Calendar, DollarSign, Send, Filter, Clock, AlertTriangle
} from 'lucide-react';

const CATEGORIES = ['General', 'Entertainment', 'Software', 'Cloud', 'Marketing', 'Insurance', 'Hosting', 'Utilities', 'Communication', 'Finance', 'Other'];
const BILLING_CYCLES = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
const STATUSES = ['Active', 'Paused', 'Cancelled', 'Expired'];
const CURRENCIES = ['RWF', 'USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS'];
const PAYMENT_METHODS = ['Card', 'Bank Transfer', 'MoMo', 'Cash', 'PayPal', 'Direct Debit', 'Other'];

const statusStyles = {
  Active: { bg: '#dcfce7', color: '#166534', icon: <CheckCircle size={12} /> },
  Paused: { bg: '#fef3c7', color: '#92400e', icon: <Pause size={12} /> },
  Cancelled: { bg: '#fef2f2', color: '#991b1b', icon: <XCircle size={12} /> },
  Expired: { bg: '#f1f5f9', color: '#475569', icon: <Clock size={12} /> },
};

const emptyForm = {
  name: '', category: 'General', plan: '', billingCycle: 'Monthly',
  cost: '', currency: 'RWF', paymentMethod: '', accountSource: '',
  startDate: new Date().toISOString().split('T')[0],
  nextBillingDate: '', autoRenewal: true, status: 'Active',
  notes: '', alertDaysBefore: 3
};

const ManageSubscriptions = () => {
  const { user, secureFetch } = useAuth();

  // Helper for numeric formatting
  const addCommas = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const n = num.toString().replace(/,/g, '');
    if (isNaN(n)) return '';
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const stripCommas = (str) => {
    return str.toString().replace(/,/g, '');
  };

  const handleNumericChange = (field, value) => {
    const cleanValue = stripCommas(value);
    if (cleanValue === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    // Prevent negative values
    if (cleanValue.startsWith('-')) return;

    if (/^\d*\.?\d*$/.test(cleanValue)) {
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  const [subscriptions, setSubscriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [message, setMessage] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1); // Default to last 1 year for subscriptions
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // ─── Fetch Data ─────────────────────────────────────────────────
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subscriptions?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setSubscriptions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subscriptions/alerts`);
      const data = await res.json();
      if (data.success) setAlerts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  useEffect(() => { fetchSubscriptions(); fetchAlerts(); }, [startDate, endDate]);

  // ─── Filter Logic ───────────────────────────────────────────────
  useEffect(() => {
    let result = [...subscriptions];
    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.plan?.toLowerCase().includes(q) ||
        s.paymentMethod?.toLowerCase().includes(q) ||
        s.accountSource?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [subscriptions, statusFilter, searchTerm]);

  // ─── Helpers ────────────────────────────────────────────────────
  const getDaysUntilBilling = (dateStr) => {
    if (!dateStr) return Infinity;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const billing = new Date(dateStr); billing.setHours(0, 0, 0, 0);
    return Math.ceil((billing - today) / (1000 * 60 * 60 * 24));
  };

  const formatMoney = (amount, currency) => {
    const num = Number(amount) || 0;
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency || 'RWF'}`;
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const totalMonthly = () => {
    return subscriptions.filter(s => s.status === 'Active').reduce((sum, s) => {
      const cost = Number(s.cost) || 0;
      if (s.billingCycle === 'Weekly') return sum + cost * 4.33;
      if (s.billingCycle === 'Monthly') return sum + cost;
      if (s.billingCycle === 'Quarterly') return sum + cost / 3;
      if (s.billingCycle === 'Yearly') return sum + cost / 12;
      return sum + cost;
    }, 0);
  };

  // ─── CRUD ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingItem
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subscriptions/${editingItem.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subscriptions`;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await secureFetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) 
      });
      const data = await res.json();
      if (data.success) {
        showMsg('success', editingItem ? 'Subscription updated.' : 'Subscription created.');
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ ...emptyForm });
        fetchSubscriptions();
        fetchAlerts();
      } else {
        showMsg('error', data.message || 'Operation failed.');
      }
    } catch (err) {
      showMsg('error', 'Network error.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'General',
      plan: item.plan || '',
      billingCycle: item.billingCycle || 'Monthly',
      cost: item.cost || '',
      currency: item.currency || 'RWF',
      paymentMethod: item.paymentMethod || '',
      accountSource: item.accountSource || '',
      startDate: item.startDate || '',
      nextBillingDate: item.nextBillingDate || '',
      autoRenewal: item.autoRenewal !== false,
      status: item.status || 'Active',
      notes: item.notes || '',
      alertDaysBefore: item.alertDaysBefore || 3
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently remove this subscription record?')) return;
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subscriptions/${id}`, { 
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showMsg('success', 'Subscription removed.');
        fetchSubscriptions();
        fetchAlerts();
      }
    } catch { showMsg('error', 'Delete failed.'); }
  };

  const handleSendAlert = async (sub) => {
    setSendingAlert(sub.id);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/subscriptions/send-alert/${sub.id}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) showMsg('success', data.message);
      else showMsg('error', data.message);
    } catch { showMsg('error', 'Alert send failed.'); }
    finally { setSendingAlert(null); }
  };

  // ─── Summary Cards ──────────────────────────────────────────────
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const pausedCount = subscriptions.filter(s => s.status === 'Paused').length;
  const upcomingCount = alerts.length;

  const cardStyle = (gradient) => ({
    background: gradient, borderRadius: '20px', padding: '1.5rem',
    color: 'white', position: 'relative', overflow: 'hidden', minHeight: '120px'
  });

  const cardLabel = { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: '6px' };
  const cardValue = { fontSize: '2rem', fontWeight: 900, lineHeight: 1 };
  const cardSub = { fontSize: '0.7rem', fontWeight: 600, opacity: 0.75, marginTop: '8px' };

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="admin-page" style={{ padding: '0 2rem 3rem' }}>
      <Header title="Subscription Manager" subtitle="Track, manage, and set renewal alerts for recurring services and platform subscriptions." />

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 999999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px', borderRadius: '14px',
          background: message.type === 'success' ? '#166534' : '#991b1b',
          color: 'white', fontWeight: 700, fontSize: '0.85rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.3s ease'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Summary Cards — Customer Intelligence Style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>

        <div style={{ background: 'white', borderRadius: '18px', padding: '1.25rem 1.5rem', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e8f5e9', color: '#32FC05', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Active Subscriptions</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#32FC05', lineHeight: 1 }}>{activeCount}</div>
            <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, marginTop: '4px' }}>of {subscriptions.length} total</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '18px', padding: '1.25rem 1.5rem', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Est. Monthly Cost</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0369a1', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatMoney(totalMonthly(), 'RWF')}</div>
            <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, marginTop: '4px' }}>all active combined</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '18px', padding: '1.25rem 1.5rem', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Upcoming Renewals</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: upcomingCount > 0 ? '#b45309' : '#32FC05', lineHeight: 1 }}>{upcomingCount}</div>
            <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, marginTop: '4px' }}>within next 7 days</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '18px', padding: '1.25rem 1.5rem', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Pause size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>On Hold</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#7c3aed', lineHeight: 1 }}>{pausedCount}</div>
            <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 600, marginTop: '4px' }}>paused subscriptions</div>
          </div>
        </div>

      </div>

      {/* Deadline Alerts Panel */}
      {alerts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a',
          borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}
            onClick={() => setShowAlerts(!showAlerts)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BellRing size={20} color="#b45309" />
              <span style={{ fontWeight: 900, color: '#92400e', fontSize: '0.9rem' }}>
                🔔 {alerts.length} Subscription{alerts.length > 1 ? 's' : ''} Due Soon
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309' }}>
              {showAlerts ? 'Collapse ▲' : 'Expand ▼'}
            </span>
          </div>
          {showAlerts && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.map(a => {
                const days = getDaysUntilBilling(a.nextBillingDate);
                return (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'white', padding: '12px 16px', borderRadius: '12px',
                    border: days <= 1 ? '2px solid #ef4444' : '1px solid #fde68a'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{a.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                        {a.billingCycle} • {formatMoney(a.cost, a.currency)} •
                        <span style={{ color: days <= 1 ? '#dc2626' : '#b45309', fontWeight: 800 }}>
                          {' '}{days === 0 ? 'DUE TODAY' : days < 0 ? `OVERDUE by ${Math.abs(days)}d` : `${days} day${days > 1 ? 's' : ''} left`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendAlert(a)}
                      disabled={sendingAlert === a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #32FC05, #2E7D32)',
                        color: 'white', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
                        opacity: sendingAlert === a.id ? 0.6 : 1
                      }}
                    >
                      <Send size={12} /> {sendingAlert === a.id ? 'Sending...' : 'Send Alert'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search subscriptions..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 14px 10px 38px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, width: '250px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All', ...STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '0.72rem',
                fontWeight: statusFilter === s ? 900 : 600, cursor: 'pointer',
                background: statusFilter === s ? '#32FC05' : '#f1f5f9',
                color: statusFilter === s ? 'white' : '#475569'
              }}>{s}</button>
            ))}
          </div>
          {(searchTerm || statusFilter !== 'All') && (
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <Filter size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Showing {filtered.length} of {subscriptions.length}
            </div>
          )}
        </div>
        {isSuperAdmin && (
          <button onClick={() => { setEditingItem(null); setFormData({ ...emptyForm }); setIsModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
              borderRadius: '12px', border: 'none', fontSize: '0.8rem', fontWeight: 900,
              background: 'linear-gradient(135deg, #32FC05, #2E7D32)', color: 'white', cursor: 'pointer'
            }}>
            <Plus size={16} /> New Subscription
          </button>
        )}
      </div>

      {/* Data Table — DRAVANUA STUDIO REPORT FORMAT */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>

        {/* Branded Report Header */}
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — SUBSCRIPTION LEDGER {new Date().getFullYear()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              RECURRING SERVICES &amp; PLATFORM FEES · {filtered.length} RECORD{filtered.length !== 1 ? 'S' : ''}
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
              <tr style={{ background: '#32FC05' }}>
                {[
                  { label: 'SIN',           tip: 'Subscription ID' },
                  { label: 'DATE',          tip: 'Start Date' },
                  { label: 'UNIT',          tip: 'Billing Cycle' },
                  { label: 'SERVICE',       tip: 'Service Name & Category' },
                  { label: 'QTY',           tip: 'Quantity / Seats' },
                  { label: 'PRICE',         tip: 'Unit Price' },
                  { label: 'TOTAL',         tip: 'Total Cost' },
                  { label: 'CURR',          tip: 'Currency' },
                  { label: 'TERMS',         tip: 'Auto Renewal Terms' },
                  { label: 'PAID',          tip: 'Confirmed Active' },
                  { label: 'DEBT',          tip: 'Overdue / Outstanding' },
                  { label: 'STATUS',        tip: 'Current Status' },
                  { label: 'CONTACT PER.',  tip: 'Account / Source' },
                  { label: 'PHONE',         tip: 'Payment Method' },
                  { label: 'BY',            tip: 'Registered By' },
                  { label: 'ACTIONS',       tip: 'Operations' },
                ].map(h => (
                  <th key={h.label} title={h.tip} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: 'left', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, #32FC05, #166534)'
                  }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 10px' }} /> Loading records...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={16} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 600 }}>
                  No subscriptions found. {isSuperAdmin ? 'Click "New Subscription" to register one.' : ''}
                </td></tr>
              ) : filtered.map((sub, idx) => {
                const days = getDaysUntilBilling(sub.nextBillingDate);
                const urgentStyle = days <= 3 && days >= 0 && sub.status === 'Active';
                const overdueStyle = days < 0 && sub.status === 'Active';
                const sty = statusStyles[sub.status] || statusStyles.Active;
                const rowBg = overdueStyle ? '#fff1f2' : urgentStyle ? '#fffbeb' : idx % 2 === 0 ? '#f8fffe' : 'white';
                const tdStyle = { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f8fafc', verticalAlign: 'middle' };
                const sinCode = `SUB-${String(sub.id).padStart(4, '0')}`;
                const isActive = sub.status === 'Active';

                return (
                  <tr key={sub.id} style={{ background: rowBg, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    {/* SIN */}
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.68rem', color: '#32FC05', whiteSpace: 'nowrap' }}>
                      {sinCode}
                    </td>

                    {/* DATE — start date */}
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#475569', fontWeight: 700 }}>
                      {sub.startDate || '—'}
                    </td>

                    {/* UNIT — billing cycle */}
                    <td style={tdStyle}>
                      <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.62rem' }}>{sub.billingCycle}</span>
                    </td>

                    {/* SERVICE — name + category */}
                    <td style={{ ...tdStyle, maxWidth: '180px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {urgentStyle && <BellRing size={12} color="#b45309" />}
                        {overdueStyle && <AlertTriangle size={12} color="#dc2626" />}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', display: 'inline-block' }}>{sub.name}</span>
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>{sub.category}</span>
                        {sub.plan && <span style={{ marginLeft: '4px', color: '#94a3b8' }}>{sub.plan}</span>}
                      </div>
                    </td>

                    {/* QTY — seats/quantity (default 1) */}
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800, color: '#334155' }}>1</td>

                    {/* PRICE */}
                    <td style={{ ...tdStyle, fontWeight: 800, color: '#32FC05', whiteSpace: 'nowrap' }}>
                      {Number(sub.cost).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>

                    {/* TOTAL (same as price for qty=1) */}
                    <td style={{ ...tdStyle, fontWeight: 900, color: '#0D3B0D', whiteSpace: 'nowrap', background: 'rgba(50,205,50,0.04)' }}>
                      {Number(sub.cost).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>

                    {/* CURR */}
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.68rem', color: '#475569' }}>
                      {sub.currency || 'RWF'}
                    </td>

                    {/* TERMS — auto renewal */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 800,
                        background: sub.autoRenewal ? '#dcfce7' : '#f1f5f9',
                        color: sub.autoRenewal ? '#166534' : '#64748b'
                      }}>
                        {sub.autoRenewal ? '🔄 AUTO' : '✋ MANUAL'}
                      </span>
                    </td>

                    {/* PAID — confirmed if Active */}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {isActive
                        ? <span style={{ color: '#16a34a', fontSize: '0.85rem' }}>✅</span>
                        : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                      }
                    </td>

                    {/* DEBT — overdue amount */}
                    <td style={{ ...tdStyle, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {overdueStyle
                        ? <span style={{ color: '#dc2626', fontSize: '0.68rem' }}>
                            {Number(sub.cost).toLocaleString()} {sub.currency}<br />
                            <span style={{ fontSize: '0.58rem', fontWeight: 700 }}>({Math.abs(days)}d late)</span>
                          </span>
                        : <span style={{ color: '#94a3b8' }}>—</span>
                      }
                    </td>

                    {/* STATUS */}
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: sty.bg, color: sty.color, padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
                        {sty.icon} {sub.status}
                      </span>
                      {isActive && (
                        <div style={{ fontSize: '0.57rem', fontWeight: 800, marginTop: '3px', color: overdueStyle ? '#dc2626' : urgentStyle ? '#b45309' : '#94a3b8' }}>
                          {days === 0 ? '⚡ TODAY' : days < 0 ? `🚨 ${Math.abs(days)}d LATE` : `${days}d left`}
                        </div>
                      )}
                    </td>

                    {/* CONTACT PERSON — account source */}
                    <td style={{ ...tdStyle, fontSize: '0.68rem', color: '#475569', fontWeight: 700, maxWidth: '110px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                        {sub.accountSource || '—'}
                      </div>
                    </td>

                    {/* PHONE — payment method */}
                    <td style={{ ...tdStyle, fontSize: '0.68rem', color: '#475569', fontWeight: 700 }}>
                      {sub.paymentMethod || '—'}
                    </td>

                    {/* BY — creator */}
                    <td style={{ ...tdStyle, fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>
                      {sub.AdminUser?.name
                        ? sub.AdminUser.name.split(' ')[0]
                        : 'Admin'}
                    </td>

                    {/* ACTIONS */}
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {isSuperAdmin && (
                          <>
                            <button className="admin-action-btn edit" onClick={() => handleEdit(sub)} title="Edit subscription"><Edit size={13} /></button>
                            <button className="admin-action-btn delete" onClick={() => handleDelete(sub.id)} title="Delete"><Trash2 size={13} /></button>
                          </>
                        )}
                        {isActive && (
                          <button className="admin-action-btn view" onClick={() => handleSendAlert(sub)} disabled={sendingAlert === sub.id} title="Send renewal alert email">
                            <Bell size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Report Footer Totals */}
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderTop: '2px solid #32FC05' }}>
                  <td colSpan={5} style={{ padding: '10px 12px', fontWeight: 900, fontSize: '0.72rem', color: '#32FC05', textAlign: 'right' }}>
                    TOTAL ({filtered.filter(s => s.status === 'Active').length} Active):
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 900, fontSize: '0.78rem', color: '#0D3B0D' }}>
                    {filtered.filter(s => s.status === 'Active').reduce((sum, s) => sum + (Number(s.cost) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 900, fontSize: '0.78rem', color: '#0D3B0D', background: 'rgba(50,205,50,0.08)' }}>
                    {filtered.filter(s => s.status === 'Active').reduce((sum, s) => sum + (Number(s.cost) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={9} style={{ padding: '10px 12px', fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>
                    {filtered.filter(s => s.status === 'Cancelled' || s.status === 'Expired').length} inactive ·
                    {' '}{filtered.filter(s => { const d = getDaysUntilBilling(s.nextBillingDate); return d < 0 && s.status === 'Active'; }).length} overdue
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="admin-modal" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1rem' }}>
                  {editingItem ? 'Edit Subscription' : 'Register New Subscription'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600 }}>
                  {editingItem ? 'Modify subscription details' : 'Track a recurring service or platform fee'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {/* Row 1: Name & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Subscription Name *</label>
                  <input required className="form-input" style={inputStyle} placeholder="e.g. Netflix, AWS, Adobe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select className="form-input" style={inputStyle} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Plan & Billing Cycle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Plan / Tier</label>
                  <input className="form-input" style={inputStyle} placeholder="e.g. Premium, Business, Pro" value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Billing Cycle *</label>
                  <select className="form-input" style={inputStyle} value={formData.billingCycle} onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}>
                    {BILLING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Cost & Currency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Cost / Amount *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    style={inputStyle}
                    placeholder="0.00"
                    value={addCommas(formData.cost)}
                    onChange={e => handleNumericChange('cost', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select className="form-input" style={inputStyle} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Payment Method & Account Source */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select className="form-input" style={inputStyle} value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Account / Source</label>
                  <input className="form-input" style={inputStyle} placeholder="e.g. Visa *4242, MTN MoMo" value={formData.accountSource} onChange={e => setFormData({ ...formData, accountSource: e.target.value })} />
                </div>
              </div>

              {/* Row 5: Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input required type="date" className="form-input" style={inputStyle} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Next Billing Date *</label>
                  <input required type="date" className="form-input" style={inputStyle} value={formData.nextBillingDate} onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value })} />
                </div>
              </div>

              {/* Row 6: Auto-Renewal, Status, Alert Days */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Auto Renewal</label>
                  <select className="form-input" style={inputStyle} value={formData.autoRenewal ? 'Yes' : 'No'}
                    onChange={e => setFormData({ ...formData, autoRenewal: e.target.value === 'Yes' })}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select className="form-input" style={inputStyle} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Alert (days before)</label>
                  <input type="number" min="0" max="30" className="form-input" style={inputStyle} value={formData.alertDaysBefore} onChange={e => setFormData({ ...formData, alertDaysBefore: parseInt(e.target.value) || 3 })} />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Notes</label>
                <textarea className="form-input" style={{ ...inputStyle, resize: 'none' }} rows="2" placeholder="Additional remarks..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsModalOpen(false); setEditingItem(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 900 }}>
                  {editingItem ? 'Save Changes' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Shared micro-styles ─────────────────────────────────────────
const labelStyle = { fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', display: 'block' };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#fdfdfd' };

export default ManageSubscriptions;
