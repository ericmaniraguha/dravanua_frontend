import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import {
  TrendingDown, Landmark, ArrowUpRight, ArrowDownRight,
  Plus, RefreshCw, X, Save, History, DollarSign,
  PieChart, ShieldCheck, Printer, Mail, Bell, Calendar,
  Clock, Info, Edit, Trash2, Eye, EyeOff, Filter, Search
} from 'lucide-react';
import ExportToolbar from './components/ExportToolbar';
import { generateReport } from '../utils/generateReport';

const OrganizationalFinance = () => {
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

  const handleNumericChange = (field, value, isFloat = true) => {
    const cleanValue = stripCommas(value);
    if (cleanValue === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    // Prevent negative signs in numeric inputs (except for specifically signed fields)
    if (cleanValue.startsWith('-')) return;

    if (isFloat) {
      if (/^\d*\.?\d*$/.test(cleanValue)) {
        let finalValue = cleanValue;
        // Remove leading zeros for non-float parts
        if (finalValue.length > 1 && finalValue.startsWith('0') && !finalValue.startsWith('0.')) {
          finalValue = finalValue.replace(/^0+/, '');
          if (finalValue === '') finalValue = '0';
        }
        setFormData(prev => ({ ...prev, [field]: finalValue }));
      }
    } else {
      if (/^\d*$/.test(cleanValue)) {
        let finalValue = cleanValue;
        if (finalValue.length > 1 && finalValue.startsWith('0')) {
          finalValue = finalValue.replace(/^0+/, '');
          if (finalValue === '') finalValue = '0';
        }
        setFormData(prev => ({ ...prev, [field]: finalValue }));
      }
    }
  };

  const [activeView, setActiveView] = useState('loans'); // 'loans' or 'savings'
  const [loading, setLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [overview, setOverview] = useState({ totalLoans: 0, totalSavings: 0 });
  const [loans, setLoans] = useState([]);
  const [savings, setSavings] = useState([]);

  // Summary Statistics
  const [summaryData, setSummaryData] = useState({
    totalLoans: 0,
    totalSavings: 0,
    netLiquidity: 0,
    loanCount: 0,
    savingsCount: 0,
    activeLoans: 0,
    averageLoanAmount: 0,
    debtToReserveRatio: 0
  });

  // Modal States
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const [formData, setFormData] = useState({
    loanName: '',
    lender: '',
    principalAmount: '',
    interestRate: '',
    termMonths: '',
    monthlyInstallment: '',
    accountName: '',
    bankName: '',
    accountNumber: '',
    currentBalance: '',
    purpose: '',
    amount: '',
    description: '',
    type: ''
  });

  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    reminderDate: new Date().toISOString().split('T')[0],
    reminderTime: '09:00',
    priority: 'Normal',
    sendToAll: false
  });

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const respOverview = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/overview`);
      const respLoans = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/loans`);
      const respSavings = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/savings`);

      const ov = await respOverview.json();
      const ln = await respLoans.json();
      const sv = await respSavings.json();

      if (ov.success) {
        setOverview(ov.data);
      }
      if (ln.success) {
        setLoans(ln.data);
      }
      if (sv.success) {
        setSavings(sv.data);
      }

      // Calculate summary statistics
      calculateSummary(ln.data || [], sv.data || []);
    } catch (err) {
      console.error('Finance Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (loansList, savingsList) => {
    const totalL = loansList.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
    const totalS = savingsList.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    const activeL = loansList.filter(l => l.status === 'Active').length;
    const avgLoan = loansList.length > 0 ? loansList.reduce((sum, l) => sum + (l.principalAmount || 0), 0) / loansList.length : 0;

    setSummaryData({
      totalLoans: totalL,
      totalSavings: totalS,
      netLiquidity: totalS - totalL,
      loanCount: loansList.length,
      savingsCount: savingsList.length,
      activeLoans: activeL,
      averageLoanAmount: avgLoan,
      debtToReserveRatio: totalS > 0 ? (totalL / totalS).toFixed(2) : 0
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Functions
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!formData.loanName || !formData.lender || !formData.principalAmount || !formData.monthlyInstallment) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          principalAmount: parseFloat(formData.principalAmount),
          interestRate: parseFloat(formData.interestRate || 0),
          termMonths: parseInt(formData.termMonths || 0),
          monthlyInstallment: parseFloat(formData.monthlyInstallment)
        })
      });
      if (res.ok) {
        setIsLoanModalOpen(false);
        resetFormData();
        fetchData();
      }
    } catch (err) {
      console.error('Create Loan Error:', err);
    }
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    if (!formData.amount) {
      alert('Please enter repayment amount');
      return;
    }
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/loans/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedItem.id,
          amount: parseFloat(formData.amount),
          description: formData.description
        })
      });
      if (res.ok) {
        setIsRepayModalOpen(false);
        resetFormData();
        fetchData();
      }
    } catch (err) {
      console.error('Repay Error:', err);
    }
  };

  const handleCreateSavings = async (e) => {
    e.preventDefault();
    if (!formData.accountName || !formData.currentBalance) {
      alert('Please fill in required fields');
      return;
    }
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/savings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentBalance: parseFloat(formData.currentBalance)
        })
      });
      if (res.ok) {
        setIsSavingsModalOpen(false);
        resetFormData();
        fetchData();
      }
    } catch (err) {
      console.error('Create Savings Error:', err);
    }
  };

  const handleSavingsTransact = async (e) => {
    e.preventDefault();
    if (!formData.amount) {
      alert('Please enter transfer amount');
      return;
    }
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/org-finance/savings/transact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savingsId: selectedItem.id,
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description
        })
      });
      if (res.ok) {
        setIsTransferModalOpen(false);
        resetFormData();
        fetchData();
      }
    } catch (err) {
      console.error('Savings Transaction Error:', err);
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

  const resetFormData = () => {
    setFormData({
      loanName: '',
      lender: '',
      principalAmount: '',
      interestRate: '',
      termMonths: '',
      monthlyInstallment: '',
      accountName: '',
      bankName: '',
      accountNumber: '',
      currentBalance: '',
      purpose: '',
      amount: '',
      description: '',
      type: ''
    });
  };

  const handlePrint = () => {
    const totalL = loans.reduce((s, l) => s + (l.remainingBalance || 0), 0);
    const totalS = savings.reduce((s, acc) => s + (acc.currentBalance || 0), 0);
    const netWorth = totalS - totalL;

    const metricsHtml = `
      <div class="section-title">Corporate Treasury KPI Overview</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val" style="color: #ef4444;">${Math.round(totalL).toLocaleString()} RWF</span>
          <span class="metric-lbl">TOTAL OUTSTANDING DEBT</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color: #10b981;">${Math.round(totalS).toLocaleString()} RWF</span>
          <span class="metric-lbl">TOTAL RESERVE CAPITAL</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color: ${netWorth >= 0 ? '#1B5E20' : '#ef4444'};">${netWorth < 0 ? '-' : ''}${Math.abs(Math.round(netWorth)).toLocaleString()} RWF</span>
          <span class="metric-lbl">NET LIQUIDITY POSITION</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${(loans.length + savings.length).toLocaleString()}</span>
          <span class="metric-lbl">TOTAL MANAGED ACCOUNTS</span>
        </div>
      </div>

      <div class="section-title">Operational Metrics</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val">${summaryData.activeLoans}</span>
          <span class="metric-lbl">ACTIVE LOANS</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.debtToReserveRatio}x</span>
          <span class="metric-lbl">DEBT-TO-RESERVE RATIO</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${Math.round(summaryData.averageLoanAmount).toLocaleString()} RWF</span>
          <span class="metric-lbl">AVG LOAN AMOUNT</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.savingsCount}</span>
          <span class="metric-lbl">SAVINGS ACCOUNTS</span>
        </div>
      </div>
    `;

    const loansTableHtml = `
      <div class="section-title">Institutional Debt Portfolio</div>
      <table>
        <thead>
          <tr>
            <th>LOAN IDENTITY</th>
            <th>LENDER</th>
            <th>PRINCIPAL AMOUNT</th>
            <th style="text-align:right;">REMAINING LIABILITY</th>
          </tr>
        </thead>
        <tbody>
          ${loans.map(l => `
            <tr>
              <td><strong>${l.loanName}</strong></td>
              <td><span class="badge badge-blue">${l.lender}</span></td>
              <td>${(l.principalAmount || 0).toLocaleString()} RWF</td>
              <td style="text-align:right; font-weight:700; color:#ef4444;">${(l.remainingBalance || 0).toLocaleString()} RWF</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const savingsTableHtml = `
      <div class="section-title">Reserve Capital & Savings Accounts</div>
      <table>
        <thead>
          <tr>
            <th>ACCOUNT NAME</th>
            <th>INSTITUTION</th>
            <th>ACCOUNT NUMBER</th>
            <th style="text-align:right;">CURRENT BALANCE</th>
          </tr>
        </thead>
        <tbody>
          ${savings.map(acc => `
            <tr>
              <td><strong>${acc.accountName}</strong></td>
              <td><span class="badge badge-green">${acc.bankName}</span></td>
              <td><code>${acc.accountNumber}</code></td>
              <td style="text-align:right; font-weight:700; color:#10b981;">${(acc.currentBalance || 0).toLocaleString()} RWF</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    generateReport({
      title: 'Corporate Treasury & Finance Audit',
      moduleCode: 'ORG-FIN',
      bodyHtml: metricsHtml + loansTableHtml + savingsTableHtml
    });
  };

  const generateEmailHtml = () => {
    const totalL = loans.reduce((s, l) => s + (l.remainingBalance || 0), 0);
    const totalS = savings.reduce((s, acc) => s + (acc.currentBalance || 0), 0);
    return `
      <div style="font-family: 'Inter', sans-serif; max-width: 700px; margin: 0 auto; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #1B5E20, #2E7D32); padding: 30px; border-radius: 16px; color: white; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(27,94,32,0.15);">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900;">DRAVANUA HUB — Treasury Audit</h1>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Institutional Financial Standings & Reserve Summary</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <div style="background: #fffafa; border: 1px solid #fee2e2; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">Outstanding Liability</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: 900; color: #b91c1c;">${totalL.toLocaleString()} RWF</p>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Reserve Balance</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: 900; color: #15803d;">${totalS.toLocaleString()} RWF</p>
          </div>
        </div>

        <h3 style="color: #1B5E20; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Top Debt Line Items</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px;">
          ${loans.slice(0, 5).map(l => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0;"><strong>${l.loanName}</strong><br/><span style="font-size: 11px; color: #64748b;">${l.lender}</span></td>
              <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #ef4444;">${(l.remainingBalance || 0).toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>

        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          DRAVANUA STUDIO — Institutional Finance Management<br/>
          Confidential Corporate Document
        </p>
      </div>
    `;
  };

  const filteredLoans = loans.filter(l =>
    (l.loanName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.lender || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSavings = savings.filter(s =>
    (s.accountName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.bankName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValue = (num) => {
    const val = parseFloat(num) || 0;
    const formatted = Math.abs(Math.round(val)).toLocaleString();
    return `${val < 0 ? '-' : ''}${formatted} RWF`;
  };

  if (loading && loans.length === 0 && savings.length === 0)
    return <div className="admin-page center"><RefreshCw className="spin" /></div>;

  return (
    <div className="admin-page animate-fadeIn">
      <Header title="Organizational Finance & Treasury" subtitle="Corporate debt portfolio, reserve capital management, and institutional liquidity planning." />

      {/* Treasury Summary Cards */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TOTAL DEBT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{showBalances ? formatValue(summaryData.totalLoans) : '••••••'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TOTAL RESERVES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{showBalances ? formatValue(summaryData.totalSavings) : '••••••'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>NET LIQUIDITY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: summaryData.netLiquidity >= 0 ? '#A5D6A7' : '#FFCDD2' }}>
              {showBalances ? formatValue(summaryData.netLiquidity) : '••••••'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>ACCOUNTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.loanCount + summaryData.savingsCount}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View:</span>
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '5px', borderRadius: '14px' }}>
              {[
                { id: 'loans', label: 'Debt Portfolio', icon: <TrendingDown size={14} /> },
                { id: 'savings', label: 'Reserve Capital', icon: <Landmark size={14} /> }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => { setActiveView(view.id); setSearchTerm(''); }}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeView === view.id ? 'white' : 'transparent',
                    color: activeView === view.id ? '#1B5E20' : '#64748b',
                    boxShadow: activeView === view.id ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {view.icon} {view.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div className="admin-search-wrapper" style={{ width: '250px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder={activeView === 'loans' ? 'Search loans...' : 'Search accounts...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
              />
            </div>

            <ExportToolbar
              emailSubject="DRAVANUA — Corporate Treasury Report"
              emailHtml={generateEmailHtml}
              onPDF={handlePrint}
              moduleCode="ORG-FIN"
            />
            <div style={{ width: '1px', height: '24px', background: '#f1f5f9', margin: '0 5px' }}></div>

            <button
              onClick={fetchData}
              className="btn btn-outline"
              style={{ height: '44px', padding: '0 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={18} />
            </button>

            {activeView === 'loans' ? (
              <button
                onClick={() => {
                  resetFormData();
                  setIsLoanModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ height: '44px', padding: '0 25px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Plus size={18} /> New Loan
              </button>
            ) : (
              <button
                onClick={() => {
                  resetFormData();
                  setIsSavingsModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ height: '44px', padding: '0 25px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Plus size={18} /> New Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loans View */}
      {activeView === 'loans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredLoans.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <TrendingDown size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>No loans found. Click "New Loan" to register organizational debt.</p>
            </div>
          ) : (
            filteredLoans.map(loan => (
              <div
                key={loan.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #f1f5f9',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
                className="hover-row"
              >
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 16px', background: loan.status === 'Active' ? '#fef2f2' : '#f0fdf4', color: loan.status === 'Active' ? '#ef4444' : '#10b981', fontSize: '0.65rem', fontWeight: 900, borderRadius: '0 0 0 12px' }}>
                  {loan.status?.toUpperCase() || 'ACTIVE'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>{loan.loanName}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Provider: {loan.lender}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Remaining Balance</p>
                    <h5 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#ef4444' }}>{formatValue(loan.remainingBalance)}</h5>
                  </div>
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Monthly Payment</p>
                    <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{formatValue(loan.monthlyInstallment || 0)}</h5>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '1rem' }}></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Principal</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{formatValue(loan.principalAmount || 0)}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Interest Rate</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{loan.interestRate || 0}%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setSelectedDetails(loan); setIsDetailsModalOpen(true); }}
                    title="View Details"
                    style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                  >
                    <Info size={14} style={{ display: 'inline', marginRight: '4px' }} /> Details
                  </button>
                  <button
                    onClick={() => { setSelectedItem(loan); setFormData({ amount: loan.monthlyInstallment.toString() }); setIsRepayModalOpen(true); }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <ArrowDownRight size={14} style={{ display: 'inline', marginRight: '4px' }} /> Repay
                  </button>
                  <button
                    onClick={() => {
                      setReminderForm({
                        ...reminderForm,
                        title: `Loan Repayment: ${loan.loanName}`,
                        description: `Payment of ${formatValue(loan.monthlyInstallment)} due for ${loan.lender}`
                      });
                      setIsReminderModalOpen(true);
                    }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#1B5E20', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Bell size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Savings View */}
      {activeView === 'savings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredSavings.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
              <Landmark size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>No savings accounts found. Click "New Account" to create a reserve fund.</p>
            </div>
          ) : (
            filteredSavings.map(acc => (
              <div
                key={acc.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #f1f5f9',
                  position: 'relative',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
                className="hover-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1e293b' }}>{acc.accountName}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{acc.bankName} • {acc.accountNumber}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '12px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Current Balance</p>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                    {formatValue(acc.currentBalance)}
                  </h3>
                  {acc.purpose && (
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Purpose: <span style={{ color: '#1B5E20', fontWeight: 800 }}>{acc.purpose}</span></div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setSelectedDetails(acc); setIsDetailsModalOpen(true); }}
                    title="View Details"
                    style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}
                  >
                    <Info size={14} style={{ display: 'inline', marginRight: '4px' }} /> Details
                  </button>
                  <button
                    onClick={() => { setSelectedItem(acc); setFormData({ type: 'Deposit', amount: '' }); setIsTransferModalOpen(true); }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: '#10b981', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <ArrowUpRight size={14} style={{ display: 'inline', marginRight: '4px' }} /> Deposit
                  </button>
                  <button
                    onClick={() => { setSelectedItem(acc); setFormData({ type: 'Withdrawal', amount: '' }); setIsTransferModalOpen(true); }}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#334155', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <ArrowDownRight size={14} style={{ display: 'inline', marginRight: '4px' }} /> Withdraw
                  </button>
                  <button
                    onClick={() => {
                      setReminderForm({
                        ...reminderForm,
                        title: `Capital Review: ${acc.accountName}`,
                        description: `Review reserve balance for ${acc.bankName}`
                      });
                      setIsReminderModalOpen(true);
                    }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', color: '#1B5E20', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Bell size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Loan Modal */}
      {isLoanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Register Loan</h2>
                <button onClick={() => setIsLoanModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Add new organizational debt liability</p>
            </div>

            <form onSubmit={handleCreateLoan} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Loan Title</label>
                <input
                  type="text"
                  placeholder="e.g. Expansion Loan"
                  required
                  value={formData.loanName}
                  onChange={e => setFormData({ ...formData, loanName: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Lender / Bank</label>
                <input
                  type="text"
                  placeholder="Bank or institution name"
                  required
                  value={formData.lender}
                  onChange={e => setFormData({ ...formData, lender: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Principal (RWF)</label>
                  <input
                    type="text"
                    required
                    value={addCommas(formData.principalAmount)}
                    onChange={e => handleNumericChange('principalAmount', e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Interest Rate (%)</label>
                  <input
                    type="text"
                    value={addCommas(formData.interestRate)}
                    onChange={e => handleNumericChange('interestRate', e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Term (Months)</label>
                  <input
                    type="text"
                    value={addCommas(formData.termMonths)}
                    onChange={e => handleNumericChange('termMonths', e.target.value, false)}
                    placeholder="0"
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Monthly Payment</label>
                  <input
                    type="text"
                    required
                    value={addCommas(formData.monthlyInstallment)}
                    onChange={e => handleNumericChange('monthlyInstallment', e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              <button type="submit" style={{ marginTop: '1rem', background: '#0f172a', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>Register Debt</button>
            </form>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {isRepayModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #ef4444, #f87171)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Process Repayment</h2>
                <button onClick={() => setIsRepayModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Recording payment for {selectedItem?.loanName}</p>
            </div>

            <form onSubmit={handleRepay} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '10px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#991b1b', fontWeight: 900 }}>Loan: <strong>{selectedItem?.loanName}</strong></p>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Repayment Amount (RWF)</label>
                <input
                  type="text"
                  required
                  value={addCommas(formData.amount)}
                  onChange={e => handleNumericChange('amount', e.target.value)}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 900, color: '#ef4444' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Month 4 Payment"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem' }}
                />
              </div>

              <button type="submit" style={{ background: '#ef4444', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>Commit Repayment</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Savings Modal */}
      {isSavingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>New Reserve Account</h2>
                <button onClick={() => setIsSavingsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Create new organizational savings account</p>
            </div>

            <form onSubmit={handleCreateSavings} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Operational Reserve"
                  required
                  value={formData.accountName}
                  onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                    style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Initial Balance (RWF)</label>
                <input
                  type="text"
                  required
                  value={addCommas(formData.currentBalance)}
                  onChange={e => handleNumericChange('currentBalance', e.target.value)}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Target Purpose</label>
                <input
                  type="text"
                  placeholder="What is this reserve for?"
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem' }}
                />
              </div>

              <button type="submit" style={{ marginTop: '1rem', background: '#10b981', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>Create Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #334155, #475569)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                  {formData.type === 'Deposit' ? 'Capital Inflow' : 'Capital Outflow'}
                </h2>
                <button onClick={() => setIsTransferModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Account: {selectedItem?.accountName}</p>
            </div>

            <form onSubmit={handleSavingsTransact} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#334155', fontWeight: 900 }}>Current Balance: <strong>{formatValue(selectedItem?.currentBalance || 0)}</strong></p>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Amount (RWF)</label>
                <input
                  type="text"
                  required
                  value={addCommas(formData.amount)}
                  onChange={e => handleNumericChange('amount', e.target.value)}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 900 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Description / Note</label>
                <input
                  type="text"
                  placeholder="Transaction reason"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.85rem' }}
                />
              </div>

              <button type="submit" style={{ background: '#334155', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>Execute Movement</button>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: '#1B5E20', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Set Financial Reminder</h3>
              <button onClick={() => setIsReminderModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateReminder} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Reminder Title"
                required
                value={reminderForm.title}
                onChange={e => setReminderForm({ ...reminderForm, title: e.target.value })}
                style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }}
              />

              <textarea
                placeholder="Instructional Notes"
                value={reminderForm.description}
                onChange={e => setReminderForm({ ...reminderForm, description: e.target.value })}
                style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '0.85rem' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Trigger Date</label>
                  <input
                    type="date"
                    required
                    value={reminderForm.reminderDate}
                    onChange={e => setReminderForm({ ...reminderForm, reminderDate: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Trigger Time</label>
                  <input
                    type="time"
                    required
                    value={reminderForm.reminderTime}
                    onChange={e => setReminderForm({ ...reminderForm, reminderTime: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                <input
                  type="checkbox"
                  id="sendToAll"
                  checked={reminderForm.sendToAll}
                  onChange={e => setReminderForm({ ...reminderForm, sendToAll: e.target.checked })}
                />
                <label htmlFor="sendToAll" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Broadcast to all administrators</label>
              </div>

              <button type="submit" style={{ background: '#1B5E20', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem' }}>Set Reminder</button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #1B5E20 0%, #32CD32 100%)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Financial Details</h2>
                <button onClick={() => { setIsDetailsModalOpen(false); setSelectedDetails(null); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedDetails.loanName ? (
                <>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Loan Name</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{selectedDetails.loanName}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Lender</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedDetails.lender}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedDetails.status === 'Active' ? '#ef4444' : '#10b981' }}>{selectedDetails.status?.toUpperCase()}</div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#e2e8f0' }}></div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Principal</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{formatValue(selectedDetails.principalAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Interest Rate</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{selectedDetails.interestRate || 0}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Term</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{selectedDetails.termMonths || 0} months</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Monthly Payment</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{formatValue(selectedDetails.monthlyInstallment)}</div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#e2e8f0' }}></div>

                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Remaining Balance</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 1000, color: '#ef4444' }}>{formatValue(selectedDetails.remainingBalance)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Account Name</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{selectedDetails.accountName}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Bank</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedDetails.bankName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Account Number</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{selectedDetails.accountNumber}</div>
                    </div>
                  </div>

                  {selectedDetails.purpose && (
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Purpose</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{selectedDetails.purpose}</div>
                    </div>
                  )}

                  <div style={{ height: '1px', background: '#e2e8f0' }}></div>

                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Current Balance</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 1000, color: '#10b981' }}>{formatValue(selectedDetails.currentBalance)}</div>
                  </div>
                </>
              )}

              <button onClick={() => { setIsDetailsModalOpen(false); setSelectedDetails(null); }} style={{ background: '#1B5E20', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '1rem' }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalFinance;