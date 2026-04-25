import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, CheckCircle, AlertCircle, Users, Zap,
  Search, Filter, Plus, X, Edit, Trash2, Check, RefreshCw,
  Printer, Mail, Download, Eye, EyeOff, TrendingUp, Activity,
  BarChart3, PieChart, LineChart as LineChartIcon, Info, Briefcase
} from 'lucide-react';
import ExportToolbar from './components/ExportToolbar';
import { generateReport } from '../utils/generateReport';

const DailyOperationsManagement = () => {
  const { secureFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('operations'); // 'operations', 'schedule', 'tasks', 'reports', 'inventory', 'purchases'
  const [loading, setLoading] = useState(false);
  const [operations, setOperations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days for operations
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState([]);
  const [items, setItems] = useState([]);
  const [showBalances, setShowBalances] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // Summary Statistics
  const [summaryData, setSummaryData] = useState({
    totalOperations: 0,
    completedToday: 0,
    pendingTasks: 0,
    staffEngaged: 0,
    efficiencyRate: 0,
    onTimeRate: 0
  });

  // Modal States
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const [deptInputType, setDeptInputType] = useState('preset');
  const [operationForm, setOperationForm] = useState({
    title: `Daily Operations — ${new Date().toLocaleDateString('en-GB')}`,
    description: '',
    department: '',
    priority: 'Medium',
    startTime: '',
    endTime: '',
    assignedTo: user?.name || '',
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: user?.name || '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    category: 'General'
  });

  const [reportForm, setReportForm] = useState({
    service: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    amountPaid: 0,
    debt: 0,
    paymentMethod: 'Cash',
    paymentAccount: '',
    notes: '',
    unavailableItems: '',
    isPaid: true,
    contactPerson: user?.name || '',
    telephone: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch Functions
  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/operations?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      if (data.success) {
        setOperations(data.data);
        calculateSummary(data.data);
      }
    } catch (err) {
      console.error('Operations Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/schedule?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      if (data.success) setSchedule(data.data);
    } catch (err) {
      console.error('Schedule Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tasks?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error('Tasks Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/daily-reports?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setReports(data.data);
    } catch (err) {
      console.error('Reports Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/items`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error('Items Fetch Error:', err);
    }
  };

  const calculateSummary = (operationsList) => {
    const completed = operationsList.filter(o => o.status === 'Completed').length;
    const pending = operationsList.filter(o => o.status === 'Pending').length;
    const onTime = operationsList.filter(o => o.onTime === true).length;

    setSummaryData({
      totalOperations: operationsList.length,
      completedToday: completed,
      pendingTasks: pending,
      staffEngaged: new Set(operationsList.map(o => o.assignedTo)).size,
      efficiencyRate: operationsList.length > 0 ? (completed / operationsList.length * 100).toFixed(1) : 0,
      onTimeRate: operationsList.length > 0 ? (onTime / operationsList.length * 100).toFixed(1) : 0
    });
  };

  const fetchInventory = async () => {
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/inventory/status`);
      const data = await res.json();
      if (data.success) setInventory(data.data);
    } catch (err) { console.error('Inventory Fetch Error:', err); }
  };

  const fetchMovements = async () => {
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/inventory/movements?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setMovements(data.data);
    } catch (err) { console.error('Movements Fetch Error:', err); }
  };

  const fetchPurchasesList = async () => {
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/purchases?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setPurchases(data.data);
    } catch (err) { console.error('Purchases Fetch Error:', err); }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (activeTab === 'operations') fetchOperations();
    else if (activeTab === 'schedule') fetchSchedule();
    else if (activeTab === 'tasks') fetchTasks();
    else if (activeTab === 'reports') {
      fetchReports();
    }
    else if (activeTab === 'inventory') {
      fetchInventory();
      fetchMovements();
    }
    else if (activeTab === 'purchases') {
      fetchPurchasesList();
    }
  }, [activeTab, startDate, endDate]);

  // Operation Handlers
  const handleCreateOperation = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/operations/${editingItem.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/operations`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await secureFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operationForm)
        }
      );
      const data = await response.json();
      if (data.success) {
        setIsOperationModalOpen(false);
        setEditingItem(null);
        setOperationForm({
          title: `Daily Operations — ${new Date().toLocaleDateString('en-GB')}`, description: '', department: '', priority: 'Medium',
          startTime: '', endTime: '', assignedTo: user?.name || '', status: 'Pending',
          date: new Date().toISOString().split('T')[0]
        });
        fetchOperations();
      } else {
        alert(data.error || 'Failed to create operation');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tasks/${editingItem.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tasks`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await secureFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskForm)
        }
      );
      const data = await response.json();
      if (data.success) {
        setIsTaskModalOpen(false);
        setEditingItem(null);
        setTaskForm({
          title: '', description: '', assignedTo: user?.name || '',
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'Medium', category: 'General'
        });
        fetchTasks();
      } else {
        alert(data.error || 'Failed to create task');
      }
    } catch (error) {
      alert('Error connecting to server');
    }
  };

  const handleUpdateStatus = async (operationId, newStatus) => {
    try {
      await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/operations/${operationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );
      fetchOperations();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/daily-reports/${editingItem.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/daily-reports`;
      const method = editingItem ? 'PUT' : 'POST';

      const resp = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm)
      });
      if (resp.ok) {
        setIsReportModalOpen(false);
        setEditingItem(null);
        setReportForm({
          service: '', quantity: 1, unitPrice: 0, totalPrice: 0, amountPaid: 0, debt: 0,
          paymentMethod: 'Cash', paymentAccount: '', notes: '', unavailableItems: '',
          isPaid: true, contactPerson: user?.name || '', telephone: '', date: new Date().toISOString().split('T')[0]
        });
        fetchReports();
      }
    } catch (err) {
      alert('Failed to save report');
    }
  };

  const [inventoryForm, setInventoryForm] = useState({ itemId: '', type: 'IN', quantity: 1, reason: 'Stock In' });
  const handleInventoryAdjust = async (e) => {
    e.preventDefault();
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryForm)
      });
      if (res.ok) {
        setIsInventoryModalOpen(false);
        fetchInventory();
        fetchMovements();
      }
    } catch (err) { alert('Adjustment failed'); }
  };

  const [purchaseForm, setPurchaseForm] = useState({ description: '', quantity: 1, unitPrice: 0, totalPrice: 0, paymentMethod: 'Cash', department: 'Logistics', date: new Date().toISOString().split('T')[0] });
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseForm)
      });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        fetchPurchasesList();
        fetchInventory(); // Purchase might trigger stock in
      }
    } catch (err) { alert('Purchase recording failed'); }
  };

  const openOperationModal = () => {
    setDeptInputType('preset');
    setEditingItem(null);
    setOperationForm({
      title: `Daily Operations — ${new Date().toLocaleDateString('en-GB')}`,
      description: '', department: '', priority: 'Medium',
      startTime: '', endTime: '', assignedTo: user?.name || '', status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    });
    setIsOperationModalOpen(true);
  };

  const handleEditOperation = (op) => {
    setDeptInputType('custom');
    setEditingItem(op);
    setOperationForm({
      title: op.title,
      description: op.description,
      department: op.department,
      priority: op.priority,
      startTime: op.startTime,
      endTime: op.endTime,
      assignedTo: op.assignedTo,
      status: op.status,
      date: op.date || new Date().toISOString().split('T')[0]
    });
    setIsOperationModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingItem(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      priority: task.priority,
      category: task.category
    });
    setIsTaskModalOpen(true);
  };

  const handlePrint = () => {
    const bodyHtml = `
      <div class="section-title">Operational Efficiency Summary</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${summaryData.totalOperations}</span><span class="metric-lbl">TOTAL OPERATIONS</span></div>
        <div class="metric-card"><span class="metric-val">${summaryData.completedToday}</span><span class="metric-lbl">COMPLETED</span></div>
        <div class="metric-card"><span class="metric-val">${summaryData.efficiencyRate}%</span><span class="metric-lbl">EFFICIENCY</span></div>
        <div class="metric-card"><span class="metric-val">${summaryData.staffEngaged}</span><span class="metric-lbl">STAFF ENGAGED</span></div>
      </div>

      <div class="section-title">Detailed Activity Ledger</div>
      <table>
        <thead>
          <tr>
            <th>OPERATION</th>
            <th>UNIT/DEPT</th>
            <th>SCHEDULE</th>
            <th>OFFICER</th>
            <th style="text-align:right">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${operations.map(op => `
            <tr>
              <td><strong>${op.title}</strong><br/><span style="font-size:9px;color:#64748b">${op.description || ''}</span></td>
              <td><span class="badge badge-blue">${String(op.department || 'General').toUpperCase()}</span></td>
              <td style="font-size:10px">${op.date || ''}<br/>${op.startTime} - ${op.endTime}</td>
              <td style="font-weight:700">${op.assignedTo}</td>
              <td style="text-align:right"><span class="badge badge-green">${op.status}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;

    generateReport({
      title: 'Daily Operations & Workflow Audit',
      moduleCode: 'DOP',
      bodyHtml,
      subtitle: `Audit Date: ${dateFilter} • Generated by: ${user?.name || 'Admin'}`
    });
  };

  const handleViewOperation = (op) => {
    setViewingItem(op);
    setIsViewModalOpen(true);
  };

  const handleViewTask = (task) => {
    setViewingItem(task);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id, type = 'operation') => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/${type}s/${id}`,
        { method: 'DELETE' }
      );
      if (type === 'operation') fetchOperations();
      else if (type === 'task') fetchTasks();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleExportPDF = () => {
    const bodyHtml = `
      <div style="margin-bottom: 20px;">
        <h2>Daily Operations Overview</h2>
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background: var(--primary-dark); color: white;">
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Operation</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Department</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Time</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Status</th>
        </tr>
        ${operations.map(op => `
          <tr style="border: 1px solid #ddd;">
            <td style="padding: 10px;">${op.title}</td>
            <td style="padding: 10px;">${op.department}</td>
            <td style="padding: 10px;">${op.startTime} - ${op.endTime}</td>
            <td style="padding: 10px;">${op.status}</td>
          </tr>
        `).join('')}
      </table>
    `;

    generateReport({
      title: 'Daily Operations Report',
      moduleCode: 'DOP',
      bodyHtml
    });
  };

  const filteredOperations = operations.filter(o =>
    (o.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(t =>
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return { bg: '#fee2e2', color: '#dc2626' };
      case 'Medium': return { bg: '#fef3c7', color: '#d97706' };
      case 'Low': return { bg: '#e0f2fe', color: '#0369a1' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: '#e0f2fe', color: '#0369a1' };
      case 'In Progress': return { bg: '#fef3c7', color: '#d97706' };
      case 'Pending': return { bg: '#fee2e2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  if (loading && operations.length === 0) {
    return (
      <div className="admin-page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Loading daily operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <Header
        title="Daily Operations Management"
        subtitle="Real-time tracking of operational activities, schedules, and task assignments across departments."
      />

      {/* Summary Cards */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div className="summary-grid" style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>TODAY'S OPERATIONS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.totalOperations}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>COMPLETED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.completedToday}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>PENDING</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.pendingTasks}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>STAFF ENGAGED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.staffEngaged}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>EFFICIENCY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{summaryData.efficiencyRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>ON-TIME RATE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{summaryData.onTimeRate}%</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-card tab-nav" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('operations')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'operations' ? 'var(--primary-dark)' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'operations' ? '3px solid var(--primary-dark)' : 'none'
          }}
        >
          <Activity size={18} style={{ display: 'inline', marginRight: '6px' }} /> Daily Operations
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'schedule' ? 'var(--primary-dark)' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'schedule' ? '3px solid var(--primary-dark)' : 'none'
          }}
        >
          <Calendar size={18} style={{ display: 'inline', marginRight: '6px' }} /> Schedule
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'tasks' ? 'var(--primary-dark)' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'tasks' ? '3px solid var(--primary-dark)' : 'none'
          }}
        >
          <CheckCircle size={18} style={{ display: 'inline', marginRight: '6px' }} /> Tasks
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'reports' ? 'var(--primary-dark)' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'reports' ? '3px solid var(--primary-dark)' : 'none'
          }}
        >
          <BarChart3 size={18} style={{ display: 'inline', marginRight: '6px' }} /> Sales & Reports
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'inventory' ? 'var(--primary-dark)' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'inventory' ? '3px solid var(--primary-dark)' : 'none'
          }}
        >
          <Zap size={18} style={{ display: 'inline', marginRight: '6px' }} /> Inventory
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'purchases' ? 'var(--primary-dark)' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'purchases' ? '3px solid var(--primary-dark)' : 'none'
          }}
        >
          <Briefcase size={18} style={{ display: 'inline', marginRight: '6px' }} /> Purchases
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <div className="admin-search-wrapper" style={{ width: '280px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search operations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
              />
            </div>

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
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ExportToolbar 
              onPDF={handlePrint}
              onExcel={() => exportToExcel([{
                name: 'Daily Operations',
                rows: operations.map(o => ({
                  Title: o.title,
                  Department: o.department,
                  Schedule: `${o.date} (${o.startTime} - ${o.endTime})`,
                  Officer: o.assignedTo,
                  Priority: o.priority,
                  Status: o.status
                }))
              }], `Operations_Audit_${startDate}_to_${endDate}`)}
              moduleCode="DOP"
            />
            
            <button
              className="btn btn-primary"
              onClick={() => {
                if (activeTab === 'tasks') setIsTaskModalOpen(true);
                else if (activeTab === 'reports') { setEditingItem(null); setReportForm({...reportForm, date: endDate}); setIsReportModalOpen(true); }
                else if (activeTab === 'inventory') { setIsInventoryModalOpen(true); }
                else if (activeTab === 'purchases') { setIsPurchaseModalOpen(true); }
                else openOperationModal();
              }}
              style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Add {activeTab === 'tasks' ? 'Task' : (activeTab === 'reports' ? 'Report' : 'Operation')}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Operations Table */}
      {activeTab === 'operations' && (
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, var(--primary-dark))', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>DRAVANUA HUB — DAILY OPERATIONS</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>REAL-TIME OPERATIONAL TRACKING · {filteredOperations.length} ACTIVE OPERATIONS</div>
            </div>
            <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
              <div>Generated: {new Date().toLocaleDateString()}</div>
              <div style={{ marginTop: '3px', color: '#32FC05' }}>CONFIDENTIAL — INTERNAL USE</div>
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: 'var(--primary-dark)' }}>
                  {['OPERATION', 'DEPARTMENT', 'TIME SLOT', 'ASSIGNED TO', 'PRIORITY', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: h === 'ACTIONS' ? 'center' : 'left',
                      whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                      background: 'linear-gradient(180deg, var(--primary-dark), #166534)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOperations.length > 0 ? filteredOperations.map((op, idx) => {
                  const priority = getPriorityColor(op.priority);
                  const status = getStatusColor(op.status);
                  return (
                    <tr key={op.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafcfb'
                    }} className="hover-row">
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{op.title}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{op.description}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {op.department}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                          {op.date || endDate}
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                          {op.startTime} - {op.endTime}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>{op.assignedTo}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', background: priority.bg, color: priority.color, borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800 }}>
                          {op.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', background: status.bg, color: status.color, borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800 }}>
                          {op.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleEditOperation(op)}
                            title="Edit"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: 'var(--primary-dark)', border: '1px solid #ddd', cursor: 'pointer' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleViewOperation(op)}
                            title="Information"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: '#64748b', border: '1px solid #ddd', cursor: 'pointer' }}
                          >
                            <Info size={14} />
                          </button>
                          {op.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateStatus(op.id, 'Completed')}
                              title="Mark Complete"
                              style={{ padding: '6px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(op.id, 'operation')}
                            title="Delete"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#fff1f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                      <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>No operations scheduled for this date.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      {activeTab === 'tasks' && (
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, var(--primary-dark))', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>TASK MANAGEMENT</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>STAFF TASK ASSIGNMENTS · {filteredTasks.length} ACTIVE TASKS</div>
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'var(--primary-dark)' }}>
                  {['TASK', 'ASSIGNED TO', 'CATEGORY', 'DUE DATE', 'PRIORITY', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: h === 'ACTIONS' ? 'center' : 'left',
                      background: 'linear-gradient(180deg, var(--primary-dark), #166534)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? filteredTasks.map((task, idx) => {
                  const priority = getPriorityColor(task.priority);
                  return (
                    <tr key={task.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafcfb'
                    }} className="hover-row">
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{task.title}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{task.description}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>{task.assignedTo}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {task.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', background: priority.bg, color: priority.color, borderRadius: '50px', fontSize: '0.65rem', fontWeight: 800 }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditTask(task)}
                            title="Edit"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: 'var(--primary-dark)', border: '1px solid #ddd', cursor: 'pointer' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleViewTask(task)}
                            title="Details"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: '#64748b', border: '1px solid #ddd', cursor: 'pointer' }}
                          >
                            <Info size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id, 'task')}
                            title="Delete"
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#fff1f2', color: '#ef4444', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                      <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>No tasks assigned yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Operation Modal */}
      {isOperationModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px', width: '90%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Briefcase size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{editingItem ? 'Edit Operation' : 'Add Daily Operation'}</h3>
              </div>
              <button onClick={() => setIsOperationModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <form onSubmit={handleCreateOperation} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Operation Title *</label>
                      <select 
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setOperationForm({...operationForm, title: e.target.value});
                        }}
                        style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, color: 'var(--primary-dark)', outline: 'none' }}
                      >
                        <option value="">Apply Registry Item...</option>
                        {items.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={operationForm.title}
                      onChange={(e) => setOperationForm({...operationForm, title: e.target.value})}
                      required
                      placeholder="e.g. Studio Session / Printing Order"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Operation Date</label>
                    <input
                      type="date"
                      value={operationForm.date}
                      onChange={(e) => setOperationForm({...operationForm, date: e.target.value})}
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Description</label>
                  <textarea
                    value={operationForm.description}
                    onChange={(e) => setOperationForm({...operationForm, description: e.target.value})}
                    rows="3"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Department</label>
                      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                        {['preset', 'custom'].map(type => (
                          <button
                            key={type} type="button" onClick={() => setDeptInputType(type)}
                            style={{
                              padding: '2px 8px', fontSize: '0.6rem', border: 'none', borderRadius: '4px',
                              background: deptInputType === type ? 'var(--primary-dark)' : 'transparent',
                              color: deptInputType === type ? 'white' : '#64748b',
                              cursor: 'pointer', fontWeight: 800, textTransform: 'uppercase'
                            }}
                          >
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {deptInputType === 'preset' ? (
                      <select
                        value={operationForm.department}
                        onChange={(e) => setOperationForm({...operationForm, department: e.target.value})}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      >
                        <option value="">Select Department...</option>
                        <option value="Studio">Studio</option>
                        <option value="Papeterie">Papeterie</option>
                        <option value="Flowers">Flowers</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Logistics">Logistics</option>
                        <option value="IT & Digital">IT & Digital</option>
                        <option value="Public Relations">Public Relations</option>
                        <option value="Management">Management</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={operationForm.department}
                        onChange={(e) => setOperationForm({...operationForm, department: e.target.value})}
                        placeholder="Enter custom department..."
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Priority</label>
                    <select
                      value={operationForm.priority}
                      onChange={(e) => setOperationForm({...operationForm, priority: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Start Time</label>
                    <input
                      type="time"
                      value={operationForm.startTime}
                      onChange={(e) => setOperationForm({...operationForm, startTime: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>End Time</label>
                    <input
                      type="time"
                      value={operationForm.endTime}
                      onChange={(e) => setOperationForm({...operationForm, endTime: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Assigned To</label>
                  <input
                    type="text"
                    value={operationForm.assignedTo}
                    onChange={(e) => setOperationForm({...operationForm, assignedTo: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsOperationModalOpen(false)} style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>{editingItem ? 'Update Operation' : 'Create Operation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '600px', width: '90%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{editingItem ? 'Update Task' : 'Create New Task'}</h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <form onSubmit={handleCreateTask} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Task Title *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                    rows="3"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Assigned To</label>
                    <input
                      type="text"
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Due Date</label>
                    <input
                      type="datetime-local"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Category (Department)</label>
                    <select
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    >
                      <option value="General">General</option>
                      <option value="Studio">Studio</option>
                      <option value="Papeterie">Papeterie</option>
                      <option value="Flowers">Flowers</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Logistics">Logistics</option>
                      <option value="IT & Digital">IT & Digital</option>
                      <option value="Public Relations">Public Relations</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsTaskModalOpen(false)} style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800 }}>{editingItem ? 'Update Task' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewingItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px', width: '90%', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #0D3B0D, var(--primary-dark))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Information Details</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <div style={{ padding: '1.75rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Subject/Title</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>{viewingItem.title}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Department / Category</div>
                  <div style={{ fontWeight: 800 }}>{viewingItem.department || viewingItem.category || 'General'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Priority Level</div>
                  <span style={{ padding: '4px 10px', background: getPriorityColor(viewingItem.priority).bg, color: getPriorityColor(viewingItem.priority).color, borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900 }}>
                    {viewingItem.priority}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Description & Scope</div>
                <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  {viewingItem.description || 'No detailed description provided for this entry.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Assigned Officer</div>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> {viewingItem.assignedTo}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Timeframe</div>
                  <div style={{ fontWeight: 800 }}>
                    {viewingItem.startTime ? `${viewingItem.startTime} - ${viewingItem.endTime}` : new Date(viewingItem.dueDate).toLocaleString()}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsViewModalOpen(false)}
                style={{ width: '100%', marginTop: '2rem', height: '44px', background: 'var(--primary-dark)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Reports Table */}
      {activeTab === 'reports' && (
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), #0D3B0D)', padding: '12px 20px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>DAILY SESSION INCOME & REPORTING</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Generated: {new Date().toLocaleDateString()}</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>SERVICE / ITEM</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>QTY</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>TOTAL VALUE</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>PAID</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>DEBT</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No reports recorded for this session.</td></tr>
                ) : reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800 }}>{r.service}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Person: {r.contactPerson || 'Walk-in'}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>x{r.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900 }}>{parseFloat(r.totalPrice).toLocaleString()} RWF</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--primary-dark)', fontWeight: 800 }}>{parseFloat(r.amountPaid).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>{parseFloat(r.debt).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: r.isPaid ? '#dcfce7' : '#fee2e2', color: r.isPaid ? '#166534' : '#dc2626', fontSize: '0.6rem', fontWeight: 800 }}>
                        {r.isPaid ? 'PAID' : 'DEBT'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingItem(r); setReportForm(r); setIsReportModalOpen(true); }} className="btn-icon"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(r.id, 'daily-report')} className="btn-icon" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="inventory-grid" style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0D3B0D, var(--primary-dark))', padding: '12px 20px', color: 'white', fontWeight: 900 }}>CURRENT STOCK LEVELS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>ITEM / PRODUCT</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>STOCK</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>VALUATION</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => {
                  const isLow = parseFloat(item.currentStock) <= parseFloat(item.minStock);
                  const isOut = parseFloat(item.currentStock) <= 0;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800 }}>{item.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{item.type}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 1000, fontSize: '0.9rem' }}>
                        {parseFloat(item.currentStock).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800,
                          background: isOut ? '#fee2e2' : (isLow ? '#fef3c7' : '#dcfce7'),
                          color: isOut ? '#dc2626' : (isLow ? '#d97706' : '#166534')
                        }}>
                          {isOut ? 'OUT OF STOCK' : (isLow ? 'LOW STOCK' : 'IN STOCK')}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>
                        {parseFloat(item.price).toLocaleString()} RWF
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '12px 20px', color: 'white', fontWeight: 900 }}>MOVEMENT HISTORY</div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 800 }}>{m.Item?.name}</div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{new Date(m.createdAt).toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 1000, color: m.type === 'IN' ? '#166534' : '#dc2626' }}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                        </span>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{m.reason}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Table */}
      {activeTab === 'purchases' && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, var(--primary-dark))', padding: '12px 20px', color: 'white', fontWeight: 900 }}>STOCK & RAW MATERIAL PURCHASES</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>DESCRIPTION</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>QTY</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>UNIT PRICE</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>TOTAL COST</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>ACCOUNT</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No purchase records found.</td></tr>
              ) : purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 800 }}>{p.description}</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Date: {p.date} • Dept: {p.department}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>x{p.quantity}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{parseFloat(p.unitPrice).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#dc2626' }}>{parseFloat(p.totalPrice).toLocaleString()} RWF</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', fontSize: '0.6rem', fontWeight: 800 }}>
                      {p.paymentAccount || p.paymentMethod}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(p.id, 'purchase')} className="btn-icon" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Report Modal */}
      {isReportModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '650px', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{editingItem ? 'Update Operational Report' : 'New Operational Entry'}</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateReport} style={{ padding: '1.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Item / Service *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        list="registryItems"
                        value={reportForm.service}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selected = items.find(i => i.name === val);
                          setReportForm({
                            ...reportForm, 
                            service: val, 
                            unitPrice: selected ? selected.price : reportForm.unitPrice,
                            totalPrice: (selected ? selected.price : reportForm.unitPrice) * reportForm.quantity,
                            debt: (selected ? selected.price : reportForm.unitPrice) * reportForm.quantity - reportForm.amountPaid
                          });
                        }}
                        required
                        className="form-input"
                        placeholder="Select from registry or type name..."
                      />
                      <datalist id="registryItems">
                        {items.map(i => <option key={i.id} value={i.name}>{parseFloat(i.price).toLocaleString()} RWF</option>)}
                      </datalist>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Unit Price</label>
                      <input 
                        type="number" 
                        value={reportForm.unitPrice}
                        onChange={(e) => {
                          const up = parseFloat(e.target.value) || 0;
                          setReportForm({
                            ...reportForm, 
                            unitPrice: up, 
                            totalPrice: up * reportForm.quantity,
                            debt: up * reportForm.quantity - reportForm.amountPaid
                          });
                        }}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        value={reportForm.quantity}
                        onChange={(e) => {
                          const q = parseInt(e.target.value) || 0;
                          setReportForm({
                            ...reportForm, 
                            quantity: q, 
                            totalPrice: q * reportForm.unitPrice,
                            debt: q * reportForm.unitPrice - reportForm.amountPaid
                          });
                        }}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Amt Paid</label>
                      <input 
                        type="number" 
                        value={reportForm.amountPaid}
                        onChange={(e) => {
                          const paid = parseFloat(e.target.value) || 0;
                          setReportForm({
                            ...reportForm, 
                            amountPaid: paid, 
                            debt: reportForm.totalPrice - paid,
                            isPaid: paid >= reportForm.totalPrice
                          });
                        }}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Notes</label>
                    <textarea 
                      value={reportForm.notes} 
                      onChange={(e) => setReportForm({...reportForm, notes: e.target.value})}
                      className="form-input"
                      style={{ height: '60px', resize: 'none' }}
                      placeholder="Session specific notes..."
                    />
                  </div>

                  <div style={{ background: '#fff1f2', padding: '12px', borderRadius: '12px', border: '1px dashed #fecaca' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> Unavailable Items Reported
                    </label>
                    <textarea 
                      value={reportForm.unavailableItems}
                      onChange={(e) => setReportForm({...reportForm, unavailableItems: e.target.value})}
                      className="form-input"
                      style={{ height: '45px', border: '1px solid #fecaca', fontSize: '0.75rem' }}
                      placeholder="List equipment or stock that was missing today..."
                    />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8' }}>TOTAL DUE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 1000, color: 'var(--primary-dark)' }}>{reportForm.totalPrice.toLocaleString()} <span style={{fontSize:'0.8rem'}}>RWF</span></div>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Contact Person</label>
                    <input type="text" value={reportForm.contactPerson} onChange={e => setReportForm({...reportForm, contactPerson: e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Telephone No.</label>
                    <input type="text" value={reportForm.telephone} onChange={e => setReportForm({...reportForm, telephone: e.target.value})} className="form-input" />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Payment Method</label>
                     <select value={reportForm.paymentMethod} onChange={e => setReportForm({...reportForm, paymentMethod: e.target.value})} className="form-input">
                       <option value="Cash">Cash</option>
                       <option value="MoMo">Mobile Money</option>
                       <option value="Bank">Bank Transfer</option>
                     </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="btn btn-outline" style={{ padding: '12px 24px', borderRadius: '12px' }}>CANCEL</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-dark), var(--secondary))' }}>
                  {editingItem ? 'UPDATE REPORT' : 'SUBMIT DAILY REPORT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Adjustment Modal */}
      {isInventoryModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '400px', borderRadius: '20px' }}>
            <div style={{ padding: '1.25rem', background: 'var(--primary-dark)', color: 'white', fontWeight: 900 }}>MANUAL STOCK ADJUSTMENT</div>
            <form onSubmit={handleInventoryAdjust} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>SELECT ITEM</label>
                <select value={inventoryForm.itemId} onChange={e => setInventoryForm({...inventoryForm, itemId: e.target.value})} required className="form-input">
                  <option value="">Select Item...</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Cur: {i.currentStock})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>TYPE</label>
                  <select value={inventoryForm.type} onChange={e => setInventoryForm({...inventoryForm, type: e.target.value})} className="form-input">
                    <option value="IN">Stock In (+)</option>
                    <option value="OUT">Stock Out (-)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>QUANTITY</label>
                  <input type="number" min="1" value={inventoryForm.quantity} onChange={e => setInventoryForm({...inventoryForm, quantity: e.target.value})} className="form-input" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>REASON</label>
                <input type="text" value={inventoryForm.reason} onChange={e => setInventoryForm({...inventoryForm, reason: e.target.value})} className="form-input" placeholder="e.g. Damage, Donation, Correction" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsInventoryModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Adjust Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px', borderRadius: '20px' }}>
            <div style={{ padding: '1.25rem', background: 'var(--primary-dark)', color: 'white', fontWeight: 900 }}>RECORD PURCHASE / STOCK IN</div>
            <form onSubmit={handleCreatePurchase} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>DESCRIPTION / ITEM NAME *</label>
                <input list="stockItems" value={purchaseForm.description} onChange={e => setPurchaseForm({...purchaseForm, description: e.target.value})} required className="form-input" placeholder="Type name or select from stock..." />
                <datalist id="stockItems">
                  {inventory.map(i => <option key={i.id} value={i.name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>QUANTITY</label>
                  <input type="number" min="1" value={purchaseForm.quantity} onChange={e => {
                    const q = parseFloat(e.target.value) || 0;
                    setPurchaseForm({...purchaseForm, quantity: q, totalPrice: q * purchaseForm.unitPrice});
                  }} className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>UNIT PRICE</label>
                  <input type="number" value={purchaseForm.unitPrice} onChange={e => {
                    const p = parseFloat(e.target.value) || 0;
                    setPurchaseForm({...purchaseForm, unitPrice: p, totalPrice: p * purchaseForm.quantity});
                  }} className="form-input" />
                </div>
              </div>
              <div style={{ padding: '10px', background: '#fff1f2', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#dc2626' }}>TOTAL COST</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 1000, color: '#dc2626' }}>{purchaseForm.totalPrice.toLocaleString()} RWF</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>ACCOUNT / METHOD</label>
                  <select value={purchaseForm.paymentMethod} onChange={e => setPurchaseForm({...purchaseForm, paymentMethod: e.target.value})} className="form-input">
                    <option value="Cash">Cash</option>
                    <option value="MoMo">Mobile Money</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b' }}>DEPARTMENT</label>
                  <select value={purchaseForm.department} onChange={e => setPurchaseForm({...purchaseForm, department: e.target.value})} className="form-input">
                    <option value="Logistics">Logistics</option>
                    <option value="Papeterie">Papeterie</option>
                    <option value="Studio">Studio</option>
                    <option value="Flowers">Flowers</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Record Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hover-row:hover { background: #f8fafc !important; }

        .summary-grid { grid-template-columns: repeat(6, 1fr); }
        .stats-grid { grid-template-columns: repeat(4, 1fr); }
        .inventory-grid { grid-template-columns: 1.2fr 0.8fr; }

        @media (max-width: 1200px) {
          .summary-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid { grid-template-columns: 1fr; }
          .inventory-grid { grid-template-columns: 1fr; }
          .tab-nav { flex-direction: column; gap: 0.5rem !important; }
          .tab-nav button { text-align: left; padding: 10px 15px !important; }
          .admin-modal { width: 95% !important; margin: 10px; }
        }

        @media (max-width: 480px) {
          .summary-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default DailyOperationsManagement;
