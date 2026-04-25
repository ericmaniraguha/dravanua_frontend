import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { 
  QrCode, Download, Printer, FileText, Camera, User, 
  Palette, CheckCircle, RefreshCw, X, Search, CreditCard, 
  Users, Link as LinkIcon, Save, Upload 
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const StaffIDCardGenerator = () => {
  const { user: currentUser, secureFetch } = useAuth();
  const location = useLocation();
  
  // Refs
  const cardRef = useRef(null);
  const barcodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // State Management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [design, setDesign] = useState('professional');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Image Management
  const [customImage, setCustomImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState('official'); // 'official', 'upload', 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);

  // Design Templates
  const cardStyles = {
    professional: {
      background: 'linear-gradient(135deg, #32FC05, #2E7D32)',
      color: 'white',
      accent: '#32CD32'
    },
    modern: {
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      color: 'white',
      accent: '#38bdf8'
    },
    minimal: {
      background: '#ffffff',
      color: '#1e293b',
      accent: '#32FC05',
      border: '1px solid #e2e8f0'
    }
  };

  // ============================================
  // DATA FETCHING
  // ============================================
  
  const fetchUsers = async () => {
    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        
        // Auto-select user if passed from another page
        if (location.state?.userId) {
          const found = data.data.find(u => u.id === location.state.userId);
          if (found) {
            setSelectedUser(found);
            if (found.profilePicture) {
              setImageUrl(`${import.meta.env.VITE_API_BASE_URL}${found.profilePicture}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ============================================
  // IMAGE MANAGEMENT
  // ============================================

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('');
    
    const form = new FormData();
    form.append('image', file);

    try {
      const response = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/upload-image`, 
        { method: 'POST', body: form }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setCustomImage(data.url);
        setImageUrl(data.url);
        setImageMode('upload');
        setUploadStatus('✅ Credential photo uploaded successfully!');
      } else {
        setUploadStatus('❌ Error: Failed to upload photo.');
      }
    } catch (error) {
      setUploadStatus('❌ Error: Network communication failure.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!selectedUser) return;
    
    const finalUrl = getProfileImage();
    if (!finalUrl) {
      alert('No image to apply');
      return;
    }

    try {
      setIsUploading(true);
      const relativeUrl = finalUrl.replace(import.meta.env.VITE_API_BASE_URL, '');
      
      const response = await secureFetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/users/${selectedUser.id}`, 
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: relativeUrl })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setUploadStatus('✅ Profile photo synchronized successfully!');
        fetchUsers();
      } else {
        setUploadStatus(`❌ Error: ${data.message || 'Profile sync failed'}`);
      }
    } catch (error) {
      setUploadStatus('❌ Error: Synchronization failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const getProfileImage = () => {
    if (imageMode === 'official' && selectedUser?.profilePicture) {
      return `${import.meta.env.VITE_API_BASE_URL}${selectedUser.profilePicture}`;
    }
    if (imageMode === 'upload' && customImage) return customImage;
    if (imageMode === 'url' && imageUrl) return imageUrl;
    return null;
  };

  // ============================================
  // BARCODE GENERATION
  // ============================================

  useEffect(() => {
    if (selectedUser && barcodeRef.current) {
      const timer = setTimeout(() => {
        try {
          JsBarcode(barcodeRef.current, selectedUser.staffCode || 'DV-2024-XXX', {
            format: "CODE128",
            lineColor: design === 'minimal' ? "#1e293b" : "#ffffff",
            width: 1.2,
            height: 30,
            displayValue: false,
            margin: 0,
            background: "transparent"
          });
        } catch (e) {
          console.error("Barcode generation failed", e);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedUser, design]);

  // ============================================
  // AUTO-SELECT IMAGE MODE
  // ============================================

  useEffect(() => {
    if (selectedUser) {
      if (selectedUser.profilePicture) {
        setImageMode('official');
      } else {
        setImageMode('url');
      }
    }
  }, [selectedUser]);

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const link = document.createElement('a');
    link.download = `ID_${selectedUser.staffCode || selectedUser.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportPDF = async () => {
    if (!cardRef.current) return;
    
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    // CR80 Standard Size: 3.375 x 2.125 inches
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [3.375, 2.125]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, 3.375, 2.125);
    pdf.save(`ID_${selectedUser.staffCode || selectedUser.name}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentStyle = cardStyles[design];
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.staffCode && u.staffCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const qrCodeData = selectedUser ? encodeURIComponent(
    `DRAVANUA HUB\nStaff ID: ${selectedUser.staffCode}\nDate Printed: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\nPrinted By: ${currentUser?.name || 'Headquarters'}\nContact: +250 788 000 000\nEmail: info@dravanua.com\nWebsite: www.dravanua.com`
  ) : '';

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="admin-page animate-fadeIn no-print-page">
      <Header 
        title="Staff ID Card Center" 
        subtitle="Generate, personalize, and export professional scannable identity cards for all personnel."
      />

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <ImageZoomModal 
          imageUrl={zoomedImage} 
          onClose={() => setZoomedImage(null)} 
        />
      )}

      <div className="id-generator-container">
        
        {/* LEFT PANEL: Staff Selector */}
        <div className="staff-selector-panel">
          <StaffSelectorPanel 
            users={filteredUsers}
            selectedUser={selectedUser}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectUser={setSelectedUser}
          />

          <DesignSelectorPanel 
            design={design}
            onSelectDesign={setDesign}
          />
        </div>

        {/* RIGHT PANEL: Card Preview & Actions */}
        <div className="card-preview-panel">
          {selectedUser ? (
            <>
              {/* Card Preview */}
              <div className="admin-card card-preview-stage">
                <IDCard 
                  ref={cardRef}
                  barcodeRef={barcodeRef}
                  user={selectedUser}
                  design={design}
                  style={currentStyle}
                  profileImage={getProfileImage()}
                  qrCodeData={qrCodeData}
                  currentUser={currentUser}
                  onImageClick={() => {
                    const img = getProfileImage();
                    if (img) setZoomedImage(img);
                  }}
                />
              </div>

              {/* Personalization Panel: Moved from left to right as requested to extend under the Aesthetic Templates area */}
              <PersonalizationPanel 
                imageMode={imageMode}
                setImageMode={setImageMode}
                selectedUser={selectedUser}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                isUploading={isUploading}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                handleApplyToProfile={handleApplyToProfile}
              />

              {/* Export Controls */}
              <div style={{ marginTop: '1.5rem' }}>
                <ExportActionsPanel 
                  onDownloadPNG={handleDownloadPNG}
                  onExportPDF={handleExportPDF}
                  onPrint={handlePrint}
                />
              </div>

              <ProductionNotice />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      <IDCardStyles />
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const ImageZoomModal = ({ imageUrl, onClose }) => (
  <div 
    onClick={onClose}
    style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 9999, 
      background: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(8px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      cursor: 'zoom-out', 
      animation: 'fadeIn 0.2s'
    }}
  >
    <img 
      src={imageUrl} 
      alt="Zoomed" 
      style={{ 
        maxWidth: '90vw', 
        maxHeight: '90vh', 
        borderRadius: '16px', 
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)', 
        border: '4px solid white' 
      }} 
    />
    <button 
      onClick={onClose}
      style={{ 
        position: 'absolute', 
        top: '2rem', 
        right: '2rem', 
        background: 'white', 
        border: 'none', 
        borderRadius: '50%', 
        width: '44px', 
        height: '44px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <X size={24} color="#000" />
    </button>
  </div>
);

const StaffSelectorPanel = ({ users, selectedUser, searchTerm, onSearchChange, onSelectUser }) => (
  <div className="admin-card staff-search-card">
    <div className="panel-header">
      <Users size={20} color="#32FC05" />
      <h3 className="panel-title">STAFF REPOSITORY</h3>
    </div>
    
    <div className="staff-search-inp">
      <Search size={16} color="#32FC05" />
      <input 
        type="text" 
        placeholder="Search staff members..." 
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ 
          background: 'none', 
          border: 'none', 
          outline: 'none', 
          width: '100%', 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          color: '#1e293b' 
        }}
      />
    </div>

    <div className="staff-list-table-container">
      <table className="staff-mini-table">
        <thead>
          <tr>
            <th>Staff Member</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr 
              key={user.id} 
              className={selectedUser?.id === user.id ? 'active' : ''}
              onClick={() => onSelectUser(user)}
            >
              <td>
                <div className="staff-cell">
                  <div className="staff-avatar">{user.name.charAt(0)}</div>
                  <span className="staff-name">{user.name}</span>
                </div>
              </td>
              <td>
                <span className="staff-id-badge">{user.staffCode || 'N/A'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DesignSelectorPanel = ({ design, onSelectDesign }) => (
  <div className="admin-card">
    <div className="panel-header">
      <Palette size={40} color="#32FC05" />
      <h3 className="panel-title">Aesthetic Templates</h3>
    </div>
    <div className="design-buttons-grid">
      {['professional', 'modern', 'minimal'].map(template => (
        <button 
          key={template}
          onClick={() => onSelectDesign(template)}
          className={`design-option-btn ${design === template ? 'active' : ''}`}
        >
          <span style={{ textTransform: 'capitalize' }}>{template} Design</span>
          {design === template && <CheckCircle size={14} />}
        </button>
      ))}
    </div>
  </div>
);

const IDCard = React.forwardRef(({ 
  barcodeRef, 
  user, 
  design, 
  style, 
  profileImage, 
  qrCodeData, 
  currentUser,
  onImageClick 
}, ref) => (
  <div 
    ref={ref}
    id="printable-id-card"
    className={`identity-card-element design-${design}`}
    style={{
      background: style.background,
      color: style.color,
      border: style.border || 'none'
    }}
  >
    {/* Header */}
    <div className="id-card-header">
      <div className="id-card-brand">
        <div className="id-card-logo">
          <img src="/logo-dvs.jpg" alt="Logo" />
        </div>
        <div className="id-card-brand-text">
          <div className="hub-title">DRAVANUA HUB</div>
          <div className="hub-subtitle">Staff Identity Credential</div>
        </div>
      </div>
      <div className="id-card-header-right">
        <div className="id-card-validity">
          <div className="validity-years">2024 - 2026</div>
          <div className="validity-status">AUTHORIZED</div>
        </div>
        <div className="id-card-qr">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrCodeData}`} 
            alt="QR Code" 
          />
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="id-card-body">
      <div 
        className="id-card-photo" 
        onClick={onImageClick}
        style={{ cursor: profileImage ? 'zoom-in' : 'default' }}
      >
        {profileImage ? (
          <img src={profileImage} alt="Profile" />
        ) : (
          <div className="photo-placeholder">{user.name.charAt(0)}</div>
        )}
      </div>

      <div className="id-card-details">
        <div className="id-card-name">{user.name.toUpperCase()}</div>
        <div className="id-card-role" style={{ color: style.accent }}>
          {user.role === 'super_admin' ? 'Chief Executive Admin' : 'Senior Operational Staff'}
        </div>

        <div className="id-card-meta-grid">
          <div className="meta-item">
            <label>Department</label>
            <span>{user.Department?.name || 'General Staff'}</span>
          </div>
          <div className="meta-item">
            <label>Join Date</label>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="id-card-employee-id">
          <label>Staff ID Credentials</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginTop: '5px' }}>
            <span style={{ 
              fontSize: '0.42rem', 
              padding: '4px 12px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '50px', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              border: '1px solid rgba(255,255,255,0.3)',
              marginRight: 'auto',
              marginBottom: '45px'
            }}>
              Verification Status: Active
            </span>
           </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="id-card-footer">
      <div className="id-card-contact">
        Contact: +250 788 000 000 | Email: info@dravanua.com<br/>
        Website: www.dravanua.com<br/>
        <div style={{ 
          marginTop: '4px', 
          fontWeight: 800, 
          fontSize: '0.30rem', 
          textTransform: 'uppercase', 
          color: style.accent 
        }}>
          If this card is found, return it to the above address
        </div>
      </div>
      <div className="id-card-barcode-wrap">
        <div className={`barcode-bg ${design === 'minimal' ? 'minimal' : ''}`}>
          <canvas ref={barcodeRef}></canvas>
        </div>
        <div className="barcode-text">
          {user.staffCode}
        </div>
      </div>
    </div>
    
    {/* Hologram Effect */}
    <div className="id-card-hologram"></div>
  </div>
));

const PersonalizationPanel = ({ 
  imageMode, 
  setImageMode, 
  selectedUser, 
  imageUrl, 
  setImageUrl, 
  isUploading, 
  uploadStatus, 
  setUploadStatus,
  fileInputRef,
  handleImageUpload,
  handleApplyToProfile 
}) => (
  <div className="admin-card">
    <div className="panel-header">
      <Camera size={20} color="#32FC05" />
      <h3 className="panel-title">CREDENTIAL PERSONALIZATION</h3>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Mode Toggle Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => { setImageMode('official'); setUploadStatus(''); }}
          disabled={!selectedUser?.profilePicture}
          className="image-mode-btn"
          title="Official Photo"
          style={{ 
            background: imageMode === 'official' ? '#32FC05' : '#f8fafc', 
            color: imageMode === 'official' ? 'white' : '#64748b', 
            opacity: !selectedUser?.profilePicture ? 0.5 : 1, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            padding: '12px' 
          }}
        >
          <Camera size={18} />
        </button>
        <button 
          onClick={() => { setImageMode('upload'); setUploadStatus(''); }}
          className="image-mode-btn"
          title="Upload New"
          style={{ 
            background: imageMode === 'upload' ? '#32FC05' : '#f8fafc', 
            color: imageMode === 'upload' ? 'white' : '#64748b', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            padding: '12px'
          }}
        >
          <Upload size={18} />
        </button>
        <button 
          onClick={() => { setImageMode('url'); setUploadStatus(''); }}
          className="image-mode-btn"
          title="Custom Link"
          style={{ 
            background: imageMode === 'url' ? '#32FC05' : '#f8fafc', 
            color: imageMode === 'url' ? 'white' : '#64748b', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            padding: '12px'
          }}
        >
          <LinkIcon size={18} />
        </button>
      </div>

      {/* Upload Status Message */}
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : 'success'}`}>
          {uploadStatus}
        </div>
      )}

      {/* Upload Mode */}
      {imageMode === 'upload' && (
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            style={{ display: 'none' }} 
            accept="image/*" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="upload-btn"
          >
            {isUploading ? (
              <>
                <RefreshCw size={18} className="spin-animation" /> 
                UPLOADING...
              </>
            ) : (
              <>
                <Camera size={18} /> 
                UPLOAD CREDENTIAL PHOTO
              </>
            )}
          </button>
        </div>
      )}

      {/* URL Mode */}
      {imageMode === 'url' && (
        <div>
          <label className="input-label">Remote Image Synchronization</label>
          <input 
            type="url" 
            placeholder="https://image-source.com/photo.jpg" 
            value={imageUrl} 
            onChange={(e) => { setImageUrl(e.target.value); setUploadStatus(''); }}
            className="url-input"
          />
        </div>
      )}
      
      {/* Apply to Profile Action */}
      {imageUrl && (
        <div className="image-link-display">
          <div className="image-link-header">
            <span className="image-link-label">Active Image Link:</span>
            <span className="image-link-badge">VERIFIED SOURCE</span>
          </div>
          <div className="image-link-url">{imageUrl}</div>
          <button 
            onClick={handleApplyToProfile}
            disabled={isUploading}
            className="apply-profile-btn"
          >
            {isUploading ? (
              <RefreshCw size={14} className="spin-animation" />
            ) : (
              <Save size={14} />
            )}
            APPLY TO PROFILE
          </button>
        </div>
      )}
    </div>
  </div>
);

const ExportActionsPanel = ({ onDownloadPNG, onExportPDF, onPrint }) => (
  <div className="id-action-toolbar">
    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
      <button onClick={onDownloadPNG} className="btn btn-outline id-btn">
        <Download size={18} /> PNG
      </button>
      <button onClick={onExportPDF} className="btn btn-outline id-btn">
        <FileText size={18} /> PDF
      </button>
    </div>
    <button onClick={onPrint} className="btn btn-primary id-btn-main">
      <Printer size={18} /> Print Verified Identity Card
    </button>
  </div>
);

const ProductionNotice = () => (
  <div className="id-production-notice">
    <div className="notice-icon">
      <CreditCard size={20} />
    </div>
    <div className="notice-content">
      <div className="notice-title">Ready for Production</div>
      <div className="notice-text">
        This card is generated at standard CR80 credit card dimensions for professional PVC printing.
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="admin-card card-empty-state">
    <QrCode size={60} className="empty-icon" />
    <h3 className="empty-title">Personnel Identity Management</h3>
    <p className="empty-text">
      Select a workforce member from the repository index to begin crafting their secure operational credentials.
    </p>
  </div>
);

// ============================================
// STYLES COMPONENT
// ============================================

const IDCardStyles = () => (
  <style>{`
    /* ===== LAYOUT ===== */
    .id-generator-container {
      display: flex;
      gap: 2rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }

    .staff-selector-panel {
      flex: 0 0 380px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card-preview-panel {
      flex: 1;
      min-width: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ===== PANEL HEADERS ===== */
    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.25rem;
    }

    .panel-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 900;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ===== STAFF SEARCH ===== */
    .staff-search-inp {
      margin-bottom: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 0 15px;
      height: 44px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* ===== STAFF TABLE ===== */
    .staff-list-table-container {
      max-height: 400px;
      overflow-y: auto;
    }

    .staff-mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .staff-mini-table th {
      text-align: left;
      padding: 10px;
      color: #64748b;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.65rem;
      border-bottom: 1px solid #f1f5f9;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }

    .staff-mini-table tr {
      cursor: pointer;
      transition: all 0.2s;
    }

    .staff-mini-table tr:hover {
      background: #f8fafc;
    }

    .staff-mini-table tr.active {
      background: #f1f5f9;
    }

    .staff-mini-table td {
      padding: 10px;
      border-bottom: 1px solid #f8fafc;
    }

    .staff-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .staff-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #32FC05, #32CD32);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 0.65rem;
    }

    .staff-name {
      font-weight: 700;
      color: #1e293b;
    }

    .staff-id-badge {
      font-size: 0.65rem;
      font-weight: 800;
      color: #32FC05;
      background: #f0faf0;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      border: 1px solid #dcfce7;
    }

    /* ===== DESIGN SELECTOR ===== */
    .design-buttons-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .design-option-btn {
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: white;
      text-align: left;
      font-weight: 800;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s;
    }

    .design-option-btn:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .design-option-btn.active {
      border-color: #32FC05;
      background: #f0faf0;
      color: #32FC05;
      border-width: 2px;
    }

    /* ===== CARD PREVIEW STAGE ===== */
    .card-preview-stage {
      padding: 3rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      min-height: 480px;
    }

    /* ===== ID CARD ELEMENT ===== */
    .identity-card-element {
      width: 540px;
      height: 340px;
      border-radius: 20px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.12);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .id-card-header {
      height: 65px;
      padding: 0 25px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }

    .id-card-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .id-card-logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: white;
      padding: 4px;
      overflow: hidden;
    }

    .id-card-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .hub-title {
      font-size: 1.25rem;
      font-weight: 950;
      letter-spacing: 0.5px;
      line-height: 1;
    }

    .hub-subtitle {
      font-size: 0.55rem;
      font-weight: 800;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 3px;
    }

    .id-card-header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .validity-years {
      font-size: 0.7rem;
      font-weight: 900;
      opacity: 0.9;
    }

    .validity-status {
      font-size: 0.45rem;
      font-weight: 800;
      opacity: 0.7;
      text-align: right;
    }

    .id-card-qr {
      width: 42px;
      height: 42px;
      background: white;
      border-radius: 8px;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .id-card-qr img {
      width: 100%;
      height: 100%;
    }

    .id-card-body {
      flex: 1;
      padding: 15px 25px;
      display: flex;
      gap: 30px;
    }

    .id-card-photo {
      width: 120px;
      height: 150px;
      border-radius: 14px;
      background: rgba(255,255,255,0.15);
      border: 2px solid white;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .id-card-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      font-size: 3.5rem;
      font-weight: 900;
      opacity: 0.6;
    }

    .id-card-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-top: 5px;
    }

    .id-card-name {
      font-size: 1.35rem;
      font-weight: 950;
      line-height: 1;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    .id-card-role {
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 15px;
      opacity: 0.95;
    }

    .id-card-meta-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .meta-item label {
      display: block;
      font-size: 0.5rem;
      font-weight: 900;
      opacity: 0.8;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }

    .meta-item span {
      display: block;
      font-size: 1rem;
      font-weight: 800;
      line-height: 1.2;
    }

    .id-card-employee-id label {
      display: block;
      font-size: 0.55rem;
      font-weight: 900;
      opacity: 0.8;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .id-value {
      font-size: 1.3rem;
      font-weight: 950;
      letter-spacing: 2px;
      font-family: 'JetBrains Mono', monospace;
    }

    .id-card-footer {
      height: 60px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding: 0 25px 12px;
    }

    .id-card-contact {
      font-size: 0.5rem;
      font-weight: 700;
      opacity: 0.8;
      line-height: 1.5;
    }

    .id-card-barcode-wrap {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      margin-top: 8px;
    }

    .id-card-contact-displaced {
      margin-top: 8px;
      font-size: 0.5rem;
      font-weight: 800;
      opacity: 0.95;
      line-height: 1.6;
      text-align: right;
    }

    .id-card-return-instruction {
      margin-top: 4px;
      font-weight: 950;
      font-size: 0.42rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .barcode-bg {
      background: white;
      padding: 5px 10px;
      border-radius: 8px;
      margin-bottom: 6px;
    }

    .barcode-bg.minimal {
      background: transparent;
    }

    .barcode-text {
      font-size: 0.5rem;
      font-weight: 950;
      letter-spacing: 2px;
      opacity: 0.9;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 2px;
    }

    .id-card-hologram {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 33%, rgba(255,255,255,0.06) 50%, transparent 66%);
      pointer-events: none;
    }

    /* ===== PERSONALIZATION PANEL ===== */
    .image-mode-btn {
      flex: 1;
      padding: 8px;
      border-radius: 8px;
      border: none;
      font-size: 0.65rem;
      font-weight: 900;
      text-transform: uppercase;
      cursor: pointer;
      transition: 0.2s;
    }

    .upload-status {
      padding: 10px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 900;
      text-align: center;
      animation: fadeIn 0.3s;
    }

    .upload-status.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .upload-status.error {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .upload-btn {
      width: 100%;
      padding: 12px;
      borderRadius: 12px;
      border: 2px dashed #cbd5e1;
      background: #fcfdfc;
      cursor: pointer;
      color: #32FC05;
      fontSize: 0.8rem;
      fontWeight: 900;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .upload-btn:disabled {
      background: #f1f5f9;
      cursor: not-allowed;
    }

    .input-label {
      font-size: 0.65rem;
      font-weight: 900;
      color: #64748b;
      text-transform: uppercase;
      display: block;
      margin-bottom: 8px;
    }

    .url-input {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      font-size: 0.85rem;
      font-weight: 700;
      background: #f8fafc;
    }

    .image-link-display {
      padding: 12px;
      background: #f0fdf4;
      border-radius: 14px;
      border: 1px solid #dcfce7;
      font-size: 0.7rem;
      color: #166534;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .image-link-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .image-link-label {
      font-weight: 900;
      text-transform: uppercase;
      font-size: 0.6rem;
      opacity: 0.8;
    }

    .image-link-badge {
      font-size: 0.6rem;
      font-weight: 800;
      background: #166534;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .image-link-url {
      font-weight: 700;
      word-break: break-all;
      opacity: 0.9;
    }

    .apply-profile-btn {
      width: 100%;
      background: #32FC05;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 10px;
      font-size: 0.75rem;
      font-weight: 950;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(27, 94, 32, 0.2);
    }

    .apply-profile-btn:hover {
      background: #2E7D32;
    }

    .apply-profile-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* ===== ACTION TOOLBAR ===== */
    .id-action-toolbar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      justify-content: center;
      align-content: center;
    }

    .id-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 800;
      background: white;
      flex: 1;
    }

    .id-btn-main {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      border-radius: 12px;
      font-weight: 800;
      width: 100%;
    }

    /* ===== PRODUCTION NOTICE ===== */
    .id-production-notice {
      padding: 1.5rem;
      background: #fffbeb;
      border-radius: 20px;
      border: 1px solid #fde68a;
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .notice-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #fef3c7;
      color: #92400e;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notice-title {
      font-size: 0.9rem;
      font-weight: 900;
      color: #92400e;
    }

    .notice-text {
      font-size: 0.8rem;
      color: #b45309;
      font-weight: 600;
    }

    /* ===== EMPTY STATE ===== */
    .card-empty-state {
      height: 100%;
      min-height: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      color: #94a3b8;
      border: 1px dashed #e2e8f0;
      text-align: center;
    }

    .empty-icon {
      opacity: 0.12;
      margin-bottom: 2rem;
    }

    .empty-title {
      font-weight: 900;
      color: #64748b;
      margin-bottom: 0.75rem;
    }

    .empty-text {
      max-width: 400px;
      line-height: 1.6;
    }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .spin-animation {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }



    /* ===== RESPONSIVE ===== */
    @media screen and (max-width: 1100px) {
      .staff-selector-panel {
        flex: 1 1 100%;
      }
      .card-preview-panel {
        flex: 1 1 100%;
        min-width: 0;
      }
      .id-generator-container {
        flex-direction: column;
      }
    }

    @media screen and (max-width: 600px) {
      .card-preview-stage {
        padding: 1rem;
        min-height: auto;
      }
      
      .identity-card-element {
        transform: scale(0.6);
        transform-origin: center center;
        margin: -40px 0;
      }

      .staff-selector-panel {
        width: 100%;
      }
      
      .design-buttons-grid {
        grid-template-columns: 1fr;
      }
    }

    @media screen and (max-width: 400px) {
      .identity-card-element {
        transform: scale(0.5);
        margin: -60px 0;
      }
    }

    /* ===== PRINT STYLES ===== */
    @media print {
      .no-print-page, 
      .admin-sidebar, 
      .admin-header, 
      .admin-toolbar, 
      .admin-card:not(#printable-id-card) {
        display: none !important;
      }
      
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      
      #printable-id-card {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        box-shadow: none !important;
        border: 1px solid #eee !important;
        width: 3.375in !important;
        height: 2.125in !important;
      }
    }
  `}</style>
);

export default StaffIDCardGenerator;