import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import {
  BarChart3, Users, Clock, Printer, Download, Search, Filter,
  TrendingUp, Activity, UserCheck, Mail, RefreshCw, AlertCircle,
  ChevronDown, X, Eye, EyeOff, Info
} from 'lucide-react';
import { generateReport } from '../utils/generateReport';
import ExportToolbar from './components/ExportToolbar';
import { exportToExcel, fmtAmt } from '../utils/exportUtils';

const Performance = () => {
  const { secureFetch } = useAuth();
  const [stats, setStats] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [rawLogs, setRawLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sendingReportFor, setSendingReportFor] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('dvs_currency') || 'RWF'
  );

  const handleCurrencyChange = (code) => {
    setCurrency(code);
    localStorage.setItem('dvs_currency', code);
  };

  const fetchStats = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setError(null);

    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/performance?start=${dateRange.start}&end=${dateRange.end}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data || []);
        setRawLogs(data.rawLogs || []);
        setDeptStats(data.deptStats || []);
      } else {
        setError(data.message || 'Failed to load performance metrics');
      }
    } catch (error) {
      console.error('Performance API Error:', error);
      setError('Could not connect to service. Ensure backend is active.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  const handleSendReport = async (userId, userName) => {
    setSendingReportFor(userId);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/performance/report/${userId}`, {
        method: 'POST'
      });
      const d = await res.json();
      alert(d.message || d.error);
    } catch (e) {
      alert('Network error - could not send report');
    } finally {
      setSendingReportFor(null);
    }
  };

  // Derived data
  const departmentsList = deptStats.length > 0
    ? deptStats.map(d => d.name)
    : [...new Set(stats.map(s => s.department))];
  const actionTypes = [...new Set(rawLogs.map(l => l.action))];

  const filteredStats = stats.filter(user => {
    const nameStr = (user.name || '').toLowerCase();
    const deptStr = (user.department || '').toLowerCase();
    const searchStr = searchTerm.toLowerCase();
    
    const matchesSearch = nameStr.includes(searchStr) || deptStr.includes(searchStr);
    const matchesDept = departmentFilter === 'all' || user.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const filteredLogs = rawLogs.filter(log => {
    const logDate = new Date(log.createdAt).toISOString().split('T')[0];
    const userStr = (log.userName || '').toLowerCase();
    const detailsStr = (log.details || '').toLowerCase();
    const searchStr = searchTerm.toLowerCase();

    const matchesSearch = userStr.includes(searchStr) || detailsStr.includes(searchStr);
    const matchesDept = departmentFilter === 'all' || log.department === departmentFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesDate = logDate >= dateRange.start && logDate <= dateRange.end;
    return matchesSearch && matchesDept && matchesAction && matchesDate;
  });

  const filteredDeptStats = deptStats.filter(dept => {
    const nameStr = (dept.name || '').toLowerCase();
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = nameStr.includes(searchStr);
    const matchesDept = departmentFilter === 'all' || dept.name === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const totalActions = rawLogs.length;
  const activeStaff = stats.length;
  const avgEfficiency = activeStaff > 0 ? (totalActions / activeStaff).toFixed(1) : 0;
  const topDepartment = stats[0]?.department?.toUpperCase() || 'N/A';
  const totalIncome = stats.reduce((sum, s) => sum + (s.income || 0), 0);
  const totalExpenses = stats.reduce((sum, s) => sum + (s.expenses || 0), 0);

  const handlePrint = () => {
    const bodyHtml = `
      <div class="section-title">Performance KPI Overview</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${totalActions.toLocaleString()}</span><span class="metric-lbl">TOTAL ACTIONS LOGGED</span></div>
        <div class="metric-card"><span class="metric-val">${activeStaff}</span><span class="metric-lbl">ACTIVE STAFF EXECUTIVES</span></div>
        <div class="metric-card"><span class="metric-val">${avgEfficiency}</span><span class="metric-lbl">AVG ACTION DENSITY</span></div>
        <div class="metric-card"><span class="metric-val">${topDepartment}</span><span class="metric-lbl">LEADING DEPARTMENT</span></div>
      </div>

      <div class="section-title">Operational Metrics</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val" style="color:#32FC05;">${totalIncome.toLocaleString()} RWF</span><span class="metric-lbl">TOTAL INCOME</span></div>
        <div class="metric-card"><span class="metric-val" style="color:#dc2626;">${totalExpenses.toLocaleString()} RWF</span><span class="metric-lbl">TOTAL EXPENSES</span></div>
        <div class="metric-card"><span class="metric-val" style="color:#0f172a;">${(totalIncome - totalExpenses).toLocaleString()} RWF</span><span class="metric-lbl">NET CONTRIBUTION</span></div>
        <div class="metric-card"><span class="metric-val">${filteredDeptStats.length}</span><span class="metric-lbl">DEPARTMENTS</span></div>
      </div>

      <div class="section-title">Staff Output & Efficiency Ranking</div>
      <table>
        <thead>
          <tr><th>EXECUTIVE NAME</th><th>DEPARTMENT</th><th>VOLUME</th><th style="text-align:right">EFFICIENCY SCORE</th></tr>
        </thead>
        <tbody>
          ${filteredStats.map(user => {
            const eff = ((user.totalActions / Math.max(...stats.map(s => s.totalActions), 1)) * 100).toFixed(0);
            return `<tr>
              <td><strong>${user.name}</strong></td>
              <td><span class="badge badge-blue">${(user.department || 'GENERAL').toUpperCase()}</span></td>
              <td><strong>${user.totalActions} Actions</strong></td>
              <td style="text-align:right; font-weight:700; color:#32FC05;">${eff}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <div class="section-title">Departmental Volume & Financial Distribution</div>
      <table>
        <thead><tr><th>DEPARTMENT UNIT</th><th>STAFFING</th><th>ACTIVITY VOLUME</th><th style="text-align:right">INCOME CONTRIBUTION</th><th style="text-align:right">ACTIVITY SHARE</th></tr></thead>
        <tbody>
          ${deptStats.map(dept => {
            const share = totalActions > 0 ? ((dept.totalActions / totalActions) * 100).toFixed(1) : 0;
            return `<tr>
              <td><strong>${(dept.name || 'GENERAL').toUpperCase()}</strong></td>
              <td>${dept.staffCount} Staff</td>
              <td>${dept.totalActions} Actions</td>
              <td style="color:#32FC05; font-weight:700;">${(dept.income || 0).toLocaleString()} RWF</td>
              <td style="text-align:right; font-weight:700;">${share}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    const page2Html = `
      <div class="section-title">Recent Strategic Activity Audit</div>
      <table>
        <thead>
          <tr><th>TIMESTAMP</th><th>EXECUTIVE</th><th>UNIT</th><th>ACTION</th><th>OPERATION DETAILS</th></tr>
        </thead>
        <tbody>
          ${filteredLogs.slice(0, 45).map(log => `
            <tr>
              <td style="color:#666; font-size:9px;">${new Date(log.createdAt).toLocaleString()}</td>
              <td><strong>${log.userName}</strong></td>
              <td><span class="badge badge-blue">${log.department}</span></td>
              <td><span class="badge ${log.action === 'CREATE' ? 'badge-green' : log.action === 'DELETE' ? 'badge-red' : 'badge-blue'}">${log.action}</span></td>
              <td style="font-size:9px; font-style:italic; color:#555;">${log.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    generateReport({
      title: 'Performance Intelligence Audit',
      moduleCode: 'PERF',
      bodyHtml,
      page2Html
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
    setActionFilter('all');
  };

  const hasActiveFilters = searchTerm || departmentFilter !== 'all' || actionFilter !== 'all';

  if (loading) {
    return (
      <div className="admin-page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#32FC05' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Initializing Performance Suite...</p>
        </div>
      </div>
    );
  }

  if (error && !stats.length) {
    return (
      <div className="admin-page animate-fadeIn">
        <Header title="Performance Intelligence" subtitle="Enterprise-grade tracking" />
        <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} color="#dc3545" style={{ marginBottom: '1rem' }} />
          <h3>Unable to Load Performance Data</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchStats(true)}>
            <RefreshCw size={18} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <Header
        title="Performance Intelligence"
        subtitle="Enterprise-grade tracking of hub productivity and service volume."
      />

      {error && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#856404', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>Could not refresh data: {error}. Showing cached results.</span>
          <button className="btn btn-sm" onClick={() => fetchStats(true)} style={{ marginLeft: 'auto', padding: '6px 12px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Treasury Summary Cards */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #32FC05, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TOTAL ACTIONS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{totalActions.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>ACTIVE STAFF</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{activeStaff}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>AVG EFFICIENCY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{avgEfficiency}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TOTAL INCOME</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{showBalances ? `${(totalIncome / 1000).toFixed(0)}K RWF` : '••••••'}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="admin-search-wrapper" style={{ width: '280px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search staff or activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Filter size={18} /> Filters {hasActiveFilters && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>Active</span>}
            </button>

            {hasActiveFilters && (
              <button
                className="btn btn-link"
                onClick={clearFilters}
                style={{ color: '#32FC05', fontWeight: 700, fontSize: '0.8rem', padding: '0', textDecoration: 'underline', cursor: 'pointer', border: 'none', background: 'none' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right Toolbar */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Auto-refresh
            </label>

            <button
              className="btn btn-outline"
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={18} className={isRefreshing ? 'spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <ExportToolbar
              onPDF={handlePrint}
              onExcel={() => exportToExcel([
                {
                  name: 'Staff Performance',
                  rows: stats.map(s => ({
                    Name: s.name,
                    Department: s.department || 'General',
                    'Total Actions': s.totalActions,
                    [`Income (${currency})`]: s.income || 0,
                    [`Expenses (${currency})`]: s.expenses || 0,
                    Sales: s.sales || 0,
                  })),
                },
                {
                  name: 'Activity Logs',
                  rows: rawLogs.slice(0, 500).map(l => ({
                    ID: l.id,
                    Date: new Date(l.createdAt).toLocaleString(),
                    Staff: l.userName,
                    Department: l.department || 'General',
                    Action: l.action,
                    Details: l.details,
                  })),
                },
              ], `Performance_Report_${dateRange.start}_${dateRange.end}`)}
              currency={currency}
              onCurrency={handleCurrencyChange}
              emailSubject={`Staff Performance Report — ${dateRange.start} to ${dateRange.end}`}
              emailHtml={() => `
                <div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto">
                  <div style="background:linear-gradient(135deg,#32FC05,#2E7D32);padding:24px;border-radius:12px;color:white;margin-bottom:20px">
                    <h1 style="margin:0;font-size:20px">DRAVANUA HUB — Staff Performance Report</h1>
                    <p style="margin:8px 0 0;opacity:.8">Period: ${dateRange.start} to ${dateRange.end}</p>
                  </div>
                  <table style="width:100%;border-collapse:collapse">
                    <thead><tr style="background:#32FC05;color:white">
                      <th style="padding:10px;text-align:left">Name</th>
                      <th style="padding:10px;text-align:left">Department</th>
                      <th style="padding:10px;text-align:right">Actions</th>
                      <th style="padding:10px;text-align:right">Income</th>
                    </tr></thead>
                    <tbody>${stats.map((s, i) => `
                      <tr style="background:${i%2===0?'#f9fafb':'white'}">
                        <td style="padding:10px;font-weight:700">${s.name}</td>
                        <td style="padding:10px;color:#666">${s.department || 'General'}</td>
                        <td style="padding:10px;text-align:right">${s.totalActions}</td>
                        <td style="padding:10px;text-align:right;font-weight:700;color:#166534">${fmtAmt(s.income, currency)}</td>
                      </tr>`).join('')}
                    </tbody>
                  </table>
                  <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:20px">DRAVANUA HUB — Confidential Internal Report</p>
                </div>`}
              moduleCode="PFM"
            />
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          marginBottom: '2rem',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #32FC05 0%, #2E7D32 100%)',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Filter size={15} color="rgba(255,255,255,0.85)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Filter Configuration
            </span>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Department Filter */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.65rem', fontWeight: 900, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#32FC05', display: 'inline-block' }} />
                Department
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{
                    width: '100%',
                    appearance: 'none',
                    padding: '10px 36px 10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#f8fafc',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#32FC05'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="all">All Departments</option>
                  {departmentsList.map((dept, idx) => (
                    <option key={`dept-${idx}`} value={dept || ''}>{(dept || 'GENERAL').toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Action Type Filter */}
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.65rem', fontWeight: 900, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0369a1', display: 'inline-block' }} />
                Action Type
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  style={{
                    width: '100%',
                    appearance: 'none',
                    padding: '10px 36px 10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#f8fafc',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0369a1'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="all">All Actions</option>
                  {actionTypes.map((action, idx) => (
                    <option key={`act-${idx}`} value={action || ''}>{action}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Period Configuration */}
            <div style={{ flex: '2', minWidth: '350px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.65rem', fontWeight: 900, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9d174d', display: 'inline-block' }} />
                Period Configuration
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#9d174d'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <span style={{
                  fontSize: '0.6rem', fontWeight: 900, color: 'white',
                  background: '#94a3b8', borderRadius: '6px',
                  padding: '3px 8px', letterSpacing: '0.06em'
                }}>TO</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    background: '#f8fafc',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#9d174d'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departmental Performance */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — DEPARTMENTAL STRATEGIC PERFORMANCE
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              AGGREGATED RESOURCE OUTPUT & FINANCIAL CONTRIBUTION · {filteredDeptStats.length} UNITS
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: '#32FC05' }}>
                {['DEPARTMENT UNIT', 'EXECUTIVES', 'ACTIVITY VOL.', 'INCOME (RWF)', 'EXPENSES (RWF)', 'NET CONTRIBUTION'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: (h.includes('EXECUTIVES') || h.includes('VOL.') || h.includes('INCOME') || h.includes('EXPENSES') || h.includes('NET')) ? 'right' : 'left',
                    whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, #32FC05, #166534)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDeptStats.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    No departmental records match your filters.
                  </td>
                </tr>
              ) : (
                filteredDeptStats.map((dept, idx) => (
                  <tr key={dept.id || idx} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? 'white' : '#fafcfb'
                  }} className="hover-row">
                    <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{(dept.name || 'GENERAL').toUpperCase()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>{dept.staffCount || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>{dept.totalActions || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#32FC05' }}>{(dept.income || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>({(dept.expenses || 0).toLocaleString()})</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 950, color: ((dept.income || 0) - (dept.expenses || 0)) >= 0 ? '#32FC05' : '#dc2626' }}>
                      {((dept.income || 0) - (dept.expenses || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Productivity Table */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — STAFF PRODUCTIVITY RANKING
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              OUTPUT PERFORMANCE & EFFICIENCY METRICS · {filteredStats.length} STAFF MEMBERS
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginBottom: '3px', fontSize: '0.65rem', fontWeight: 700 }}
            >
              {showBalances ? <EyeOff size={12} style={{ display: 'inline', marginRight: '4px' }} /> : <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />}
              {showBalances ? 'Hide' : 'Show'}
            </button>
            <div style={{ color: '#32FC05', marginTop: '3px' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#32FC05' }}>
                {['STAFF NAME', 'DEPARTMENT', 'SALES', 'INCOME (RWF)', 'EXPENSES', 'VOLUME', 'EFFICIENCY', 'ACTIONS'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: (h === 'EFFICIENCY' || h === 'VOLUME' || h === 'INCOME (RWF)' || h === 'EXPENSES') ? 'right' : 'left',
                    whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, #32FC05, #166534)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    No staff members match your current filters.
                    {hasActiveFilters && (
                      <div style={{ marginTop: '1rem' }}>
                        <button className="btn btn-outline" onClick={clearFilters} style={{ padding: '8px 16px', fontSize: '0.75rem' }}>Clear Filters</button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStats.map((user, idx) => {
                  const maxActions = Math.max(...stats.map(s => s.totalActions), 1);
                  const efficiency = (user.totalActions / maxActions) * 100;

                  return (
                    <tr key={user.userId || idx} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafcfb'
                    }} className="hover-row">
                      <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{user.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#f0fdf4', padding: '3px 8px', borderRadius: '4px', border: '1px solid #dcfce7', fontSize: '0.65rem', fontWeight: 800, color: '#166534' }}>
                          {(user.department || 'GENERAL').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#32FC05' }}>{user.sales || 0}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{showBalances ? (user.income || 0).toLocaleString() : '••••••'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{showBalances ? `(${(user.expenses || 0).toLocaleString()})` : '••••••'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>{user.totalActions}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <div style={{ width: '40px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${efficiency}%`, background: '#32FC05', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontWeight: 800, color: '#32FC05', minWidth: '30px' }}>{Math.round(efficiency)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          title={`Send report for ${user.name}`}
                          disabled={sendingReportFor === user.userId}
                          onClick={() => handleSendReport(user.userId, user.name)}
                          style={{
                            padding: '6px 10px',
                            background: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            color: '#32FC05',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {sendingReportFor === user.userId ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            <Mail size={12} />
                          )}
                          {sendingReportFor === user.userId ? 'Sending...' : 'Report'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Activity Stream */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — LIVE ACTIVITY AUDIT STREAM
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              REAL-TIME OPERATIONAL TRACKING · {filteredLogs.length} ENTRIES {autoRefresh && <span style={{ color: '#32FC05', fontWeight: 900 }}>● LIVE</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '900px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#32FC05' }}>
                {['TIMESTAMP', 'EXECUTIVE', 'DEPARTMENT', 'ACTION', 'DETAILS'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: 'left', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, #32FC05, #166534)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    No activity logs match your current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 50).map((log, idx) => (
                  <tr key={log.id || idx} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? 'white' : '#fafcfb'
                  }} className="hover-row">
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{log.userName}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>
                        {log.department}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        background: log.action === 'CREATE' ? '#f0fdf4' : log.action === 'DELETE' ? '#fef2f2' : '#f0f9ff',
                        color: log.action === 'CREATE' ? '#166534' : log.action === 'DELETE' ? '#b91c1c' : '#0c4a6e'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

export default Performance;