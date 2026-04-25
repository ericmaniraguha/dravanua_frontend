import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import {
  FileText, Upload, Filter, Search, Download, Eye,
  Trash2, CheckCircle, XCircle, FilePlus, ChevronLeft,
  ChevronRight, Calendar, DollarSign, RefreshCw, Plus,
  Eye as EyeIcon, EyeOff, Building2, Tag, Clock, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ExportToolbar from './components/ExportToolbar';
import { generateReport } from '../utils/generateReport';

const ManageReceipts = () => {
  const { user, secureFetch } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department_id: user?.departmentId || '',
    amount: '',
    currency: 'RWF',
    supplier_name: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const categories = [
    'Fuel', 'Transport', 'Office Supplies', 'Internet',
    'Maintenance', 'Equipment', 'Training', 'Marketing',
    'Salaries', 'Other'
  ];

  const [departments, setDepartments] = useState([]);

  // ─── API ──────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const deptRes = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/departments`);
      const deptData = await deptRes.json();
      if (deptData.success) {
        setDepartments(deptData.data || []);
      }

      const recRes = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/receipts`);
      const recData = await recRes.json();
      if (recData.success) setReceipts(recData.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'category' && formData[key] === 'Other' && customCategory.trim()) {
        data.append(key, customCategory);
      } else {
        data.append(key, formData[key]);
      }
    });
    if (file) data.append('receipt_file', file);

    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/receipts`, {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setShowUploadModal(false);
        fetchData();
        setFormData({
          title: '', description: '', category: '',
          department_id: user?.departmentId || '',
          amount: '', currency: 'RWF', supplier_name: '',
          expense_date: new Date().toISOString().split('T')[0]
        });
        setFile(null);
        setCustomCategory('');
      } else {
        alert(result.message + (result.error ? ': ' + result.error : ''));
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id, status) => {
    if (!window.confirm(`Mark this document as ${status}?`)) return;
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/receipts/${id}/approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        }
      );
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record permanently?')) return;
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/receipts/${id}`,
        { method: 'DELETE' }
      );
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  // ─── Derived State ────────────────────────────────────────────────────────

  const filteredReceipts = receipts.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (r.title || '').toLowerCase().includes(term) ||
      (r.supplierName || '').toLowerCase().includes(term) ||
      (r.receiptFileName || '').toLowerCase().includes(term);
    const matchCat    = filterCategory ? r.category === filterCategory : true;
    const matchStatus = filterStatus   ? r.status   === filterStatus   : true;
    const matchDept   = filterDept     ? String(r.departmentId) === String(filterDept) : true;
    return matchSearch && matchCat && matchStatus && matchDept;
  });

  const pageCount    = Math.ceil(filteredReceipts.length / itemsPerPage);
  const currentItems = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDeptName  = (id) => departments.find(d => String(d.id) === String(id))?.name || 'General';

  // ─── Summary ──────────────────────────────────────────────────────────────

  const totalAmount   = receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const approvedAmt   = receipts.filter(r => r.status === 'Approved').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const pendingCount  = receipts.filter(r => r.status === 'Pending').length;
  const approvedCount = receipts.filter(r => r.status === 'Approved').length;

  // ─── Export ───────────────────────────────────────────────────────────────

  const handlePDF = () => {
    const bodyHtml = `
      <div class="section-title">DROPBOX DIGITAL VAULT — RECEIPTS AUDIT</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-val">${totalAmount.toLocaleString()} RWF</span>
          <span class="metric-lbl">TOTAL DECLARED</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color:#2E7D32">${approvedAmt.toLocaleString()} RWF</span>
          <span class="metric-lbl">APPROVED AMOUNT</span>
        </div>
        <div class="metric-card">
          <span class="metric-val">${approvedCount}</span>
          <span class="metric-lbl">APPROVED DOCS</span>
        </div>
        <div class="metric-card">
          <span class="metric-val" style="color:#d97706">${pendingCount}</span>
          <span class="metric-lbl">PENDING REVIEW</span>
        </div>
      </div>

      <div class="section-title">RECEIPTS REGISTER</div>
      <table>
        <thead>
          <tr>
            <th>S/N</th>
            <th>DATE</th>
            <th>TITLE</th>
            <th>CATEGORY</th>
            <th>SUPPLIER</th>
            <th style="text-align:right">AMOUNT</th>
            <th>STATUS</th>
            <th>UPLOADER</th>
          </tr>
        </thead>
        <tbody>
          ${filteredReceipts.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${new Date(r.expenseDate).toLocaleDateString()}</td>
              <td><strong>${r.title}</strong></td>
              <td>${r.category}</td>
              <td>${r.supplierName || '—'}</td>
              <td style="text-align:right;font-weight:700">${Number(r.amount).toLocaleString()} ${r.currency}</td>
              <td><span style="font-weight:800;color:${r.status === 'Approved' ? '#166534' : r.status === 'Rejected' ? '#991b1b' : '#854d0e'}">${r.status}</span></td>
              <td>${r.Uploader?.name || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    generateReport({ title: 'Digital Vault — Receipts Audit', moduleCode: 'VLT', bodyHtml });
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const statusStyle = (s) => ({
    Approved: { bg: '#dcfce7', color: '#166534' },
    Rejected: { bg: '#fee2e2', color: '#991b1b' },
    Pending:  { bg: '#fef9c3', color: '#854d0e' }
  }[s] || { bg: '#f1f5f9', color: '#475569' });

  if (loading) {
    return (
      <div className="admin-page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#32FC05' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Loading vault documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <Header
        title="Dropbox Digital Vault & Receipts"
        subtitle="Manage and securely store financial documents, invoices, and expense receipts."
      />

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="admin-card" style={{
        background: 'linear-gradient(135deg, #32FC05, #2E7D32)',
        color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>TOTAL DOCUMENTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{receipts.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>TOTAL DECLARED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
              {showBalances ? `${totalAmount.toLocaleString()} RWF` : '••••••'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>APPROVED AMOUNT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>
              {showBalances ? `${approvedAmt.toLocaleString()} RWF` : '••••••'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>PENDING REVIEW</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFCC80' }}>{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>

          {/* Left: search + filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="admin-search-wrapper" style={{
              width: '260px', height: '44px',
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
              position: 'relative'
            }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search documents or suppliers..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <XCircle size={14} />
                </button>
              )}
            </div>

            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 14px', height: '44px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700, outline: 'none', background: 'white', cursor: 'pointer' }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 14px', height: '44px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 700, outline: 'none', background: 'white', cursor: 'pointer' }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {(searchTerm || filterCategory || filterStatus) && (
              <div style={{ fontSize: '0.7rem', color: '#32FC05', fontWeight: 800, padding: '6px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                <Filter size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {filteredReceipts.length} result{filteredReceipts.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Right: visibility + export + upload */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#32FC05', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {showBalances ? <EyeOff size={15} /> : <EyeIcon size={15} />}
              {showBalances ? 'Hide' : 'Show'}
            </button>

            <ExportToolbar
              onPDF={handlePDF}
              emailSubject="DRAVANUA HUB — Digital Vault Receipts Report"
              emailHtml={() => `
                <div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto">
                  <div style="background:linear-gradient(135deg,#32FC05,#2E7D32);padding:20px;border-radius:12px;color:white;margin-bottom:16px">
                    <h2 style="margin:0">DRAVANUA HUB — Vault Receipts Report</h2>
                    <p style="margin:6px 0 0;opacity:.8">Generated: ${new Date().toLocaleString()}</p>
                  </div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr style="background:#f1f5f9"><td style="padding:12px;font-weight:800">Total Documents</td><td style="padding:12px">${receipts.length}</td></tr>
                    <tr><td style="padding:12px;font-weight:800">Total Declared</td><td style="padding:12px;font-weight:900;color:#32FC05">${totalAmount.toLocaleString()} RWF</td></tr>
                    <tr style="background:#f1f5f9"><td style="padding:12px;font-weight:800">Approved Amount</td><td style="padding:12px;font-weight:900;color:#166534">${approvedAmt.toLocaleString()} RWF</td></tr>
                    <tr><td style="padding:12px;font-weight:800">Pending Review</td><td style="padding:12px;color:#854d0e;font-weight:800">${pendingCount} document(s)</td></tr>
                  </table>
                  <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px">DRAVANUA HUB — Confidential Financial Report</p>
                </div>
              `}
              moduleCode="VLT"
            />

            <button
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
              style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FilePlus size={18} /> Upload Doc
            </button>
          </div>
        </div>
      </div>

      {/* ── Receipts Table ────────────────────────────────────────────────── */}
      <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>

        {/* Dark header bar */}
        <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #32FC05)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              DRAVANUA HUB — DROPBOX DIGITAL VAULT
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>
              FINANCIAL DOCUMENTS & RECEIPT REGISTER · {filteredReceipts.length} DOCUMENT{filteredReceipts.length !== 1 ? 'S' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
            <div>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1050px' }}>
            <thead>
              <tr>
                {['S/N', 'DATE', 'DOCUMENT DETAILS', 'CATEGORY', 'DEPARTMENT', 'AMOUNT', 'STATUS', 'ACTORS', 'ACTIONS'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', color: 'white', fontWeight: 900,
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    textAlign: h === 'ACTIONS' || h === 'AMOUNT' ? 'right' : 'left',
                    whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, #32FC05, #166534)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                    No documents found matching criteria.
                  </td>
                </tr>
              ) : (
                currentItems.map((r, i) => {
                  const st = statusStyle(r.status);
                  return (
                    <tr key={r.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: i % 2 === 0 ? 'white' : '#fafcfb'
                    }} className="hover-row">

                      {/* S/N */}
                      <td style={{ padding: '12px', fontWeight: 900, color: '#32FC05', fontFamily: 'monospace' }}>
                        #{(currentPage - 1) * itemsPerPage + i + 1}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(r.expenseDate).toLocaleDateString('en-GB')}
                      </td>

                      {/* Document Details */}
                      <td style={{ padding: '12px', maxWidth: '220px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e293b' }}>{r.title}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                          {r.supplierName || 'Unknown Supplier'}
                        </div>
                        <code style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {(r.receiptFileName || '').substring(0, 26)}{r.receiptFileName?.length > 26 ? '…' : ''}
                        </code>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                          {r.category}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {getDeptName(r.departmentId)}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#0f172a' }}>
                          {showBalances ? Number(r.amount).toLocaleString() : '••••'}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>{r.currency}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '5px 12px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 900,
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: st.bg, color: st.color
                        }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color }} />
                          {r.status}
                        </span>
                      </td>

                      {/* Actors */}
                      <td style={{ padding: '12px', fontSize: '0.65rem' }}>
                        <div style={{ color: '#64748b' }}>
                          <span style={{ fontWeight: 700 }}>↑ </span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{r.Uploader?.name || '—'}</span>
                        </div>
                        <div style={{ color: '#64748b', marginTop: '2px' }}>
                          <span style={{ fontWeight: 700 }}>✓ </span>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{r.Approver?.name || '—'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => setShowPreviewModal(r)}
                            title="View Details"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={14} />
                          </button>

                          {user?.role !== 'user' && r.status === 'Pending' && (
                            <button
                              onClick={() => handleApprove(r.id, 'Approved')}
                              title="Approve"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}

                           {r.receiptUrl && (
                             <a
                               href={import.meta.env.VITE_API_BASE_URL + r.receiptUrl}
                               download
                               target="_blank"
                               rel="noreferrer"
                               title="Download"
                               style={{ padding: '6px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                             >
                               <Download size={14} />
                             </a>
                           )}

                          {user?.role === 'super_admin' && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              title="Delete Record"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: '#fff1f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of {filteredReceipts.length}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#32FC05', padding: '0 4px' }}>
                {currentPage} / {pageCount}
              </span>
              <button
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage === pageCount ? '#f8fafc' : 'white', cursor: currentPage === pageCount ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Upload Modal ──────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '680px', width: '95%', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #32FC05, #32CD32)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Upload size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Dropbox Vault Sync</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#e2e8f0' }}>Upload a financial document to the secure vault</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>

            <form onSubmit={handleUpload} style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
              {/* Title + Supplier */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Title / Reference *</label>
                  <input
                    type="text" required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#32FC05'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Supplier / Merchant</label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#32FC05'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Category + Department */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', background: 'white' }}
                    onFocus={e => e.target.style.borderColor = '#32FC05'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {formData.category === 'Other' && (
                    <input
                      type="text" required
                      placeholder="Specify custom category..."
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #0EA5E9', fontSize: '0.9rem', fontWeight: 700, outline: 'none', marginTop: '8px', background: '#f0f9ff' }}
                    />
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', background: 'white' }}
                    onFocus={e => e.target.style.borderColor = '#32FC05'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Financial section */}
              <div style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} /> Financial Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Currency</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 800, outline: 'none', background: 'white' }}
                    >
                      <option value="RWF">RWF</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Declared Amount *</label>
                    <input
                      type="number" step="0.01" required
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 900, fontSize: '1.05rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#32FC05'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Date *</label>
                    <input
                      type="date" required
                      value={formData.expense_date}
                      onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#32FC05'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#32FC05'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* File upload */}
              <div style={{ padding: '1.25rem', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '14px', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Document File (Receipt, PDF, Image) — Optional
                </label>
                <input
                  type="file"
                  onChange={e => setFile(e.target.files[0])}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: 'white' }}
                />
                {file && (
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#32FC05', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} /> {file.name}
                  </div>
                )}
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '6px', marginBottom: 0 }}>
                  File will be routed into the internal Dropbox sub-folder architecture securely.
                </p>
              </div>

              {/* Form actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ height: '42px', padding: '0 20px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 28px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', opacity: uploading ? 0.7 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
                >
                  {uploading
                    ? <><RefreshCw size={16} className="spin" /> Uploading…</>
                    : <><Upload size={16} /> Save & Upload</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Modal ─────────────────────────────────────────────────── */}
      {showPreviewModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '640px', width: '95%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #32FC05, #32CD32)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Document Intelligence Viewer</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>

            <div style={{ padding: '1.75rem' }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: <FileText size={14} />, label: 'Reference', value: showPreviewModal.title },
                  { icon: <DollarSign size={14} />, label: 'Amount Declared', value: `${Number(showPreviewModal.amount).toLocaleString()} ${showPreviewModal.currency}`, highlight: true },
                  { icon: <Tag size={14} />, label: 'Category', value: showPreviewModal.category },
                  { icon: <Building2 size={14} />, label: 'Department', value: getDeptName(showPreviewModal.departmentId) },
                  { icon: <User size={14} />, label: 'Supplier', value: showPreviewModal.supplierName || 'N/A' },
                  { icon: <Calendar size={14} />, label: 'Expense Date', value: new Date(showPreviewModal.expenseDate).toLocaleDateString('en-GB') },
                  { icon: <User size={14} />, label: 'Uploaded By', value: showPreviewModal.Uploader?.name || '—' },
                  { icon: <CheckCircle size={14} />, label: 'Approved By', value: showPreviewModal.Approver?.name || 'Awaiting' }
                ].map(({ icon, label, value, highlight }) => (
                  <div key={label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: highlight ? '#32FC05' : '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Status:</span>
                <span style={{
                  padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900,
                  background: statusStyle(showPreviewModal.status).bg,
                  color: statusStyle(showPreviewModal.status).color
                }}>
                  {showPreviewModal.status}
                </span>
              </div>

              {/* Vault path */}
              <div style={{ padding: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Vault Path
                </div>
                <code style={{ fontSize: '0.72rem', color: '#475569', wordBreak: 'break-all' }}>
                  {showPreviewModal.receiptUrl}
                </code>
              </div>

              {/* File preview placeholder */}
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', background: '#fafcfb' }}>
                <FileText size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#475569', fontSize: '0.85rem' }}>{showPreviewModal.receiptFileName}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Direct preview not available for secure vault blobs.</p>
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowPreviewModal(null)}
                  style={{ height: '42px', padding: '0 20px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}
                >
                  Close
                </button>
                <a
                  href={import.meta.env.VITE_API_BASE_URL + showPreviewModal.receiptUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{ height: '42px', padding: '0 20px', borderRadius: '10px', background: '#32FC05', color: 'white', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <Download size={16} /> Download Original
                </a>
              </div>
            </div>
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

export default ManageReceipts;