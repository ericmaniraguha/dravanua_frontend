import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import {
  Bell, BellRing, Plus, Edit, Trash2, Send, Search,
  CheckCircle, Clock, XCircle, AlertTriangle, X,
  RefreshCw, Filter, Calendar, Megaphone, Users,
  Flag, MessageSquare, ChevronDown, ChevronUp, Info,
  Check, Loader
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────
const CATEGORIES = ['Payment', 'Meeting', 'Subscription', 'Project', 'Work Coordination', 'Follow-up', 'Compliance', 'HR', 'Finance', 'General', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES   = ['Pending', 'Sent', 'Completed', 'Cancelled'];
const DEPARTMENTS = ['All Departments', 'Studio', 'Flower Gifts', 'Classic Fashion', 'Stationery & Office Supplies', 'Management'];

const PRIORITY_STYLES = {
  Low:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
  Medium: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#3b82f6' },
  High:   { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
  Urgent: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444' },
};

const STATUS_STYLES = {
  Pending:   { bg: '#eff6ff', color: '#2563eb', icon: <Clock size={12} /> },
  Sent:      { bg: '#f0fdf4', color: '#16a34a', icon: <CheckCircle size={12} /> },
  Completed: { bg: '#dcfce7', color: '#166534', icon: <Check size={12} /> },
  Cancelled: { bg: '#f1f5f9', color: '#475569', icon: <XCircle size={12} /> },
};

const emptyForm = {
  title: '', message: '', category: 'General', priority: 'Medium',
  department: '', sendToAll: false, recipient: '',
  reminderDate: new Date().toISOString().split('T')[0],
  reminderTime: '', dueDate: '', status: 'Pending', notes: ''
};

// ── Main Component ───────────────────────────────────────────────────
const ManageReminders = () => {
  const { user, secureFetch } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [reminders,   setReminders]   = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData,    setFormData]    = useState({ ...emptyForm });
  const [message,     setMessage]     = useState(null);
  const [sending,     setSending]     = useState(null);
  const [expandedId,  setExpandedId]  = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  // ── Fetch ───────────────────────────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders`);
      const data = await res.json();
      if (data.success) setReminders(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  // ── Filter ──────────────────────────────────────────────────────────
  useEffect(() => {
    let r = [...reminders];
    if (statusFilter   !== 'All') r = r.filter(x => x.status   === statusFilter);
    if (priorityFilter !== 'All') r = r.filter(x => x.priority === priorityFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      r = r.filter(x =>
        x.title?.toLowerCase().includes(q)    ||
        x.message?.toLowerCase().includes(q)  ||
        x.category?.toLowerCase().includes(q) ||
        x.recipient?.toLowerCase().includes(q)||
        x.department?.toLowerCase().includes(q)
      );
    }
    setFiltered(r);
  }, [reminders, statusFilter, priorityFilter, searchTerm]);

  // ── Helpers ─────────────────────────────────────────────────────────
  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d     = new Date(dateStr); d.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / 86400000);
  };

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── Stats ────────────────────────────────────────────────────────────
  const pendingCount   = reminders.filter(r => r.status === 'Pending').length;
  const urgentCount    = reminders.filter(r => r.priority === 'Urgent' && r.status === 'Pending').length;
  const dueTodayCount  = reminders.filter(r => { const d = getDaysUntil(r.reminderDate); return d !== null && d <= 0 && r.status === 'Pending'; }).length;
  const completedCount = reminders.filter(r => r.status === 'Completed').length;

  // ── CRUD ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url    = editingItem ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders/${editingItem.id}` : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders`;
    const method = editingItem ? 'PUT' : 'POST';
    try {
      const res  = await secureFetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) 
      });
      const data = await res.json();
      if (data.success) {
        showMsg('success', editingItem ? 'Reminder updated.' : 'Reminder created.');
        setIsModalOpen(false); setEditingItem(null); setFormData({ ...emptyForm });
        fetchReminders();
      } else { showMsg('error', data.message || 'Operation failed.'); }
    } catch { showMsg('error', 'Network error.'); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '', message: item.message || '',
      category: item.category || 'General', priority: item.priority || 'Medium',
      department: item.department || '', sendToAll: !!item.sendToAll,
      recipient: item.recipient || '',
      reminderDate: item.reminderDate || '',
      reminderTime: item.reminderTime || '',
      dueDate: item.dueDate || '',
      status: item.status || 'Pending', notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this reminder permanently?')) return;
    try {
      const res  = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders/${id}`, { 
        method: 'DELETE' 
      });
      const data = await res.json();
      if (data.success) { showMsg('success', 'Reminder removed.'); fetchReminders(); }
    } catch { showMsg('error', 'Delete failed.'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res  = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders/${id}/status`, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) { showMsg('success', data.message); fetchReminders(); }
    } catch { showMsg('error', 'Failed to update status.'); }
  };

  const handleSendEmail = async (reminder) => {
    setSending(reminder.id);
    try {
      const res  = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders/send-email/${reminder.id}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      });
      const data = await res.json();
      if (data.success) { showMsg('success', data.message); fetchReminders(); }
      else { showMsg('error', data.message); }
    } catch { showMsg('error', 'Send failed.'); }
    finally { setSending(null); setRecipientEmail(''); }
  };

  // ── Field style helpers ──────────────────────────────────────────────
  const labelSt = { fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' };
  const inputSt = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 600, outline: 'none', background: '#fdfdfd', boxSizing: 'border-box' };

  // ── RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="admin-page" style={{ padding: '0 2rem 3rem' }}>
      <Header title="Reminders & Schedules" subtitle="Track, broadcast, and manage reminders, plans, and follow-ups across departments." />

      {/* Toast */}
      {message && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 999999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 20px', borderRadius: '14px',
          background: message.type === 'success' ? '#166534' : '#991b1b',
          color: 'white', fontWeight: 700, fontSize: '0.85rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.3s ease'
        }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Pending',        value: pendingCount,   icon: <Clock size={22} />,       bg: '#e0f2fe', color: '#0369a1' },
          { label: 'Due / Overdue',  value: dueTodayCount,  icon: <BellRing size={22} />,    bg: '#fef2f2', color: '#dc2626' },
          { label: 'Urgent',         value: urgentCount,    icon: <Flag size={22} />,         bg: '#fffbeb', color: '#b45309' },
          { label: 'Completed',      value: completedCount, icon: <CheckCircle size={22} />, bg: '#dcfce7', color: '#166534' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: '18px', padding: '1.25rem 1.5rem', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: 600, marginTop: '4px' }}>of {reminders.length} total</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search reminders..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '9px 14px 9px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, width: '220px', outline: 'none' }} />
          </div>
          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {['All', ...STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '7px 13px', borderRadius: '9px', border: 'none', fontSize: '0.7rem',
                fontWeight: statusFilter === s ? 900 : 600, cursor: 'pointer',
                background: statusFilter === s ? '#1B5E20' : '#f1f5f9',
                color: statusFilter === s ? 'white' : '#475569'
              }}>{s}</button>
            ))}
          </div>
          {/* Priority filter */}
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: '#475569', outline: 'none', background: 'white' }}>
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(searchTerm || statusFilter !== 'All' || priorityFilter !== 'All') && (
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, padding: '6px 10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <Filter size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              {filtered.length} of {reminders.length}
            </span>
          )}
        </div>
        <button onClick={() => { setEditingItem(null); setFormData({ ...emptyForm }); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', fontSize: '0.8rem', fontWeight: 900, background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', cursor: 'pointer' }}>
          <Plus size={16} /> New Reminder
        </button>
      </div>

      {/* Main Ledger Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {/* Report Header */}
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — REMINDER & SCHEDULE LEDGER {new Date().getFullYear()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              REMINDERS · SCHEDULES · PLANS · FOLLOW-UPS &nbsp;·&nbsp; {filtered.length} RECORD{filtered.length !== 1 ? 'S' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div>Generated: {new Date().toLocaleDateString('en-GB')}</div>
            <div style={{ color: '#90EE90', marginTop: '3px' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1150px' }}>
            <thead>
              <tr>
                {[
                  { l: 'ID',          t: 'Unique Reminder ID' },
                  { l: 'TITLE',       t: 'Short subject' },
                  { l: 'CATEGORY',    t: 'Payment / Meeting / etc.' },
                  { l: 'PRIORITY',    t: 'Urgency level' },
                  { l: 'DEPARTMENT',  t: 'Target department' },
                  { l: 'BROADCAST',   t: 'Send to all departments' },
                  { l: 'RECIPIENT',   t: 'Individual or team' },
                  { l: 'REM. DATE',   t: 'When to trigger reminder' },
                  { l: 'DUE DATE',    t: 'Action completion deadline' },
                  { l: 'STATUS',      t: 'Current state' },
                  { l: 'CREATED BY',  t: 'Who created this reminder' },
                  { l: 'ACTIONS',     t: 'Operations' },
                ].map(h => (
                  <th key={h.l} title={h.t} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900, fontSize: '0.6rem',
                    textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
                    whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.08)',
                    background: 'linear-gradient(180deg, #1B5E20, #166534)'
                  }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <RefreshCw size={22} className="spin-animation" style={{ margin: '0 auto 10px', display: 'block' }} /> Loading reminders...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8', fontWeight: 600 }}>
                  <Bell size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.2 }} />
                  No reminders found. Click &quot;New Reminder&quot; to create one.
                </td></tr>
              ) : filtered.map((r, idx) => {
                const pSty  = PRIORITY_STYLES[r.priority] || PRIORITY_STYLES.Medium;
                const sSty  = STATUS_STYLES[r.status]    || STATUS_STYLES.Pending;
                const dRem  = getDaysUntil(r.reminderDate);
                const dDue  = getDaysUntil(r.dueDate);
                const isUrgent  = dRem !== null && dRem <= 0 && r.status === 'Pending';
                const isWarning = dRem !== null && dRem <= 2 && dRem > 0 && r.status === 'Pending';
                const rowBg = isUrgent ? '#fff1f2' : isWarning ? '#fffbeb' : idx % 2 === 0 ? '#f8fffe' : 'white';
                const tdSt  = { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', borderRight: '1px solid #f8fafc' };

                return (
                  <React.Fragment key={r.id}>
                    <tr style={{ background: rowBg, transition: 'background 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}
                    >
                      {/* ID */}
                      <td style={{ ...tdSt, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.65rem', color: '#1B5E20', whiteSpace: 'nowrap' }}>
                        REM-{String(r.id).padStart(4, '0')}
                      </td>

                      {/* Title + preview toggle */}
                      <td style={{ ...tdSt, maxWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isUrgent  && <BellRing size={12} color="#dc2626" />}
                          {isWarning && <AlertTriangle size={12} color="#b45309" />}
                          <span style={{ fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', display: 'inline-block' }}>
                            {r.title}
                          </span>
                          <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0 }}>
                            {expandedId === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={tdSt}>
                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.62rem', whiteSpace: 'nowrap' }}>{r.category}</span>
                      </td>

                      {/* Priority */}
                      <td style={tdSt}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: pSty.bg, color: pSty.color, border: `1px solid ${pSty.border}`, padding: '3px 9px', borderRadius: '6px', fontWeight: 900, fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pSty.dot, display: 'inline-block' }}></span>
                          {r.priority}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ ...tdSt, fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>
                        {r.sendToAll ? <span style={{ color: '#1B5E20', fontWeight: 800 }}>All Depts.</span> : (r.department || '—')}
                      </td>

                      {/* Broadcast */}
                      <td style={{ ...tdSt, textAlign: 'center' }}>
                        {r.sendToAll
                          ? <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>📢</span>
                          : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>

                      {/* Recipient */}
                      <td style={{ ...tdSt, fontSize: '0.7rem', color: '#475569', fontWeight: 700, maxWidth: '110px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{r.recipient || '—'}</div>
                      </td>

                      {/* Reminder Date */}
                      <td style={{ ...tdSt, whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, color: isUrgent ? '#dc2626' : isWarning ? '#b45309' : '#334155', fontSize: '0.72rem' }}>{fmt(r.reminderDate)}</div>
                        {r.reminderTime && <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>{r.reminderTime}</div>}
                        {r.status === 'Pending' && dRem !== null && (
                          <div style={{ fontSize: '0.58rem', fontWeight: 900, color: isUrgent ? '#dc2626' : isWarning ? '#b45309' : '#64748b', marginTop: '2px' }}>
                            {dRem < 0 ? `🚨 ${Math.abs(dRem)}d OVERDUE` : dRem === 0 ? '⚡ TODAY' : `${dRem}d left`}
                          </div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td style={{ ...tdSt, whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                        {r.dueDate ? (
                          <>
                            <div style={{ fontWeight: 700, color: dDue !== null && dDue < 0 ? '#dc2626' : '#334155' }}>{fmt(r.dueDate)}</div>
                            {dDue !== null && <div style={{ fontSize: '0.6rem', color: dDue < 0 ? '#dc2626' : '#94a3b8', fontWeight: 700 }}>
                              {dDue < 0 ? `${Math.abs(dDue)}d late` : dDue === 0 ? 'Due today' : `${dDue}d left`}
                            </div>}
                          </>
                        ) : '—'}
                      </td>

                      {/* Status */}
                      <td style={tdSt}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: sSty.bg, color: sSty.color, padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
                          {sSty.icon} {r.status}
                        </span>
                      </td>

                      {/* Created By */}
                      <td style={{ ...tdSt, fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>
                        {r.createdBy || r.AdminUser?.name?.split(' ')[0] || 'Admin'}
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdSt }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {/* Send email */}
                          <button className="admin-action-btn view"
                            onClick={() => handleSendEmail(r)}
                            disabled={sending === r.id}
                            title="Send reminder email"
                          >
                            {sending === r.id ? <Loader size={12} className="spin-animation" /> : <Send size={12} />}
                          </button>
                          {/* Mark complete */}
                          {r.status === 'Pending' || r.status === 'Sent' ? (
                            <button className="admin-action-btn" title="Mark Completed"
                              onClick={() => handleStatusChange(r.id, 'Completed')}
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Check size={12} />
                            </button>
                          ) : null}
                          {/* Mark cancelled */}
                          {r.status !== 'Cancelled' && r.status !== 'Completed' && (
                            <button className="admin-action-btn" title="Cancel"
                              onClick={() => handleStatusChange(r.id, 'Cancelled')}
                              style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <XCircle size={12} />
                            </button>
                          )}
                          <button className="admin-action-btn edit" onClick={() => handleEdit(r)} title="Edit"><Edit size={12} /></button>
                          {isSuperAdmin && <button className="admin-action-btn delete" onClick={() => handleDelete(r.id)} title="Delete"><Trash2 size={12} /></button>}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable message row */}
                    {expandedId === r.id && (
                      <tr style={{ background: '#f8fffe' }}>
                        <td colSpan={12} style={{ padding: '12px 20px 16px', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>📝 Message</div>
                              <div style={{ background: 'white', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155', lineHeight: 1.7, fontWeight: 500 }}>{r.message}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>📎 Notes &amp; Follow-up</div>
                              <div style={{ background: '#fffbeb', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '0.78rem', color: '#78350f', lineHeight: 1.7 }}>
                                {r.notes || <span style={{ color: '#cbd5e1' }}>No additional notes.</span>}
                              </div>
                              {/* Quick email input */}
                              {!r.sendToAll && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                  <input type="email" placeholder="Override email to send to…" value={recipientEmail}
                                    onChange={e => setRecipientEmail(e.target.value)}
                                    style={{ flex: 1, padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', outline: 'none' }} />
                                  <button onClick={() => handleSendEmail(r)} disabled={sending === r.id}
                                    style={{ padding: '7px 14px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Send size={12} /> {sending === r.id ? 'Sending…' : 'Send'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderTop: '2px solid #1B5E20' }}>
                  <td colSpan={9} style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.7rem', color: '#1B5E20' }}>
                    TOTALS: {pendingCount} pending · {urgentCount} urgent · {dueTodayCount} due today · {completedCount} completed
                  </td>
                  <td colSpan={3} style={{ padding: '10px 12px', fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textAlign: 'right' }}>
                    {filtered.filter(r => r.sendToAll).length} broadcast reminders
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setIsModalOpen(false); setEditingItem(null); } }}>
          <div className="admin-modal" style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1rem' }}>
                  {editingItem ? 'Edit Reminder' : 'Create New Reminder'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem' }}>
                  {editingItem ? 'Update reminder details below' : 'Fill in the schedule / reminder details'}
                </p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

              {/* Title */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelSt}>Title *</label>
                <input required style={inputSt} placeholder="e.g. Job Start Coordination" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelSt}>Message *</label>
                <textarea required style={{ ...inputSt, resize: 'vertical', minHeight: '90px' }} rows={3}
                  placeholder="Tomorrow we should communicate on how we will start the job…"
                  value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
              </div>

              {/* Category & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelSt}>Category</label>
                  <select style={inputSt} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Priority</label>
                  <select style={inputSt} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Send To All toggle */}
              <div style={{ marginBottom: '1.25rem', padding: '14px 16px', background: formData.sendToAll ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: `1px solid ${formData.sendToAll ? '#dcfce7' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e293b' }}>📢 Send to All Departments</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Broadcast this reminder to every department's inbox</div>
                </div>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={formData.sendToAll} onChange={e => setFormData({ ...formData, sendToAll: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <span style={{ fontWeight: 800, color: formData.sendToAll ? '#1B5E20' : '#94a3b8', fontSize: '0.78rem' }}>{formData.sendToAll ? 'YES' : 'NO'}</span>
                </label>
              </div>

              {/* Department & Recipient */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem', opacity: formData.sendToAll ? 0.5 : 1 }}>
                <div>
                  <label style={labelSt}>Department</label>
                  <select style={inputSt} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} disabled={formData.sendToAll}>
                    <option value="">— Select —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Recipient</label>
                  <input style={inputSt} placeholder="Individual name or team" value={formData.recipient} onChange={e => setFormData({ ...formData, recipient: e.target.value })} disabled={formData.sendToAll} />
                </div>
              </div>

              {/* Dates & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelSt}>Reminder Date *</label>
                  <input required type="date" style={inputSt} value={formData.reminderDate} onChange={e => setFormData({ ...formData, reminderDate: e.target.value })} />
                </div>
                <div>
                  <label style={labelSt}>Reminder Time</label>
                  <input type="time" style={inputSt} value={formData.reminderTime} onChange={e => setFormData({ ...formData, reminderTime: e.target.value })} />
                </div>
                <div>
                  <label style={labelSt}>Due Date</label>
                  <input type="date" style={inputSt} value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelSt}>Status</label>
                <select style={{ ...inputSt, maxWidth: '220px' }} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelSt}>Notes / Follow-up</label>
                <textarea style={{ ...inputSt, resize: 'none' }} rows={2} placeholder="Additional comments, follow-up information…" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsModalOpen(false); setEditingItem(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 900 }}>
                  {editingItem ? 'Save Changes' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageReminders;
