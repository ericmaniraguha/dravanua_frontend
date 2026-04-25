/**
 * ExportToolbar — DRAVANUA HUB
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in toolbar providing:
 *   • PDF print (uses window.print via generateReport)
 *   • Excel download (via exportUtils)
 *   • Email delivery (via exportUtils + modal)
 *   • Currency selector (persisted to localStorage)
 *
 * Props:
 *   onPDF         () => void             — trigger the existing PDF/print flow
 *   onExcel       () => void             — trigger Excel export
 *   currency      string                 — current currency code e.g. "RWF"
 *   onCurrency    (code: string) => void — currency change handler
 *   emailSubject  string                 — default subject for email modal
 *   emailHtml     () => string           — lazy getter: returns HTML body for email
 *   moduleCode    string                 — e.g. "ANA" | "FIN"
 *   extraButtons  ReactNode              — additional buttons to append
 */

import React, { useState } from 'react';
import {
  Printer, FileSpreadsheet, Mail, ChevronDown,
  DollarSign, CheckCircle, AlertCircle, X, Send, Loader
} from 'lucide-react';
import { CURRENCIES, sendReportEmail } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';

const ExportToolbar = ({
  onPDF,
  onExcel,
  currency    = 'RWF',
  onCurrency,
  emailSubject = 'DRAVANUA HUB — Report',
  emailHtml,
  moduleCode   = 'DVS',
  extraButtons,
}) => {
  const { secureFetch } = useAuth();
  const [showCurrency, setShowCurrency]   = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo]             = useState('');
  const [emailNote, setEmailNote]         = useState('');
  const [sending, setSending]             = useState(false);
  const [emailResult, setEmailResult]     = useState(null); // { success, message }

  // ── Send email ─────────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!emailTo.trim()) return;
    setSending(true);
    setEmailResult(null);
    try {
      const html = emailHtml ? emailHtml() : '<p>See attached report.</p>';
      const result = await sendReportEmail({
        to: emailTo.trim(),
        subject: emailSubject,
        htmlBody: emailNote
          ? `<p style="font-size:13px;color:#334155;margin-bottom:16px;">${emailNote}</p>${html}`
          : html,
        moduleCode,
        secureFetch
      });
      setEmailResult(result);
      if (result.success) {
        setTimeout(() => { setShowEmailModal(false); setEmailResult(null); setEmailTo(''); setEmailNote(''); }, 2500);
      }
    } finally {
      setSending(false);
    }
  };

  const selectedCur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

        {/* Currency Selector */}
        {onCurrency && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCurrency(v => !v)}
              title="Switch currency"
              style={btnStyle('#f8fafc', '#475569', '#e2e8f0')}
            >
              <DollarSign size={14} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{selectedCur.code}</span>
              <ChevronDown size={11} style={{ opacity: 0.6, transform: showCurrency ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {showCurrency && (
              <div style={dropdownStyle}>
                <div style={{ padding: '6px 10px', fontSize: '0.6rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Display Currency
                </div>
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { onCurrency(c.code); setShowCurrency(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', background: c.code === currency ? '#f0fdf4' : 'none',
                      border: 'none', cursor: 'pointer', padding: '7px 12px',
                      fontSize: '0.75rem', fontWeight: c.code === currency ? 800 : 500,
                      color: c.code === currency ? '#166534' : '#334155',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: '32px', fontSize: '0.7rem', fontWeight: 900, color: '#32FC05' }}>{c.symbol}</span>
                    {c.label}
                    {c.code === currency && <CheckCircle size={12} color="#16a34a" style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDF Button */}
        {onPDF && (
          <button onClick={onPDF} style={btnStyle('#32FC05', 'white', '#166534')} title="Generate PDF Report">
            <Printer size={14} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>PDF</span>
          </button>
        )}

        {/* Excel Button */}
        {onExcel && (
          <button onClick={onExcel} style={btnStyle('#166534', 'white', '#14532d')} title="Download Excel Spreadsheet">
            <FileSpreadsheet size={14} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Excel</span>
          </button>
        )}

        {/* Email Button */}
        {emailHtml && (
          <button onClick={() => setShowEmailModal(true)} style={btnStyle('#1565c0', 'white', '#1e40af')} title="Email this report">
            <Mail size={14} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Email</span>
          </button>
        )}

        {extraButtons}
      </div>

      {/* ── Email Modal ──────────────────────────────────────────────────────── */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999,
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) setShowEmailModal(false); }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '420px', maxWidth: '95vw',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
            overflow: 'hidden', animation: 'emailModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #1565c0, #1e40af)', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} color="white" />
                <div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>Send Report by Email</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{emailSubject}</div>
                </div>
              </div>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {emailResult ? (
                <div style={{
                  textAlign: 'center', padding: '20px',
                  color: emailResult.success ? '#166534' : '#b91c1c',
                }}>
                  {emailResult.success
                    ? <CheckCircle size={40} style={{ marginBottom: '10px', color: '#16a34a' }} />
                    : <AlertCircle size={40} style={{ marginBottom: '10px' }} />}
                  <p style={{ fontWeight: 700 }}>{emailResult.message}</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Recipient Email(s)</label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="recipient@example.com"
                      style={inputStyle}
                      disabled={sending}
                    />
                    <p style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>Separate multiple addresses with a comma.</p>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Message / Note (optional)</label>
                    <textarea
                      value={emailNote}
                      onChange={e => setEmailNote(e.target.value)}
                      placeholder="Add a note to prepend to the report…"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      disabled={sending}
                    />
                  </div>
                  <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '10px 12px', fontSize: '0.72rem', color: '#1e40af', marginBottom: '16px' }}>
                    📎 The full report will be sent as formatted HTML to the recipient(s).
                  </div>
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || !emailTo.trim()}
                    style={{
                      width: '100%', background: sending || !emailTo.trim() ? '#94a3b8' : 'linear-gradient(135deg, #1565c0, #1e40af)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      padding: '12px', fontWeight: 800, fontSize: '0.85rem',
                      cursor: sending || !emailTo.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    {sending ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : <><Send size={15} /> Send Report</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes emailModalIn {
          from { opacity: 0; transform: scale(0.90) translateY(-12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

// ── Shared micro-styles ──────────────────────────────────────────────────────
const btnStyle = (bg, color, borderColor) => ({
  display: 'flex', alignItems: 'center', gap: '5px',
  background: bg, color, border: `1.5px solid ${borderColor}`,
  borderRadius: '9px', padding: '7px 12px', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.18s',
  whiteSpace: 'nowrap',
});

const dropdownStyle = {
  position: 'absolute', top: '38px', left: 0,
  background: 'white', border: '1.5px solid #e2e8f0',
  borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
  zIndex: 999999, minWidth: '240px', overflow: 'hidden',
};

const labelStyle = {
  display: 'block', fontSize: '0.68rem', fontWeight: 900,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default ExportToolbar;
