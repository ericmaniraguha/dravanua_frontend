import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, Users, CreditCard, Calendar, FileText,
  CheckCircle, Clock, AlertCircle, Search, Filter, Plus,
  Save, Download, ChevronRight, RefreshCw, X, Check,
  Printer, Mail, Bell, BellRing, CalendarIcon, Edit, Trash2, Info, TrendingUp
} from 'lucide-react';
import ExportToolbar from './components/ExportToolbar';
import { generateReport } from '../utils/generateReport';

const PayrollManagement = () => {
  const { secureFetch, user } = useAuth();

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

  const handleNumericChange = (setter, state, field, value) => {
    const cleanValue = stripCommas(value);
    if (cleanValue === '') {
      setter({ ...state, [field]: '' });
      return;
    }
    
    // Prevent negative values
    if (cleanValue.startsWith('-')) return;

    if (/^\d*\.?\d*$/.test(cleanValue)) {
      // Remove leading zeros
      let finalValue = cleanValue;
      if (finalValue.length > 1 && finalValue.startsWith('0') && !finalValue.startsWith('0.')) {
        finalValue = finalValue.replace(/^0+/, '');
        if (finalValue === '') finalValue = '0';
      }
      setter({ ...state, [field]: finalValue });
    }
  };

  const [activeTab, setActiveTab] = useState('processing'); // 'processing', 'structures', 'advances'
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [salaryData, setSalaryData] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Start of month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBalances, setShowBalances] = useState(true);

  // Summary Statistics
  const [summaryData, setSummaryData] = useState({
    totalGrossPayout: 0,
    totalDeductions: 0,
    totalNetPayout: 0,
    staffProcessed: 0,
    pendingAdvances: 0,
    approvedAdvances: 0,
    averageSalary: 0,
    paymentStability: 0
  });

  // Modal States
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [editFormData, setEditFormData] = useState({
    baseSalary: '',
    allowance: '',
    deductions: '',
    bankName: '',
    accountNumber: '',
    paymentCycle: 'Monthly',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const [advanceForm, setAdvanceForm] = useState({
    userId: '',
    amount: '',
    reason: '',
    requestDate: new Date().toISOString().split('T')[0],
    repaymentDate: ''
  });

  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    reminderDate: new Date().toISOString().split('T')[0],
    reminderTime: '09:00',
    priority: 'Normal',
    sendToAll: false
  });

  // Fetch Functions
  const fetchSalaryStructures = async () => {
    setLoadingStructures(true);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/structures`);
      const data = await res.json();
      if (data.success) setSalaryData(data.data);
    } catch (err) {
      console.error('Salary Structures Fetch Error:', err);
      setError('Failed to load salary structures.');
    } finally {
      setLoadingStructures(false);
    }
  };

  const fetchPayrollRecords = async () => {
    setLoadingPayroll(true);
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/records?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      if (data.success) {
        setPayrollRecords(data.data);
        calculateSummary(data.data, advances);
      }
    } catch (err) {
      console.error('Payroll Records Fetch Error:', err);
      setError('Failed to load payroll records.');
    } finally {
      setLoadingPayroll(false);
    }
  };

  const fetchAdvances = async () => {
    setLoadingAdvances(true);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/advances`);
      const data = await res.json();
      if (data.success) {
        setAdvances(data.data);
        calculateSummary(payrollRecords, data.data);
      }
    } catch (err) {
      console.error('Advances Fetch Error:', err);
      setError('Failed to load salary advances.');
    } finally {
      setLoadingAdvances(false);
    }
  };

  const calculateSummary = (records, advancesList) => {
    const totalGross = records.reduce((sum, r) => sum + (parseFloat(r.baseAmount) || 0) + (parseFloat(r.allowances) || 0), 0);
    const totalDeduct = records.reduce((sum, r) => sum + (parseFloat(r.deductions) || 0), 0);
    const totalNet = records.reduce((sum, r) => sum + (parseFloat(r.netAmount) || 0), 0);
    const pendingAdv = (advancesList || []).filter(a => a.status === 'Pending').length;
    const approvedAdv = (advancesList || []).filter(a => a.status === 'Approved').length;

    setSummaryData({
      totalGrossPayout: totalGross,
      totalDeductions: totalDeduct,
      totalNetPayout: totalNet,
      staffProcessed: records.length,
      pendingAdvances: pendingAdv,
      approvedAdvances: approvedAdv,
      averageSalary: records.length > 0 ? totalNet / records.length : 0,
      paymentStability: totalGross > 0 ? (totalNet / totalGross).toFixed(2) : 0
    });
  };

  useEffect(() => {
    if (activeTab === 'structures') {
      fetchSalaryStructures();
    } else if (activeTab === 'advances') {
      fetchAdvances();
      fetchSalaryStructures();
    } else {
      fetchPayrollRecords();
    }
  }, [activeTab, startDate, endDate]);

  // Update Handlers
  const handleUpdateStructure = async (e) => {
    e.preventDefault();
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedStaff.id,
          ...editFormData,
          baseSalary: parseFloat(editFormData.baseSalary),
          allowance: parseFloat(editFormData.allowance || 0),
          deductions: parseFloat(editFormData.deductions || 0)
        })
      });
      if (res.ok) {
        setIsStructureModalOpen(false);
        fetchSalaryStructures();
      }
    } catch (err) {
      console.error('Update Structure Error:', err);
    }
  };

  const handleRequestAdvance = async (e) => {
    e.preventDefault();
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...advanceForm,
          amount: parseFloat(advanceForm.amount)
        })
      });
      if (res.ok) {
        setIsAdvanceModalOpen(false);
        fetchAdvances();
        setAdvanceForm({
          userId: '',
          amount: '',
          reason: '',
          requestDate: new Date().toISOString().split('T')[0],
          repaymentDate: ''
        });
      }
    } catch (err) {
      console.error('Advance Request Error:', err);
    }
  };

  const updateAdvanceStatus = async (id, status) => {
    if (!window.confirm(`Mark this advance as ${status}?`)) return;
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/advances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchAdvances();
    } catch (err) {
      console.error('Update Advance Status Error:', err);
    }
  };

  const generateNewPayroll = async () => {
    if (!window.confirm(`Generate payroll records for ${period.month}/${period.year}?`)) return;
    setLoadingPayroll(true);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(period)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.count === 0) {
          setError('No records generated! Please ensure staff members have active Salary Contracts (Structures) defined first.');
        } else {
          setSuccessMsg(`Payroll generated successfully for ${data.count} staff members.`);
        }
        fetchPayrollRecords();
      } else {
        setError(data.error || 'Failed to generate payroll.');
      }
    } catch (err) {
      console.error('Generate Payroll Error:', err);
      setError('Failed to generate payroll due to a server error.');
    } finally {
      setLoadingPayroll(false);
    }
  };

  const updateRecordStatus = async (id, status) => {
    const action = status === 'Paid' ? 'mark as PAID and create expense' : `mark as ${status}`;
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/payroll/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccessMsg(`Payroll status updated to ${status}.`);
        fetchPayrollRecords();
      }
    } catch (err) {
      console.error('Update Record Status Error:', err);
      setError('Failed to update payroll status.');
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderForm)
      });
      if (res.ok) {
        setIsReminderModalOpen(false);
        setReminderForm({
          title: '',
          description: '',
          reminderDate: new Date().toISOString().split('T')[0],
          reminderTime: '09:00',
          priority: 'Normal',
          sendToAll: false
        });
      }
    } catch (err) {
      console.error('Create Reminder Error:', err);
    }
  };

  const handlePrint = () => {
    const formatNum = (v) => Number(v || 0).toLocaleString();

    const metricsHtml = `
      <div class="section-title">Payroll Processing Summary</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val">${formatNum(summaryData.totalGrossPayout)} RWF</span>
          <span class="metric-lbl">GROSS PERSONNEL LIABILITY</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color:#d32f2f;">${formatNum(summaryData.totalDeductions)} RWF</span>
          <span class="metric-lbl">TOTAL DEDUCTIONS</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color:#32FC05;">${formatNum(summaryData.totalNetPayout)} RWF</span>
          <span class="metric-lbl">NET SALARY DISBURSEMENT</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.staffProcessed}</span>
          <span class="metric-lbl">STAFF PROCESSED</span>
        </div>
      </div>

      <div class="section-title">Operational Metrics</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val">${formatNum(summaryData.averageSalary)} RWF</span>
          <span class="metric-lbl">AVERAGE SALARY</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.paymentStability}x</span>
          <span class="metric-lbl">PAYMENT RATIO</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.pendingAdvances}</span>
          <span class="metric-lbl">PENDING ADVANCES</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.approvedAdvances}</span>
          <span class="metric-lbl">APPROVED ADVANCES</span>
        </div>
      </div>
    `;

    const tableHtml = `
      <div class="section-title">Staff Compensation Audit</div>
      <table>
        <thead>
          <tr>
            <th>STAFF NAME</th>
            <th>BASE SALARY</th>
            <th>ALLOWANCES</th>
            <th>DEDUCTIONS</th>
            <th>NET AMOUNT</th>
            <th style="text-align:right;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${payrollRecords.map(r => `
            <tr>
              <td><strong>${r.AdminUser?.name}</strong><br/><span style="font-size:9px; color:#666;">${r.AdminUser?.staffCode}</span></td>
              <td>${formatNum(r.baseAmount)} RWF</td>
              <td>${formatNum(r.allowances)} RWF</td>
              <td>${formatNum(r.deductions)} RWF</td>
              <td><strong>${formatNum(r.netAmount)} RWF</strong></td>
              <td style="text-align:right;">
                <span class="badge ${r.status === 'Paid' ? 'badge-green' : 'badge-blue'}">${(r.status || '').toUpperCase()}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Outstanding Salary Advances</div>
      <table>
        <thead>
          <tr>
            <th>STAFF NAME</th>
            <th>ADVANCE AMOUNT</th>
            <th>REASON</th>
            <th style="text-align:right;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${advances.map(adv => `
            <tr>
              <td><strong>${adv.AdminUser?.name}</strong></td>
              <td><strong>${formatNum(adv.amount)} RWF</strong></td>
              <td style="font-style:italic;">${adv.reason || 'Not Specified'}</td>
              <td style="text-align:right;">
                <span class="badge badge-blue">${(adv.status || '').toUpperCase()}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    generateReport({
      title: 'Payroll Intelligence & Personnel Audit',
      moduleCode: 'PAY',
      bodyHtml: metricsHtml + tableHtml
    });
  };

  const filteredStaff = React.useMemo(() => {
    return salaryData.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salaryData, searchTerm]);

  const formatValue = (num) => {
    return `${Math.round(parseFloat(num) || 0).toLocaleString()} RWF`;
  };

  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => { setError(''); setSuccessMsg(''); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  if ((loadingPayroll || loadingStructures || loadingAdvances) && payrollRecords.length === 0 && salaryData.length === 0)
    return <div className="admin-page center"><RefreshCw className="spin" /></div>;

  return (
    <div className="admin-page animate-fadeIn" style={{ position: 'relative' }}>
      
      {/* Toast Notifications */}
      {(successMsg || error) && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          padding: '16px 24px', borderRadius: '12px', color: 'white',
          background: error ? '#ef4444' : '#10b981',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideInRight 0.3s ease-out forwards'
        }}>
          {error ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{error || successMsg}</span>
          <button onClick={() => { setError(''); setSuccessMsg(''); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '10px' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <Header title="Payroll & Personnel Management" subtitle="Compensation processing, salary structures, and advance management." />

      {/* Treasury Summary Card */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #32FC05, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>GROSS PAYOUT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{showBalances ? formatValue(summaryData.totalGrossPayout) : '••••••'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>DEDUCTIONS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFCDD2' }}>{showBalances ? formatValue(summaryData.totalDeductions) : '••••••'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>NET PAYOUT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{showBalances ? formatValue(summaryData.totalNetPayout) : '••••••'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>STAFF PROCESSED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.staffProcessed}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Context:</span>
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '14px' }}>
              {[
                { id: 'processing', label: 'Processing', icon: <RefreshCw size={14} /> },
                { id: 'structures', label: 'Contracts', icon: <FileText size={14} /> },
                { id: 'advances', label: 'Advances', icon: <CreditCard size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeTab === tab.id ? 'white' : 'transparent',
                    color: activeTab === tab.id ? '#32FC05' : '#64748b',
                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {activeTab === 'processing' && (
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
            )}

            <ExportToolbar
              emailSubject="DRAVANUA — Payroll Processing Report"
              emailHtml={() => generateEmailHtml(summaryData, payrollRecords)}
              onPDF={handlePrint}
              moduleCode="PAY"
            />
            <div style={{ width: '1px', height: '24px', background: '#f1f5f9', margin: '0 5px' }}></div>

            {activeTab === 'processing' ? (
              <button
                onClick={generateNewPayroll}
                className="btn btn-primary"
                style={{ height: '44px', padding: '0 25px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Plus size={18} /> Generate Payroll
              </button>
            ) : activeTab === 'advances' ? (
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="btn btn-primary"
                style={{ height: '44px', padding: '0 25px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Plus size={18} /> New Advance
              </button>
            ) : (
              <div className="admin-search-wrapper" style={{ width: '280px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Tab */}
      {activeTab === 'processing' && (
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                DRAVANUA STUDIO — PAYROLL PROCESSING {new Date().getFullYear()}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
                PERSONNEL COMPENSATION · {payrollRecords.length} RECORD{payrollRecords.length !== 1 ? 'S' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
              <div>Period: {new Date(0, period.month - 1).toLocaleString('default', { month: 'long' })} {period.year}</div>
              <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#32FC05' }}>
                  {['STAFF NAME', 'STAFF CODE', 'BASE SALARY', 'ALLOWANCES', 'DEDUCTIONS', 'NET AMOUNT', 'ATTENDANCE', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: (h === 'ACTIONS' || h === 'STATUS' || h === 'NET AMOUNT') ? 'right' : 'left',
                      whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                      background: 'linear-gradient(180deg, #32FC05, #166534)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrollRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                      No payroll records generated for this cycle. Click "Generate Payroll" to create records.
                    </td>
                  </tr>
                ) : (
                  payrollRecords.map((item, idx) => (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafcfb'
                    }} className="hover-row">
                      <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{item.AdminUser?.name}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.7rem', color: '#475569' }}>{item.AdminUser?.staffCode}</td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{formatValue(item.baseAmount)}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#32FC05' }}>+{formatValue(item.allowances)}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#dc2626' }}>-{formatValue(item.deductions)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#32FC05', fontSize: '0.8rem' }}>{formatValue(item.netAmount)}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.daysWorked > 0 ? '#32CD32' : '#cbd5e1' }}></div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{item.daysWorked} days</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          background: item.status === 'Paid' ? '#e8f5e9' : item.status === 'Approved' ? '#e3f2fd' : '#fff3e0',
                          color: item.status === 'Paid' ? '#2e7d32' : item.status === 'Approved' ? '#1565c0' : '#e65100'
                        }}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => { setSelectedRecord(item); setIsDetailsModalOpen(true); }}
                            title="View Details"
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            <Info size={14} />
                          </button>
                          {item.status === 'Pending' && (
                            <button
                              onClick={() => updateRecordStatus(item.id, 'Approved')}
                              style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', color: '#32FC05' }}
                            >
                              Approve
                            </button>
                          )}
                          {item.status === 'Approved' && (
                            <button
                              onClick={() => updateRecordStatus(item.id, 'Paid')}
                              style={{ padding: '4px 10px', background: '#32FC05', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                              Disburse
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReminderForm({
                                ...reminderForm,
                                title: `Payroll: ${item.AdminUser?.name}`,
                                description: `Disburse ${formatValue(item.netAmount)} to ${item.AdminUser?.name}`
                              });
                              setIsReminderModalOpen(true);
                            }}
                            style={{ padding: '4px 6px', background: 'white', border: '1px solid #e2e8f0', color: '#32FC05', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            <Bell size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advances Tab */}
      {activeTab === 'advances' && (
        <>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>Salary Advances Pool</h2>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              style={{ background: '#32FC05', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              + New Advance
            </button>
          </div>

          <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem' }}>
              <thead style={{ background: '#32FC05' }}>
                <tr>
                  {['STAFF NAME', 'AMOUNT', 'REASON', 'REQUEST DATE', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: (h === 'ACTIONS' || h === 'AMOUNT') ? 'right' : 'left',
                      whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                      background: 'linear-gradient(180deg, #32FC05, #166534)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {advances.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No advance requests found.</td></tr>
                ) : (
                  advances.map((adv, idx) => (
                    <tr key={adv.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafcfb'
                    }} className="hover-row">
                      <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{adv.AdminUser?.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#32FC05' }}>{formatValue(adv.amount)}</td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', color: '#475569' }}>{adv.reason || '—'}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>{new Date(adv.requestDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900,
                          background: adv.status === 'Settled' ? '#f1f5f9' : adv.status === 'Approved' ? '#e3f2fd' : '#fff3e0',
                          color: adv.status === 'Settled' ? '#64748b' : adv.status === 'Approved' ? '#1565c0' : '#e65100'
                        }}>
                          {adv.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {adv.status === 'Pending' && (
                            <button
                              onClick={() => updateAdvanceStatus(adv.id, 'Approved')}
                              style={{ padding: '4px 10px', background: '#32FC05', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setReminderForm({
                                ...reminderForm,
                                title: `Advance Follow-up: ${adv.AdminUser?.name}`,
                                description: `Review repayment of ${formatValue(adv.amount)} from ${adv.AdminUser?.name}`
                              });
                              setIsReminderModalOpen(true);
                            }}
                            style={{ padding: '4px 6px', background: 'white', border: '1px solid #e2e8f0', color: '#32FC05', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            <Bell size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Structures Tab */}
      {activeTab === 'structures' && (
        <>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f1f5f9', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              />
            </div>
            <button style={{ padding: '10px 15px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#64748b' }}>
              <Filter size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredStaff.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', padding: '1.5rem', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', color: '#32FC05', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem' }}>
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{s.name}</h3>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, margin: 0 }}>{s.role.replace('_', ' ')}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Base Salary</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1e293b' }}>{formatValue(s.SalaryStructure?.baseSalary || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Payment Cycle</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#32FC05' }}>{s.SalaryStructure?.paymentCycle || 'Not Set'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedStaff(s);
                    setEditFormData({
                      baseSalary: s.SalaryStructure?.baseSalary || '',
                      allowance: s.SalaryStructure?.allowance || '',
                      deductions: s.SalaryStructure?.deductions || '',
                      bankName: s.SalaryStructure?.bankName || '',
                      accountNumber: s.SalaryStructure?.accountNumber || '',
                      paymentCycle: s.SalaryStructure?.paymentCycle || 'Monthly',
                      effectiveDate: s.SalaryStructure?.effectiveDate ? new Date(s.SalaryStructure.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    });
                    setIsStructureModalOpen(true);
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Edit size={14} /> Configure Contract
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Salary Structure Modal */}
      {isStructureModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #32FC05 0%, #32CD32 100%)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Contract Config</h2>
                <button onClick={() => setIsStructureModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Compensation structure for {selectedStaff?.name}</p>
            </div>

            <form onSubmit={handleUpdateStructure} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Base Salary</label>
                  <input
                    type="text"
                    value={addCommas(editFormData.baseSalary)}
                    onChange={e => handleNumericChange(setEditFormData, editFormData, 'baseSalary', e.target.value)}
                    placeholder="Amount"
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Payment Cycle</label>
                  <select
                    value={editFormData.paymentCycle}
                    onChange={e => setEditFormData({ ...editFormData, paymentCycle: e.target.value })}
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Allowances</label>
                  <input
                    type="text"
                    value={addCommas(editFormData.allowance)}
                    onChange={e => handleNumericChange(setEditFormData, editFormData, 'allowance', e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Deductions</label>
                  <input
                    type="text"
                    value={addCommas(editFormData.deductions)}
                    onChange={e => handleNumericChange(setEditFormData, editFormData, 'deductions', e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Effective Date</label>
                <input
                  type="date"
                  value={editFormData.effectiveDate}
                  onChange={e => setEditFormData({ ...editFormData, effectiveDate: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, color: '#32FC05' }}
                />
              </div>

              <button type="submit" style={{ marginTop: '1rem', background: '#32FC05', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Save size={18} /> Commit Structure
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Advance Request Modal */}
      {isAdvanceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Request Advance</h2>
              <button onClick={() => setIsAdvanceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleRequestAdvance} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Select Staff Member</label>
                <select
                  required
                  value={advanceForm.userId}
                  onChange={e => setAdvanceForm({ ...advanceForm, userId: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                >
                  <option value="">-- Choose Staff --</option>
                  {salaryData.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Amount (RWF)</label>
                  <input
                    type="text"
                    required
                    value={addCommas(advanceForm.amount)}
                    onChange={e => handleNumericChange(setAdvanceForm, advanceForm, 'amount', e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Request Date</label>
                  <input
                    type="date"
                    required
                    value={advanceForm.requestDate}
                    onChange={e => setAdvanceForm({ ...advanceForm, requestDate: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', fontWeight: 800, color: '#32FC05' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Repayment Expected Date</label>
                <input
                  type="date"
                  required
                  value={advanceForm.repaymentDate}
                  onChange={e => setAdvanceForm({ ...advanceForm, repaymentDate: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Reason / Description</label>
                <textarea
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="Explain the advance request"
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: '80px', fontSize: '0.85rem' }}
                ></textarea>
              </div>
              <button type="submit" style={{ background: '#32FC05', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <CreditCard size={18} /> Submit Advance Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', background: '#32FC05', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Set Payroll Reminder</h3>
              <button onClick={() => setIsReminderModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateReminder} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Reminder Title" required value={reminderForm.title} onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }} />
              <textarea placeholder="Description" value={reminderForm.description} onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Date</label>
                  <input type="date" required value={reminderForm.reminderDate} onChange={e => setReminderForm({ ...reminderForm, reminderDate: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Time</label>
                  <input type="time" required value={reminderForm.reminderTime} onChange={e => setReminderForm({ ...reminderForm, reminderTime: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </div>
              </div>
              <button type="submit" style={{ background: '#32FC05', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Set Reminder</button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #32FC05 0%, #32CD32 100%)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Payroll Details</h2>
                <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Staff Name</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#32FC05' }}>{selectedRecord.AdminUser?.name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>STAFF CODE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{selectedRecord.AdminUser?.staffCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>DAYS WORKED</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedRecord.daysWorked}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#e2e8f0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>BASE SALARY</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{formatValue(selectedRecord.baseAmount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>ALLOWANCES</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#32FC05' }}>+{formatValue(selectedRecord.allowances)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>DEDUCTIONS</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#dc2626' }}>-{formatValue(selectedRecord.deductions)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>NET AMOUNT</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 1000, color: '#32FC05' }}>{formatValue(selectedRecord.netAmount)}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#e2e8f0' }}></div>

              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>STATUS</div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  background: selectedRecord.status === 'Paid' ? '#e8f5e9' : selectedRecord.status === 'Approved' ? '#e3f2fd' : '#fff3e0',
                  color: selectedRecord.status === 'Paid' ? '#2e7d32' : selectedRecord.status === 'Approved' ? '#1565c0' : '#e65100'
                }}>
                  {selectedRecord.status.toUpperCase()}
                </div>
              </div>

              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: '#32FC05', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '1rem' }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const generateEmailHtml = (summary, records) => {
  const formatNum = (v) => Number(v || 0).toLocaleString();
  return `
    <div style="font-family: sans-serif; color: #1e293b; max-width: 600px;">
      <h2 style="color: #32FC05; border-bottom: 2px solid #32FC05; padding-bottom: 10px;">Payroll Summary Report</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b;">NET DISBURSEMENT</div>
          <div style="font-size: 20px; font-weight: bold; color: #32FC05;">${formatNum(summary.totalNetPayout)} RWF</div>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <div style="font-size: 12px; color: #64748b;">STAFF PROCESSED</div>
          <div style="font-size: 20px; font-weight: bold;">${summary.staffProcessed} Members</div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #32FC05; color: white;">
            <th style="padding: 10px; text-align: left;">Staff</th>
            <th style="padding: 10px; text-align: right;">Net Amount</th>
            <th style="padding: 10px; text-align: right;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px;">${r.AdminUser?.name}</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${formatNum(r.netAmount)} RWF</td>
              <td style="padding: 10px; text-align: right;">${(r.status || '').toUpperCase()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
        This is an automated personnel audit from Dra Vanua Hub. Confidentiality Required.
      </p>
    </div>
  `;
};

export default PayrollManagement;