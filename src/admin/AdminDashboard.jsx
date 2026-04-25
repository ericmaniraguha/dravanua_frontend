import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fmtAmt } from '../utils/exportUtils';
import { generateReport } from '../utils/generateReport';
import ExportToolbar from './components/ExportToolbar';
import {
  ShoppingBag, FileText, Mail, Eye,
  Activity, Users, Shield, Plus, Settings, Download,
  RefreshCw, Clock, DollarSign, Wallet, Target, Calendar,
  Check, MapPin, X, Search, EyeOff, Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, secureFetch } = useAuth();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(() => localStorage.getItem('dvs_currency') || 'RWF');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);

  // Data
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0, totalBookings: 0, totalCustomers: 0, pendingMsgs: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);


  const isSuper = user?.role === 'super_admin' || user?.assignedService === 'all';
  const businessName = isSuper ? 'DRAVANUA HUB' : `DRAVANUA ${user?.assignedService?.toUpperCase() || 'STUDIO'}`;

  // ─── Time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const h = currentTime.getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  // ─── Fetchers ─────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const periodParam = isSuper ? '30d' : '1d';
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/analytics?period=${periodParam}&currency=${currencyFilter}`);
      const data = await resp.json();
      if (data?.success) {
        const { summary } = data.data;
        const msgResp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/contact`);
        const msgData = await msgResp.json();
        const pendingMsgs = msgData.success ? msgData.data.filter(m => m.status === 'pending').length : 0;
        setStats({
          totalRevenue: Number(summary.totalRevenue) || 0,
          totalBookings: Number(summary.totalBookings) || 0,
          totalCustomers: Number(summary.totalCustomers) || 0,
          pendingMsgs
        });
      }
    } catch (err) { console.error('Dashboard stats fetch failed:', err); }
  };

  const fetchRecentReports = async () => {
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/daily-reports?period=30d&currency=${currencyFilter}`);
      const data = await resp.json();
      if (data?.success) setRecentReports(data.data.slice(0, 8));
    } catch (err) { console.error(err); }
  };

  const fetchRecentBookings = async () => {
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/bookings?currency=${currencyFilter}`);
      const data = await resp.json();
      if (data?.success) setRecentBookings(data.data.slice(0, 8));
    } catch (err) { console.error(err); }
  };

  const fetchRecentMessages = async () => {
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/messages`);
      const data = await resp.json();
      if (data?.success) setRecentMessages(data.data.slice(0, 5));
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const resp = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/users');
      const data = await resp.json();
      if (data?.success) setAllUsers(data.data);
    } catch (err) { console.error(err); }
    finally { setLoadingUsers(false); }
  };


  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(), fetchRecentReports(), fetchRecentBookings(), fetchRecentMessages(),
        isSuper ? fetchUsers() : Promise.resolve()
      ]);
      setLoading(false);
    };
    init();
  }, [currencyFilter, isSuper]);

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([fetchStats(), fetchRecentReports(), fetchRecentBookings(), fetchRecentMessages(), isSuper ? fetchUsers() : Promise.resolve()])
      .finally(() => setLoading(false));
  };


  // ─── Derived ──────────────────────────────────────────────────────────
  const reportTotals = useMemo(() => ({
    qty: recentReports.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    revenue: recentReports.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0),
    paid: recentReports.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0),
    debt: recentReports.reduce((s, r) => s + (Number(r.debt) || 0), 0)
  }), [recentReports]);

  const displayCurrency = currencyFilter === 'all' ? 'RWF' : currencyFilter;

  // ─── Quick Actions ────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Record Sale', icon: <Plus size={16} />, color: '#32FC05', path: '/admin/finance' },
    { label: 'New Booking', icon: <ShoppingBag size={16} />, color: '#059669', path: '/admin/bookings' },
    { label: 'Messages', icon: <Mail size={16} />, color: '#d97706', path: '/admin/messages-admin' },
    ...(isSuper ? [
      { label: 'Attendance Audit', icon: <Clock size={16} />, color: '#7B1FA2', path: '/admin/attendance' },
      { label: 'Staff Registry', icon: <Users size={16} />, color: '#0891b2', path: '/admin/users' },
      { label: 'Operations', icon: <FileText size={16} />, color: '#64748b', path: '/admin/operations' },
    ] : [])
  ];

  // ─── Export ───────────────────────────────────────────────────────────
  const handlePDF = () => {
    const bodyHtml = `
      <div class="section-title">Executive Dashboard Summary</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${fmtAmt(stats.totalRevenue, displayCurrency)}</span><span class="metric-lbl">TOTAL REVENUE</span></div>
        <div class="metric-card"><span class="metric-val">${stats.totalBookings.toLocaleString()}</span><span class="metric-lbl">ACTIVE BOOKINGS</span></div>
        <div class="metric-card"><span class="metric-val">${stats.totalCustomers.toLocaleString()}</span><span class="metric-lbl">CLIENT DATABASE</span></div>
        <div class="metric-card"><span class="metric-val">${stats.pendingMsgs}</span><span class="metric-lbl">PENDING INQUIRIES</span></div>
      </div>
      <div class="section-title">Recent Revenue Activity</div>
      <table>
        <thead><tr><th>SERVICE</th><th>DATE</th><th style="text-align:right">AMOUNT</th><th>STATUS</th></tr></thead>
        <tbody>
          ${recentReports.map(r => `
            <tr>
              <td><strong>${r.service}</strong></td>
              <td>${r.date}</td>
              <td style="text-align:right;font-weight:900;color:#32FC05">${fmtAmt(r.totalPrice || 0, currency)}</td>
              <td><span class="badge badge-green">Recorded</span></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
    generateReport({ title: 'Administrative Dashboard Report', moduleCode: 'ADM', bodyHtml });
  };

  // ─── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#32FC05' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Initializing dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="admin-page animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      <Header
        title={`${getGreeting()}, ${user?.name || 'Administrator'}`}
        subtitle={isSuper ? `Command Center • ${businessName}` : `Staff Workspace • ${businessName}`}
      />

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #32FC05, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>TOTAL REVENUE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
              {showBalances ? fmtAmt(stats.totalRevenue, displayCurrency) : '••••••'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>ACTIVE BOOKINGS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalBookings.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>CLIENT DATABASE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalCustomers.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>PENDING INQUIRIES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFCC80' }}>{stats.pendingMsgs}</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Left – quick actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>Actions:</span>
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={a.onClick || (() => navigate(a.path))}
                style={{
                  height: '38px', padding: '0 14px', borderRadius: '10px', border: '1px solid #e2e8f0',
                  background: 'white', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: '6px', color: a.color, whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {/* Right – filters + export + refresh */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={currencyFilter}
              onChange={e => setCurrencyFilter(e.target.value)}
              style={{ height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0 12px', fontSize: '0.75rem', fontWeight: 900, outline: 'none', cursor: 'pointer', background: 'white' }}
            >
              <option value="all">ALL CURR</option>
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </select>

            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#32FC05', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {showBalances ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            <ExportToolbar
              onPDF={handlePDF}
              emailSubject="DRAVANUA HUB — Executive Dashboard Report"
              emailHtml={() => `<div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto">
                <div style="background:linear-gradient(135deg,#32FC05,#2E7D32);padding:20px;border-radius:12px;color:white;margin-bottom:16px">
                  <h2 style="margin:0">DRAVANUA HUB — Dashboard Report</h2>
                  <p style="margin:6px 0 0;opacity:.8">Generated: ${new Date().toLocaleString()}</p>
                </div>
                <table style="width:100%;border-collapse:collapse">
                  <tr style="background:#f1f5f9"><td style="padding:12px;font-weight:800">Revenue</td><td style="padding:12px;font-weight:900;color:#32FC05">${fmtAmt(stats.totalRevenue, displayCurrency)}</td></tr>
                  <tr><td style="padding:12px;font-weight:800">Bookings</td><td style="padding:12px">${stats.totalBookings}</td></tr>
                  <tr style="background:#f1f5f9"><td style="padding:12px;font-weight:800">Clients</td><td style="padding:12px">${stats.totalCustomers}</td></tr>
                  <tr><td style="padding:12px;font-weight:800">Pending</td><td style="padding:12px;color:#854d0e">${stats.pendingMsgs}</td></tr>
                </table>
                <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px">DRAVANUA HUB — Confidential</p>
              </div>`}
              moduleCode="ADM"
            />

            <button
              onClick={handleRefresh}
              style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#32FC05' }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Revenue Audit Table ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

        {/* Revenue table */}
        {isSuper && (
          <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>REVENUE AUDIT</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>LAST 30 DAYS · {recentReports.length} RECORDS</div>
              </div>
              <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
                <div style={{ color: '#32FC05' }}>CONFIDENTIAL</div>
              </div>
            </div>

            {recentReports.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                <FileText size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No reports recorded yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '420px' }}>
                  <thead>
                    <tr>
                      {['SERVICE', 'DATE', 'AMOUNT'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          textAlign: h === 'AMOUNT' ? 'right' : 'left',
                          background: 'linear-gradient(180deg, #32FC05, #068637ff)',
                          borderRight: '1px solid rgba(255,255,255,0.1)'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcfb' }} className="hover-row">
                        <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: '0.78rem', color: '#1e293b' }}>{r.service}</td>
                        <td style={{ padding: '10px 14px', fontSize: '0.72rem', color: '#94a3b8' }}>{r.date}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#32FC05', fontSize: '0.8rem' }}>
                          {showBalances ? fmtAmt(Number(r.totalPrice) || 0, currency) : '••••'}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: '#f0fdf4', borderTop: '2px solid #32FC05' }}>
                      <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 900, fontSize: '0.72rem', color: '#32FC05', textAlign: 'right' }}>TOTAL:</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: '0.85rem', color: '#32FC05' }}>
                        {showBalances ? fmtAmt(reportTotals.revenue, currency) : '••••'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings table */}
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>RECENT BOOKINGS</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>CLIENT ACTIVITY · {recentBookings.length} RECORDS</div>
            </div>
            <button
              onClick={() => navigate('/admin/bookings')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Eye size={12} /> VIEW ALL
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
              <ShoppingBag size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No bookings recorded.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '420px' }}>
                <thead>
                  <tr>
                    {['CLIENT', 'SERVICE / DATE', 'AMOUNT', 'STATUS'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        textAlign: h === 'AMOUNT' ? 'right' : 'left',
                        background: 'linear-gradient(180deg, #32FC05, #068637ff)',
                        borderRight: '1px solid rgba(255,255,255,0.1)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcfb' }} className="hover-row">
                      <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: '0.78rem', color: '#1e293b' }}>{b.customerName || 'Client'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>{b.serviceType}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(b.bookingDate).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#32FC05', fontSize: '0.8rem' }}>
                        {showBalances ? fmtAmt(Number(b.totalAmount) || 0, currency) : '••••'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '50px', fontSize: '0.62rem', fontWeight: 900,
                          background: b.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: b.status === 'completed' ? '#068637ff' : '#92400e'
                        }}>
                          {b.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Grid: Staff + Messages ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem' }}>

        {/* Staff Hierarchy */}
        {isSuper && (
          <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem' }}>STAFF HIERARCHY</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>TEAM OVERVIEW · {allUsers.length} MEMBERS</div>
              </div>
              <button
                onClick={() => navigate('/admin/users')}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Settings size={12} /> MANAGE
              </button>
            </div>

            {loadingUsers ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <RefreshCw size={24} className="spin" style={{ color: '#32FC05' }} />
              </div>
            ) : allUsers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                <Users size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No staff members registered.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                  <thead>
                    <tr>
                      {['MEMBER', 'ROLE', 'STATUS', 'LOG'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                          textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'LOG' ? 'center' : 'left',
                          background: 'linear-gradient(180deg, #32FC05, #068637ff)',
                          borderRight: '1px solid rgba(255,255,255,0.1)'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u, i) => (
                      <tr key={u.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcfb' }} className="hover-row">
                        <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: '0.78rem', color: '#1e293b' }}>{u.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '50px', fontSize: '0.62rem', fontWeight: 900,
                            background: (u.role === 'super_admin' || u.role === 'service_admin') ? '#dc3545' : '#f1f5f9',
                            color: (u.role === 'super_admin' || u.role === 'service_admin') ? 'white' : '#64748b'
                          }}>
                            {u.role?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '50px', fontSize: '0.62rem', fontWeight: 900,
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: u.isActive ? '#dcfce7' : '#fee2e2',
                            color: u.isActive ? '#068637ff' : '#991b1b'
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.isActive ? '#16a34a' : '#dc2626' }} />
                            {u.isActive ? 'ACTIVE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button 
                            onClick={() => navigate('/admin/attendance')}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#32FC05', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Open Attendance"
                          >
                            <Clock size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pending Messages */}
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem' }}>PENDING INQUIRIES</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>CLIENT MESSAGES · {recentMessages.length} AWAITING</div>
            </div>
            <button
              onClick={() => navigate('/admin/messages-admin')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Mail size={12} /> INBOX
            </button>
          </div>

          {recentMessages.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
              <Mail size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>All messages responded to.</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentMessages.map((m, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcfb' }} className="hover-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e293b' }}>{m.senderName || 'Guest'}</div>
                    {m.status === 'pending' && (
                      <span style={{ padding: '3px 8px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 900, background: '#fef3c7', color: '#92400e' }}>PENDING</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '3px' }}>{m.subject}</div>
                  <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hover-row:hover { background: #f8fafc !important; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;