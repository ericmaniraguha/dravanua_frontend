import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, Upload, Download, Search, File, Folder, FolderOpen,
  Trash2, ExternalLink, HardDrive, RefreshCw, Image, FileText,
  Clock, CheckCircle, AlertCircle, ChevronRight, Home, Plus,
  MoreVertical, Eye, Edit, Copy, Move, Star, Grid, List,
  ArrowLeft, FolderPlus, X, Check, Film, Music, Archive,
  Share2, Link, Users, Lock, Unlock, Info, Filter, Camera, 
  Flower2, Shirt, Calendar, ShoppingBag, Palette, Heart,
  Gift, Sparkles, BookOpen, Tag, Layers, Settings, Shield, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import ContractGenerator from './Contractgenerator';

const ManageDropbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ── All vault categories (super_admin sees all) ────────────────────────────
  const serviceCategories = [
    // Dept 1 — Studio
    { 
      id: 'studio', 
      name: 'Studio Repository', 
      folderName: 'Studio',
      deptCodes: ['studio'],          // which departments own this card
      icon: Camera, 
      color: '#9C27B0', 
      bgColor: '#f3e5f5',
      description: 'Primary photography archive and raw photoshoot storage',
      subfolders: ['Portraits', 'Events', 'Classic Fashions', 'Commercial']
    },
    // Dept 2 — Papeterie / Stationery
    { 
      id: 'papeterie', 
      name: 'Papeterie / Stationary', 
      folderName: 'Papeterie / Stationary',
      deptCodes: ['papeterie'],
      icon: BookOpen, 
      color: '#3F51B5', 
      bgColor: '#e8eaf6',
      description: 'Design templates, print files and stationery project archives',
      subfolders: ['Business Cards', 'Invitations', 'Flyers & Posters', 'Menus', 'Certificates']
    },
    // Dept 3 — Flower Gifts
    { 
      id: 'flowers', 
      name: 'Flower Gifts', 
      folderName: 'Flower Gifts',
      deptCodes: ['flower_gifts'],
      icon: Flower2, 
      color: '#E91E63', 
      bgColor: '#fce4ec',
      description: 'Floral catalog images, event decoration archives, and gift arrangements',
      subfolders: ['Bouquets', 'Event Decorations', 'Classic Fashion Flowers', 'Gift Arrangements']
    },
    // Dept 4 — Classic Fashion
    { 
      id: 'fashion', 
      name: 'Classic Fashion', 
      folderName: 'Classic Fashion',
      deptCodes: ['classic_fashion'],
      icon: Shirt, 
      color: '#FF5722', 
      bgColor: '#fbe9e7',
      description: 'Lookbooks, model portfolios, product shots and campaign assets',
      subfolders: ['Lookbooks', 'Product Shots', 'Model Portfolios', 'Campaigns']
    },
    // Shared — all departments
    { 
      id: 'client_files', 
      name: 'Client Delivery Hub', 
      folderName: 'Client_Folders',
      deptCodes: ['studio', 'papeterie', 'flower_gifts', 'classic_fashion', 'marketing', 'operations_hub'],   // visible to most
      icon: Users, 
      color: '#00BCD4', 
      bgColor: '#e0f7fa',
      description: 'Customer project deliveries and collaborative asset folders',
      subfolders: ['In-Progress', 'Completed', 'Awaiting Approval']
    },
    // Shared — all departments
    {
      id: 'booking',
      name: 'Booking / E-Service',
      folderName: 'Booking / E-Service',
      deptCodes: ['studio', 'papeterie', 'flower_gifts', 'classic_fashion', 'marketing', 'operations_hub'],
      icon: Calendar,
      color: '#009688',
      bgColor: '#e0f2f1',
      description: 'Client contracts, invoices, quotes, and digital delivery archives',
      subfolders: ['Client Contracts', 'Invoices', 'Quotes', 'Digital Deliveries']
    },
    // Admin-only shared vaults
    { 
      id: 'reports', 
      name: 'Operational Reports', 
      folderName: 'Reports',
      deptCodes: [],               // empty = privileged-only (super_admin / service_admin)
      icon: FileText, 
      color: '#4CAF50', 
      bgColor: '#e8f5e9',
      description: 'Audit trails, financial summaries, and performance logs',
      subfolders: ['Monthly', 'Annual', 'Expenditure']
    },
    { 
      id: 'brand', 
      name: 'Brand Assets', 
      folderName: 'Brand_Assets',
      deptCodes: [],
      icon: Palette, 
      color: '#FF9800', 
      bgColor: '#fff3e0',
      description: 'Corporate identity, master logos, and style guidelines',
      subfolders: ['Logos', 'Static Assets', 'Guidelines']
    },
    { 
      id: 'external', 
      name: 'External Resources', 
      folderName: 'External_Resources',
      deptCodes: [],
      icon: ExternalLink, 
      color: '#607D8B', 
      bgColor: '#eceff1',
      description: 'Vendor resources and shared public-facing assets',
      subfolders: ['Third-Party', 'Public Assets', 'Shared']
    },
    { 
      id: 'receipts', 
      name: 'Digital Vault & Receipts', 
      folderName: 'Receipts_Vault',
      deptCodes: [],
      icon: Shield, 
      color: '#32FC05', 
      bgColor: '#e8f5e9',
      description: 'Secure receipts, invoices, and expense declaration module',
      subfolders: [],
      isExternalLink: '/admin/dropbox'
    }
  ];

  // State
  const [activeService, setActiveService] = useState(null); // null = show all services
  const [currentPath, setCurrentPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Root', path: '/' }]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showPreview, setShowPreview] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [emailModal, setEmailModal] = useState({ isOpen: false, item: null, recipient: '' });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Storage stats — expanded for new service IDs
  const [storageStats, setStorageStats] = useState({
    total: 2048,
    used: 456.8,
    services: {
      studio:      { used: 178.5, files: 4521, folders: 89 },
      papeterie:   { used:  56.2, files: 1870, folders: 42 },
      flowers:     { used:  32.4, files:  980, folders: 28 },
      fashion:     { used:  45.0, files: 1340, folders: 38 },
      client_files:{ used: 112.3, files: 2156, folders: 45 },
      booking:     { used:  24.8, files:  512, folders: 22 },
      reports:     { used:  45.2, files: 1234, folders: 34 },
      brand:       { used:  67.8, files:  890, folders: 23 },
      external:    { used:  53.0, files:  678, folders: 56 }
    }
  });

  const { secureFetch } = useAuth();

  // ── ROLE-BASED ACCESS CONTROL ──────────────────────────────────────────────
  const isSuperAdmin   = user?.role === 'super_admin';
  const isServiceAdmin = user?.role === 'service_admin';
  const userDeptCode   = user?.deptCode || null;
  const isPrivileged   = isSuperAdmin || isServiceAdmin;

  // Normal staff (role: 'user') can access if they are active and have a department
  const canAccessVault = isPrivileged || (user?.isActive && userDeptCode);

  if (!canAccessVault) {
    return (
      <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
        <div style={{ background: '#fee2e2', padding: '2.5rem', borderRadius: '32px', border: '1px solid #fecaca', maxWidth: '450px' }}>
          <Lock size={64} color="#dc2626" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ color: '#991b1b', fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem' }}>Vault Restricted</h2>
          <p style={{ color: '#7f1d1d', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            The Digital Vault is restricted to active staff members. Please contact the head office if you require file archival access.
          </p>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', borderRadius: '12px' }}
          >
            Return to Command Center
          </button>
        </div>
      </div>
    );
  }

  const filteredServices = serviceCategories.filter(s => {
    let access = false;
    if (isSuperAdmin) access = true;
    else if (s.deptCodes.length === 0) access = isServiceAdmin;
    else if (isServiceAdmin) access = true;
    else access = userDeptCode !== null && s.deptCodes.includes(userDeptCode);

    if (access && searchTerm) {
       access = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase()) || s.folderName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return access;
  });

  // Dept label for the access banner
  const deptLabels = { 
    studio: 'Creative Studio 📸', 
    papeterie: 'Papeterie 📄', 
    flower_gifts: 'Flower Gifts 💐', 
    classic_fashion: 'Classic Fashion 💍', 
    marketing: 'Marketing 📢' 
  };
  const userDeptLabel = deptLabels[userDeptCode] || user?.department || 'General';

  // Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Demo data generator
  const generateDemoData = (servicePath) => {
    const demoStructures = {
      // STUDIO
      '/Studio': {
        folders: [
          { id: 's1', name: 'Portraits', itemCount: 234, size: '45.2 GB', modified: '2026-01-18', color: '#9C27B0' },
          { id: 's2', name: 'Products', itemCount: 156, size: '23.5 GB', modified: '2026-01-17', color: '#9C27B0' },
          { id: 's3', name: 'Passport Photos', itemCount: 1245, size: '8.9 GB', modified: '2026-01-18', color: '#9C27B0' },
          { id: 's4', name: 'Corporate', itemCount: 89, size: '15.2 GB', modified: '2026-01-15', color: '#9C27B0' },
          { id: 's5', name: 'Events', itemCount: 567, size: '78.4 GB', modified: '2026-01-16', color: '#9C27B0' },
          { id: 's6', name: 'Classic Fashions', itemCount: 890, size: '156.8 GB', modified: '2026-01-18', color: '#9C27B0' },
        ],
        files: [
          { id: 'sf1', name: 'Price_List_2026.pdf', size: '2.4 MB', type: 'pdf', modified: '2026-01-15' },
          { id: 'sf2', name: 'Studio_Guidelines.pdf', size: '5.1 MB', type: 'pdf', modified: '2026-01-10' },
        ]
      },
      '/Studio/Classic Fashions': {
        folders: [
          { id: 'sw1', name: 'Eric & Anna - Jan 2026', itemCount: 456, size: '12.5 GB', modified: '2026-01-18', color: '#E91E63', client: 'Eric Mutabazi' },
          { id: 'sw2', name: 'Jean & Marie - Dec 2025', itemCount: 389, size: '10.2 GB', modified: '2025-12-28', color: '#E91E63', client: 'Jean Baptiste' },
          { id: 'sw3', name: 'David & Sarah - Nov 2025', itemCount: 567, size: '15.8 GB', modified: '2025-11-20', color: '#E91E63', client: 'David Habimana' },
        ],
        files: []
      },
      '/Studio/Classic Fashions/Eric & Anna - Jan 2026': {
        folders: [
          { id: 'swe1', name: 'Raw Photos', itemCount: 1890, size: '85.2 GB', modified: '2026-01-18', color: '#795548' },
          { id: 'swe2', name: 'Edited', itemCount: 456, size: '12.5 GB', modified: '2026-01-18', color: '#4CAF50' },
          { id: 'swe3', name: 'Final Delivery', itemCount: 300, size: '8.2 GB', modified: '2026-01-18', color: '#2196F3' },
          { id: 'swe4', name: 'Album Design', itemCount: 24, size: '2.1 GB', modified: '2026-01-17', color: '#9C27B0' },
        ],
        files: [
          { id: 'swef1', name: 'Contract_Signed.pdf', size: '1.2 MB', type: 'pdf', modified: '2026-01-05' },
          { id: 'swef2', name: 'Shot_List.docx', size: '45 KB', type: 'doc', modified: '2026-01-10' },
          { id: 'swef3', name: 'Invoice_Final.pdf', size: '156 KB', type: 'pdf', modified: '2026-01-18' },
        ]
      },
      '/Studio/Classic Fashions/Eric & Anna - Jan 2026/Edited': {
        folders: [],
        files: [
          { id: 'img1', name: 'IMG_0001_edited.jpg', size: '8.5 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200' },
          { id: 'img2', name: 'IMG_0002_edited.jpg', size: '7.2 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200' },
          { id: 'img3', name: 'IMG_0003_edited.jpg', size: '9.1 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200' },
          { id: 'img4', name: 'IMG_0004_edited.jpg', size: '6.8 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=200' },
          { id: 'img5', name: 'IMG_0005_edited.jpg', size: '8.9 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200' },
          { id: 'img6', name: 'IMG_0006_edited.jpg', size: '7.5 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
        ]
      },
      '/Studio/Portraits': {
        folders: [
          { id: 'sp1', name: 'January 2026', itemCount: 89, size: '12.4 GB', modified: '2026-01-18', color: '#9C27B0' },
          { id: 'sp2', name: 'December 2025', itemCount: 156, size: '18.9 GB', modified: '2025-12-31', color: '#9C27B0' },
        ],
        files: []
      },

      // PAPETERIE
      '/Papeterie / Stationary': {
        folders: [
          { id: 'p1', name: 'Business Cards', itemCount: 234, size: '8.5 GB', modified: '2026-01-17', color: '#3F51B5' },
          { id: 'p2', name: 'Invitations', itemCount: 189, size: '12.3 GB', modified: '2026-01-18', color: '#3F51B5' },
          { id: 'p3', name: 'Flyers & Posters', itemCount: 145, size: '15.6 GB', modified: '2026-01-16', color: '#3F51B5' },
          { id: 'p4', name: 'Menus', itemCount: 67, size: '4.2 GB', modified: '2026-01-15', color: '#3F51B5' },
          { id: 'p5', name: 'Certificates', itemCount: 234, size: '3.8 GB', modified: '2026-01-14', color: '#3F51B5' },
          { id: 'p6', name: 'Templates', itemCount: 56, size: '2.1 GB', modified: '2026-01-10', color: '#607D8B' },
        ],
        files: [
          { id: 'pf1', name: 'Design_Guidelines.pdf', size: '8.4 MB', type: 'pdf', modified: '2026-01-10' },
          { id: 'pf2', name: 'Color_Palette.ai', size: '1.2 MB', type: 'file', modified: '2026-01-08' },
        ]
      },
      '/Papeterie / Stationary/Business Cards': {
        folders: [
          { id: 'pbc1', name: 'Corporate Clients', itemCount: 89, size: '3.2 GB', modified: '2026-01-17', color: '#3F51B5' },
          { id: 'pbc2', name: 'Individual Orders', itemCount: 145, size: '5.3 GB', modified: '2026-01-18', color: '#3F51B5' },
        ],
        files: [
          { id: 'pbcf1', name: 'Template_Standard.psd', size: '45 MB', type: 'file', modified: '2026-01-15' },
          { id: 'pbcf2', name: 'Template_Premium.psd', size: '52 MB', type: 'file', modified: '2026-01-15' },
        ]
      },
      '/Papeterie / Stationary/Invitations': {
        folders: [
          { id: 'pi1', name: 'Classic Fashion Invitations', itemCount: 78, size: '6.5 GB', modified: '2026-01-18', color: '#E91E63' },
          { id: 'pi2', name: 'Birthday Cards', itemCount: 56, size: '3.2 GB', modified: '2026-01-16', color: '#FF9800' },
          { id: 'pi3', name: 'Corporate Events', itemCount: 34, size: '2.1 GB', modified: '2026-01-15', color: '#607D8B' },
        ],
        files: []
      },

      // Flower Gifts
      '/Flower Gifts': {
        folders: [
          { id: 'f1', name: 'Bouquets', itemCount: 234, size: '18.5 GB', modified: '2026-01-18', color: '#E91E63' },
          { id: 'f2', name: 'Event Decorations', itemCount: 156, size: '25.3 GB', modified: '2026-01-17', color: '#E91E63' },
          { id: 'f3', name: 'Classic Fashion Flower Gifts', itemCount: 289, size: '35.6 GB', modified: '2026-01-18', color: '#E91E63' },
          { id: 'f4', name: 'Gift Arrangements', itemCount: 123, size: '12.4 GB', modified: '2026-01-16', color: '#E91E63' },
          { id: 'f5', name: 'Catalog Photos', itemCount: 456, size: '8.9 GB', modified: '2026-01-15', color: '#E91E63' },
        ],
        files: [
          { id: 'ff1', name: 'Catalog_2026.pdf', size: '45 MB', type: 'pdf', modified: '2026-01-10' },
          { id: 'ff2', name: 'Price_List.xlsx', size: '1.2 MB', type: 'file', modified: '2026-01-15' },
        ]
      },
      '/Flower Gifts/Bouquets': {
        folders: [
          { id: 'fb1', name: 'Roses', itemCount: 89, size: '6.5 GB', modified: '2026-01-18', color: '#F44336' },
          { id: 'fb2', name: 'Mixed Flower Gifts', itemCount: 78, size: '5.8 GB', modified: '2026-01-17', color: '#9C27B0' },
          { id: 'fb3', name: 'Seasonal', itemCount: 67, size: '4.2 GB', modified: '2026-01-16', color: '#4CAF50' },
        ],
        files: []
      },
      '/Flower Gifts/Bouquets/Roses': {
        folders: [],
        files: [
          { id: 'fbr1', name: 'red_roses_classic.jpg', size: '4.5 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1518882605630-8eb574c0c0e5?w=200' },
          { id: 'fbr2', name: 'pink_roses_bouquet.jpg', size: '3.8 MB', type: 'image', modified: '2026-01-17', thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200' },
          { id: 'fbr3', name: 'white_roses_elegant.jpg', size: '5.2 MB', type: 'image', modified: '2026-01-16', thumbnail: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=200' },
        ]
      },

      // FASHION
      '/Classic Fashion': {
        folders: [
          { id: 'cf1', name: 'Lookbooks', itemCount: 234, size: '45.2 GB', modified: '2026-01-18', color: '#FF5722' },
          { id: 'cf2', name: 'Product Shots', itemCount: 567, size: '35.8 GB', modified: '2026-01-17', color: '#FF5722' },
          { id: 'cf3', name: 'Model Portfolios', itemCount: 189, size: '28.4 GB', modified: '2026-01-16', color: '#FF5722' },
          { id: 'cf4', name: 'Campaigns', itemCount: 78, size: '18.9 GB', modified: '2026-01-15', color: '#FF5722' },
          { id: 'cf5', name: 'Behind the Scenes', itemCount: 234, size: '12.3 GB', modified: '2026-01-14', color: '#FF5722' },
        ],
        files: [
          { id: 'cff1', name: 'Style_Guide_2026.pdf', size: '25 MB', type: 'pdf', modified: '2026-01-10' },
        ]
      },
      '/Classic Fashion/Lookbooks': {
        folders: [
          { id: 'cfl1', name: 'Spring 2026', itemCount: 89, size: '15.2 GB', modified: '2026-01-18', color: '#4CAF50' },
          { id: 'cfl2', name: 'Winter 2025', itemCount: 78, size: '12.8 GB', modified: '2025-12-15', color: '#2196F3' },
          { id: 'cfl3', name: 'Fall 2025', itemCount: 67, size: '10.5 GB', modified: '2025-09-20', color: '#FF9800' },
        ],
        files: []
      },
      '/Classic Fashion/Lookbooks/Spring 2026': {
        folders: [],
        files: [
          { id: 'cfls1', name: 'look_01_casual.jpg', size: '8.5 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200' },
          { id: 'cfls2', name: 'look_02_formal.jpg', size: '7.8 MB', type: 'image', modified: '2026-01-18', thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200' },
          { id: 'cfls3', name: 'look_03_street.jpg', size: '9.2 MB', type: 'image', modified: '2026-01-17', thumbnail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=200' },
        ]
      },

      // BOOKING / E-SERVICE
      '/Booking / E-Service': {
        folders: [
          { id: 'b1', name: 'Client Contracts', itemCount: 234, size: '1.8 GB', modified: '2026-01-18', color: '#00BCD4' },
          { id: 'b2', name: 'Invoices', itemCount: 567, size: '890 MB', modified: '2026-01-18', color: '#00BCD4' },
          { id: 'b3', name: 'Quotes', itemCount: 189, size: '456 MB', modified: '2026-01-17', color: '#00BCD4' },
          { id: 'b4', name: 'Booking Confirmations', itemCount: 345, size: '234 MB', modified: '2026-01-18', color: '#00BCD4' },
          { id: 'b5', name: 'Digital Deliveries', itemCount: 123, size: '45.6 GB', modified: '2026-01-16', color: '#00BCD4' },
        ],
        files: [
          { id: 'bf1', name: 'Terms_and_Conditions.pdf', size: '2.4 MB', type: 'pdf', modified: '2026-01-01' },
          { id: 'bf2', name: 'Booking_Policy.pdf', size: '1.8 MB', type: 'pdf', modified: '2026-01-01' },
        ]
      },
      '/Booking / E-Service/Client Contracts': {
        folders: [
          { id: 'bc1', name: '2026', itemCount: 45, size: '456 MB', modified: '2026-01-18', color: '#00BCD4' },
          { id: 'bc2', name: '2025', itemCount: 189, size: '1.2 GB', modified: '2025-12-31', color: '#607D8B' },
        ],
        files: [
          { id: 'bcf1', name: 'Contract_Standard_Studio_2026.pdf', size: '1.2 MB', type: 'pdf', modified: '2026-01-18' },
          { id: 'bcf2', name: 'Classic Fashion_Full_Service_Agreement_Mutabazi.pdf', size: '2.4 MB', type: 'pdf', modified: '2026-01-15' },
          { id: 'bcf3', name: 'Corporate_Event_Service_Contract_ABC.pdf', size: '1.8 MB', type: 'pdf', modified: '2026-01-14' },
          { id: 'bcf4', name: 'Papeterie_Supply_Agreement_Stationary.pdf', size: '945 KB', type: 'pdf', modified: '2026-01-12' },
          { id: 'bcf5', name: 'Contract_Template_Standard.docx', size: '245 KB', type: 'doc', modified: '2026-01-10' },
        ]
      },
      '/Booking / E-Service/Invoices': {
        folders: [
          { id: 'bi1', name: 'January 2026', itemCount: 67, size: '125 MB', modified: '2026-01-18', color: '#00BCD4' },
          { id: 'bi2', name: 'December 2025', itemCount: 89, size: '156 MB', modified: '2025-12-31', color: '#00BCD4' },
        ],
        files: []
      },
      '/Booking / E-Service/Digital Deliveries': {
        folders: [
          { id: 'bd1', name: 'Eric & Anna Classic Fashion', itemCount: 300, size: '8.2 GB', modified: '2026-01-18', color: '#E91E63', status: 'delivered' },
          { id: 'bd2', name: 'Corporate Headshots - ABC Corp', itemCount: 45, size: '1.2 GB', modified: '2026-01-17', color: '#607D8B', status: 'pending' },
          { id: 'bd3', name: 'Product Catalog - Fashion House', itemCount: 156, size: '5.6 GB', modified: '2026-01-16', color: '#FF5722', status: 'delivered' },
        ],
        files: []
      },
      // NEW DUMMY NODES
      '/Client_Folders': {
        folders: [
          { id: 'cf1', name: 'Active Orders', itemCount: 42, size: '4.5 GB', modified: '2026-04-12', color: '#3F51B5' },
          { id: 'cf2', name: 'Completed Project', itemCount: 128, size: '12.8 GB', modified: '2026-04-10', color: '#3F51B5' },
          { id: 'cf3', name: 'Client Approval Queue', itemCount: 5, size: '150 MB', modified: '2026-04-13', color: '#FF9800' }
        ],
        files: [
          { id: 'cff1', name: 'Client_Handbook.pdf', size: '2.4 MB', type: 'pdf', modified: '2026-01-01' }
        ]
      },
      '/Reports': {
        folders: [
          { id: 'rep1', name: 'Monthly Audits', itemCount: 12, size: '45 MB', modified: '2026-04-01', color: '#4CAF50' },
          { id: 'rep2', name: 'Annual Performance', itemCount: 3, size: '12 MB', modified: '2026-01-15', color: '#4CAF50' }
        ],
        files: [
          { id: 'rf1', name: 'Q1_Financial_Snapshot.xlsx', size: '890 KB', type: 'spreadsheet', modified: '2026-04-10' }
        ]
      },
      '/Brand_Assets': {
        folders: [
          { id: 'ba1', name: 'Master Logos', itemCount: 24, size: '150 MB', modified: '2026-03-20', color: '#FF9800' },
          { id: 'ba2', name: 'Style Guides', itemCount: 4, size: '45 MB', modified: '2026-04-05', color: '#FF9800' }
        ],
        files: [
          { id: 'bf1', name: 'Dra_Vanua_Brand_Bible_V1.pdf', size: '15.2 MB', type: 'pdf', modified: '2026-01-10' }
        ]
      },
      '/External_Resources': {
        folders: [
          { id: 'ext1', name: 'Vendor Catalogues', itemCount: 85, size: '1.2 GB', modified: '2026-04-11', color: '#607D8B' },
          { id: 'ext2', name: 'Public Press Kit', itemCount: 12, size: '450 MB', modified: '2026-03-30', color: '#607D8B' }
        ],
        files: []
      }
    };

    return demoStructures[servicePath] || { folders: [], files: [] };
  };

  // Fetch contents
  const fetchContents = useCallback(async (path = currentPath) => {
    setLoading(true);
    try {
      const resp = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/dropbox/list?path=${encodeURIComponent(path)}&start=${startDate}&end=${endDate}`);
      const result = await resp.json();
      if (result.success) {
        setFolders(result.folders || []);
        setFiles(result.files || []);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      const data = generateDemoData(path);
      setFolders(data.folders);
      setFiles(data.files);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    if (activeService) {
      fetchContents(currentPath);
    }
  }, [currentPath, activeService, fetchContents, startDate, endDate]);

  // Navigate to service
  const selectService = (service) => {
    setActiveService(service);
    const path = `/${service.folderName}`;
    setCurrentPath(path);
    setBreadcrumbs([
      { name: 'Vault Root', path: '/' },
      { name: service.name, path: path }
    ]);
    setSelectedItems([]);
  };

  // Back to services
  const backToServices = () => {
    setActiveService(null);
    setCurrentPath('/');
    setBreadcrumbs([{ name: 'Root', path: '/' }]);
    setFolders([]);
    setFiles([]);
  };

  // Navigate to folder
  const navigateToFolder = (folderName) => {
    const newPath = `${currentPath}/${folderName}`;
    setCurrentPath(newPath);
    
    const newBreadcrumb = { name: folderName, path: newPath };
    setBreadcrumbs(prev => [...prev, newBreadcrumb]);
    setSelectedItems([]);
  };

  // Navigate to path
  const navigateToPath = (path, index) => {
    if (path === '/') {
      backToServices();
    } else {
      setCurrentPath(path);
      setBreadcrumbs(prev => prev.slice(0, index + 1));
      setSelectedItems([]);
    }
  };

  // Go back
  const goBack = () => {
    if (breadcrumbs.length > 2) {
      const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
      navigateToPath(parentBreadcrumb.path, breadcrumbs.length - 2);
    } else if (breadcrumbs.length === 2) {
      backToServices();
    }
  };

  // File operations
  const handleFileUpload = async (e) => {
    const uploadFiles = Array.from(e.target.files);
    if (!uploadFiles.length) return;

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      setUploadProgress(((i + 1) / uploadFiles.length) * 100);
      
      // Demo mode
      const newFile = {
        id: `new-${Date.now()}-${i}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file.name),
        modified: new Date().toISOString().split('T')[0],
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      };
      setFiles(prev => [...prev, newFile]);
      showToast(`Uploaded: ${file.name}`);
    }

    setUploading(false);
    setUploadProgress(0);
    setShowUploadModal(false);
    e.target.value = '';
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      itemCount: 0,
      size: '0 KB',
      modified: new Date().toISOString().split('T')[0],
      color: activeService?.color || '#607D8B'
    };
    setFolders(prev => [...prev, newFolder]);
    showToast(`Folder "${newFolderName}" created`);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  // Delete
  const handleDelete = (item, isFolder = false) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    
    if (isFolder) {
      setFolders(prev => prev.filter(f => f.id !== item.id));
    } else {
      setFiles(prev => prev.filter(f => f.id !== item.id));
    }
    showToast(`"${item.name}" deleted`);
    setShowContextMenu(null);
  };

  // Download
  const handleDownload = (file) => {
    showToast(`Downloading: ${file.name}`);
    setShowContextMenu(null);
  };

  const handleFileEmail = (file) => {
    setEmailModal({ 
      isOpen: true, 
      item: file, 
      recipient: '' 
    });
    setShowContextMenu(null);
  };

  const dispatchFileEmail = () => {
    const { item, recipient } = emailModal;
    if (!recipient) {
      showToast('Recipient email is required', 'error');
      return;
    }

    const subject = encodeURIComponent(`DRAVANUA HUB: Delivery - ${item.name}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find "${item.name}" available for your review in the delivery vault.\n\nDRAVANUA STUDIO`);
    
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    setEmailModal({ ...emailModal, isOpen: false });
    showToast('Thank you! Email sent.', 'success');
  };

  const handleRename = (item) => {
    const newName = prompt(`Rename ${item.name}:`, item.name);
    if (newName && newName !== item.name) {
      showToast(`Renamed to ${newName}`, 'success');
      setShowContextMenu(null);
    }
  };

  // Share
  const handleShare = (item) => {
    setShowShareModal(item);
    setShareLink(`https://vault.dravauna.com/share/${item.id}-${Date.now()}`);
    setShowContextMenu(null);
  };

  // Copy link
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    showToast('Link copied!');
  };

  // Drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      droppedFiles.forEach((file, i) => {
        const newFile = {
          id: `drop-${Date.now()}-${i}`,
          name: file.name,
          size: formatFileSize(file.size),
          type: getFileType(file.name),
          modified: new Date().toISOString().split('T')[0],
          thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };
        setFiles(prev => [...prev, newFile]);
      });
      showToast(`${droppedFiles.length} file(s) uploaded`);
    }
  };

  // Helpers
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'raw', 'cr2', 'nef'],
      video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
      audio: ['mp3', 'wav', 'flac', 'aac'],
      pdf: ['pdf'],
      doc: ['doc', 'docx', 'txt', 'rtf'],
      spreadsheet: ['xls', 'xlsx', 'csv'],
      archive: ['zip', 'rar', '7z']
    };
    for (const [type, exts] of Object.entries(types)) {
      if (exts.includes(ext)) return type;
    }
    return 'file';
  };

  const getFileIcon = (type) => {
    const icons = {
      image: <Image size={24} />,
      video: <Film size={24} />,
      audio: <Music size={24} />,
      pdf: <FileText size={24} />,
      doc: <FileText size={24} />,
      spreadsheet: <FileText size={24} />,
      archive: <Archive size={24} />,
      file: <File size={24} />
    };
    return icons[type] || icons.file;
  };

  // Filter
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const storagePercentage = (storageStats.used / storageStats.total) * 100;

  return (
    <div className="admin-page dropbox-vault animate-fadeIn">
      {/* Toast */}
      {toast && (
        <div className="toast-notification" style={{ background: toast.type === 'error' ? '#fee2e2' : '#dcfce7', color: toast.type === 'error' ? '#dc2626' : '#16a34a' }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          {toast.message}
        </div>
      )}

      <Header 
        title="Dropbox Studio Vault" 
        subtitle={isSuperAdmin
          ? "High-resolution asset synchronization and cloud archival for DRAVANUA STUDIO"
          : `${userDeptLabel} vault — viewing files accessible to your department`
        }
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* ── ACCESS SCOPE BANNER (for non-super_admin) ── */}
      {!isSuperAdmin && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          border: '1.5px solid #f59e0b', borderRadius: '16px',
          padding: '14px 20px', marginBottom: '1.5rem',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Lock size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#92400e' }}>
              🗂️ Department-Scoped Vault
            </div>
            <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '2px', lineHeight: 1.5 }}>
              You are viewing vaults for <strong>{userDeptLabel}</strong> only.
              {isServiceAdmin
                ? ' As Service Admin, you can access all department and shared vaults.'
                : ' Shared vaults (Client Delivery Hub & Booking) are available to all staff. Contact your administrator for additional access.'
              }
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Role</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#b45309', textTransform: 'capitalize' }}>
              {currentUser.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {/* Storage Overview */}
      <div className="storage-header">
        <div className="storage-info">
          <div className="storage-icon">
            <Cloud size={36} />
          </div>
          <div>
            <h2>Studio Cloud Storage</h2>
            <p>Dropbox Business • 2TB Allocated</p>
            <div className="storage-bar">
              <div className="storage-bar-fill" style={{ width: `${storagePercentage}%` }} />
            </div>
            <span className="storage-text">{storageStats.used} GB of {storageStats.total} GB used</span>
          </div>
        </div>
        
        <div className="storage-stats">
          <div className="stat-item">
            <span className="stat-value">{Object.values(storageStats.services).reduce((a, b) => a + b.files, 0).toLocaleString()}</span>
            <span className="stat-label">Total Files</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Object.values(storageStats.services).reduce((a, b) => a + b.folders, 0)}</span>
            <span className="stat-label">Folders</span>
          </div>
          <div className="stat-item">
            <CheckCircle size={24} color="#52C41A" />
            <span className="stat-label">Synced</span>
          </div>
        </div>
      </div>

      {/* Service Selection or File Browser */}
      {!activeService ? (
        /* SERVICE CATEGORIES VIEW */
        <div className="services-grid" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Dashboard Header Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="vault-welcome">
              <h2 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Studio Vault Explorer</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Enterprise-grade asset management and legal orchestration hub</p>
            </div>
            
            <button 
              className="universal-action-btn"
              onClick={() => setShowContractGenerator(true)}
              style={{ 
                background: 'linear-gradient(135deg, #0061FF 0%, #60EFFF 100%)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '16px',
                border: 'none',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 97, 255, 0.4)',
                transform: 'translateY(0)',
                transition: 'all 0.3s'
              }}
            >
              <Shield size={24} />
              ORCHESTRATE NEW CONTRACT | PROFORMA
            </button>
          </div>

          {/* Quick Stats - Balanced Grid */}
          <div className="quick-stats high-visibility">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
              <div style={{ padding: '8px', background: '#eef2ff', borderRadius: '10px' }}>
                <BarChart3 size={24} color="#4f46e5" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Unified Storage Distribution</h3>
            </div>
            
            <div className="stats-bars-grid-horizontal">
              {filteredServices.map(service => {
                const stats = storageStats.services[service.id] || { used: 0 };
                const pct = (stats.used / storageStats.used) * 100;
                return (
                  <div 
                    key={service.id} 
                    className="stat-card-glass" 
                    onClick={() => selectService(service)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="stat-card-header">
                      <div className="stat-icon-mini" style={{ background: service.color }}>
                        <service.icon size={14} color="white" />
                      </div>
                      <span className="stat-pct-badge">{Math.round(pct)}%</span>
                    </div>
                    <div className="stat-card-primary">
                      <span className="stat-val-large">{stats.used}</span>
                      <span className="stat-unit">GB</span>
                    </div>
                    <div className="stat-bar-full">
                      <div className="stat-bar-progress" style={{ width: `${pct}%`, background: service.color }} />
                    </div>
                    <span className="stat-label-footer">{service.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              <Layers size={22} color="#666" /> Management Repositories
            </h3>
            
            <div className="service-cards-responsive">
              {filteredServices.map(service => {
                const stats = storageStats.services[service.id] || { used: 0, files: 0, folders: 0 };
                return (
                  <div 
                    key={service.id}
                    className="service-card-premium"
                    style={{ '--service-color': service.color, '--service-bg': service.bgColor }}
                    onClick={() => {
                        if (service.isExternalLink) {
                            navigate(service.isExternalLink);
                        } else {
                            selectService(service);
                        }
                    }}
                  >
                    <div className="card-accent" />
                    <div className="card-content-wrap">
                      <div className="card-header-main">
                        <div className="service-icon-wrapper" style={{ background: service.bgColor, color: service.color }}>
                          <service.icon size={28} />
                        </div>
                        <div className="card-title-group">
                          <h4>{service.name}</h4>
                          <span className="card-folder-alias">vault:/{service.folderName}</span>
                        </div>
                      </div>
                      
                      <p className="card-desc">{service.description}</p>
                      
                      <div className="card-metrics">
                        <div className="metric">
                          <span className="metric-val">{stats.files.toLocaleString()}</span>
                          <span className="metric-label">Files</span>
                        </div>
                        <div className="metric">
                          <span className="metric-val">{stats.folders}</span>
                          <span className="metric-label">Folders</span>
                        </div>
                        <div className="metric">
                          <span className="metric-val">{stats.used}</span>
                          <span className="metric-label">GB Used</span>
                        </div>
                      </div>
                      
                      <div className="card-footer-action">
                        <div className="mini-progress">
                          <div className="mini-bar" style={{ width: `${(stats.used / 500) * 100}%`, background: service.color }} />
                        </div>
                        <button className="open-repo-btn" style={{ background: service.color }}>
                          <FolderOpen size={16} /> Access Vault
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* FILE BROWSER VIEW */
        <div 
          className={`file-browser ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Toolbar */}
          <div className="browser-toolbar">
            <div className="toolbar-left">
              <button onClick={goBack} className="nav-btn" title="Go Back">
                <ArrowLeft size={18} />
              </button>
              
              <div className="breadcrumbs">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.path}>
                    <button 
                      onClick={() => navigateToPath(crumb.path, idx)}
                      className={`breadcrumb ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}
                    >
                      {idx === 0 ? <Home size={14} /> : crumb.name}
                    </button>
                    {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="breadcrumb-sep" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="toolbar-right">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', marginLeft: '0.5rem' }}>
                <Calendar size={12} className="text-muted" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '0.65rem', fontWeight: 600, color: '#334155', width: '85px' }} />
                <span style={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.65rem' }}>→</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '0.65rem', fontWeight: 600, color: '#334155', width: '85px' }} />
              </div>

              <div className="view-toggle">
                <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>
                  <Grid size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>
                  <List size={18} />
                </button>
              </div>

              <button onClick={() => fetchContents(currentPath)} className="action-btn" disabled={loading}>
                <RefreshCw size={18} className={loading ? 'spin' : ''} />
              </button>

              <button onClick={() => setShowNewFolderModal(true)} className="action-btn">
                <FolderPlus size={18} />
              </button>

              {activeService?.id === 'client_files' && (
                <button 
                  onClick={() => setShowContractGenerator(true)} 
                  className="action-btn"
                  title="Create New Legal Contract"
                  style={{ color: '#0061FF', borderColor: '#0061FF' }}
                >
                  <Shield size={18} />
                </button>
              )}

              <label className="upload-btn" style={{ background: activeService?.color }}>
                <Upload size={18} />
                <span>{uploading ? `${Math.round(uploadProgress)}%` : 'Upload'}</span>
                <input type="file" multiple onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Service Badge */}
          <div className="service-badge" style={{ background: activeService?.bgColor, borderColor: activeService?.color }}>
            {activeService && <activeService.icon size={18} color={activeService.color} />}
            <span style={{ color: activeService?.color }}>{activeService?.name}</span>
            <span className="badge-path">{currentPath}</span>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-info">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="progress-bar">
                <div style={{ width: `${uploadProgress}%`, background: activeService?.color }} />
              </div>
            </div>
          )}

          {/* Drag Overlay */}
          {dragOver && (
            <div className="drag-overlay">
              <Upload size={48} />
              <p>Drop files here to upload</p>
            </div>
          )}

          {/* Content */}
          <div className="browser-content">
            {loading ? (
              <div className="loading-state">
                <RefreshCw size={40} className="spin" color={activeService?.color} />
                <p>Loading files...</p>
              </div>
            ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
              <div className="empty-state">
                <Folder size={64} />
                <h3>This folder is empty</h3>
                <p>Upload files or create a new folder</p>
                <label className="upload-btn-large" style={{ background: activeService?.color }}>
                  <Upload size={20} />
                  <span>Upload Files</span>
                  <input type="file" multiple onChange={handleFileUpload} />
                </label>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid-view">
                {filteredFolders.length > 0 && (
                  <div className="grid-section">
                    <h4>Folders ({filteredFolders.length})</h4>
                    <div className="folders-grid">
                      {filteredFolders.map(folder => (
                        <div 
                          key={folder.id}
                          className="folder-card"
                          onDoubleClick={() => navigateToFolder(folder.name)}
                          onContextMenu={e => { e.preventDefault(); setShowContextMenu({ type: 'folder', item: folder, x: e.clientX, y: e.clientY }); }}
                        >
                          <div className="folder-icon" style={{ background: `${folder.color}20`, color: folder.color }}>
                            <Folder size={28} />
                          </div>
                          <div className="folder-details">
                            <span className="folder-name">{folder.name}</span>
                            <span className="folder-meta">{folder.itemCount} items • {folder.size}</span>
                          </div>
                          {folder.client && <span className="folder-client">{folder.client}</span>}
                          {folder.status && (
                            <span className={`folder-status ${folder.status}`}>
                              {folder.status === 'delivered' ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {folder.status}
                            </span>
                          )}
                          <button className="folder-menu" onClick={e => { e.stopPropagation(); setShowContextMenu({ type: 'folder', item: folder, x: e.clientX, y: e.clientY }); }}>
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredFiles.length > 0 && (
                  <div className="grid-section">
                    <h4>Files ({filteredFiles.length})</h4>
                    <div className="files-grid">
                      {filteredFiles.map(file => (
                        <div 
                          key={file.id}
                          className="file-card"
                          onClick={() => setShowPreview(file)}
                          onContextMenu={e => { e.preventDefault(); setShowContextMenu({ type: 'file', item: file, x: e.clientX, y: e.clientY }); }}
                        >
                          <div className="file-thumbnail">
                            {file.thumbnail ? (
                              <img src={file.thumbnail} alt={file.name} />
                            ) : (
                              <div className="file-icon">{getFileIcon(file.type)}</div>
                            )}
                          </div>
                          <div className="file-details">
                            <span className="file-name" title={file.name}>{file.name}</span>
                            <span className="file-meta">{file.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="list-view">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFolders.map(folder => (
                      <tr key={folder.id} className="folder-row" onDoubleClick={() => navigateToFolder(folder.name)}>
                        <td>
                          <div className="item-name">
                            <div className="item-icon" style={{ background: `${folder.color}20`, color: folder.color }}>
                              <Folder size={20} />
                            </div>
                            <div>
                              <span className="name">{folder.name}</span>
                              <span className="meta">{folder.itemCount} items</span>
                            </div>
                          </div>
                        </td>
                        <td>{folder.size}</td>
                        <td>{folder.modified}</td>
                        <td>
                          <div className="row-actions">
                            <button onClick={() => navigateToFolder(folder.name)}><FolderOpen size={16} /></button>
                            <button onClick={() => handleShare(folder)}><Share2 size={16} /></button>
                            <button onClick={() => handleDelete(folder, true)} className="delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredFiles.map(file => (
                      <tr key={file.id}>
                        <td>
                          <div className="item-name">
                            <div className="item-icon file">
                              {file.thumbnail ? (
                                <img src={file.thumbnail} alt="" />
                              ) : getFileIcon(file.type)}
                            </div>
                            <span className="name">{file.name}</span>
                          </div>
                        </td>
                        <td>{file.size}</td>
                        <td>{file.modified}</td>
                        <td>
                          <div className="row-actions">
                            <button onClick={() => setShowPreview(file)} title="Preview"><Eye size={16} /></button>
                            <button onClick={() => handleDownload(file)} title="Download"><Download size={16} /></button>
                            <button onClick={() => handleFileEmail(file)} title="Email file"><Mail size={16} /></button>
                            {currentUser.name === 'Admin User' && (
                              <button onClick={() => handleRename(file)} title="Modify / Rename"><Edit size={16} /></button>
                            )}
                            <button onClick={() => handleShare(file)} title="Share link"><Share2 size={16} /></button>
                            <button onClick={() => handleDelete(file, false)} className="delete" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div className="context-overlay" onClick={() => setShowContextMenu(null)} />
          <div className="context-menu" style={{ left: showContextMenu.x, top: showContextMenu.y }}>
            {showContextMenu.type === 'folder' ? (
              <>
                <button onClick={() => { navigateToFolder(showContextMenu.item.name); setShowContextMenu(null); }}>
                  <FolderOpen size={16} /> Open
                </button>
                <button onClick={() => handleShare(showContextMenu.item)}><Share2 size={16} /> Share</button>
                <hr />
                <button onClick={() => handleDelete(showContextMenu.item, true)} className="danger">
                  <Trash2 size={16} /> Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setShowPreview(showContextMenu.item); setShowContextMenu(null); }}>
                  <Eye size={16} /> Preview
                </button>
                <button onClick={() => handleDownload(showContextMenu.item)}><Download size={16} /> Download</button>
                <button onClick={() => handleFileEmail(showContextMenu.item)}><Mail size={16} /> Email File</button>
                <button onClick={() => handleShare(showContextMenu.item)}><Share2 size={16} /> Share</button>
                {currentUser.name === 'Admin User' && (
                  <button onClick={() => handleRename(showContextMenu.item)}><Edit size={16} /> Modify / Rename</button>
                )}
                <hr />
                <button onClick={() => handleDelete(showContextMenu.item, false)} className="danger">
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(null)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{showPreview.name}</h3>
              <div className="preview-actions">
                <button onClick={() => handleDownload(showPreview)}><Download size={18} /></button>
                <button onClick={() => handleShare(showPreview)}><Share2 size={18} /></button>
                <button onClick={() => setShowPreview(null)} className="close"><X size={18} /></button>
              </div>
            </div>
            <div className="preview-content">
              {showPreview.type === 'image' && showPreview.thumbnail ? (
                <img src={showPreview.thumbnail.replace('w=200', 'w=1200')} alt={showPreview.name} />
              ) : (
                <div className="preview-placeholder">
                  {getFileIcon(showPreview.type)}
                  <p>Preview not available</p>
                  <button onClick={() => handleDownload(showPreview)} className="download-btn">
                    <Download size={16} /> Download to View
                  </button>
                </div>
              )}
            </div>
            <div className="preview-footer">
              <span><strong>Size:</strong> {showPreview.size}</span>
              <span><strong>Modified:</strong> {showPreview.modified}</span>
              <span><strong>Type:</strong> {showPreview.type}</span>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="small-modal" onClick={e => e.stopPropagation()}>
            <h3><FolderPlus size={20} color={activeService?.color} /> Create New Folder</h3>
            <input 
              type="text" 
              placeholder="Folder name" 
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowNewFolderModal(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="btn-primary" style={{ background: activeService?.color }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(null)}>
          <div className="small-modal" onClick={e => e.stopPropagation()}>
            <h3><Share2 size={20} color={activeService?.color} /> Share "{showShareModal.name}"</h3>
            <p className="share-info">Anyone with this link can view</p>
            <div className="share-link-box">
              <input type="text" value={shareLink} readOnly />
              <button onClick={copyShareLink} style={{ background: activeService?.color }}><Copy size={16} /></button>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowShareModal(null)} className="btn-cancel">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      {/* Contract Generator Modal */}
      {showContractGenerator && (
        <ContractGenerator 
          onCancel={() => setShowContractGenerator(false)}
          onSave={(contractFile) => {
            const newFile = {
              id: Date.now(),
              ...contractFile,
              icon: FileText,
              color: '#0061FF',
              isContract: true
            };
            setFiles(prev => [newFile, ...prev]);
            setShowContractGenerator(false);
            showToast('Legal contract pushed to client vault.');
          }}
          repository={activeService?.folderName}
        />
      )}
      {/* Email Recipient Modal */}
      {emailModal.isOpen && (
        <div className="modal-overlay animate-fadeIn" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="modal-content" style={{
            background: 'white', border: '5px solid #2E7D32', borderRadius: '32px', width: '420px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #32FC05, #2E7D32)',
              padding: '1.75rem', color: 'white', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                  <Mail size={22} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Dispatch Delivery</h2>
              </div>
              <button onClick={() => setEmailModal({...emailModal, isOpen: false})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: 0.7 }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '2.5rem' }}>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
                Enter the verified email address to deliver <strong>{emailModal.item.name}</strong> directly from the vault.
              </p>
              
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 800, color: '#32FC05', fontSize: '0.8rem', textTransform: 'uppercase' }}>Recipient Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    placeholder="client@dravanua.com"
                    value={emailModal.recipient}
                    onChange={(e) => setEmailModal({...emailModal, recipient: e.target.value})}
                    style={{
                      width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px',
                      border: '2px solid #e2e8f0', outlineColor: '#2E7D32', fontSize: '1rem',
                      transition: 'all 0.2s', background: '#f8fafc'
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => setEmailModal({...emailModal, isOpen: false})}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                    background: '#f1f5f9', color: '#475569', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={dispatchFileEmail}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '14px', border: 'none',
                    background: '#2E7D32', color: 'white', fontWeight: 900, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)'
                  }}
                >
                  <Send size={20} /> Send Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dropbox-vault { background: #f8fafc; min-height: 100vh; }
        
        .toast-notification {
          position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
          border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          z-index: 9999; display: flex; align-items: center; gap: 10px;
          animation: slideIn 0.3s ease;
        }
        
        /* Storage Header */
        .storage-header {
          background: linear-gradient(135deg, #0061FF, #0045A5);
          border-radius: 20px; padding: 2rem; color: white;
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 2rem;
        }
        .storage-info { display: flex; align-items: center; gap: 1.5rem; }
        .storage-icon { width: 70px; height: 70px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .storage-info h2 { margin: 0; font-size: 1.5rem; }
        .storage-info p { margin: 4px 0 12px; opacity: 0.8; font-size: 0.9rem; }
        .storage-bar { width: 300px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden; }
        .storage-bar-fill { height: 100%; background: white; border-radius: 10px; transition: width 0.5s; }
        .storage-text { font-size: 0.8rem; opacity: 0.8; margin-top: 6px; display: block; }
        .storage-stats { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; }
        .stat-item { text-align: center; background: rgba(255,255,255,0.1); padding: 1rem 1.5rem; border-radius: 12px; }
        .stat-value { display: block; font-size: 1.8rem; font-weight: 900; }
        .stat-label { font-size: 0.75rem; opacity: 0.8; }
        
        /* Service Categories & Global Analytics */
        .vault-welcome h2 { letter-spacing: -0.05em; font-family: 'Outfit', sans-serif; }
        .universal-action-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px -5px rgba(0, 97, 255, 0.4);
        }
        
        .quick-stats.high-visibility { 
          background: white; border-radius: 32px; padding: 2.5rem; 
          border: 1px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.03); 
        }
        .stats-bars-grid-horizontal { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; width: 100%; }
        
        .stat-card-glass {
          background: #f8fafc; border-radius: 20px; padding: 1.5rem;
          border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column; gap: 1rem;
        }
        .stat-card-glass:hover { transform: scale(1.02); background: white; box-shadow: 0 10px 20px rgba(0,0,0,0.04); border-color: #cbd5e1; }
        .stat-card-header { display: flex; justify-content: space-between; align-items: center; }
        .stat-icon-mini { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .stat-pct-badge { font-family: monospace; font-size: 0.75rem; font-weight: 800; color: #64748b; background: white; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .stat-card-primary { display: flex; align-items: baseline; gap: 4px; }
        .stat-val-large { font-size: 1.8rem; font-weight: 900; color: #1e293b; letter-spacing: -0.05em; }
        .stat-unit { font-size: 0.8rem; font-weight: 800; color: #94a3b8; }
        .stat-bar-full { height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
        .stat-bar-progress { height: 100%; border-radius: 10px; transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .stat-label-footer { font-size: 0.85rem; font-weight: 700; color: #475569; }

        .service-cards-responsive { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .service-card-premium {
          background: white; border-radius: 28px; border: 1px solid #e2e8f0;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .service-card-premium:hover {
          transform: translateY(-12px);
          box-shadow: 0 25px 40px -10px rgba(0,0,0,0.08);
          border-color: var(--service-color);
        }
        .card-accent { position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: var(--service-color); opacity: 0.5; }
        .card-content-wrap { padding: 1.5rem; }
        .card-header-main { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .service-icon-wrapper { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px -2px rgba(0,0,0,0.1); }
        .card-title-group h4 { margin: 0; font-size: 1.1rem; font-weight: 900; color: #1e293b; letter-spacing: -0.01em; }
        .card-folder-alias { font-size: 0.8rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
        .card-desc { font-size: 0.85rem; color: #475569; line-height: 1.5; margin: 0 0 1.5rem; height: 2.6rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-metrics { display: flex; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 16px; justify-content: space-around; border: 1px solid #f1f5f9; }
        .metric { display: flex; flex-direction: column; align-items: center; }
        .metric-val { font-size: 0.85rem; font-weight: 900; color: #0f172a; }
        .metric-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
        .card-footer-action { display: flex; flex-direction: column; gap: 1.25rem; }
        .mini-progress { height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
        .mini-bar { height: 100%; border-radius: 10px; }
        .open-repo-btn {
          width: 100%; padding: 14px; border: none; border-radius: 16px;
          color: white; font-weight: 900; font-size: 0.85rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .open-repo-btn:hover { filter: brightness(1.1); transform: scale(1.02); }

        /* File Browser */
        .file-browser { background: white; border-radius: 20px; overflow: hidden; position: relative; }
        .file-browser.drag-over { border: 3px dashed #0061FF; }
        
        .browser-toolbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.5rem; border-bottom: 1px solid #eee; flex-wrap: wrap; gap: 1rem;
        }
        .toolbar-left { display: flex; align-items: center; gap: 10px; }
        .toolbar-right { display: flex; align-items: center; gap: 10px; }
        
        .nav-btn {
          width: 38px; height: 38px; border-radius: 10px; border: 1px solid #ddd;
          background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .nav-btn:hover { background: #f5f5f5; }
        
        .breadcrumbs { display: flex; align-items: center; background: #f5f5f5; padding: 6px 12px; border-radius: 10px; }
        .breadcrumb { background: none; border: none; cursor: pointer; font-size: 0.85rem; padding: 4px 8px; border-radius: 6px; color: #666; font-weight: 500; }
        .breadcrumb:hover { background: #e8e8e8; }
        .breadcrumb.active { color: #0061FF; font-weight: 700; }
        .breadcrumb-sep { color: #ccc; }
        
        .search-box { position: relative; }
        .search-box input { width: 220px; padding: 10px 12px 10px 36px; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 0.85rem; }
        .search-box svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #999; }
        
        .view-toggle { display: flex; background: #f0f0f0; border-radius: 8px; padding: 2px; }
        .view-toggle button { padding: 8px; border-radius: 6px; border: none; background: transparent; cursor: pointer; }
        .view-toggle button.active { background: white; }
        
        .action-btn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #ddd; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { border-color: #0061FF; color: #0061FF; }
        
        .upload-btn {
          display: flex; align-items: center; gap: 6px; padding: 10px 20px;
          border-radius: 10px; border: none; color: white; cursor: pointer;
          font-weight: 700; font-size: 0.85rem;
        }
        .upload-btn input { display: none; }
        .upload-btn:hover { opacity: 0.9; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        
        /* Service Badge */
        .service-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; margin: 1rem 1.5rem 0; border-radius: 10px;
          border: 1px solid; font-size: 0.85rem; font-weight: 600;
        }
        .badge-path { color: #888; font-weight: 400; margin-left: 8px; font-family: monospace; font-size: 0.8rem; }
        
        /* Upload Progress */
        .upload-progress { margin: 1rem 1.5rem; padding: 1rem; background: #e3f2fd; border-radius: 10px; }
        .progress-info { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px; }
        .progress-bar { height: 6px; background: #bbdefb; border-radius: 10px; overflow: hidden; }
        .progress-bar > div { height: 100%; transition: width 0.3s; }
        
        /* Drag Overlay */
        .drag-overlay {
          position: absolute; inset: 0; background: rgba(0, 97, 255, 0.95);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          color: white; z-index: 100; border-radius: 20px;
        }
        .drag-overlay p { margin-top: 1rem; font-size: 1.2rem; font-weight: 600; }
        
        /* Browser Content */
        .browser-content { padding: 1.5rem; min-height: 400px; }
        
        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 4rem; color: #888;
        }
        .empty-state svg { opacity: 0.3; margin-bottom: 1rem; }
        .empty-state h3 { margin: 0 0 8px; color: #555; }
        .empty-state p { margin: 0 0 1.5rem; }
        .upload-btn-large {
          display: flex; align-items: center; gap: 8px; padding: 14px 28px;
          border-radius: 12px; border: none; color: white; cursor: pointer;
          font-weight: 700; font-size: 0.95rem;
        }
        .upload-btn-large input { display: none; }
        
        /* Grid View */
        .grid-section { margin-bottom: 2rem; }
        .grid-section h4 { margin: 0 0 1rem; font-size: 0.7rem; color: #999; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
        
        .folders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
        .folder-card {
          position: relative; display: flex; align-items: center; gap: 12px;
          padding: 1rem; background: white; border: 1px solid #eee;
          border-radius: 14px; cursor: pointer; transition: all 0.2s;
        }
        .folder-card:hover { border-color: #0061FF; box-shadow: 0 8px 25px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .folder-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: linear-gradient(135deg, #32FC05, #32CD32) !important; color: white !important; }
        .folder-details { flex: 1; min-width: 0; }
        .folder-name { display: block; font-weight: 800; font-size: 0.9rem; color: var(--accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .folder-meta { display: block; font-size: 0.7rem; color: #999; margin-top: 2px; }
        .folder-client { position: absolute; top: 8px; right: 40px; font-size: 0.65rem; background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 50px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; }
        .folder-status { position: absolute; bottom: 8px; right: 12px; font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; text-transform: capitalize; }
        .folder-status.delivered { background: #dcfce7; color: #16a34a; }
        .folder-status.pending { background: #fef3c7; color: #d97706; }
        .folder-menu { position: absolute; top: 8px; right: 8px; background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; opacity: 0; }
        .folder-card:hover .folder-menu { opacity: 1; }
        .folder-menu:hover { background: #f0f0f0; }
        
        .files-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
        .file-card {
          background: white; border: 1px solid #eee; border-radius: 14px;
          overflow: hidden; cursor: pointer; transition: all 0.2s;
        }
        .file-card:hover { border-color: #0061FF; box-shadow: 0 8px 25px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .file-thumbnail { height: 120px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .file-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .file-icon { color: #0061FF; }
        .file-details { padding: 0.75rem; }
        .file-name { display: block; font-weight: 600; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-meta { display: block; font-size: 0.7rem; color: #888; margin-top: 2px; }
        
        /* List View */
        .list-view table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
        .list-view th { padding: 12px 16px; text-align: left; font-size: 0.7rem; color: #999; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; border: none; }
        .list-view td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
        .list-view tr:hover { background: #fafafa; }
        .folder-row { cursor: pointer; }
        .folder-row:hover td { background: #e3f2fd; }
        .item-name { display: flex; align-items: center; gap: 12px; }
        .item-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; background: linear-gradient(135deg, #32FC05, #32CD32) !important; color: white !important; }
        .item-icon.file { background: linear-gradient(135deg, #32FC05, #32CD32) !important; color: white !important; }
        .item-icon img { width: 100%; height: 100%; object-fit: cover; }
        .item-name .name { font-weight: 700; font-size: 0.85rem; color: var(--accent); }
        .item-name .meta { display: block; font-size: 0.7rem; color: #999; }
        
        .row-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .row-actions button {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: #f5f5f5; cursor: pointer; display: flex;
          align-items: center; justify-content: center; color: #666;
        }
        .row-actions button:hover { background: #0061FF; color: white; }
        .row-actions button.delete:hover { background: #dc2626; }
        
        /* Context Menu */
        .context-overlay { position: fixed; inset: 0; z-index: 100; }
        .context-menu {
          position: fixed; z-index: 101; background: white; border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15); min-width: 180px; overflow: hidden;
        }
        .context-menu button {
          width: 100%; padding: 10px 16px; border: none; background: none;
          cursor: pointer; display: flex; align-items: center; gap: 10px;
          font-size: 0.85rem; text-align: left;
        }
        .context-menu button:hover { background: #f5f5f5; }
        .context-menu button.danger { color: #dc2626; }
        .context-menu button.danger:hover { background: #fee2e2; }
        .context-menu hr { margin: 4px 0; border: none; border-top: 1px solid #eee; }
        
        /* Modals */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
        }
        
        .preview-modal {
          background: white; border-radius: 20px; width: 90%; max-width: 900px;
          max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
        }
        .preview-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.5rem; border-bottom: 1px solid #eee;
        }
        .preview-header h3 { margin: 0; font-size: 1rem; }
        .preview-actions { display: flex; gap: 8px; }
        .preview-actions button {
          width: 38px; height: 38px; border-radius: 10px; border: 1px solid #ddd;
          background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .preview-actions button:hover { background: #f5f5f5; }
        .preview-actions button.close:hover { background: #fee2e2; color: #dc2626; }
        .preview-content {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 2rem; background: #f8f9fa; overflow: auto;
        }
        .preview-content img { max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 8px; }
        .preview-placeholder { text-align: center; color: #888; }
        .preview-placeholder svg { width: 64px; height: 64px; margin-bottom: 1rem; opacity: 0.5; }
        .download-btn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 1rem;
          padding: 12px 24px; background: #0061FF; color: white; border: none;
          border-radius: 10px; cursor: pointer; font-weight: 600;
        }
        .preview-footer {
          display: flex; gap: 2rem; padding: 1rem 1.5rem;
          border-top: 1px solid #eee; font-size: 0.85rem; color: #666;
        }
        
        .small-modal {
          background: white; border-radius: 20px; padding: 1.5rem;
          width: 100%; max-width: 420px;
        }
        .small-modal h3 {
          margin: 0 0 1rem; display: flex; align-items: center; gap: 10px; font-size: 1.1rem;
        }
        .small-modal input {
          width: 100%; padding: 12px 16px; border: 1px solid #ddd;
          border-radius: 10px; font-size: 0.9rem;
        }
        .small-modal input:focus { border-color: #0061FF; outline: none; }
        .share-info { color: #666; font-size: 0.85rem; margin: 0 0 1rem; }
        .share-link-box { display: flex; gap: 8px; }
        .share-link-box input { flex: 1; background: #f5f5f5; }
        .share-link-box button {
          width: 44px; border: none; border-radius: 10px; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 1.5rem; }
        .btn-cancel {
          padding: 10px 20px; border-radius: 10px; border: 1px solid #ddd;
          background: white; cursor: pointer; font-weight: 600;
        }
        .btn-primary {
          padding: 10px 24px; border-radius: 10px; border: none;
          background: #0061FF; color: white; cursor: pointer; font-weight: 600;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        
        /* Animations */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .storage-header { flex-direction: column; gap: 1.5rem; }
          .storage-info { flex-direction: column; text-align: center; }
          .storage-bar { width: 100%; }
          .service-cards { grid-template-columns: 1fr; }
          .browser-toolbar { flex-direction: column; }
          .toolbar-left, .toolbar-right { width: 100%; justify-content: space-between; }
          .search-box input { width: 100%; }
          .stat-bar-item { grid-template-columns: 1fr; gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
};



export default ManageDropbox;

