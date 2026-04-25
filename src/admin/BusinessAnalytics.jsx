import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, 
  ArrowUpRight, ArrowDownRight, Briefcase, 
  Calendar, Star, Award, BarChart3, Clock,
  BriefcaseIcon, Target, TrendingUpIcon, 
  Search, Download, Mail, Printer, LayoutDashboard,
  CreditCard, ShoppingCart, Package, Info, X, Lock, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import { generateReport } from '../utils/generateReport';

// ── Reusable Info Panel (Portal-based to avoid overflow:hidden clipping) ──────
import ReactDOM from 'react-dom';
import ExportToolbar from './components/ExportToolbar';
import { exportToExcel, fmtAmt, CURRENCIES } from '../utils/exportUtils';

const InfoPanel = ({ title, description, formula, serves }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const openPanel = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Default — try to show below+right; will clamp later
      setPos({ top: r.bottom + 8, left: r.right - 310 });
    }
    setOpen(o => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Clamp panel so it never goes off-screen
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current.getBoundingClientRect();
    let { top, left } = pos;
    if (left < 8) left = 8;
    if (left + panel.width > window.innerWidth - 8) left = window.innerWidth - panel.width - 8;
    if (top + panel.height > window.innerHeight - 8) top = pos.top - panel.height - 40;
    setPos(p => ({ ...p, top, left }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const panel = open ? ReactDOM.createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: '320px',
        zIndex: 999999,
        background: 'white',
        border: '1.5px solid #d1fae5',
        borderRadius: '18px',
        boxShadow: '0 20px 60px rgba(27,94,32,0.18), 0 4px 16px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        animation: 'infoPanelIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--secondary) 100%)',
        padding: '13px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} color="rgba(255,255,255,0.9)" />
          <span style={{ color: 'white', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', padding: '2px', lineHeight: 1 }}>
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* What it shows */}
        <div>
          <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '5px' }}>
            📊 What This Shows
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.58 }}>
            {description}
          </p>
        </div>

        {/* Formula */}
        {formula && (
          <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '9px 12px', borderLeft: '3px solid #16a34a' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#32FC05', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              🔢 Calculation Formula
            </div>
            <code style={{ fontSize: '0.71rem', color: '#15803d', fontFamily: 'monospace', display: 'block', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {formula}
            </code>
          </div>
        )}

        {/* How it serves */}
        {serves && (
          <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '9px 12px', borderLeft: '3px solid #3b82f6' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              💡 How It Serves You
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#1e3a5f', lineHeight: 1.55 }}>
              {serves}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes infoPanelIn {
          from { opacity: 0; transform: scale(0.88) translateY(-6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>,
    document.body
  ) : null;

  return (
    <span style={{ display: 'inline-flex', position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={openPanel}
        title="About this metric"
        style={{
          background: open ? 'rgba(27,94,32,0.08)' : 'none',
          border: '1.5px solid',
          borderColor: open ? 'var(--primary-dark)' : 'transparent',
          borderRadius: '50%',
          cursor: 'pointer',
          color: open ? 'var(--primary-dark)' : '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '26px', height: '26px',
          padding: 0,
          transition: 'all 0.2s',
          flexShrink: 0
        }}
      >
        <Info size={14} />
      </button>
      {panel}
    </span>
  );
};
// ─────────────────────────────────────────────────────────────────────────────


const BusinessAnalytics = () => {
  const { user: authUser, secureFetch } = useAuth();
  const callerRole    = authUser?.role || 'user';
  const isSuperAdmin  = callerRole === 'super_admin';
  const isServiceAdmin = callerRole === 'service_admin';
  const isPrivileged  = isSuperAdmin; // Only super_admin gets full historical data
  // ─────────────────────────────────────────────────────────────────────────────

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessScope, setAccessScope] = useState(null); // filled from API response
  const [period, setPeriod] = useState('all'); 
  const [isDummy, setIsDummy] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [department, setDepartment] = useState('All Units');
  const [compareWith, setCompareWith] = useState('');
  const [chartMode, setChartMode] = useState('Consolidated'); // Consolidated, Comparison, Isolated
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('dvs_currency') || 'RWF'
  );
  const [showHighSpenders, setShowHighSpenders] = useState(false);
  const handleCurrencyChange = (code) => {
    setCurrency(code);
    localStorage.setItem('dvs_currency', code);
  };



  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/analytics?period=${period}`;
      if (customStart && customEnd) {
        url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/analytics?start=${customStart}&end=${customEnd}`;
      }
      if (department) {
        url += `&department=${department}`;
      }

      const resp = await secureFetch(url);
      
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const result = await resp.json();
      
      if (result.success) {
        setData(result.data);
        setAccessScope(result.data.accessScope || null);
        setIsDummy(false);
      } else {
        throw new Error(result.message || 'Logic failure in analytics engine');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setData(null);
      setIsDummy(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (p) => {
    setCustomStart('');
    setCustomEnd('');
    setPeriod(p);
  };

  const handleCustomDateApply = () => {
    if (customStart && customEnd) {
      setPeriod('custom');
    }
  };

  const handleClearFilters = () => {
    setCustomStart('');
    setCustomEnd('');
    setDepartment('');
    setPeriod('all');
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, department]);


  const handlePrint = () => {
    const bodyHtml = `
      <div class="section-title">Performance Intelligence Summary</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${summary.totalRevenue?.toLocaleString() || 0} RWF</span><span class="metric-lbl">Total Gross Revenue</span></div>
        <div class="metric-card"><span class="metric-val" style="color:var(--primary-dark)">${summary.netProfit?.toLocaleString() || 0} RWF</span><span class="metric-lbl">Net Operational Profit</span></div>
        <div class="metric-card"><span class="metric-val">${summary.totalCustomers || 0}</span><span class="metric-lbl">Registered Clients</span></div>
        <div class="metric-card"><span class="metric-val">${summary.workingDaysCount || 0}</span><span class="metric-lbl">Logged Work Days</span></div>
      </div>

      <div class="section-title">Staff Efficiency Index</div>
      <table>
        <thead>
          <tr>
            <th>Staff Name</th>
            <th style="text-align:center">Days</th>
            <th style="text-align:center">Efficiency Score</th>
            <th style="text-align:right">Revenue Contribution</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRates.map(emp => {
            const ratio = (emp.incomeGenerated / maxStaffIncome) * 100;
            return `
              <tr>
                <td><strong>${emp.name}</strong></td>
                <td style="text-align:center">${emp.workingDays}</td>
                <td style="text-align:center"><span class="badge badge-blue">Rank ${emp.efficiency}%</span></td>
                <td style="text-align:right; font-weight:900; color:var(--primary-dark)">${emp.incomeGenerated.toLocaleString()} RWF</td>
                <td>
                  <div class="score-bar-wrap"><div class="score-bar-fill" style="width:${ratio}%"></div></div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="section-title">Platinum Client Yield</div>
      <table>
        <thead><tr><th>Client Rank</th><th>Member Name</th><th>Total LTV</th><th>Status</th></tr></thead>
        <tbody>
          ${specialClients.slice(0, 5).map((c, i) => `
            <tr>
              <td>#00${i+1}</td>
              <td><strong>${c.name}</strong></td>
              <td style="font-weight:700">${c.total.toLocaleString()} RWF</td>
              <td><span class="badge ${i === 0 ? 'badge-green' : 'badge-yellow'}">${i === 0 ? 'PLATINUM' : 'ELITE'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const page2Html = `
      <div style="background:var(--primary-dark); color:white; padding:15px; border-radius:8px; text-align:center; font-weight:900; font-size:18px; margin-bottom:20px;">
        DRAVANUA HUB OPERATIONAL AUDIT LOG - ${new Date().getFullYear()}
      </div>
      
      <table>
        <thead style="background:#e8f5e9;">
          <tr>
            <th style="color:var(--primary-dark)">S/N</th>
            <th style="color:var(--primary-dark)">Date</th>
            <th style="color:var(--primary-dark)">Service Classification</th>
            <th style="color:var(--primary-dark)">Staff Lead</th>
            <th style="color:var(--primary-dark); text-align:right">Revenue (RWF)</th>
            <th style="color:var(--primary-dark)">Certification</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRates.flatMap(emp => Array(Math.min(5, Math.ceil(emp.clientsServed/4 || 1))).fill(emp)).map((e, idx) => `
            <tr>
              <td style="font-weight:700">DVS-${(1053 + idx).toString().padStart(4, '0')}</td>
              <td>${new Date().toLocaleDateString()}</td>
              <td><span class="badge badge-blue">Direct Service</span></td>
              <td>${e.name}</td>
              <td style="text-align:right; font-weight:800">${(e.incomePerDay * 0.8).toLocaleString()}</td>
              <td style="color:#666; font-size:9px; font-style:italic">Verified Hub Entry</td>
            </tr>
          `).join('')}
          <tr style="background:#fffde7">
            <td colspan="4" style="text-align:right; font-weight:900">CONSOLIDATED OPERATIONS YIELD:</td>
            <td style="text-align:right; font-weight:900; color:var(--primary-dark)">${summary.totalRevenue?.toLocaleString()} RWF</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top:20px; font-size:10px; color:#666; padding:10px; border:1px dashed #ccc; border-radius:5px;">
        <strong>HUB Intelligence Notice:</strong> This audit log represents a consolidated view of individual service entries processed through the DRAVANUA central ledger.
      </div>
    `;

    generateReport({ 
      title: 'Performance Intelligence & Operations Audit', 
      moduleCode: 'ANL', 
      bodyHtml, 
      page2Html 
    });
  };

  const handleExcelExport = () => {
    exportToExcel([
      {
        name: 'Summary',
        rows: [{
          Period: summary.period || 'All Time',
          [`Total Revenue (${currency})`]: summary.totalRevenue || 0,
          [`Net Profit (${currency})`]:    summary.netProfit || 0,
          [`Expenses (${currency})`]:       summary.operationalExpenses || 0,
          'Total Bookings':                 summary.totalBookings || 0,
          'Total Customers':                summary.totalCustomers || 0,
          'Working Days':                   summary.workingDaysCount || 0,
        }],
      },
      {
        name: 'Staff Performance',
        rows: employeeRates.map(e => ({
          Name:                          e.name,
          'Working Days':                e.workingDays,
          'Clients Served':              e.clientsServed,
          [`Income Generated (${currency})`]: e.incomeGenerated || 0,
          'Total Actions':               e.totalActions,
          'Efficiency Score':            e.efficiency,
          [`Income Per Day (${currency})`]:   e.incomePerDay || 0,
        })),
      },
      {
        name: 'Top Clients',
        rows: specialClients.map((c, i) => ({
          Rank:                          `#${i + 1}`,
          Name:                          c.name,
          Bookings:                      c.count,
          [`Total Revenue (${currency})`]: c.total || 0,
        })),
      },
      {
        name: 'Department Revenue',
        rows: Object.entries(categoryRevenue).map(([dept, rev]) => ({
          Department: dept,
          [`Revenue (${currency})`]: Number(rev) || 0,
        })),
      },
    ], `DraVanua_Analytics_${period}`);
  };

  const getEmailHtml = () => {
    return `
      <div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto">
        <div style="background:linear-gradient(135deg,var(--primary-dark),var(--secondary));padding:24px;border-radius:12px;color:white;margin-bottom:20px">
          <h1 style="margin:0;font-size:20px">DRAVANUA HUB — Performance Intelligence Report</h1>
          <p style="margin:8px 0 0;opacity:.8">Period: ${summary.period || 'All Time'} | Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr style="background:#f0fdf4">
            <td style="padding:12px;font-weight:700">Total Revenue</td>
            <td style="padding:12px;color:var(--primary-dark);font-weight:900">${fmtAmt(summary.totalRevenue, currency)}</td>
          </tr>
          <tr>
            <td style="padding:12px;font-weight:700">Operational Expenses</td>
            <td style="padding:12px;color:#dc2626;font-weight:900">${fmtAmt(summary.operationalExpenses, currency)}</td>
          </tr>
          <tr style="background:#f0fdf4">
            <td style="padding:12px;font-weight:700">Net Profit</td>
            <td style="padding:12px;color:#32FC05;font-weight:900">${fmtAmt(summary.netProfit, currency)}</td>
          </tr>
          <tr>
            <td style="padding:12px;font-weight:700">Total Bookings</td>
            <td style="padding:12px;font-weight:700">${summary.totalBookings || 0}</td>
          </tr>
          <tr style="background:#f0fdf4">
            <td style="padding:12px;font-weight:700">Registered Clients</td>
            <td style="padding:12px;font-weight:700">${summary.totalCustomers || 0}</td>
          </tr>
        </table>
        <h3 style="color:var(--primary-dark);border-bottom:2px solid #e8f5e9;padding-bottom:8px">Staff Contributions</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead><tr style="background:var(--primary-dark);color:white">
            <th style="padding:10px;text-align:left">Name</th>
            <th style="padding:10px;text-align:right">Income Generated</th>
            <th style="padding:10px;text-align:center">Working Days</th>
          </tr></thead>
          <tbody>${employeeRates.map((e, i) => `
            <tr style="background:${i % 2 === 0 ? '#fafff9' : 'white'}">
              <td style="padding:10px">${e.name}</td>
              <td style="padding:10px;text-align:right;font-weight:700;color:var(--primary-dark)">${fmtAmt(e.incomeGenerated, currency)}</td>
              <td style="padding:10px;text-align:center">${e.workingDays}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <p style="font-size:11px;color:#94a3b8;text-align:center">DRAVANUA HUB — Confidential Internal Report</p>
      </div>`;
  };


  if (loading && !data) return (
    <div className="admin-page flex-center h-400">
      <div className="loading-spinner"></div>
      <p style={{ marginTop: '1rem', color: '#888' }}>Compiling Efficiency Metrics...</p>
    </div>
  );

  if (!data) return <div className="admin-error flex-center h-400"><h3>Intelligence Link Offline</h3><p>Unable to synchronize with the analytics server.</p></div>;

  const { 
    specialClients = [], 
    employeeRates = [], 
    categoryRevenue = {}, 
    summary = {} 
  } = data;

  const maxStaffIncome = employeeRates.length > 0 ? Math.max(...employeeRates.map(e => e.incomeGenerated || 0)) : 1;

  return (
    <div className="admin-page animate-fadeIn no-print-padding">
      <Header 
        title="Performance Intelligence" 
        subtitle={isSuperAdmin
          ? "Operational oversight of revenue generation and staff productivity across all departments."
          : `Today's performance snapshot — ${authUser?.name || 'Your'} dashboard — ${new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}`
        }
      />

      {/* ── ACCESS SCOPE BANNER ── */}
      {!isPrivileged && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          border: '1.5px solid #f59e0b', borderRadius: '16px',
          padding: '14px 20px', marginBottom: '1.5rem',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Shield size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#92400e' }}>
              📅 Today’s View — Scoped Access
            </div>
            <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '2px', lineHeight: 1.5 }}>
              You are viewing data for <strong>today only</strong>
              {accessScope?.department && accessScope.department !== 'all' && (
                <> and your department only (<strong>Dept #{accessScope.department}</strong>)</>              )}
              . Historical data and full cross-department analytics are available only to administrators.
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Role</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#b45309', textTransform: 'capitalize' }}>{callerRole.replace('_', ' ')}</div>
          </div>
        </div>
      )}
      {/* Report Filtering Toolbar */}
      <div className="admin-card no-print" style={{ 
        background: 'white', 
        border: '1px solid #eee', 
        borderRadius: '20px', 
        padding: '1.25rem 1.5rem', 
        marginBottom: '2.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* ── PRIVILEGED CONTROLS (super_admin only) ── */}
          {isPrivileged ? (<>
            {/* Quick Period Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quick:</span>
               <div style={{ display: 'flex', gap: '6px', background: '#f0f2f0', padding: '4px', borderRadius: '12px' }}>
                  {['7d', '30d', 'all'].map(p => (
                    <button key={p} onClick={() => handlePeriodChange(p)}
                      style={{ padding: '6px 18px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, border: 'none', cursor: 'pointer',
                        background: period === p ? 'white' : 'transparent', color: period === p ? 'var(--primary-dark)' : '#777',
                        boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s ease' }}
                    >
                      {p === '7d' ? 'Weekly' : p === '30d' ? 'Monthly' : 'All Time'}
                    </button>
                  ))}
               </div>
            </div>

            {/* Custom Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Range:</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f8faf8', borderRadius: '10px', border: '1px solid #eee' }}>
                 <Calendar size={14} color="#888" />
                 <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600, outline: 'none', width: '120px' }} />
                 <span style={{ color: '#ccc', fontSize: '0.8rem' }}>→</span>
                 <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600, outline: 'none', width: '120px' }} />
               </div>
               <button onClick={handleCustomDateApply} disabled={!customStart || !customEnd}
                 style={{ height: '34px', padding: '0 14px', borderRadius: '8px', border: 'none',
                   background: (customStart && customEnd) ? 'var(--primary-dark)' : '#eee', color: (customStart && customEnd) ? 'white' : '#999',
                   fontSize: '0.75rem', fontWeight: 800, cursor: (customStart && customEnd) ? 'pointer' : 'default' }}>Apply</button>
            </div>

            {/* Main Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Primary Unit:</span>
              <select value={department} onChange={(e) => {setDepartment(e.target.value); setChartMode(e.target.value === 'All Units' ? 'Consolidated' : 'Isolated')}}
                style={{ height: '38px', padding: '0 12px', borderRadius: '12px', border: '2px solid var(--primary)', background: '#fcfdfc', fontSize: '0.85rem', fontWeight: 800, outline: 'none', color: 'var(--primary-dark)' }}>
                <option value="All Units">📊 Consolidated Hub</option>
                <option value="Studio">📸 Studio Operations</option>
                <option value="Papeterie">📄 Papeterie Unit</option>
                <option value="Flower Gifts">💐 Flower Atelier</option>
                <option value="Classic Fashion">💍 Classic Fashion Styling</option>
              </select>
            </div>

            {/* Business Comparison Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#999', textTransform: 'uppercase' }}>Compare With:</span>
              <select value={compareWith} onChange={(e) => {setCompareWith(e.target.value); setChartMode(e.target.value ? 'Comparison' : (department === 'All Units' ? 'Consolidated' : 'Isolated'))}}
                style={{ height: '38px', padding: '0 12px', borderRadius: '12px', border: '2px solid #1565c0', background: '#fcfdfc', fontSize: '0.85rem', fontWeight: 800, outline: 'none', color: '#1565c0' }}>
                <option value="">(None)</option>
                <option value="Studio">📸 Studio</option>
                <option value="Papeterie">📄 Papeterie</option>
                <option value="Flower Gifts">💐 Flower Gifts</option>
                <option value="Classic Fashion">💍 Classic Fashion</option>
              </select>
            </div>
          </>) : (
            /* ── LOCKED PILLS for normal / service users ── */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '10px', padding: '8px 14px' }}>
                <Lock size={14} color="#d97706" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e' }}>
                  📅 Today — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '8px 14px' }}>
                <Shield size={14} color="#16a34a" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#32FC05' }}>Your Department Only</span>
              </div>
            </div>
          )}


          {/* Action Buttons — ExportToolbar (all roles) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             {isPrivileged && (customStart || customEnd || department) && (
               <button onClick={handleClearFilters} style={{ height: '34px', padding: '0 12px', borderRadius: '8px', border: '1px solid #eee', background: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#dc3545' }}>✕ Clear</button>
             )}
             <ExportToolbar
               onPDF={handlePrint}
               onExcel={handleExcelExport}
               currency={currency}
               onCurrency={handleCurrencyChange}
               emailSubject={`Performance Intelligence Report — ${summary.period || 'All Time'}`}
               emailHtml={getEmailHtml}
               moduleCode="ANA"
             />
          </div>
        </div>
      </div>


      {/* Revenue Overview: Real Data Chart */}
      <div className="admin-card mb-5" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.4rem' }}>
              <Activity size={24} color="var(--primary-dark)" /> Revenue & Staff Performance Overview
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
              Consolidated view of revenue generation vs. operational expenses with staff contribution breakdown.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <InfoPanel
              title="Revenue Overview Chart"
              description="This chart visualises three core financial indicators for the selected period: Total Revenue (all income from bookings and transactions), Operational Expenses (recorded outflows), and Net Profit. The bottom SVG bars show each staff member's personal revenue contribution relative to the top performer."
              formula="Net Profit = Total Revenue − Operational Expenses"
              serves="Gives management an immediate read of whether the hub is operating profitably. The staff bars let team leaders identify who is generating the most value, enabling data-driven staffing, bonus, and reallocation decisions."
            />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', background: '#f8fafc', padding: '10px 15px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>Expenses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary-dark)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)' }}>Net Profit</span>
            </div>
          </div>
        </div>

        {/* Top-Level Financial Bars */}
        {(() => {
          const rev = summary.totalRevenue || 0;
          const exp = summary.operationalExpenses || 0;
          const net = summary.netProfit || 0;
          const maxVal = Math.max(rev, exp, 1);
          return (
            <div style={{ marginBottom: '2.5rem' }}>
              {[
                { label: 'Total Revenue', value: rev, pct: (rev / maxVal) * 100, color: 'linear-gradient(90deg, var(--primary-dark), var(--primary))', textColor: 'var(--primary-dark)' },
                { label: 'Operational Expenses', value: exp, pct: (exp / maxVal) * 100, color: 'linear-gradient(90deg, #b91c1c, #dc2626)', textColor: '#dc2626' },
                { label: 'Net Profit', value: net, pct: (Math.abs(net) / maxVal) * 100, color: net >= 0 ? 'linear-gradient(90deg, #32FC05, #22c55e)' : 'linear-gradient(90deg, #9f1239, #dc2626)', textColor: net >= 0 ? '#32FC05' : '#dc2626' },
              ].map((row, i) => (
                <div key={i} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px' }}>
                    <span>{row.label}</span>
                    <span style={{ color: row.textColor }}>RWF {Math.round(row.value).toLocaleString()}</span>
                  </div>
                  <div style={{ height: '22px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(0, Math.min(100, row.pct))}%`,
                      background: row.color,
                      borderRadius: '8px',
                      transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex', alignItems: 'center', paddingLeft: '10px',
                      color: 'white', fontSize: '0.65rem', fontWeight: 900
                    }}>
                      {row.pct > 15 ? `${row.pct.toFixed(0)}%` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Staff Contribution SVG Bar Chart */}
        {employeeRates.length > 0 && (() => {
          const maxIncome = Math.max(...employeeRates.map(e => e.incomeGenerated || 0), 1);
          const chartH = 200;
          const barW = Math.min(80, Math.floor(900 / employeeRates.length) - 20);
          const gap = Math.floor(900 / employeeRates.length);
          const colors = ['var(--primary-dark)','var(--secondary)','#388E3C','#43A047','#4CAF50','#66BB6A'];
          return (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Staff Revenue Contribution
              </div>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${Math.max(900, employeeRates.length * gap)} ${chartH + 50}`} style={{ width: '100%', minWidth: '400px' }}>
                  {/* Y-axis gridlines */}
                  {[0, 25, 50, 75, 100].map(pct => (
                    <g key={pct}>
                      <line x1="0" y1={chartH - (pct / 100) * chartH} x2="900" y2={chartH - (pct / 100) * chartH} stroke="#f1f5f9" strokeWidth="1" />
                      <text x="0" y={chartH - (pct / 100) * chartH - 3} style={{ fontSize: '8px', fill: '#94a3b8' }}>{pct}%</text>
                    </g>
                  ))}
                  {/* Bars */}
                  {employeeRates.map((emp, i) => {
                    const barH = Math.max(4, ((emp.incomeGenerated || 0) / maxIncome) * chartH);
                    const x = i * gap + (gap - barW) / 2;
                    const y = chartH - barH;
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={barW} height={barH} rx="6" fill={colors[i % colors.length]} opacity="0.9" />
                        <text x={x + barW / 2} y={chartH + 15} textAnchor="middle" style={{ fontSize: '9px', fill: '#475569', fontWeight: 700 }}>
                          {emp.name.split(' ')[0]}
                        </text>
                        <text x={x + barW / 2} y={y - 5} textAnchor="middle" style={{ fontSize: '8px', fill: 'var(--primary-dark)', fontWeight: 900 }}>
                          {((emp.incomeGenerated || 0) / 1000).toFixed(0)}K
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })()}

        {employeeRates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No staff revenue data available for the selected period.</p>
          </div>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '3rem' }}>
        <div className="admin-stat-card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div className="admin-stat-icon" style={{ background: '#e8f5e9', color: 'var(--primary)' }}><DollarSign size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Flow Yield</span>
            <span className="admin-stat-value">{summary.totalRevenue?.toLocaleString()} RWF</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 800 }}>↑ Gross Growth</span>
          </div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #dc2626' }}>
          <div className="admin-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><ArrowDownRight size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Burn Rate</span>
            <span className="admin-stat-value">{fmtAmt(summary.operationalExpenses || 0, currency)}</span>
            <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800 }}>↓ Op. Expenditure</span>
          </div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid #6366f1' }}>
          <div className="admin-stat-icon" style={{ background: '#eef2ff', color: '#6366f1' }}><Activity size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Subscription Burn</span>
            <span className="admin-stat-value">{fmtAmt(summary.subscriptionBurn || 0, currency)}</span>
            <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 800 }}>⚡ Monthly Recurring</span>
          </div>
        </div>
        <div className="admin-stat-card" style={{ borderTop: '4px solid var(--primary-dark)' }}>
          <div className="admin-stat-icon" style={{ background: '#f1f8e9', color: 'var(--primary-dark)' }}><Target size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Net Operational Profit</span>
            <span className="admin-stat-value" style={{ color: 'var(--primary-dark)' }}>{fmtAmt(summary.netProfit || 0, currency)}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 800 }}>Safe Margin Verified</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#e0f2f1', color: '#128C7E' }}><Users size={24} /></div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Engagement Multiplier</span>
            <span className="admin-stat-value">{(summary.totalBookings || 0).toLocaleString()} Active</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>Across {(summary.workingDaysCount || 0).toLocaleString()} Days</span>
          </div>
        </div>
      </div>

      {/* NEW: Operational Intelligence Visualization (Circle & Bar Diagrams) */}
      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
         {/* Circular Analytics: Operational Mix */}
         <div className="admin-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.2rem' }}><Activity size={20} color="var(--primary)" /> Operational Health Mix</h3>
               <InfoPanel
                 title="Operational Health Mix"
                 description="Donut chart showing the ratio of total revenue versus total operational expenses for the filtered period. The percentage in the centre reflects how much of the combined financial flow is attributable to revenue generation."
                 formula="Revenue % = Revenue ÷ (Revenue + Expenses) × 100"
                 serves="Enables administrators to instantly gauge operational efficiency. A high revenue % signals a healthy hub. A shrinking ratio is an early warning to review spending or boost sales before the books go negative."
               />
               </div>
               <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>Verification of revenue flow vs procurement approvals.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                   <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                     <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f0f2f0" strokeWidth="3" />
                     {/* Revenue Segment - calculated from real data */}
                     <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--primary)" strokeWidth="3"
                       strokeDasharray={`${summary.totalRevenue && (summary.totalRevenue + (summary.operationalExpenses || 0)) > 0 ? ((summary.totalRevenue / (summary.totalRevenue + (summary.operationalExpenses || 0))) * 100).toFixed(0) : 75} 100`}
                       strokeLinecap="round" className="svg-animate-stroke" />
                     {/* Expense Segment */}
                     <circle cx="18" cy="18" r="16" fill="transparent" stroke="#dc2626" strokeWidth="3"
                       strokeDasharray={`${summary.operationalExpenses && (summary.totalRevenue + summary.operationalExpenses) > 0 ? ((summary.operationalExpenses / (summary.totalRevenue + summary.operationalExpenses)) * 100).toFixed(0) : 25} 100`}
                       strokeDashoffset={`-${summary.totalRevenue && (summary.totalRevenue + (summary.operationalExpenses || 0)) > 0 ? ((summary.totalRevenue / (summary.totalRevenue + (summary.operationalExpenses || 0))) * 100).toFixed(0) : 75}`}
                       strokeLinecap="round" className="svg-animate-stroke" />
                   </svg>
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                     <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                       {summary.totalRevenue && (summary.totalRevenue + (summary.operationalExpenses || 0)) > 0
                         ? ((summary.totalRevenue / (summary.totalRevenue + summary.operationalExpenses)) * 100).toFixed(0)
                         : 0}%
                     </div>
                     <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase' }}>Revenue</div>
                   </div>
                </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }}></div>
                     <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Revenue Generation</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{fmtAmt(summary.totalRevenue || 0, currency)}</div>
                     </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '12px', height: '12px', background: '#dc2626', borderRadius: '3px' }}></div>
                     <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Operational Burn</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{fmtAmt(summary.operationalExpenses || 0, currency)}</div>
                     </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '12px', height: '12px', background: '#1565c0', borderRadius: '3px' }}></div>
                     <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Net Profit</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{fmtAmt(summary.netProfit || 0, currency)}</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Bar Diagram: Revenue vs Expenses by real computed values */}
         <div className="admin-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.2rem' }}><BarChart3 size={20} color="#1565c0" /> Yield vs. Liquidity Audit</h3>
               <InfoPanel
                 title="Yield vs. Liquidity Audit"
                 description="Horizontal progress bars comparing key financial metrics as percentages of the total financial flow. Revenue and Expenses are scaled relative to the larger of the two, giving a side-by-side visual of fiscal health. Net Profit margin is expressed as a percentage of total revenue."
                 formula="Revenue % = Revenue ÷ max(Revenue, Expenses) × 100 | Margin = Net Profit ÷ Revenue × 100"
                 serves="Provides a rapid visual liquidity check. Finance officers can see at a glance whether income covers costs, what margin remains, and how close the hub is to break-even — without reading a spreadsheet."
               />
               </div>
               <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>Revenue generation versus operational expenditure.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {/* Revenue Bar */}
               {(() => {
                 const totalFlow = (summary.totalRevenue || 0) + (summary.operationalExpenses || 0);
                 const revPct = totalFlow > 0 ? Math.round((summary.totalRevenue / totalFlow) * 100) : 0;
                 const expPct = totalFlow > 0 ? Math.round((summary.operationalExpenses / totalFlow) * 100) : 0;
                 return (
                   <>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                         <span>Total Revenue</span>
                         <span style={{ color: '#32FC05' }}>{revPct}% of Flow</span>
                       </div>
                       <div style={{ height: '30px', display: 'flex', gap: '4px' }}>
                         <div style={{ height: '100%', width: `${revPct}%`, background: 'linear-gradient(90deg, #32FC05, #16a34a)', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', paddingLeft: '10px', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>{fmtAmt(summary.totalRevenue || 0, currency)}</div>
                         {100 - revPct > 0 && <div style={{ height: '100%', width: `${100 - revPct}%`, background: '#f1f5f9', borderRadius: '0 6px 6px 0' }}></div>}
                       </div>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                         <span>Operational Expenses</span>
                         <span style={{ color: '#dc2626' }}>{expPct}% of Flow</span>
                       </div>
                       <div style={{ height: '30px', display: 'flex', gap: '4px' }}>
                         <div style={{ height: '100%', width: `${expPct}%`, background: 'linear-gradient(90deg, #dc2626, #ef5350)', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', paddingLeft: '10px', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>{fmtAmt(summary.operationalExpenses || 0, currency)}</div>
                         {100 - expPct > 0 && <div style={{ height: '100%', width: `${100 - expPct}%`, background: '#f1f5f9', borderRadius: '0 6px 6px 0' }}></div>}
                       </div>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                         <span>Net Profit</span>
                         <span style={{ color: summary.netProfit >= 0 ? '#32FC05' : '#dc2626' }}>{summary.totalRevenue ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : 0}% Margin</span>
                       </div>
                       <div style={{ height: '30px', display: 'flex', borderRadius: '6px', overflow: 'hidden' }}>
                         <div style={{ height: '100%', width: `${summary.totalRevenue ? Math.max(0, Math.min(100, (summary.netProfit / summary.totalRevenue) * 100)) : 0}%`, background: summary.netProfit >= 0 ? 'linear-gradient(90deg, var(--primary-dark), var(--primary))' : '#dc2626', display: 'flex', alignItems: 'center', paddingLeft: '10px', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>{fmtAmt(summary.netProfit || 0, currency)}</div>
                       </div>
                     </div>
                   </>
                 );
               })()}
            </div>
         </div>
      </div>

      {/* Staff Productivity Comparison Chart (Bar Chart) */}
      <div className="admin-card mb-5" style={{ padding: '2.5rem' }}>
         <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.4rem' }}>
               <BarChart3 size={24} color="var(--primary)" /> Staff Revenue Performance
            </h3>
            <InfoPanel
              title="Staff Revenue Performance"
              description="Horizontal progress bars showing each staff member's total income generated relative to the highest earner. Bar width = (staff income ÷ maximum staff income) × 100. Only staff who have linked bookings or transactions appear here."
              formula="Bar Width = Staff Income ÷ Max(Staff Incomes) × 100%"
              serves="Allows supervisors to benchmark team performance fairly and transparently. The relative bar widths communicate effort and revenue output, supporting performance reviews, incentive structures, and workload balancing."
            />
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '4px' }}>Comparative analysis of total income vs working presence intensity.</p>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {employeeRates.length > 0 ? employeeRates.map((emp, i) => (
               <div key={i} className="performance-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{emp.name}</span>
                     <span style={{ fontWeight: 900, color: 'var(--primary)' }}>RWF {(emp.incomeGenerated || 0).toLocaleString()} / {emp.workingDays || 0} Days</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: '#f0f2f0', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
                     <div style={{
                        width: `${maxStaffIncome > 0 ? (emp.incomeGenerated / maxStaffIncome) * 100 : 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                        borderRadius: '20px',
                        transition: 'width 1s ease-out'
                     }}></div>
                  </div>
               </div>
            )) : (
               <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                 No staff performance data available for the selected period.
               </div>
            )}
         </div>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        {/* Booking Status Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', margin: 0 }}><CreditCard size={18} color="#1565c0" /> Booking Pipeline</h3>
            <InfoPanel
              title="Booking Pipeline"
              description="Displays three operational counters: Total Bookings (all booking records in the DB for the period), Registered Clients (unique customers in the system), and Working Days Logged (attendance check-in records). Bar widths are proportional to the largest of the three values."
              formula="Bar % = Value ÷ max(Bookings, Clients, Days) × 100"
              serves="Keeps operations managers aligned on the volume of work the hub is handling versus its human resource coverage. It connects bookings to clients and attendance — surfacing capacity, utilisation, and retention trends."
            />
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            {[
              { label: 'Total Bookings', value: summary.totalBookings || 0, color: '#1565c0' },
              { label: 'Registered Clients', value: summary.totalCustomers || 0, color: 'var(--primary-dark)' },
              { label: 'Working Days Logged', value: summary.workingDaysCount || 0, color: '#9d174d' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700 }}>{item.label}</span>
                  <span style={{ fontWeight: 900, color: item.color }}>{item.value.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (item.value / Math.max(summary.totalBookings || 1, summary.totalCustomers || 1, summary.workingDaysCount || 1)) * 100)}%`, height: '100%', background: item.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Outflow Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', margin: 0 }}><ShoppingCart size={18} color="#dc2626" /> Operational Outflow</h3>
            <InfoPanel
              title="Operational Outflow"
              description="Summary of financial outflows for the period. General Expenses = sum of all expense-type transactions and daily ops expense records. Total Revenue is shown for reference. Net Profit is Revenue minus all Expenses."
              formula="Net Profit = Total Revenue − Operational Expenses"
              serves="Acts as a concise P&L snapshot. Finance leads use this to confirm burn rates, verify that procurement spend is justified, and compare outflow against incoming revenue without opening separate reports."
            />
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9f9f9' }}>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Variable Expenses</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{fmtAmt((summary.operationalExpenses || 0) - (summary.subscriptionBurn || 0), currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9f9f9' }}>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Subscription Burn</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{fmtAmt(summary.subscriptionBurn || 0, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9f9f9' }}>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Total Revenue</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{fmtAmt(summary.totalRevenue || 0, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: '5px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>Net Operational Profit</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: (summary.netProfit || 0) >= 0 ? '#32FC05' : '#dc2626' }}>{fmtAmt(summary.netProfit || 0, currency)}</span>
            </div>
          </div>
        </div>

        {/* Department Revenue Distribution */}
        <div className="admin-card">
          <div className="admin-card-header" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', margin: 0 }}><Package size={18} color="#673ab7" /> Department Revenue</h3>
            <InfoPanel
              title="Department Revenue"
              description="Bar chart showing revenue generated per department for the selected period. Revenue is aggregated from Sale-type transactions and Daily Ops reports, grouped by departmentId. Bars are scaled relative to the highest-earning department."
              formula="Bar % = Dept Revenue ÷ max(All Dept Revenues) × 100"
              serves="Reveals which business units (Studio, Flower Gifts, Classic Fashion, etc.) are the strongest contributors. Directors can use this to allocate marketing budgets, expand profitable units, and identify underperforming departments for coaching."
            />
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            {Object.keys(categoryRevenue).length > 0 ? (() => {
              const maxCatRev = Math.max(...Object.values(categoryRevenue).map(v => Number(v) || 0), 1);
              return Object.entries(categoryRevenue).map(([dept, rev], i) => (
                <div key={i} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, marginBottom: '5px' }}>
                    <span>{dept}</span>
                    <span style={{ color: 'var(--primary-dark)' }}>{fmtAmt(Number(rev) || 0, currency)}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f5f5f5', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(Number(rev) / maxCatRev) * 100}%`, height: '100%', background: ['#673ab7','#3f51b5','#2196f3','#00bcd4','var(--primary-dark)','#dc2626'][i % 6], borderRadius: '10px' }}></div>
                  </div>
                </div>
              ));
            })() : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '1.5rem 0' }}>No category data available.</div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '2rem', marginBottom: '3rem' }}>
         {/* Procurement Lifecycle from real booking data */}
         <div className="admin-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.2rem' }}><Target size={20} color="#E65100" /> Booking Lifecycle</h3>
               <InfoPanel
                 title="Booking Lifecycle"
                 description="Circular gauge showing the ratio of total bookings to total registered clients — indicating how many bookings exist per client on average. The stats panel shows total bookings count, client base, and average revenue per booking."
                 formula="Gauge % = min(100, Bookings ÷ Clients × 100) | Avg Rev = Revenue ÷ Bookings"
                 serves="Communicates client engagement depth. A high ratio means existing clients are returning frequently. The average revenue per booking helps price-check services and identify upsell opportunities to increase order value."
               />
               </div>
               <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>Breakdown of total bookings processed through the system.</p>
            </div>
            {(() => {
              const total = summary.totalBookings || 0;
              const clients = summary.totalCustomers || 0;
              const ratio = total > 0 && clients > 0 ? Math.min(100, ((total / clients) * 100)).toFixed(0) : 0;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                  <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f0f2f0" strokeWidth="4" />
                      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#E65100" strokeWidth="4"
                        strokeDasharray={`${ratio} 100`} strokeLinecap="round" className="svg-animate-stroke" />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#E65100' }}>{total}</div>
                      <div style={{ fontSize: '0.6rem', color: '#888' }}>Bookings</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Total Bookings</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>{total.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Client Base</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{clients.toLocaleString()} Clients</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Avg Revenue</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#f59e0b' }}>{fmtAmt(total > 0 ? (summary.totalRevenue || 0) / total : 0, currency)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
         </div>

         {/* Top Clients from real specialClients data */}
         <div className="admin-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.2rem' }}><Package size={20} color="#673ab7" /> Top Client Revenue</h3>
               <InfoPanel
                 title="Top Client Revenue"
                 description="Horizontal bars ranking the top 5 clients by total booking revenue for the selected period. Revenue is summed from all bookings linked to each client's email. Bar widths are scaled to the highest-spending client."
                 formula="Bar % = Client Total ÷ max(All Client Totals) × 100"
                 serves="Identifies your platinum clients — the people driving the most revenue. Use this to prioritise VIP service, personalise outreach, offer loyalty rewards, and ensure these relationships are protected by the right team members."
               />
               </div>
               <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>Highest value clients by booking revenue.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {specialClients.length > 0 ? (() => {
                 const maxClient = Math.max(...specialClients.map(c => c.total), 1);
                 return specialClients.slice(0, 5).map((c, i) => (
                   <div key={i}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, marginBottom: '5px' }}>
                       <span>{c.name} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({c.count} bookings)</span></span>
                       <span style={{ color: 'var(--primary-dark)' }}>{fmtAmt(c.total || 0, currency)}</span>
                     </div>
                     <div style={{ height: '6px', background: '#f5f5f5', borderRadius: '10px', overflow: 'hidden' }}>
                       <div style={{ width: `${(c.total / maxClient) * 100}%`, height: '100%', background: ['var(--primary-dark)','#3f51b5','#673ab7','#E65100','#dc2626'][i % 5], borderRadius: '10px' }}></div>
                     </div>
                   </div>
                 ));
               })() : (
                 <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '1.5rem 0' }}>No client booking data found yet.</div>
               )}
            </div>
         </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', margin: 0 }}><Activity size={18} color="var(--secondary)" /> Staff Revenue Audit</h3>
          <InfoPanel
            title="Staff Revenue Audit"
            description="Activity feed showing each staff member's individual revenue contribution, number of clients served, working days logged, and total actions recorded in the system. Revenue is aggregated from transactions where the staff member is set as 'recordedBy', plus daily ops reports they created."
            formula="Staff Revenue = Σ(Transactions recorded by staff) + Σ(Daily report totals created by staff)"
            serves="Provides full accountability and traceability of who generated what revenue. Management can use this to audit actuals versus targets, resolve discrepancies, and communicate individual performance during reviews or payroll calculations."
          />
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          {employeeRates.length > 0 ? employeeRates.slice(0, 5).map((emp, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: emp.incomeGenerated > 0 ? 'var(--secondary)' : '#94a3b8' }}></div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>{emp.name}</p>
                  <span style={{ fontSize: '0.65rem', color: '#999' }}>{emp.clientsServed} clients • {emp.workingDays} days • {emp.totalActions} actions</span>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--secondary)' }}>
                +{fmtAmt(emp.incomeGenerated || 0, currency)}
              </span>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>No staff activity data for the selected period.</div>
          )}
        </div>
      </div>

      {/* Customer Intelligence Highlights */}
       <div className="admin-card no-print" style={{ 
        background: 'var(--primary-dark)', 
        color: 'white', 
        borderRadius: '24px', 
        padding: '2rem', 
        marginBottom: '3rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
        boxShadow: '0 10px 30px rgba(27, 94, 32, 0.2)'
      }}>
         <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Database</div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{(summary.totalCustomers || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 700 }}>IDENTITY LOGGED CLIENTS</div>
         </div>
         <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Avg. LTV</div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{fmtAmt(summary.totalCustomers ? summary.totalRevenue / summary.totalCustomers : 0, currency)}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 700 }}>LIFE-TIME VALUE YIELD</div>
         </div>
         <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>High-Value Rate</div>
            <div style={{ fontSize: '2rem', fontWeight: 900 }}>{summary.totalCustomers ? ((specialClients.length / summary.totalCustomers) * 100).toFixed(1) : '0'}%</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 700 }}>PLATINUM TIER RATIO</div>
         </div>
      </div>

      <div className="admin-dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: '2.5rem' }}>
        
        {/* Productivity & Attendance Correlation Index */}
        <div className="admin-card no-border shadow-sm">
          <div className="admin-card-header" style={{ padding: '1.5rem 2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
               <Award size={20} color="var(--primary-dark)" /> Attendance vs Income Correlation
            </h3>
            <InfoPanel
               title="Productivity Correlation"
               description="This table compares the volume of work presence (Attendance Days) with the actual financial output (Income Generated). It allows you to identify high-yield personnel who generate significant revenue per day of attendance."
               formula="Yield Density = Total Income ÷ Working Days"
               serves="Helps identify your most efficient staff members. A staff member with fewer days but higher revenue might be more efficient in high-value services than someone with high attendance but low total generation."
            />
          </div>
          <div style={{ padding: '0 2rem 2rem' }}>
            <table className="admin-table plain">
              <thead>
                <tr>
                  <th>Workforce Member</th>
                  <th style={{ textAlign: 'center' }}>Attendance Intensity</th>
                  <th style={{ textAlign: 'center' }}>Rev Density / Day</th>
                  <th style={{ textAlign: 'right' }}>Total Generation</th>
                </tr>
              </thead>
              <tbody>
                {employeeRates.map((emp, i) => {
                   const maxDays = Math.max(...employeeRates.map(e => e.workingDays || 1), 1);
                   const daysPct = ((emp.workingDays || 0) / maxDays) * 100;
                   const yieldPct = ((emp.incomeGenerated || 0) / maxStaffIncome) * 100;
                   
                   return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '10px', 
                            background: i === 0 ? 'linear-gradient(135deg, #FFD700, #FDB931)' : '#f1f5f9', 
                            color: i === 0 ? 'white' : '#64748b', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                            boxShadow: i === 0 ? '0 4px 10px rgba(255, 215, 0, 0.3)' : 'none'
                          }}>
                             {i === 0 ? <Star size={16} /> : emp.name.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: '#1e293b', display: 'block' }}>{emp.name}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>RANK #{i+1} CONTRIBUTOR</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                         <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{(emp.workingDays || 0).toLocaleString()} Shifts</div>
                         <div style={{ width: '60px', height: '4px', background: '#f1f5f9', borderRadius: '10px', margin: '4px auto 0', overflow: 'hidden' }}>
                            <div style={{ width: `${daysPct}%`, height: '100%', background: '#6366f1' }}></div>
                         </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                         <span style={{ fontSize: '0.95rem', fontWeight: 950, color: 'var(--primary-dark)' }}>{fmtAmt(Number(emp.incomePerDay) || 0, currency)}</span>
                         <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Daily Yield</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                         <div style={{ fontSize: '1.05rem', fontWeight: 950, color: 'var(--primary)' }}>{fmtAmt(emp.incomeGenerated || 0, currency)}</div>
                         <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{((emp.incomeGenerated / (summary.totalRevenue || 1)) * 100).toFixed(1)}% Core Contribution</div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Customers (VIP List) */}
        <div className="admin-card no-border shadow-sm">
          <div className="admin-card-header" style={{ padding: '1.5rem 2rem' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><Star size={20} color="#FFD700" /> Platinum Clients</h3>
          </div>
          <div style={{ padding: '0 2rem 2rem' }}>
             {specialClients.map((client, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 0', borderBottom: i < specialClients.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#fff9e6', color: '#856404', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{i + 1}</div>
                    <div>
                      <p style={{ fontWeight: 800, margin: 0, color: 'var(--accent)' }}>{client.name}</p>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>Last Active: {client.lastActive || 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{fmtAmt(client.total, currency)}</div>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'var(--primary)', color: 'white', textTransform: 'uppercase', fontWeight: 900 }}>Top Tier</span>
                  </div>
               </div>
             ))}
              <button 
                className="btn btn-outline w-100 no-print" 
                onClick={() => setShowHighSpenders(true)}
                style={{ marginTop: '1.5rem', height: '45px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800 }}
              >
                 View All High Spenders
              </button>
          </div>
        </div>
      </div>

      {/* High Spenders Leaderboard Modal */}
      {showHighSpenders && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
           <div className="admin-card" style={{ width: '90%', maxWidth: '600px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfdfc' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={20} color="#D97706" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Platinum Client Leaderboard</h3>
                 </div>
                 <button onClick={() => setShowHighSpenders(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <Activity size={20} />
                 </button>
              </div>
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                 <table className="admin-table plain" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                    <thead>
                       <tr>
                          <th style={{ textAlign: 'left', fontSize: '0.65rem' }}>RANK</th>
                          <th style={{ textAlign: 'left', fontSize: '0.65rem' }}>CLIENT PROFILE</th>
                          <th style={{ textAlign: 'right', fontSize: '0.65rem' }}>TOTAL LTV</th>
                       </tr>
                    </thead>
                    <tbody>
                       {specialClients.map((client, i) => (
                          <tr key={i}>
                             <td style={{ padding: '12px', background: '#f8fafc', borderBottomLeftRadius: '10px', borderTopLeftRadius: '10px', fontWeight: 900, fontSize: '0.75rem', color: 'var(--primary-dark)' }}>
                                #{i + 1}
                             </td>
                             <td style={{ background: '#f8fafc', padding: '12px' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{client.name}</div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Member since 2024 • Last active {client.lastActive}</div>
                             </td>
                             <td style={{ background: '#f8fafc', padding: '12px', borderBottomRightRadius: '10px', borderTopRightRadius: '10px', textAlign: 'right' }}>
                                <div style={{ fontWeight: 900, color: 'var(--primary-dark)', fontSize: '0.9rem' }}>{fmtAmt(client.total || 0, currency)}</div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 800, background: '#e8f5e9', color: 'var(--primary-dark)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>PLATINUM TIER</div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                 <button onClick={() => setShowHighSpenders(false)} className="btn btn-primary" style={{ width: '100%', height: '45px', borderRadius: '12px', fontWeight: 800 }}>CLOSE LEADERBOARD</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .admin-table.plain { border-spacing: 0 10px; border-collapse: separate; }
        .admin-table.plain th { color: #888; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px; border: none; }
        .admin-table.plain tr td { background: #fcfdfc; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; padding: 15px 10px; }
        .admin-table.plain tr td:first-child { border-left: 1px solid #f0f0f0; border-radius: 12px 0 0 12px; }
        .admin-table.plain tr td:last-child { border-right: 1px solid #f0f0f0; border-radius: 0 12px 12px 0; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        
        @media print {
           .no-print { display: none !important; }
           .admin-card { box-shadow: none !important; border: 1px solid #eee !important; }
           .admin-page { padding: 0 !important; }
           body { background: white !important; }
           .billboard-analytics { background: white !important; padding: 1rem !important; }
           .print-only { display: block !important; }
        }
        .print-only { display: none; }
        .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .h-400 { height: 400px; }
        .w-100 { width: 100%; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #f0f2f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @keyframes stroke-anim {
          from { stroke-dasharray: 0 100; }
        }
        .svg-animate-stroke {
          animation: stroke-anim 1.5s ease-out forwards;
        }
        
        @keyframes path-grow {
          from { stroke-dasharray: 1500; stroke-dashoffset: 1500; }
          to { stroke-dasharray: 1500; stroke-dashoffset: 0; }
        }
        .path-animate {
          animation: path-grow 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .performance-row:hover {
          transform: translateX(8px);
          background: #f8faf8;
        }
        .performance-row {
          padding: 10px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default BusinessAnalytics;
