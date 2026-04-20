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
  const [officeLocations, setOfficeLocations] = useState([]);

  // GPS Modal
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [officeLocation, setOfficeLocation] = useState({
    office_name: 'DRAVANUA STUDIO', latitude: -1.9441, longitude: 30.0619,
    allowed_radius: 100, address: '', city: '', country: ''
  });
  const [savingGps, setSavingGps] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);

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

  const fetchOfficeLocation = async () => {
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/office-location`);
      const data = await resp.json();
      if (data?.success) setOfficeLocation(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchOfficeLocations = async () => {
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/office-locations`);
      const data = await resp.json();
      if (data?.success) setOfficeLocations(data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(), fetchRecentReports(), fetchRecentBookings(), fetchRecentMessages(),
        isSuper ? fetchUsers() : Promise.resolve(),
        isSuper ? fetchOfficeLocation() : Promise.resolve(),
        isSuper ? fetchOfficeLocations() : Promise.resolve()
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

  // ─── GPS ──────────────────────────────────────────────────────────────
  const captureCurrentGPS = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser.'); return; }
    setCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setOfficeLocation(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setCapturingGps(false); },
      (err) => { setCapturingGps(false); alert(`Failed to capture GPS: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleUpdateOfficeLocation = async (e) => {
    e.preventDefault();
    setSavingGps(true);
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/office-location`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officeLocation)
      });
      if (resp.ok) { setGpsModalOpen(false); fetchOfficeLocation(); }
    } catch (err) { alert('Failed to update GPS location'); console.error(err); }
    finally { setSavingGps(false); }
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
    { label: 'Record Sale', icon: <Plus size={16} />, color: '#1B5E20', path: '/admin/finance' },
    { label: 'New Booking', icon: <ShoppingBag size={16} />, color: '#059669', path: '/admin/bookings' },
    { label: 'Messages', icon: <Mail size={16} />, color: '#d97706', path: '/admin/messages-admin' },
    ...(isSuper ? [
      { label: 'GPS Config', icon: <MapPin size={16} />, color: '#7B1FA2', onClick: () => setGpsModalOpen(true) },
      { label: 'Staff', icon: <Users size={16} />, color: '#0891b2', path: '/admin/users' },
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
              <td style="text-align:right;font-weight:900;color:#1B5E20">${fmtAmt(r.totalPrice || 0, currency)}</td>
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
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#1B5E20' }} />
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
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
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
              style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {showBalances ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            <ExportToolbar
              onPDF={handlePDF}
              emailSubject="DRAVANUA HUB — Executive Dashboard Report"
              emailHtml={() => `<div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto">
                <div style="background:linear-gradient(135deg,#1B5E20,#2E7D32);padding:20px;border-radius:12px;color:white;margin-bottom:16px">
                  <h2 style="margin:0">DRAVANUA HUB — Dashboard Report</h2>
                  <p style="margin:6px 0 0;opacity:.8">Generated: ${new Date().toLocaleString()}</p>
                </div>
                <table style="width:100%;border-collapse:collapse">
                  <tr style="background:#f1f5f9"><td style="padding:12px;font-weight:800">Revenue</td><td style="padding:12px;font-weight:900;color:#1B5E20">${fmtAmt(stats.totalRevenue, displayCurrency)}</td></tr>
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
              style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B5E20' }}
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
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>REVENUE AUDIT</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>LAST 30 DAYS · {recentReports.length} RECORDS</div>
              </div>
              <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
                <div style={{ color: '#90EE90' }}>CONFIDENTIAL</div>
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
                          background: 'linear-gradient(180deg, #1B5E20, #166534)',
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
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#1B5E20', fontSize: '0.8rem' }}>
                          {showBalances ? fmtAmt(Number(r.totalPrice) || 0, currency) : '••••'}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ background: '#f0fdf4', borderTop: '2px solid #1B5E20' }}>
                      <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 900, fontSize: '0.72rem', color: '#1B5E20', textAlign: 'right' }}>TOTAL:</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: '0.85rem', color: '#1B5E20' }}>
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
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        background: 'linear-gradient(180deg, #1B5E20, #166534)',
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
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#1B5E20', fontSize: '0.8rem' }}>
                        {showBalances ? fmtAmt(Number(b.totalAmount) || 0, currency) : '••••'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '50px', fontSize: '0.62rem', fontWeight: 900,
                          background: b.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: b.status === 'completed' ? '#166534' : '#92400e'
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
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <RefreshCw size={24} className="spin" style={{ color: '#1B5E20' }} />
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
                      {['MEMBER', 'ROLE', 'STATUS'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                          textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
                          background: 'linear-gradient(180deg, #1B5E20, #166534)',
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
                            color: u.isActive ? '#166534' : '#991b1b'
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.isActive ? '#16a34a' : '#dc2626' }} />
                            {u.isActive ? 'ACTIVE' : 'OFFLINE'}
                          </span>
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
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      {/* ── GPS Configuration Table ────────────────────────────────────── */}
      {isSuper && (
        <div style={{ marginTop: '2rem', padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
          <div style={{ background: 'linear-gradient(135deg, #4A148C, #7B1FA2)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>GPS BOUNDARIES & ACCESS POLICIES</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>CONFIGURED OFFICES · {officeLocations.length} RECORDS</div>
            </div>
            <button
              onClick={() => setGpsModalOpen(true)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Settings size={12} /> CONFIGURE
            </button>
          </div>

          {officeLocations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
              <MapPin size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No office locations configured.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
                <thead>
                  <tr>
                    {['OFFICE NAME', 'COORDINATES', 'RADIUS', 'STATUS', 'LAST UPDATED'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                        textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
                        background: 'linear-gradient(180deg, #7B1FA2, #4A148C)',
                        borderRight: '1px solid rgba(255,255,255,0.1)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {officeLocations.map((loc, i) => (
                    <tr key={loc.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcfb' }} className="hover-row">
                      <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: '0.78rem', color: '#1e293b' }}>{loc.office_name}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {parseFloat(loc.latitude).toFixed(4)}, {parseFloat(loc.longitude).toFixed(4)}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#4A148C' }}>{loc.allowed_radius}m</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '50px', fontSize: '0.62rem', fontWeight: 900,
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: loc.is_active ? '#dcfce7' : '#fee2e2',
                          color: loc.is_active ? '#166534' : '#991b1b'
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: loc.is_active ? '#16a34a' : '#dc2626' }} />
                          {loc.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '0.65rem', color: '#94a3b8' }}>
                        {loc.updated_at ? new Date(loc.updated_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GPS Modal ──────────────────────────────────────────────────── */}
      {gpsModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px', width: '95%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #4A148C, #7B1FA2)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>GPS Boundary Setup</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#e2e8f0' }}>Configure office geofence for clock-in verification</p>
                </div>
              </div>
              <button onClick={() => setGpsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <form onSubmit={handleUpdateOfficeLocation} style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Office Name</label>
                <input type="text" value={officeLocation.office_name} onChange={e => setOfficeLocation({ ...officeLocation, office_name: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Latitude</label>
                  <input type="number" step="any" value={officeLocation.latitude} onChange={e => setOfficeLocation({ ...officeLocation, latitude: parseFloat(e.target.value) })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Longitude</label>
                  <input type="number" step="any" value={officeLocation.longitude} onChange={e => setOfficeLocation({ ...officeLocation, longitude: parseFloat(e.target.value) })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Allowed Radius (meters)</label>
                <input type="number" value={officeLocation.allowed_radius} onChange={e => setOfficeLocation({ ...officeLocation, allowed_radius: parseFloat(e.target.value) })} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
              </div>

              <button
                type="button" onClick={captureCurrentGPS} disabled={capturingGps}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #7B1FA2', background: '#f3e5f5', color: '#7B1FA2', fontSize: '0.85rem', fontWeight: 900, cursor: capturingGps ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem', opacity: capturingGps ? 0.7 : 1 }}
              >
                {capturingGps ? <RefreshCw size={16} className="spin" /> : <MapPin size={16} />}
                {capturingGps ? 'CAPTURING...' : 'CAPTURE CURRENT GPS'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setGpsModalOpen(false)} style={{ height: '42px', padding: '0 20px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" disabled={savingGps} style={{ height: '42px', padding: '0 28px', borderRadius: '10px', background: '#7B1FA2', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 900, cursor: savingGps ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: savingGps ? 0.7 : 1 }}>
                  {savingGps ? <RefreshCw size={16} className="spin" /> : <Check size={16} />}
                  {savingGps ? 'Saving...' : 'Save GPS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hover-row:hover { background: #f8fafc !important; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;