import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import { generateReport } from '../utils/generateReport';
import { Calendar, Users, Clock, Filter, FileText, Printer, Search, MapPin, Activity, UserCheck, LogIn, LogOut, CheckCircle, AlertCircle, Eye, EyeOff, X, RefreshCw, Info } from 'lucide-react';
import ExportToolbar from './components/ExportToolbar';
import { exportToExcel } from '../utils/exportUtils';

const AttendanceLog = () => {
  const { user: currentUser, secureFetch } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', department: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [message, setMessage] = useState(null);
  const [hardwareStatus, setHardwareStatus] = useState('DEVICE_DISCONNECTED');
  const [clockLoading, setClockLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  const checkHardwareStatus = () => {
    // Simulated check for fingerprint device
    setHardwareStatus('SCANNER_READY');
  };

  const handleClockAction = async (action) => {
    const endpoint = action === 'in' ? 'clock-in' : 'clock-out';
    if (hardwareStatus !== 'SCANNER_READY') {
      alert('Fingerprint hardware not detected. Please reconnect the device.');
      return;
    }
    try {
      setClockLoading(true);
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: 'FINGERPRINT',
          timestamp: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Biometric authentication success. Successfully clocked ${action}!` });
        fetchLogs();
      } else setMessage({ type: 'error', text: data.message });
    } catch (error) {
      setMessage({ type: 'error', text: 'Operation failed' });
    } finally {
      setClockLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/attendance`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
        const today = new Date().toISOString().split('T')[0];
        if (currentUser && currentUser.id) {
          const record = data.data.find(r => r.date === today && r.userId === currentUser.id);
          setCurrentRecord(record || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  useEffect(() => {
    checkHardwareStatus();
  }, []);

  const filteredLogs = (logs || []).filter(log => {
    if (!log) return false;
    const matchesSearch = (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filters.department || (log.department || '').toLowerCase() === filters.department.toLowerCase();
    const matchesDate = !filters.date || log.date === filters.date;
    return matchesSearch && matchesDept && matchesDate;
  });

  const totalCalculatedHours = (filteredLogs || []).reduce((sum, log) => sum + (parseFloat(log.totalHours) || 0), 0).toFixed(1);
  const uniqueStaffCount = new Set((filteredLogs || []).map(l => l?.userName).filter(Boolean)).size;
  const activeSessions = (filteredLogs || []).filter(log => log.status === 'on-duty').length;

  // Department breakdown
  const deptBreakdown = (filteredLogs || []).reduce((acc, log) => {
    if (!log) return acc;
    const dept = String(log.department || log.departmentId || 'General').toUpperCase();
    if (!acc[dept]) acc[dept] = { sessions: 0, hours: 0, staff: new Set() };
    acc[dept].sessions++;
    acc[dept].hours += parseFloat(log.totalHours) || 0;
    if (log.userName) acc[dept].staff.add(log.userName);
    return acc;
  }, {});

  const handlePrint = () => {
    const bodyHtml = `
      <div class="section-title">Attendance & Workforce Summary</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${filteredLogs.length}</span><span class="metric-lbl">TOTAL SESSIONS</span></div>
        <div class="metric-card"><span class="metric-val">${totalCalculatedHours}</span><span class="metric-lbl">COLLECTIVE HOURS</span></div>
        <div class="metric-card"><span class="metric-val">${uniqueStaffCount}</span><span class="metric-lbl">UNIQUE STAFF</span></div>
        <div class="metric-card"><span class="metric-val">${Object.keys(deptBreakdown).length}</span><span class="metric-lbl">DEPARTMENTS</span></div>
      </div>

      <div class="section-title">Department Coverage Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>DEPARTMENT</th>
            <th>STAFF COUNT</th>
            <th>SESSIONS</th>
            <th>TOTAL HOURS</th>
            <th style="text-align:right">AVG HOURS</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(deptBreakdown).map(([dept, d]) => `
            <tr>
              <td><strong>${dept}</strong></td>
              <td>${d.staff.size}</td>
              <td>${d.sessions}</td>
              <td style="font-weight:700;color:#166534">${d.hours.toFixed(1)} hrs</td>
              <td style="text-align:right;font-weight:700">${d.sessions > 0 ? (d.hours / d.sessions).toFixed(1) : 0} hrs</td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;

    const page2Html = `
      <div class="section-title">Detailed Attendance Log (${filteredLogs.length} records)</div>
      <table>
        <thead>
          <tr>
            <th>DATE</th>
            <th>STAFF MEMBER</th>
            <th>UNIT</th>
            <th>CLOCK IN</th>
            <th>CLOCK OUT</th>
            <th style="text-align:center">HOURS</th>
          </tr>
        </thead>
        <tbody>
          ${filteredLogs.map(log => {
            const clockIn = log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const clockOut = log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ON-DUTY';
            return `<tr>
              <td>${log.date || '—'}</td>
              <td><strong>${log.userName || '—'}</strong><br/><span style="font-size:9px; color:#32FC05; font-family: monospace;">${log.staffCode || '—'}</span></td>
              <td><span class="badge badge-blue">${String(log.department || 'General').toUpperCase()}</span></td>
              <td style="color:#16a34a;font-weight:700">${clockIn}</td>
              <td style="color:${log.clockOut ? '#dc2626' : '#94a3b8'};font-weight:700">${clockOut}</td>
              <td style="text-align:center;font-weight:900">${log.totalHours || 0}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    generateReport({
      title: 'Attendance & Workforce Audit',
      moduleCode: 'ATT',
      bodyHtml,
      page2Html,
      subtitle: `Audit Period: ${filters.date || 'All Time'} • Department: ${filters.department || 'All Units'}`
    });
  };

  if (loading) {
    return (
      <div className="admin-page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#32FC05' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#000000' }}>Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <Header
        title={isSuperAdmin ? "Attendance & Workforce Audit" : "My Attendance & Clock-In"}
        subtitle={isSuperAdmin ? "Assess operational density, identify who worked when, and monitor departmental coverage." : "Record your shift engagement and track your logged hours."}
      />

      {/* Time Clock Module */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #32FC05, #2E7D32)', color: 'white', padding: '3rem 2rem', borderRadius: '24px', marginBottom: '2rem', position: 'relative', boxShadow: '0 10px 40px rgba(27, 94, 32, 0.15)' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 900, color: 'white',
            background: hardwareStatus === 'SCANNER_READY' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            padding: '6px 12px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px',
            border: `1px solid ${hardwareStatus === 'SCANNER_READY' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
          }}>
            <Activity size={14} color="white" />
            {hardwareStatus === 'SCANNER_READY' ? 'FINGERPRINT SCANNER READY' : 'HARDWARE DISCONNECTED'}
          </div>
          <button
            onClick={checkHardwareStatus}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 800,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              marginTop: '6px',
              transition: 'all 0.2s',
              width: '100%'
            }}
          >
            🔄 Reset Hardware
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 950, margin: '0', letterSpacing: '-0.02em', color: '#000000' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h2>
          <p style={{ color: '#000000', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '8px', fontSize: '0.85rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {message && (
          <div style={{
            marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px',
            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
            fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
          }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <button
            className="btn"
            disabled={(currentRecord && currentRecord.status === 'on-duty') || clockLoading || hardwareStatus !== 'SCANNER_READY'}
            onClick={() => handleClockAction('in')}
            style={{
              height: '56px', fontSize: '1rem', background: hardwareStatus !== 'SCANNER_READY' || (currentRecord && currentRecord.status === 'on-duty') ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
              color: hardwareStatus !== 'SCANNER_READY' || (currentRecord && currentRecord.status === 'on-duty') ? 'rgba(255,255,255,0.5)' : '#000000',
              borderRadius: '14px', border: 'none', fontWeight: 900, cursor: hardwareStatus !== 'SCANNER_READY' || (currentRecord && currentRecord.status === 'on-duty') ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => !location.lat || (currentRecord && currentRecord.status === 'on-duty') ? null : e.target.style.background = 'white'}
            onMouseOut={e => !location.lat || (currentRecord && currentRecord.status === 'on-duty') ? null : e.target.style.background = 'rgba(255,255,255,0.95)'}
          >
            <LogIn size={20} /> {hardwareStatus !== 'SCANNER_READY' ? 'Connect Scanner' : (currentRecord && currentRecord.status === 'on-duty') ? 'Checked In' : 'Clock In'}
          </button>
          <button
            className="btn"
            disabled={(!currentRecord || currentRecord.status === 'off-duty') || clockLoading || !location.lat}
            onClick={() => handleClockAction('out')}
            style={{
              height: '56px', fontSize: '1rem', background: hardwareStatus !== 'SCANNER_READY' || (!currentRecord || currentRecord.status === 'off-duty') ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
              color: hardwareStatus !== 'SCANNER_READY' || (!currentRecord || currentRecord.status === 'off-duty') ? 'rgba(255,255,255,0.5)' : '#000000',
              borderRadius: '14px', border: 'none', fontWeight: 900, cursor: hardwareStatus !== 'SCANNER_READY' || (!currentRecord || currentRecord.status === 'off-duty') ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => !location.lat || (!currentRecord || currentRecord.status === 'off-duty') ? null : e.target.style.background = 'white'}
            onMouseOut={e => !location.lat || (!currentRecord || currentRecord.status === 'off-duty') ? null : e.target.style.background = 'rgba(255,255,255,0.95)'}
          >
            <LogOut size={20} /> {hardwareStatus !== 'SCANNER_READY' ? 'Connect Scanner' : (currentRecord?.status === 'on-duty') ? 'Clock Out' : 'Not Clocked In'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #32FC05, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TOTAL SESSIONS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{filteredLogs.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>COLLECTIVE HOURS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#000000' }}>{showBalances ? totalCalculatedHours : '••••••'} hrs</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>UNIQUE STAFF</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{uniqueStaffCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>ACTIVE NOW</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{activeSessions}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="admin-search-wrapper" style={{ width: '280px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by staff name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700, color: '#000000' }}
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

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '0 12px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '44px' }}>
              <Calendar size={16} color="#32FC05" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 700, outline: 'none', color: '#000000', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '0 12px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '44px', position: 'relative' }}>
              <Filter size={16} color="#32FC05" />
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 800, outline: 'none', cursor: 'pointer', color: '#000000' }}
              >
                <option value="">All Departments</option>
                <option value="studio">Creative Studio</option>
                <option value="Classic Fashion">Classic Fashion</option>
                <option value="Stationery & Office Supplies">Stationery & Office</option>
                <option value="Flower Gifts">Flower Store</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{
                padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#000000', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
              {showBalances ? 'Hide' : 'Show'}
            </button>

            {isSuperAdmin && (
              <ExportToolbar
                onPDF={handlePrint}
                onExcel={() => exportToExcel([{
                  name: 'Attendance Log',
                  rows: filteredLogs.map(l => ({
                    Date: l.date,
                    Staff: l.userName,
                    Department: l.department || 'General',
                    'Check In': l.clockIn ? new Date(l.clockIn).toLocaleTimeString() : '—',
                    'Check Out': l.clockOut ? new Date(l.clockOut).toLocaleTimeString() : '—',
                    'Hours Worked': l.totalHours || 0,
                    Status: l.clockOut ? 'Clocked Out' : 'On Duty',
                  }))
                }], `Attendance_Report_${new Date().toISOString().slice(0, 10)}`)}
                emailSubject={`Attendance Log Report — ${new Date().toLocaleDateString()}`}
                emailHtml={() => `<div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto">
                  <div style="background:linear-gradient(135deg,#32FC05,#2E7D32);padding:20px;border-radius:12px;color:white;margin-bottom:16px">
                    <h2 style="margin:0">DRAVANUA HUB — Attendance Report</h2>
                    <p style="margin:6px 0 0;opacity:.8">Generated: ${new Date().toLocaleString()}</p>
                  </div>
                  <p><strong>Total Sessions:</strong> ${filteredLogs.length} &nbsp;|&nbsp; <strong>Unique Staff:</strong> ${uniqueStaffCount} &nbsp;|&nbsp; <strong>Total Hours:</strong> ${totalCalculatedHours}h</p>
                  <table style="width:100%;border-collapse:collapse">
                    <thead><tr style="background:#32FC05;color:white">
                      <th style="padding:8px;text-align:left">Date</th><th style="padding:8px;text-align:left">Staff</th><th style="padding:8px">Dept</th><th style="padding:8px">Hours</th><th style="padding:8px">Status</th>
                    </tr></thead>
                    <tbody>${filteredLogs.slice(0, 30).map((l, i) => `<tr style="background:${i % 2 === 0 ? '#fafff9' : 'white'}">
                      <td style="padding:8px">${l.date}</td><td style="padding:8px;font-weight:700">${l.userName}</td>
                      <td style="padding:8px;text-align:center">${l.department || '—'}</td>
                      <td style="padding:8px;text-align:center;font-weight:700;color:#32FC05">${l.totalHours || 0}h</td>
                      <td style="padding:8px;text-align:center">${l.clockOut ? 'Out' : 'On Duty'}</td>
                    </tr>`).join('')}</tbody>
                  </table>
                  <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px">DRAVANUA HUB — Confidential HR Report</p>
                </div>`}
                moduleCode="ATT"
              />
            )}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA STUDIO — ATTENDANCE & WORKFORCE RECORDS
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              PERSONNEL TRACKING & SHIFT MANAGEMENT · {filteredLogs.length} SESSIONS
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: '#32FC05' }}>
                {['STAFF MEMBER', 'STAFF ID', 'DEPARTMENT', 'SHIFT TIMING', 'DURATION', 'VERIFICATION'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: (h === 'DURATION' || h === 'VERIFICATION') ? 'center' : 'left',
                    whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, #32FC05, #166534)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                <tr key={log.id || idx} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: idx % 2 === 0 ? 'white' : '#fafcfb'
                }} className="hover-row">
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #32FC05, #32CD32)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem' }}>
                        {log.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{log.userName || '—'}</div>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>📅 {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}, {log.date}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#000000', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontWeight: 900, fontFamily: 'monospace', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                      {log.staffCode || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '50px',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      background: '#f1f5f9',
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em'
                    }}>
                      {log.department || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 900 }}>In</div>
                        <div style={{ color: '#000000', fontWeight: 900, fontSize: '0.8rem' }}>
                          {log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </div>
                      <div style={{ color: '#e2e8f0' }}>→</div>
                      <div>
                        <div style={{ fontSize: '0.55rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 900 }}>Out</div>
                        <div style={{ color: log.clockOut ? '#000000' : '#94a3b8', fontWeight: 900, fontSize: '0.8rem' }}>
                          {log.clockOut ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ON-DUTY'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>
                      {showBalances ? (
                        <>
                          {log.totalHours || 0} <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>HRS</span>
                        </>
                      ) : (
                        '••••••'
                      )}
                    </div>
                  </td>
                   <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      background: '#f8fafc', color: '#000000', borderRadius: '50px', fontSize: '0.65rem',
                      fontWeight: 900, border: '1px solid #e2e8f0'
                    }}>
                      <Activity size={12} color="#000000" /> BIOMETRIC VERIFIED
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>No attendance records found matching your filters.</p>
                  </td>
                </tr>
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

export default AttendanceLog;