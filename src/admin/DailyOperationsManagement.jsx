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
  const [activeTab, setActiveTab] = useState('operations'); // 'operations', 'schedule', 'tasks', 'reports'
  const [loading, setLoading] = useState(false);
  const [operations, setOperations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showBalances, setShowBalances] = useState(true);

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

  const [deptInputType, setDeptInputType] = useState('preset');
  const [operationForm, setOperationForm] = useState({
    title: '',
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

  // Fetch Functions
  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/operations?date=${dateFilter}`
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
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/schedule?date=${dateFilter}`
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
      const res = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tasks`);
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error('Tasks Fetch Error:', err);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (activeTab === 'operations') fetchOperations();
    else if (activeTab === 'schedule') fetchSchedule();
    else if (activeTab === 'tasks') fetchTasks();
  }, [activeTab, dateFilter]);

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
          title: '', description: '', department: '', priority: 'Medium',
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

  const openOperationModal = () => {
    setDeptInputType('preset');
    setEditingItem(null);
    setOperationForm({
      title: '', description: '', department: '', priority: 'Medium',
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
        <p><strong>Date:</strong> ${dateFilter}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background: #1B5E20; color: white;">
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
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#1B5E20' }} />
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
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
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
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('operations')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'operations' ? '#1B5E20' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'operations' ? '3px solid #1B5E20' : 'none'
          }}
        >
          <Activity size={18} style={{ display: 'inline', marginRight: '6px' }} /> Daily Operations
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'schedule' ? '#1B5E20' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'schedule' ? '3px solid #1B5E20' : 'none'
          }}
        >
          <Calendar size={18} style={{ display: 'inline', marginRight: '6px' }} /> Schedule
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, color: activeTab === 'tasks' ? '#1B5E20' : '#94a3b8',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'tasks' ? '3px solid #1B5E20' : 'none'
          }}
        >
          <CheckCircle size={18} style={{ display: 'inline', marginRight: '6px' }} /> Tasks
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
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

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
            />
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
              }], `Operations_Audit_${dateFilter}`)}
              moduleCode="DOP"
            />
            
            <button
              className="btn btn-primary"
              onClick={() => activeTab === 'tasks' ? setIsTaskModalOpen(true) : openOperationModal()}
              style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Add {activeTab === 'tasks' ? 'Task' : 'Operation'}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Operations Table */}
      {activeTab === 'operations' && (
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>DRAVANUA HUB — DAILY OPERATIONS</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>REAL-TIME OPERATIONAL TRACKING · {filteredOperations.length} ACTIVE OPERATIONS</div>
            </div>
            <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
              <div>Generated: {new Date().toLocaleDateString()}</div>
              <div style={{ marginTop: '3px', color: '#90EE90' }}>CONFIDENTIAL — INTERNAL USE</div>
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: '#1B5E20' }}>
                  {['OPERATION', 'DEPARTMENT', 'TIME SLOT', 'ASSIGNED TO', 'PRIORITY', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: h === 'ACTIONS' ? 'center' : 'left',
                      whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.1)',
                      background: 'linear-gradient(180deg, #1B5E20, #166534)'
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
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1B5E20' }}>
                          {op.date || dateFilter}
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
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: '#1B5E20', border: '1px solid #ddd', cursor: 'pointer' }}
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
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>TASK MANAGEMENT</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px', letterSpacing: '0.06em' }}>STAFF TASK ASSIGNMENTS · {filteredTasks.length} ACTIVE TASKS</div>
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#1B5E20' }}>
                  {['TASK', 'ASSIGNED TO', 'CATEGORY', 'DUE DATE', 'PRIORITY', 'ACTIONS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', color: 'white', fontWeight: 900,
                      fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: h === 'ACTIONS' ? 'center' : 'left',
                      background: 'linear-gradient(180deg, #1B5E20, #166534)'
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
                      <td style={{ padding: '12px', fontSize: '0.75rem', fontWeight: 800, color: '#1B5E20' }}>
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
                            style={{ padding: '6px 8px', borderRadius: '6px', background: '#f8fafc', color: '#1B5E20', border: '1px solid #ddd', cursor: 'pointer' }}
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
          <div className="admin-modal" style={{ maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #1B5E20, #32CD32)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Operation Title *</label>
                    <input
                      type="text"
                      value={operationForm.title}
                      onChange={(e) => setOperationForm({...operationForm, title: e.target.value})}
                      required
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
                              background: deptInputType === type ? '#1B5E20' : 'transparent',
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
          <div className="admin-modal" style={{ maxWidth: '600px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #1B5E20, #32CD32)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div className="admin-modal" style={{ maxWidth: '500px', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                style={{ width: '100%', marginTop: '2rem', height: '44px', background: '#1B5E20', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
              >
                Close Details
              </button>
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

export default DailyOperationsManagement;