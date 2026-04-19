import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, 
  CreditCard, PieChart, ArrowUpRight, ArrowDownRight,
  Filter, Download, Search, Calendar, Landmark,
  ArrowRightLeft, FileText, CheckCircle, Clock,
  Plus, Shield, RefreshCw, Eye, EyeOff, Info,
  Activity, X, Edit, Trash2
} from 'lucide-react';
import ExportToolbar from './components/ExportToolbar';
import { exportToExcel, fmtAmt } from '../utils/exportUtils';
import { generateReport } from '../utils/generateReport';

const FinancialManagement = () => {
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

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');
  const [displayCurrency, setDisplayCurrency] = useState(() => localStorage.getItem('dvs_currency') || 'RWF');
  const [exchangeRate, setExchangeRate] = useState(1300);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showBalances, setShowBalances] = useState(true);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intelPeriod, setIntelPeriod] = useState('Weekly');

  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTreasury: 0, periodIncome: 0, periodExpenses: 0, netBalance: 0,
    incomeCount: 0, expenseCount: 0, pendingRevenue: 0, pendingCount: 0,
    avgTicket: 0, operationalStability: 0, yieldPercentage: 0
  });
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    type: 'income', category: '', customCategory: '', client: '', amount: '',
    method: 'Cash', financialInstitution: '', accountNumber: '', description: '', date: new Date().toISOString().split('T')[0],
    departmentId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const transResp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/finance`);
      const transData = await transResp.json();
      const analyticsResp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/analytics?period=all`);
      const analyticsResult = await analyticsResp.json();

      if (transData.success) setTransactions(transData.data);
      if (analyticsResult.success) {
        const summary = analyticsResult.data.summary;
        setSummaryData({
          totalTreasury: (summary.totalRevenue || 0) - (summary.operationalExpenses || 0),
          periodIncome: summary.totalRevenue || 0,
          periodExpenses: summary.operationalExpenses || 0,
          netBalance: summary.netProfit || 0,
          incomeCount: (transData.data || []).filter(t => t.type === 'Sale').length,
          expenseCount: (transData.data || []).filter(t => t.type === 'Expense').length,
          pendingRevenue: summary.pendingRevenue || 0,
          pendingCount: summary.pendingCount || 0,
          avgTicket: summary.avgTicket || 0,
          operationalStability: summary.operationalStability || 0,
          yieldPercentage: summary.yieldPercentage || 0
        });
      }

      const deptResp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/departments`);
      const deptData = await deptResp.json();
      if (deptData.success) {
        setDepartments(deptData.data);
        if (deptData.data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: deptData.data[0].name }));
        }
      }
    } catch (error) { console.error('Finance Fetch Error:', error); } finally { setLoading(false); }
  };

  const handleRecordSubmit = async (e) => {
    if (e) e.preventDefault();
    const amountVal = parseFloat(formData.amount);

    if (!formData.amount || !formData.client) { alert('Amount and Client are required'); return; }
    if (amountVal <= 0) { alert('Amount must be a positive value'); return; }
    
    const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
    if (!finalCategory) { alert('Please select or specify a category'); return; }

    setIsSubmitting(true);

    const selectedDept = departments.find(d => d.name === finalCategory);
    const departmentId = selectedDept ? selectedDept.id : null;

    try {
      const url = editingItem 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/finance/${editingItem.id}` 
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/finance`;
      
      const resp = await secureFetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type === 'income' ? 'Sale' : 'Expense',
          amount: amountVal,
          category: finalCategory,
          paymentMethod: formData.method,
          financialInstitution: formData.financialInstitution,
          accountNumber: formData.accountNumber,
          client: formData.client,
          description: formData.description,
          date: formData.date,
          department_id: departmentId,
          user_id: user?.id,
          recorded_by: user?.name
        })
      });
      if (resp.ok) { 
        setIsRecordModalOpen(false); 
        setEditingItem(null);
        setFormData({ ...formData, amount: '', client: '', description: '', customCategory: '', financialInstitution: '', accountNumber: '' });
        fetchData(); 
      }
    } catch (error) { console.error('Submission error:', error); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this financial record?')) return;
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/finance/${id}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        fetchData();
      } else {
        alert('Access Denied: Only Super Admins can delete ledger entries.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleEdit = (t) => {
    setEditingItem(t);
    // Find if the category is a standard department
    const isStandard = departments.some(d => d.name === t.category);
    setFormData({
      type: t.type === 'Sale' ? 'income' : 'expense',
      category: isStandard ? t.category : 'Other',
      customCategory: isStandard ? '' : t.category,
      client: t.client || '',
      amount: t.amount.toString(),
      method: t.paymentMethod || 'Cash',
      financialInstitution: t.financialInstitution || '',
      accountNumber: t.accountNumber || '',
      description: t.description || '',
      date: new Date(t.date).toISOString().split('T')[0],
      departmentId: t.departmentId || ''
    });
    setIsRecordModalOpen(true);
  };

  const showDetails = (t) => {
    setSelectedTransaction(t);
    setIsDetailsModalOpen(true);
  };

  useEffect(() => { fetchData(); }, []);

  const formatValue = (num) => {
    const cleanNum = parseFloat(num) || 0;
    if (displayCurrency === 'USD') return `$${(cleanNum / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${Math.round(cleanNum).toLocaleString()} RWF`;
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = (t.client || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || (typeFilter === 'income' && t.type === 'Sale') || (typeFilter === 'expense' && t.type === 'Expense');
    return matchesSearch && matchesType;
  });

  const handlePrint = () => {
    const reportDate = new Date().toLocaleDateString();
    
    // 1. Treasury Summary Metrics
    const metricsHtml = `
      <div class="section-title">Treasury Performance Summary</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val">${formatValue(summaryData.totalTreasury)}</span>
          <span class="metric-lbl">TOTAL TREASURY</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color:#2E7D32;">${formatValue(summaryData.periodIncome)}</span>
          <span class="metric-lbl">TOTAL INCOME</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color:#d32f2f;">${formatValue(summaryData.periodExpenses)}</span>
          <span class="metric-lbl">TOTAL EXPENSES</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${formatValue(summaryData.netBalance)}</span>
          <span class="metric-lbl">NET PROFIT</span>
        </div>
      </div>

      <div class="section-title">Operational Efficiency</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val">${formatValue(summaryData.avgTicket)}</span>
          <span class="metric-lbl">AVG TRANSACTION</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.operationalStability}x</span>
          <span class="metric-lbl">STABILITY RATIO</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${summaryData.yieldPercentage}%</span>
          <span class="metric-lbl">PROFIT YIELD</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${filteredTransactions.length}</span>
          <span class="metric-lbl">TXN COUNT</span>
        </div>
      </div>
    `;

    // 2. Transaction Ledger Table
    const tableHtml = `
      <div class="section-title">Institutional Transaction Ledger</div>
      <table>
        <thead>
          <tr>
            <th>DATE</th>
            <th>CLIENT / SOURCE</th>
            <th>CATEGORY</th>
            <th>METHOD</th>
            <th>STAFF</th>
            <th style="text-align:right;">VALUATION</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td>${new Date(t.date).toLocaleDateString()}</td>
              <td><strong>${t.client || 'General'}</strong></td>
              <td>${t.category}</td>
              <td><span class="badge badge-blue">${t.paymentMethod}</span></td>
              <td>${t.recordedBy}</td>
              <td style="text-align:right; font-weight:700; color: ${t.type === 'Sale' ? '#2E7D32' : '#c62828'}">
                ${t.type === 'Sale' ? '+' : '-'}${formatValue(t.amount)}
              </td>
            </tr>
          `).join('')}
          ${filteredTransactions.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #999;">No transaction records found in the current scope.</td></tr>' : ''}
        </tbody>
      </table>
    `;

    generateReport({ 
      title: 'Financial Audit Ledger', 
      moduleCode: 'FIN', 
      bodyHtml: metricsHtml + tableHtml 
    });
  };

  if (loading) return <div className="admin-page center"><RefreshCw className="spin" /></div>;

  return (
    <div className="admin-page animate-fadeIn no-print-padding">
      <Header title="Financial Ledger & Treasury" subtitle="Consolidated studio accounts and multi-currency revenue streams." />
      
      <div className="admin-card treasury-summary" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div><div style={{ fontSize: '0.7rem', opacity: 0.8 }}>TOTAL TREASURY</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{showBalances ? formatValue(summaryData.totalTreasury) : '••••••'}</div></div>
          <div><div style={{ fontSize: '0.7rem', opacity: 0.8 }}>INCOME</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{showBalances ? formatValue(summaryData.periodIncome) : '••••••'}</div></div>
          <div><div style={{ fontSize: '0.7rem', opacity: 0.8 }}>EXPENSES</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFCDD2' }}>{showBalances ? formatValue(summaryData.periodExpenses) : '••••••'}</div></div>
          <div><div style={{ fontSize: '0.7rem', opacity: 0.8 }}>NET PROFIT</div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{showBalances ? formatValue(summaryData.netBalance) : '••••••'}</div></div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => { setEditingItem(null); setFormData({ ...formData, amount: '', client: '', description: '', customCategory: '' }); setIsRecordModalOpen(true); }} className="btn btn-primary"><Plus size={16} /> RECORD ENTRY</button>
            <button onClick={handlePrint} className="btn btn-outline"><PieChart size={16} /> AUDIT REPORT</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" placeholder="Search ledger..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)} style={{ padding: '8px', borderRadius: '8px' }}>
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* Data Table — DRAVANUA STUDIO REPORT FORMAT */}
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                DRAVANUA STUDIO — FINANCIAL LEDGER {new Date().getFullYear()}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
                TREASURY TRANSACTIONS · {filteredTransactions.length} RECORD{filteredTransactions.length !== 1 ? 'S' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
              <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
              <div style={{ marginTop: '3px', color: '#90EE90' }}>CONFIDENTIAL — INTERNAL USE</div>
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#1B5E20' }}>
                  {[
                    { label: 'DATE',          tip: 'Transaction Date' },
                    { label: 'CLIENT',        tip: 'Client or Source' },
                    { label: 'CATEGORY',      tip: 'Financial Category' },
                    { label: 'METHOD',        tip: 'Payment Method' },
                    { label: 'INSTITUTION',   tip: 'Bank / Telco' },
                    { label: 'ACCOUNT NO.',   tip: 'Account Reference' },
                    { label: 'VALUATION',     tip: 'Amount Processed' },
                    { label: 'STAFF',         tip: 'Recorded By' },
                    { label: 'ACTIONS',       tip: 'Modify Entry' }
                  ].map(h => (
                    <th key={h.label} title={h.tip} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: (h.label === 'VALUATION' || h.label === 'ACTIONS' || h.label === 'STAFF') ? 'right' : 'left', 
                      whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                      background: 'linear-gradient(180deg, #1B5E20, #166534)'
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 600 }}>
                    No financial records match your current view.
                  </td></tr>
                ) : filteredTransactions.map((t, idx) => (
                  <tr key={t.id} style={{ 
                    borderBottom: '1px solid #f1f5f9', 
                    background: idx % 2 === 0 ? 'white' : '#fafcfb',
                    transition: 'background 0.2s',
                  }} className="hover-row">
                    <td style={{ padding: '12px', fontWeight: 700, color: '#334155' }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{t.client || 'General'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#f0fdf4', padding: '3px 8px', borderRadius: '4px', border: '1px solid #dcfce7', fontSize: '0.65rem', fontWeight: 800, color: '#166534' }}>
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#475569', fontWeight: 600, fontSize: '0.7rem' }}>{t.financialInstitution || '-'}</td>
                    <td style={{ padding: '12px', color: '#475569', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'monospace' }}>{t.accountNumber || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: t.type === 'Sale' ? '#1B5E20' : '#dc2626' }}>
                      {t.type === 'Sale' ? '+' : '-'}{formatValue(t.amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>{t.recordedBy}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => showDetails(t)} title="Audit Details" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}><Info size={14} /></button>
                        <button onClick={() => handleEdit(t)} title="Edit Entry" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0284c7', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(t.id)} title="Delete Entry" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isRecordModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px', padding: '1.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#1B5E20', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{editingItem ? 'Edit Transaction' : 'Record Transaction'}</h3>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '8px' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleRecordSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Category / Department</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="form-input" required style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px' }}>
                    <option value="" disabled>Select Category</option>
                    <optgroup label="Organizational Units">
                      {departments.map(dept => (<option key={dept.id} value={dept.name}>{dept.name.toUpperCase()}</option>))}
                    </optgroup>
                    <optgroup label="General Finance">
                      <option value="Payroll">Payroll</option>
                      <option value="Rent">Rent & Utilities</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Taxes">Taxes / Statutory</option>
                      <option value="Other">Other Operational</option>
                    </optgroup>
                  </select>
                </div>

                {formData.category === 'Other' && (
                  <div className="form-group animate-slideDown" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Specify Operational Category</label>
                    <input type="text" value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} className="form-input" placeholder="e.g., Office Renovation" required style={{ padding: '8px 12px' }} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Type</label>
                    <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                      <button type="button" onClick={() => setFormData({...formData, type: 'income'})} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', background: formData.type === 'income' ? '#1B5E20' : 'transparent', color: formData.type === 'income' ? 'white' : '#64748b' }}>INCOME</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', background: formData.type === 'expense' ? '#dc2626' : 'transparent', color: formData.type === 'expense' ? 'white' : '#64748b' }}>EXPENSE</button>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</label>
                    <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className="form-input" style={{ padding: '8px' }}>
                      <option value="Cash">Cash</option>
                      <option value="MoMo">Mobile Money (MoMo)</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Card">POS / Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Client / Vendor / Source</label>
                    <input type="text" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="form-input" placeholder="Name..." style={{ padding: '8px' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Amount ({displayCurrency})</label>
                    <input
                      type="text"
                      required
                      value={addCommas(formData.amount)}
                      onChange={e => handleNumericChange('amount', e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                      style={{ padding: '8px', fontWeight: 900, color: '#1B5E20' }}
                    />
                  </div>
                </div>

                {(formData.method === 'MoMo' || formData.method === 'Bank') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }} className="animate-slideDown">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {formData.method === 'MoMo' ? 'Communication Network' : 'Financial Institution'}
                      </label>
                      {formData.method === 'MoMo' ? (
                        <select value={formData.financialInstitution} onChange={e => setFormData({...formData, financialInstitution: e.target.value})} className="form-input" style={{ padding: '8px' }}>
                          <option value="">Select Network</option>
                          <option value="MTN MoMo">MTN MoMo</option>
                          <option value="Airtel Money">Airtel Money</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input type="text" value={formData.financialInstitution} onChange={e => setFormData({...formData, financialInstitution: e.target.value})} className="form-input" placeholder="Bank Name (e.g. BK, I&M)" style={{ padding: '8px' }} />
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Account / Phone Number</label>
                      <input type="text" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="form-input" placeholder={formData.method === 'MoMo' ? '078...' : 'Acc No...'} style={{ padding: '8px', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Transaction Narrative (Optional)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input" placeholder="Notes regarding this entry..." style={{ height: '55px', padding: '8px', fontSize: '0.8rem', resize: 'none' }}></textarea>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="btn btn-outline" style={{ padding: '10px', borderRadius: '10px' }}>CANCEL</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }}>
                  {isSubmitting ? <RefreshCw className="spin" size={16} /> : (editingItem ? 'UPDATE LEDGER' : 'CONFIRM ENTRY')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedTransaction && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '420px', padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.1em' }}>Transaction Audit Entry</div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 900 }}>Financial Ledger Details</h3>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Valuation</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 1000, color: selectedTransaction.type === 'Sale' ? '#1B5E20' : '#dc2626' }}>
                    {selectedTransaction.type === 'Sale' ? '+' : '-'}{formatValue(selectedTransaction.amount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Posting Date</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{new Date(selectedTransaction.date).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Client / Source</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{selectedTransaction.client || 'General'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Category</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{selectedTransaction.category}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Payment Method</div>
                  <span style={{ background: '#f0fdf4', padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, color: '#166534', border: '1px solid #dcfce7' }}>
                    {selectedTransaction.paymentMethod || 'Cash'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Recorded By</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{selectedTransaction.recordedBy}</div>
                </div>
              </div>

              {(selectedTransaction.financialInstitution || selectedTransaction.accountNumber) && (
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Account Information</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Institution / Network</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>{selectedTransaction.financialInstitution || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Reference / Account</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1e293b', fontFamily: 'monospace' }}>{selectedTransaction.accountNumber || '—'}</span>
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Narrative History</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, fontStyle: 'italic', background: '#fdfcfb', padding: '10px', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                  "{selectedTransaction.description || 'No additional narrative provided for this entry.'}"
                </div>
              </div>

              <button onClick={() => setIsDetailsModalOpen(false)} className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#1B5E20', fontWeight: 800 }}>CLOSE AUDIT VIEW</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;
