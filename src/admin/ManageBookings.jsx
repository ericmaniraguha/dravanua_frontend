import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './components/Header';
import ExportToolbar from './components/ExportToolbar';
import { exportToExcel, fmtAmt } from '../utils/exportUtils';
import { generateReport } from '../utils/generateReport';
import { ALL_COUNTRIES } from '../utils/countryData';
import { 
  Calendar, Clock, User, Phone, MapPin, 
  Search, Filter, Plus, ChevronLeft, ChevronRight,
  MoreVertical, Edit, Trash2, CheckCircle, XCircle, AlertCircle,
  FileText, Download, Printer, Mail, Info,
  Package, DollarSign, Activity, RefreshCw, X, Loader2, ShoppingBag, Landmark, Wallet,
  TrendingUp, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';


const ManageBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const { user, secureFetch } = useAuth();
  const isSuper = user?.role === 'super_admin' || user?.assignedService === 'all';
  const [currency, setCurrency] = useState(() => localStorage.getItem('dvs_currency') || 'RWF');

  const userDeptFormatted = (() => {
    switch (user?.assignedService?.toLowerCase()) {
      case 'papeterie': return 'Stationery & Office Supplies';
      case 'flowers': return 'Flower Gifts';
      case 'fashion': return 'Classic Fashion';
      case 'studio': return 'Studio';
      default: return user?.assignedService?.charAt(0).toUpperCase() + user?.assignedService?.slice(1) || 'Studio';
    }
  })();

  const [activeService, setActiveService] = useState(isSuper ? 'All' : (userDeptFormatted || 'Studio'));
  const [activeCurrency, setActiveCurrency] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationInputType, setLocationInputType] = useState('preset');
  const [editMode, setEditMode] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    serviceType: 'Studio',
    bookingDate: '',
    status: 'pending',
    totalAmount: '',
    amountPaid: '',
    phoneNumber: '',
    countryCode: '+250',
    countryName: 'Rwanda',
    location: 'Studio',
    customLocation: '',
    notes: '',
    currency: 'RWF',
  });

  const services = isSuper 
    ? ['All', 'Studio', 'Stationery & Office Supplies', 'Flower Gifts', 'Classic Fashion']
    : [userDeptFormatted || 'Studio'];

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const url = isSuper 
        ? import.meta.env.VITE_API_BASE_URL + '/api/v1/admin/bookings' 
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/bookings?service=${userDeptFormatted}`;
      
      const response = await secureFetch(url);
      const data = await response.json();
      if (data.success) {
        setAllBookings(data.data);
        setBookings(data.data);
      } else {
        setAllBookings([]);
        setBookings([]);
      }
    } catch (error) {
      console.error('Booking fetch error:', error);
      setAllBookings([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const roleFilteredBookings = React.useMemo(() => {
    if (isSuper) return allBookings;
    return allBookings.filter(b => b.serviceType === userDeptFormatted);
  }, [allBookings, isSuper, userDeptFormatted]);

  useEffect(() => {
    filterBookings();
  }, [activeService, activeCurrency, searchTerm, roleFilteredBookings]);

  const filterBookings = () => {
    let filtered = [...roleFilteredBookings];

    if (activeService !== 'All') {
      filtered = filtered.filter(b => b.serviceType === activeService);
    }

    if (activeCurrency !== 'All') {
      filtered = filtered.filter(b => (b.currency || 'RWF') === activeCurrency);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        (b.customerName || '').toLowerCase().includes(search) || 
        (b.customerEmail || '').toLowerCase().includes(search) ||
        (b.phoneNumber || '').toLowerCase().includes(search) ||
        (b.id || '').toString().includes(search) ||
        (b.location || '').toLowerCase().includes(search)
      );
    }

    setBookings(filtered);
  };

  const updateStatus = async (id, status) => {
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchBookings();
    } catch (error) {
       setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  const handleEdit = (booking) => {
    const presetLocations = ['Studio', 'Field/Outdoor', 'Client Office', 'Event Venue', 'Other'];
    const isPreset = presetLocations.includes(booking.location);
    
    const phone = booking.phoneNumber || '';
    const matchedCountry = ALL_COUNTRIES.find(c => phone.startsWith(c.code)) || ALL_COUNTRIES.find(x => x.name === 'Rwanda');
    const localPhone = phone.startsWith(matchedCountry.code) ? phone.slice(matchedCountry.code.length).trim() : phone.trim();

    setEditMode(true);
    setLocationInputType(isPreset ? 'preset' : 'custom');
    setFormData({
      customerName: booking.customerName || '',
      customerEmail: booking.customerEmail || '',
      serviceType: booking.serviceType || 'Studio',
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().slice(0, 16) : '',
      status: booking.status || 'pending',
      totalAmount: booking.totalAmount || '',
      amountPaid: booking.amountPaid || '',
      phoneNumber: localPhone,
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      location: isPreset ? booking.location : 'Studio',
      customLocation: isPreset ? '' : booking.location || '',
      notes: booking.notes || '',
      currency: booking.currency || 'RWF',
    });
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setLocationInputType('preset');
    setSelectedBooking(null);
    setReceiptFile(null);
    setFormData({
      customerName: '', 
      customerEmail: '', 
      serviceType: isSuper ? 'Studio' : (userDeptFormatted || 'Studio'), 
      bookingDate: '', 
      status: 'pending', 
      totalAmount: '', 
      amountPaid: '', 
      phoneNumber: '', 
      countryCode: '+250',
      countryName: 'Rwanda',
      location: 'Studio', 
      customLocation: '', 
      notes: '',
      currency: 'RWF',
      paymentMethod: 'Cash',
      paymentAccount: ''
    });
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const finalLocation = locationInputType === 'custom' && formData.customLocation.trim() 
        ? formData.customLocation.trim() 
        : formData.location;
      
      const finalPhone = `${formData.countryCode}${formData.phoneNumber.trim()}`;
      
      const payload = {
        ...formData,
        phoneNumber: finalPhone,
        location: finalLocation,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        amountPaid: parseFloat(formData.amountPaid) || 0
      };

      const formDataToSend = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
           formDataToSend.append(key, payload[key]);
        }
      });
      
      if (receiptFile) {
        formDataToSend.append('receipt', receiptFile);
      }

      const url = editMode 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/bookings/${selectedBooking.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/bookings`;
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await secureFetch(url, {
        method,
        body: formDataToSend
      });
      
      const data = await response.json();
      if (data.success) {
        fetchBookings();
        handleModalClose();
      } else {
        alert(data.message || `Failed to ${editMode ? 'update' : 'save'} booking`);
      }
    } catch (error) {
       console.error(`Failed to ${editMode ? 'UPDATE' : 'POST'} booking:`, error);
       alert(`Error connecting to server to ${editMode ? 'update' : 'save'} booking`);
    } finally {
       setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/bookings/${id}`, {
        method: 'DELETE'
      });
      fetchBookings();
    } catch (e) {
      console.error(e);
    }
  };

  const openMessageCenter = (booking) => {
    navigate('/admin/messages-admin', {
      state: {
        prefillEmail: booking.customerEmail,
        prefillName: booking.customerName,
        prefillSubject: `Re: Booking #BK-${booking.id}`,
        prefillMessage: `Dear ${booking.customerName},\n\nRegarding your booking #BK-${booking.id} for ${booking.serviceType}...\n\nBest regards,\nDRAVANUA HUB Team`
      }
    });
  };

  const generateBookingReport = (booking) => {
    const reportWindow = window.open('', '_blank');
    const balance = (booking.totalAmount || 0) - (booking.amountPaid || 0);
    const currency = booking.currency || 'RWF';
    
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Report - #BK-${booking.id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1B5E20; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: 900; color: #1B5E20; margin-bottom: 5px; }
          .tagline { font-size: 14px; color: #64748b; font-style: italic; }
          .booking-id { font-size: 24px; font-weight: 800; color: #1B5E20; margin: 20px 0; }
          .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 12px; }
          .section-title { font-size: 16px; font-weight: 800; color: #1B5E20; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { padding: 10px 0; }
          .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 600; color: #1e293b; }
          .stats-summary { background: linear-gradient(135deg, #1B5E20, #2E7D32); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
          .stats-item { display: inline-block; margin: 0 20px; }
          .stats-value { font-size: 32px; font-weight: 900; display: block; }
          .stats-label { font-size: 12px; opacity: 0.8; text-transform: uppercase; }
          .notes-section { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
          .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-top: 10px; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-confirmed { background: #dbeafe; color: #1e40af; }
          .status-completed { background: #dcfce7; color: #166534; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">DRAVANUA HUB</div>
          <div class="tagline">Here to Create</div>
          <div class="booking-id">Booking Report #BK-${booking.id}</div>
          <span class="status-badge status-${booking.status}">${booking.status}</span>
        </div>

        <div class="stats-summary">
          <div class="stats-item">
            <span class="stats-value">${(parseFloat(booking.totalAmount) || 0).toLocaleString()} ${currency}</span>
            <span class="stats-label">Total Amount</span>
          </div>
          <div class="stats-item">
            <span class="stats-value" style="color: #6ee7b7">${(parseFloat(booking.amountPaid) || 0).toLocaleString()} ${currency}</span>
            <span class="stats-label">Amount Paid</span>
          </div>
          <div class="stats-item">
            <span class="stats-value" style="color: ${balance > 0 ? '#fca5a5' : '#6ee7b7'}">${balance.toLocaleString()} ${currency}</span>
            <span class="stats-label">Outstanding Balance</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${booking.customerName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email Address</div>
              <div class="info-value">${booking.customerEmail || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone Number</div>
              <div class="info-value">${booking.phoneNumber || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Service Location</div>
              <div class="info-value">${booking.location || 'Studio'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Booking Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Service Type</div>
              <div class="info-value">${booking.serviceType}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Booking Date & Time</div>
              <div class="info-value">${new Date(booking.bookingDate).toLocaleString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Method</div>
              <div class="info-value">${booking.paymentMethod || 'Cash'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Handled By</div>
              <div class="info-value">${booking.handledByAdminName || 'System'}</div>
            </div>
          </div>
        </div>

        ${booking.notes ? `
          <div class="notes-section">
            <div class="section-title" style="color: #92400e; margin-bottom: 10px;">Operational Notes</div>
            <div style="line-height: 1.8; color: #78350f;">${booking.notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>DRAVANUA HUB</strong> | Kigali, Rwanda</p>
          <p>Email: info@dravanuahub.com | Phone: +250 795 520 554</p>
          <p style="margin-top: 10px; font-style: italic;">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background: #1B5E20; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer; margin-right: 10px;">PRINT REPORT</button>
          <button onclick="window.close()" style="background: white; color: #1B5E20; border: 2px solid #1B5E20; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer;">CLOSE</button>
        </div>
      </body>
      </html>
    `;
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
  };

  const generateGeneralReport = () => {
    const totalBookings = bookings.length;
    const totalExpected = bookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const totalCollected = bookings.reduce((sum, b) => sum + (parseFloat(b.amountPaid) || 0), 0);
    const totalPending = totalExpected - totalCollected;

    const bodyHtml = `
      <div class="section-title">Bookings Intelligence Summary</div>
      <div class="metrics-grid">
        <div class="metric-card"><span class="metric-val">${totalBookings}</span><span class="metric-lbl">Total Bookings</span></div>
        <div class="metric-card"><span class="metric-val">${fmtAmt(totalExpected, currency)}</span><span class="metric-lbl">Expected Revenue</span></div>
        <div class="metric-card"><span class="metric-val" style="color:#166534">${fmtAmt(totalCollected, currency)}</span><span class="metric-lbl">Revenue Collected</span></div>
        <div class="metric-card"><span class="metric-val" style="color:${totalPending > 0 ? '#dc2626' : '#166534'}">${fmtAmt(totalPending, currency)}</span><span class="metric-lbl">Outstanding Balance</span></div>
      </div>

      <div class="section-title">Operational Workflow Distribution</div>
      <table>
        <thead><tr><th>Service / Category</th><th>Bookings</th><th>Operational Load</th><th>Status</th></tr></thead>
        <tbody>
          ${['Studio', 'Papeterie', 'Flower Gifts', 'Classic Fashion', 'Wedding'].map(dept => {
            const count = bookings.filter(b => (b.department || b.service || b.serviceType) === dept).length;
            const pct = totalBookings > 0 ? (count / totalBookings * 100).toFixed(1) : 0;
            return `
            <tr>
              <td><strong>${dept}</strong></td>
              <td>${count} entries</td>
              <td>${pct}% of volume</td>
              <td><span class="badge badge-green">Operational</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    const page2Html = `
      <div class="section-title">Full Bookings Audit Ledger (${bookings.length} records)</div>
      <table>
        <thead><tr><th>Ref</th><th>Client Name</th><th>Service Type</th><th>Date</th><th style="text-align:right">Total Amount</th></tr></thead>
        <tbody>
          ${bookings.slice(0, 45).map((b, i) => `
            <tr>
              <td style="color:#999;font-size:10px">BK-${b.id}</td>
              <td style="font-weight:700">${b.clientName || b.customerName || '—'}</td>
              <td><span class="badge badge-blue">${b.service || b.serviceType || 'General'}</span></td>
              <td style="font-size:10px">${new Date(b.date || b.bookingDate).toLocaleDateString()}</td>
              <td style="text-align:right; font-weight:900; color:#1B5E20">${fmtAmt(b.totalAmount || 0, currency)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    generateReport({ 
      title: 'Bookings Performance Audit', 
      moduleCode: 'BKG', 
      bodyHtml, 
      page2Html 
    });
  };

  const downloadBookingReport = (booking) => {
    generateBookingReport(booking);
  };

  // Calculate booking stats
  const bookingStats = React.useMemo(() => {
    return {
      total: bookings.length,
      expectedRevenue: bookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0),
      collectedRevenue: bookings.reduce((sum, b) => sum + (parseFloat(b.amountPaid) || 0), 0),
      pendingBalance: bookings.reduce((sum, b) => sum + ((parseFloat(b.totalAmount) || 0) - (parseFloat(b.amountPaid) || 0)), 0),
      confirmedCount: bookings.filter(b => b.status === 'confirmed').length,
      completedCount: bookings.filter(b => b.status === 'completed').length,
    };
  }, [bookings]);

  return (
    <div className="admin-page animate-fadeIn" style={{ paddingBottom: '2rem' }}>
      <Header 
        title="Reservation Command" 
        subtitle={isSuper ? "Executive Oversight • Global Booking Repository" : `Departmental Audit • ${userDeptFormatted}`}
      />

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>TOTAL BOOKINGS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{bookingStats.total.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>REVENUE COLLECTED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{fmtAmt(bookingStats.collectedRevenue, currency)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>OUTSTANDING BALANCE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFCC80' }}>{fmtAmt(bookingStats.pendingBalance, currency)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>EXPECTED TOTAL</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{fmtAmt(bookingStats.expectedRevenue, currency)}</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="admin-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Left Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="admin-search" style={{ width: '280px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={14} />
              <input 
                type="text" 
                placeholder="Search bookings..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <button 
              onClick={() => setIsModalOpen(true)} 
              style={{ 
                height: '38px', padding: '0 16px', borderRadius: '10px', background: '#1B5E20', color: 'white', border: 'none',
                fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
              }}
            >
              <Plus size={16} /> NEW RECORD
            </button>
          </div>

          {/* Right Filters & Exports */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#f8fafc', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {services.map(s => (
                <button 
                  key={s} 
                  onClick={() => setActiveService(s)}
                  style={{ 
                    padding: '6px 12px', border: 'none', background: activeService === s ? 'white' : 'transparent',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 900,
                    boxShadow: activeService === s ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', 
                    color: activeService === s ? '#1B5E20' : '#64748b'
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            <select 
              value={activeCurrency} 
              onChange={(e) => setActiveCurrency(e.target.value)}
              style={{ height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0 10px', fontSize: '0.72rem', fontWeight: 900, background: 'white', color: '#1B5E20', cursor: 'pointer' }}
            >
              <option value="All">ALL CURR</option>
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

            <ExportToolbar
              onPDF={generateGeneralReport}
              onExcel={() => exportToExcel([{
                name: 'Bookings',
                rows: bookings.map(b => ({
                  'Booking ID': `BK-${b.id}`,
                  Client: b.clientName || b.customerName || '—',
                  Service: b.service || b.serviceType || '—',
                  Date: b.date || b.bookingDate || '—',
                  Status: b.status || '—',
                  [`Amount (${currency})`]: Number(b.totalAmount || 0),
                }))
              }], `Bookings_Report_${new Date().toISOString().slice(0,10)}`)}
              currency={currency}
              onCurrency={(code) => { setCurrency(code); localStorage.setItem('dvs_currency', code); }}
              moduleCode="BKG"
            />

            <button 
              onClick={fetchBookings}
              style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B5E20' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>


      {/* Data Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', background: 'white', borderRadius: '24px' }}>
          <Loader2 size={32} className="spin-animation" style={{ color: '#1B5E20' }} />
          <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 800 }}>Loading bookings...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <ShoppingBag size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Bookings Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'No bookings available for this department'}
          </p>
        </div>
      ) : (
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>RESERVATION LEDGER</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>OPERATIONAL AUDIT · {bookings.length} RECORDS</div>
            </div>
            <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 700 }}>
              <div style={{ color: '#90EE90' }}>CONFIDENTIAL</div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', minWidth: '1000px' }}>
              <thead>
                <tr>
                  {['BOOKING / CLIENT', 'SERVICE', 'DATE', 'PAYMENT', 'BALANCE', 'METHOD', 'STATUS', 'ACTIONS'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 14px', color: 'white', fontWeight: 900, fontSize: '0.62rem',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      textAlign: (h === 'PAYMENT' || h === 'BALANCE') ? 'right' : (h === 'ACTIONS' ? 'center' : 'left'),
                      background: 'linear-gradient(180deg, #1B5E20, #166534)',
                      borderRight: i < 7 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => {
                  const total = Number(b.totalAmount) || 0;
                  const paid = Number(b.amountPaid) || 0;
                  const balance = total - paid;
                  const bookingCurrency = b.currency || 'RWF';
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafcfb' }} className="hover-row">
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <User size={14} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>{b.customerName}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{b.customerEmail || 'No Email'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#475569' }}>
                          {b.serviceType?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#1e293b' }}>{new Date(b.bookingDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#1B5E20', fontSize: '0.78rem' }}>{paid.toLocaleString()} {bookingCurrency}</div>
                        <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>OF {total.toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: balance > 0 ? '#dc2626' : '#16a34a', fontSize: '0.78rem' }}>
                          {balance === 0 ? 'SETTLED' : balance.toLocaleString() + ' ' + bookingCurrency}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b' }}>{b.paymentMethod || 'CASH'}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select 
                          value={b.status} 
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          style={{ 
                            fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', padding: '3px 6px', borderRadius: '4px', border: 'none', cursor: 'pointer', outline: 'none',
                            background: b.status === 'confirmed' ? '#dbeafe' : b.status === 'completed' ? '#dcfce7' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                            color: b.status === 'confirmed' ? '#1e40af' : b.status === 'completed' ? '#166534' : b.status === 'cancelled' ? '#991b1b' : '#92400e'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(b)} title="Edit" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1B5E20', cursor: 'pointer' }}><Edit size={14} /></button>
                          <button onClick={() => openMessageCenter(b)} title="Message" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#d97706', cursor: 'pointer' }}><Mail size={14} /></button>
                          <button onClick={() => { setSelectedBooking(b); setIsDetailsOpen(true); }} title="Details" style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Info size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Manual Entry/Edit */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '1000px', width: '95%', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {editMode ? <Edit size={22} /> : <ShoppingBag size={22} />}
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>
                  {editMode ? `Update Booking #BK-${selectedBooking?.id}` : 'Record New Booking'}
                </h3>
              </div>
              <button 
                onClick={handleModalClose} 
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualEntry} style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
              {/* Customer Info */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1B5E20', textTransform: 'uppercase', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', letterSpacing: '0.03em' }}>
                  👤 Customer Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.customerName} 
                      onChange={e => setFormData({...formData, customerName: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={formData.customerEmail} 
                      onChange={e => setFormData({...formData, customerEmail: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Country Code</label>
                    <select 
                      value={formData.countryCode} 
                      onChange={e => {
                        const c = ALL_COUNTRIES.find(x => x.code === e.target.value);
                        setFormData({...formData, countryCode: e.target.value, countryName: c?.name || 'Other'});
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#f8fafc', fontWeight: 900 }}
                    >
                      {ALL_COUNTRIES.map(c => (
                        <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phoneNumber} 
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                      placeholder="788 000 000" 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700 }} 
                    />
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1B5E20', textTransform: 'uppercase', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', letterSpacing: '0.03em' }}>
                  📅 Booking Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Service Type *</label>
                    <select 
                      value={formData.serviceType} 
                      onChange={e => setFormData({...formData, serviceType: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', background: '#fcfdfc' }}
                    >
                      {isSuper ? (
                        <>
                          <option value="Studio">Studio Photography</option>
                          <option value="Stationery & Office Supplies">Papeterie Services</option>
                          <option value="Flower Gifts">Floral Arrangements</option>
                          <option value="Classic Fashion">Classic Fashion Styling</option>
                        </>
                      ) : (
                        <option value={userDeptFormatted}>{userDeptFormatted}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Date & Time *</label>
                    <input 
                      type="datetime-local" 
                      required 
                      value={formData.bookingDate} 
                      onChange={e => setFormData({...formData, bookingDate: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Service Location</span>
                    <div style={{ display: 'flex', gap: '4px', background: '#f8fafc', padding: '2px', borderRadius: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => setLocationInputType('preset')}
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.6rem', 
                          border: 'none', 
                          background: locationInputType === 'preset' ? '#1B5E20' : 'transparent',
                          color: locationInputType === 'preset' ? 'white' : '#64748b',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 800
                        }}
                      >
                        PRESET
                      </button>
                      <button 
                        type="button"
                        onClick={() => setLocationInputType('custom')}
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.6rem', 
                          border: 'none', 
                          background: locationInputType === 'custom' ? '#1B5E20' : 'transparent',
                          color: locationInputType === 'custom' ? 'white' : '#64748b',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 800
                        }}
                      >
                        CUSTOM
                      </button>
                    </div>
                  </label>
                  {locationInputType === 'preset' ? (
                    <select 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', background: '#fcfdfc' }}
                    >
                      <option value="Studio">Studio (Office)</option>
                      <option value="Field/Outdoor">Field / Outdoor</option>
                      <option value="Client Office">Client Office</option>
                      <option value="Event Venue">Event Venue</option>
                      <option value="Other">Other / Remote</option>
                    </select>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1B5E20' }} />
                      <input 
                        type="text" 
                        value={formData.customLocation} 
                        onChange={e => setFormData({...formData, customLocation: e.target.value})} 
                        placeholder="Enter customer location..."
                        style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px', border: '1px solid #1B5E20', fontSize: '0.9rem', background: '#f0fdf4' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Section */}
              <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#fcfdfc', border: '1px solid #efefef', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1B5E20', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  💰 Financial Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Currency</label>
                    <select 
                      value={formData.currency} 
                      onChange={e => setFormData({...formData, currency: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: 'white', fontWeight: 800 }}
                    >
                      <option value="RWF">RWF</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="KES">KES</option>
                      <option value="UGX">UGX</option>
                      <option value="TZS">TZS</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Total Amount ({formData.currency})*</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.totalAmount} 
                      onChange={e => setFormData({...formData, totalAmount: e.target.value})} 
                      placeholder="0" 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 900, fontSize: '1.1rem' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Paid ({formData.currency})</label>
                    <input 
                      type="number" 
                      value={formData.amountPaid} 
                      onChange={e => setFormData({...formData, amountPaid: e.target.value})} 
                      placeholder="0" 
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1B5E20', fontWeight: 900, fontSize: '1.1rem', color: '#1B5E20' }} 
                    />
                  </div>
                </div>

                <div style={{ background: (parseFloat(formData.totalAmount || 0) - parseFloat(formData.amountPaid || 0)) > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '10px', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Outstanding Balance</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: (parseFloat(formData.totalAmount || 0) - parseFloat(formData.amountPaid || 0)) > 0 ? '#dc2626' : '#16a34a' }}>
                      {((parseFloat(formData.totalAmount || 0) - parseFloat(formData.amountPaid || 0))).toLocaleString()} {formData.currency}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '4px 12px', borderRadius: '6px', background: (parseFloat(formData.totalAmount || 0) - parseFloat(formData.amountPaid || 0)) <= 0 ? '#dcfce7' : '#fef9c3', color: (parseFloat(formData.totalAmount || 0) - parseFloat(formData.amountPaid || 0)) <= 0 ? '#166534' : '#854d0e', textTransform: 'uppercase' }}>
                    {(parseFloat(formData.totalAmount || 0) - parseFloat(formData.amountPaid || 0)) <= 0 ? '✓ PAID' : '⏳ PENDING'}
                  </span>
                </div>
              </div>

              {/* Additional Info */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1B5E20', textTransform: 'uppercase', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', letterSpacing: '0.03em' }}>
                  📝 Additional Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Payment Method</label>
                    <select 
                      value={formData.paymentMethod || 'Cash'} 
                      onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Reference / Account</label>
                    <input 
                      type="text" 
                      value={formData.paymentAccount || ''} 
                      onChange={e => setFormData({...formData, paymentAccount: e.target.value})}
                      placeholder="MoMo Number or Reference"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.9rem' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Operational Notes</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    rows={3} 
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', resize: 'vertical', lineHeight: '1.6' }} 
                    placeholder="Add operational notes..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Receipt / Attachment</label>
                  <div style={{ 
                    border: '2px dashed #e2e8f0', 
                    borderRadius: '12px', 
                    padding: '1.25rem', 
                    textAlign: 'center',
                    background: receiptFile ? '#f0fdf4' : '#f8fafc',
                    borderColor: receiptFile ? '#16a34a' : '#e2e8f0',
                    position: 'relative',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="file" 
                      onChange={e => setReceiptFile(e.target.files[0])}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    {receiptFile ? (
                      <div style={{ color: '#166534', fontWeight: 800, fontSize: '0.75rem' }}>
                        ✅ {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                      </div>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                        <FileText size={20} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                        Drop file here or click to browse
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button 
                  type="button" 
                  onClick={handleModalClose} 
                  style={{ 
                    background: 'white', 
                    border: '1px solid #e2e8f0', 
                    padding: '12px 24px', 
                    borderRadius: '12px', 
                    fontSize: '0.85rem', 
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  style={{ 
                    background: '#1B5E20', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 36px', 
                    borderRadius: '12px', 
                    fontSize: '0.85rem', 
                    fontWeight: 900, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    opacity: isSaving ? 0.7 : 1, 
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSaving ? (
                    <><Loader2 size={18} className="spin-animation" /> {editMode ? 'UPDATING...' : 'SAVING...'}</>
                  ) : (
                    editMode ? '✓ UPDATE BOOKING' : '+ SAVE BOOKING'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsOpen && selectedBooking && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '550px', width: '90%', borderRadius: '24px', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.8, textTransform: 'uppercase', marginBottom: '6px' }}>Booking Details</div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Reference #BK-{selectedBooking.id}</h3>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)} 
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.3rem', padding: 0 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{new Date(selectedBooking.bookingDate).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} />
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedBooking.customerName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} />
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedBooking.phoneNumber || 'N/A'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} />
                  <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>{selectedBooking.location || 'Studio'}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'white', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <DollarSign size={12} /> Total
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1B5E20' }}>{(selectedBooking.totalAmount || 0).toLocaleString()} {selectedBooking.currency || 'RWF'}</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <Landmark size={12} /> Balance
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: (selectedBooking.totalAmount - selectedBooking.amountPaid) > 0 ? '#dc2626' : '#16a34a' }}>
                    {((selectedBooking.totalAmount || 0) - (selectedBooking.amountPaid || 0)).toLocaleString()} {selectedBooking.currency || 'RWF'}
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
                  <div style={{ padding: '1rem', background: '#fcfdfc', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                    {selectedBooking.notes}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => { setIsDetailsOpen(false); openMessageCenter(selectedBooking); }} 
                  style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#92400e', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Mail size={14} /> SEND EMAIL
                </button>
                <button 
                  onClick={() => downloadBookingReport(selectedBooking)} 
                  style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FileText size={14} /> REPORT
                </button>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>HANDLED BY: {selectedBooking.handledByAdminName || 'SYSTEM'}</span>
                <button 
                  onClick={() => setIsDetailsOpen(false)} 
                  style={{ background: '#1B5E20', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: rgba(0,0,0,0.4); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 9999; 
          backdrop-filter: blur(4px);
        }
        .btn-icon:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(5px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .hover-row:hover { background: #f8fafc !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ManageBookings;