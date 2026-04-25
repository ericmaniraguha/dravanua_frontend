import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, User, Calendar, MapPin, DollarSign, 
  CheckCircle, Download, Send, Printer, X, Plus,
  Info, Shield, Briefcase, Camera, Clock, 
  ChevronRight, RefreshCw, Save, Trash2, Edit3,
  Check, AlertCircle, Bookmark, Share2, Mail
} from 'lucide-react';
import { generateReport } from '../utils/generateReport';

const ContractGenerator = ({ onCancel, onSave, repository = 'client_files', initialData = null }) => {
  const { secureFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  
  // Contract State
  const [contractData, setContractData] = useState({
    contractNumber: `DVS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    eventType: 'Classic Fashion',
    eventDate: '',
    venue: '',
    servicePackage: 'Premium Classic Fashion Package',
    items: [
      { id: Date.now(), description: 'Full Day Classic Fashion Coverage (12 Hours)', price: 1500000 },
      { id: Date.now() + 1, description: 'High-Res Digital Gallery (300+ Photos)', price: 0 },
      { id: Date.now() + 2, description: 'Premium Leather Photo Album (40 Pages)', price: 250000 },
    ],
    terms: 'Standard Terms & Conditions apply.',
    deposit: 500000,
    currency: 'RWF',
    notes: 'Includes drone coverage and 2 lead photographers.'
  });

  // Hydrate with initial data if provided from CRM
  useEffect(() => {
    if (initialData) {
      setContractData(prev => ({
        ...prev,
        clientName: initialData.clientName || prev.clientName,
        clientEmail: initialData.clientEmail || prev.clientEmail,
        clientPhone: initialData.clientPhone || prev.clientPhone,
        clientAddress: initialData.clientAddress || prev.clientAddress
      }));
    }
  }, [initialData]);

  const totals = {
    subtotal: contractData.items.reduce((acc, item) => acc + item.price, 0),
    deposit: contractData.deposit,
    balance: contractData.items.reduce((acc, item) => acc + item.price, 0) - contractData.deposit
  };

  const handleInputChange = (field, value) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setContractData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', price: 0 }]
    }));
  };

  const removeItem = (id) => {
    setContractData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id, field, value) => {
    setContractData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(3);
    }, 800);
  };

  const handlePrintContract = () => {
    const bodyHtml = `
      <div class="section-title">Client Information</div>
      <table>
        <tbody>
          <tr><td style="width:30%"><strong>Client Name</strong></td><td>${contractData.clientName || 'N/A'}</td></tr>
          <tr><td><strong>Email</strong></td><td>${contractData.clientEmail || 'N/A'}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${contractData.clientPhone || 'N/A'}</td></tr>
          <tr><td><strong>Address</strong></td><td>${contractData.clientAddress || 'N/A'}</td></tr>
        </tbody>
      </table>

      <div class="section-title">Project Scope</div>
      <table>
        <tbody>
          <tr><td style="width:30%"><strong>Event Type</strong></td><td>${contractData.eventType}</td></tr>
          <tr><td><strong>Event Date</strong></td><td>${contractData.eventDate || 'TBD'}</td></tr>
          <tr><td><strong>Venue</strong></td><td>${contractData.venue || 'TBD'}</td></tr>
        </tbody>
      </table>

      <div class="section-title">Financial Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:right">Price (${contractData.currency})</th>
          </tr>
        </thead>
        <tbody>
          ${contractData.items.map(item => `
            <tr>
              <td>${item.description || 'Service Line Item'}</td>
              <td style="text-align:right; font-weight:700;">${item.price.toLocaleString()}</td>
            </tr>
          `).join('')}
          <tr style="background:#e8f5e9">
            <td style="text-align:right; font-weight:900;">Subtotal:</td>
            <td style="text-align:right; font-weight:900; color:#32FC05">${totals.subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="text-align:right; font-weight:700;">Deposit Paid:</td>
            <td style="text-align:right; font-weight:700; color:#d32f2f">-${totals.deposit.toLocaleString()}</td>
          </tr>
          <tr style="background:#fffde7">
            <td style="text-align:right; font-weight:900; font-size:12px;">Balance Due:</td>
            <td style="text-align:right; font-weight:900; font-size:12px;">${totals.balance.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="section-title">Terms & Conditions</div>
      <div style="font-size: 11px; color:#555; line-height: 1.6; background: #f8fdf8; padding: 15px; border-left: 3px solid #32FC05; margin-bottom: 20px;">
        <p style="margin-bottom: 8px;">${contractData.terms}</p>
        <p>1. A non-refundable retainer/deposit of <strong>${contractData.deposit.toLocaleString()} ${contractData.currency}</strong> is required to formally secure the date and services.</p>
        <p>2. Final high-resolution media will be securely archived in the studio's cloud vault for 12 calendar months post-delivery.</p>
        <p>3. This agreement serves as a binding contract. Cancellation policies apply as dictated by standard DRAVANUA STUDIO operational terms.</p>
      </div>
      
      <div class="sig-grid" style="margin-top: 40px; margin-bottom: 20px;">
        <div class="sig-box"><div class="sig-line"></div><div class="sig-name">${contractData.clientName || 'Client'}</div><div class="sig-role">Client Signature & Date</div></div>
        <div class="sig-box"><div class="sig-line"></div><div class="sig-name">Authorised Representative</div><div class="sig-role">DRAVANUA STUDIO</div></div>
      </div>
    `;

    generateReport({
      title: 'Client Proposal, Proforma, and Contract Management System',
      moduleCode: 'CTR',
      bodyHtml
    });
  };

  const handleEmailContract = () => {
    setTempEmail(contractData.clientEmail);
    setShowEmailPrompt(true);
  };

  const dispatchContract = async () => {
    if (!tempEmail) return;
    
    setIsGenerating(true);
    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/contracts/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: tempEmail,
          contractData,
          totals
        })
      });

      const result = await response.json();
      if (result.success) {
        alert("Contract successfully dispatched to client email.");
        setShowEmailPrompt(false);
      } else {
        alert(result.error || "Failed to dispatch contract.");
      }
    } catch (error) {
      console.error("Email Error:", error);
      alert("System could not connect to Mail Server. Opening local client as backup.");
      
      // Fallback to mailto if API fails
      const subject = encodeURIComponent(`DRAVANUA HUB: Official Legal Contract - ${contractData.contractNumber}`);
      const body = encodeURIComponent(`Dear ${contractData.clientName},\n\nPlease find the official service agreement for your upcoming ${contractData.eventType} session.\n\nTotal Contract Value: ${totals.subtotal.toLocaleString()} ${contractData.currency}\nDeposit Paid: ${totals.deposit.toLocaleString()} ${contractData.currency}\n\nPlease review and return a signed copy.\n\nBest Regards,\nDRAVANUA STUDIO`);
      window.location.href = `mailto:${tempEmail}?subject=${subject}&body=${body}`;
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewSave = () => {
    const fileName = `${contractData.clientName.replace(/\s+/g, '_') || 'Client'}_Contract_${contractData.contractNumber}.pdf`;
    onSave({
      name: fileName,
      type: 'pdf',
      size: '1.2 MB',
      modified: new Date().toISOString().split('T')[0],
      client: contractData.clientName
    });
  };

  return (
    <div className="contract-gen-overlay animate-fadeIn">
      <div className="contract-gen-container">
        {/* Header */}
        <div className="contract-gen-header">
          <div className="header-title">
            <div className="icon-badge">
              <Shield size={24} />
            </div>
            <div>
              <h3>Client Proposal, Proforma, and Contract Management System</h3>
              <p>DRAVANUA STUDIO • Audit-Ready Professional Agreements</p>
            </div>
          </div>
          <button className="close-btn" onClick={onCancel}><X size={20} /></button>
        </div>

        {/* Stepper */}
        <div className="contract-stepper">
          {[
            { n: 1, label: 'Client Identity' },
            { n: 2, label: 'Service Details' },
            { n: 3, label: 'Audit & Launch' }
          ].map(s => (
            <div key={s.n} className={`step-item ${step >= s.n ? 'active' : ''}`}>
              <div className="step-circle">{step > s.n ? <Check size={16} /> : s.n}</div>
              <span>{s.label}</span>
              {s.n < 3 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="contract-form-body">
          {step === 1 && (
            <div className="form-step-content animate-slideUp">
              <h4 className="section-title"><User size={18} /> Client & Contact Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name / Organization</label>
                  <input 
                    type="text" 
                    value={contractData.clientName} 
                    onChange={e => handleInputChange('clientName', e.target.value)}
                    placeholder="e.g., Eric Mutabazi"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={contractData.clientEmail} 
                    onChange={e => handleInputChange('clientEmail', e.target.value)}
                    placeholder="eric@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={contractData.clientPhone} 
                    onChange={e => handleInputChange('clientPhone', e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
                <div className="form-group">
                  <label>Billing Address</label>
                  <input 
                    type="text" 
                    value={contractData.clientAddress} 
                    onChange={e => handleInputChange('clientAddress', e.target.value)}
                    placeholder="Kigali, Rwanda"
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                  <Info size={16} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>This information builds both the legal contract and the financial invoice generated in the <code>reports</code> vault.</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step-content animate-slideUp">
              <h4 className="section-title" style={{ marginBottom: '1rem' }}><Briefcase size={18} /> Project Scope & Financials</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Event Type</label>
                  <select value={contractData.eventType} onChange={e => handleInputChange('eventType', e.target.value)}>
                    <option value="Classic Fashion">Classic Fashion Session</option>
                    <option value="Portrait">Studio Portrait</option>
                    <option value="Event">Corporate Event</option>
                    <option value="Fashion">Fashion Shoot</option>
                    <option value="Other">Custom Project</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Event Date</label>
                  <input type="date" value={contractData.eventDate} onChange={e => handleInputChange('eventDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Venue / Location</label>
                  <input type="text" value={contractData.venue} onChange={e => handleInputChange('venue', e.target.value)} placeholder="e.g., Kigali Convention Centre" />
                </div>
                <div className="form-group">
                  <label>Currency *</label>
                  <select value={contractData.currency || 'RWF'} onChange={e => handleInputChange('currency', e.target.value)} required>
                    <option value="RWF">RWF (Francs)</option>
                    <option value="USD">USD (Dollars)</option>
                    <option value="EUR">EUR (Euros)</option>
                    <option value="GBP">GBP (Pounds)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Line Items</label>
                  <button className="add-item-btn" onClick={addItem}><Plus size={14} /> Add Line</button>
                </div>
                <div className="items-list">
                  {contractData.items.map((item, idx) => (
                    <div key={item.id} className="item-row">
                      <input 
                        className="item-desc" 
                        value={item.description} 
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                      />
                      <div className="item-price-wrap">
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        />
                        <span>{contractData.currency}</span>
                      </div>
                      <button className="remove-item-btn" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="totals-review">
                <div className="total-group">
                  <label>Deposit Paid</label>
                  <div className="price-input">
                    <input type="number" value={contractData.deposit} onChange={e => handleInputChange('deposit', parseFloat(e.target.value) || 0)} />
                    <span>{contractData.currency}</span>
                  </div>
                </div>
                <div className="total-summary-mini">
                  <div className="row"><span>Subtotal:</span><strong>{totals.subtotal.toLocaleString()} {contractData.currency}</strong></div>
                  <div className="row"><span>Deposit:</span><strong style={{ color: '#10b981' }}>- {totals.deposit.toLocaleString()} {contractData.currency}</strong></div>
                  <div className="row final"><span>Balance Due:</span><strong>{totals.balance.toLocaleString()} {contractData.currency}</strong></div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step-content animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ width: '80px', height: '80px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Printer size={40} color="#0061FF" />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', marginBottom: '8px' }}>Contract Generated Successfully</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                  The legal document for <strong>{contractData.clientName || 'Client'}</strong> is now structured and ready for official review or secure storage.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    onClick={handlePrintContract}
                    style={{ background: '#32FC05', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', boxShadow: '0 4px 12px rgba(27, 94, 32, 0.2)' }}
                  >
                    <Printer size={18} /> Review & Print Official Document
                  </button>

                  {showEmailPrompt ? (
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '2px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', textAlign: 'left' }}>Specify Recipient Email</label>
                      <input 
                        type="email" 
                        value={tempEmail} 
                        onChange={e => setTempEmail(e.target.value)}
                        placeholder="client@example.com"
                        style={{ padding: '12px', borderRadius: '10px', border: '1px solid #dbeafe', fontSize: '0.95rem', outlineColor: '#3b82f6' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowEmailPrompt(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={dispatchContract} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                          <Send size={16} style={{marginRight: '6px'}}/> Send Now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={handleEmailContract}
                      style={{ background: '#eef2ff', color: '#3b82f6', border: '1px solid #dbeafe', padding: '14px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', width: '100%' }}
                    >
                      {isGenerating ? <RefreshCw size={18} className="spin" /> : <Mail size={18} />} 
                      {isGenerating ? 'Structuring Dispatch...' : 'Email Contract to Client'}
                    </button>
                  )}

                  <button 
                    onClick={handlePreviewSave}
                    style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}
                  >
                    <Save size={18} /> Save to Client Delivery Hub (Client Files)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="contract-gen-footer">
          {step > 1 && step < 3 && (
            <button className="btn-back" onClick={() => setStep(step - 1)}>
              Back to Client Info
            </button>
          )}
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={onCancel}>
              Discard Draft
            </button>
            
            {step < 2 ? (
              <button 
                className="btn-next" 
                onClick={() => setStep(step + 1)}
                disabled={!contractData.clientName || !contractData.clientEmail}
              >
                Next: Service Scope <ChevronRight size={18} />
              </button>
            ) : step === 2 ? (
              <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating} style={{ background: '#32FC05' }}>
                {isGenerating ? <><RefreshCw size={18} className="spin" /> Structuring Document...</> : <><Shield size={18} /> Prepare Legal Document</>}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-outline" onClick={() => setStep(2)}>
                  <Edit3 size={18} /> Edit Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .contract-gen-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px); display: flex; align-items: flex-start; justify-content: center;
          z-index: 9999; padding: 3rem 2rem 2rem; overflow-y: auto;
        }
        .contract-gen-container {
          background: white; border-radius: 20px; width: 100%; max-width: 1100px;
          max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column; 
          overflow-x: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); margin: 0 auto;
        }
        
        .contract-gen-header {
          padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center; background: #f8fafc;
        }
        .header-title { display: flex; align-items: center; gap: 0.75rem; }
        .icon-badge { background: #0061FF; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .header-title h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }
        .header-title p { margin: 0; font-size: 0.75rem; color: #64748b; }
        
        .contract-stepper {
          display: flex; justify-content: space-around; padding: 1rem 2rem;
          background: white; border-bottom: 1px solid #f1f5f9;
        }
        .step-item { display: flex; align-items: center; gap: 8px; position: relative; color: #94a3b8; font-size: 0.85rem; }
        .step-item.active { color: #0061FF; font-weight: 700; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
        .step-line { width: 40px; height: 2px; background: #e2e8f0; margin-left: 12px; }
        .step-item.active .step-line { background: #93c5fd; }
        
        .contract-form-body { flex: 1; overflow-y: auto; padding: 1.5rem; background: #ffffff; }
        .section-title { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; margin-bottom: 1.25rem; color: #1e293b; font-weight: 800; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input, .form-group select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; outline-color: #0061FF; }
        
        .add-item-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #f1f5f9; border: none; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: #0061FF; cursor: pointer; }
        .items-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .item-row { display: flex; gap: 8px; align-items: center; background: #f8fafc; padding: 6px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .item-desc { flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; background: white; }
        .item-price-wrap { display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; width: 140px; overflow: hidden; }
        .item-price-wrap input { width: 100%; border: none; background: transparent; padding: 10px; text-align: right; outline: none; font-weight: 600; }
        .item-price-wrap span { padding-right: 12px; font-size: 0.75rem; color: #64748b; font-weight: 700; }
        .remove-item-btn { color: #ef4444; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; transition: 0.2s; }
        .remove-item-btn:hover { background: #fee2e2; }
        
        .totals-review { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
        .price-input { display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .price-input input { flex: 1; border: none; padding: 10px 14px; font-weight: 700; background: transparent; outline: none; text-align: right; font-size: 0.9rem; }
        .price-input span { padding-right: 14px; font-size: 0.75rem; font-weight: 800; color: #64748b; }
        
        .total-summary-mini { background: #1e293b; color: white; padding: 1rem 1.5rem; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
        .total-summary-mini .row { display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.8; }
        .total-summary-mini .row.final { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; opacity: 1; font-weight: 800; font-size: 1rem; }
        
        /* Preview Styles */
        .contract-preview-document {
          background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4rem;
          color: #1e293b; box-shadow: 0 10px 30px rgba(0,0,0,0.05); font-family: "Times New Roman", serif;
        }
        .doc-header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 2rem; margin-bottom: 2.5rem; }
        .doc-logo h2 { margin: 0; font-size: 2rem; font-weight: 900; letter-spacing: 0.1em; font-family: sans-serif; }
        .doc-logo span { font-size: 0.8rem; color: #0061FF; font-weight: 800; font-family: sans-serif; }
        .doc-meta { text-align: right; display: flex; flexDirection: column; gap: 4px; }
        
        .doc-section { margin-bottom: 2rem; }
        .doc-section h4 { text-transform: uppercase; font-size: 0.9rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .doc-section p { font-size: 1rem; line-height: 1.6; margin: 0.5rem 0; }
        
        .doc-table { width: 100%; margin: 2rem 0; }
        .table-header { display: flex; justify-content: space-between; font-weight: 800; padding: 1rem; background: #f8fafc; border-bottom: 1px solid #1e293b; }
        .table-row { display: flex; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #f1f5f9; }
        .table-footer { margin-top: 1.5rem; display: flex; flexDirection: column; align-items: flex-end; gap: 8px; }
        .footer-row { display: flex; gap: 2rem; width: 300px; justify-content: space-between; }
        .footer-row.total { font-weight: 900; font-size: 1.25rem; border-top: 1.5px solid #1e293b; padding-top: 10px; margin-top: 10px; }
        
        .terms p { font-size: 0.85rem; color: #475569; }
        
        .doc-signatures { display: flex; justify-content: space-between; margin-top: 5rem; }
        .sig-line { width: 200px; text-align: center; }
        .sig-line .line { border-bottom: 1px solid #1e293b; margin-bottom: 8px; }
        .sig-line span { font-size: 0.85rem; color: #64748b; font-style: italic; }
        
        .contract-gen-footer {
          padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0;
          display: flex; align-items: center;
        }
        
        .btn-back { background: none; border: none; color: #64748b; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-secondary { background: none; border: none; color: #ef4444; font-weight: 700; cursor: pointer; }
        .btn-next, .btn-generate, .btn-primary { 
          padding: 12px 24px; border: none; border-radius: 12px; color: white; 
          font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px;
        }
        .btn-next { background: #0061FF; }
        .btn-generate { background: #1e293b; }
        .btn-primary { background: #0061FF; }
        .btn-outline { background: white; border: 1px solid #e2e8f0; color: #1e293b; padding: 12px 24px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Add other animations as needed */
      `}</style>
    </div>
  );
};

export default ContractGenerator;
