import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import Header from './components/Header';
import {
  Mail, MessageCircle, Send, CheckCircle, Clock, Search, X,
  User, Calendar, Shield, Inbox, CheckSquare, AlertCircle,
  Trash2, ArrowRight, UserPlus, FileText, Smartphone, Plus, Paperclip,
  Globe, Info, Loader2, Eye, EyeOff, RefreshCw
} from 'lucide-react';

const MessageCenter = () => {
  const { user: currentUser, secureFetch } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [inboxFilter, setInboxFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  const location = useLocation();

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', isBranded: true, departmentId: 'all' });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch staff directory for quick email filling
  const fetchTeam = async () => {
    try {
      const [teamResp, deptResp] = await Promise.all([
        secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/team`),
        secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/departments`)
      ]);

      const teamData = await teamResp.json();
      const deptData = await deptResp.json();

      if (teamData.success) setTeamMembers(teamData.data || []);
      if (deptData.success) setDepartments(deptData.data || []);
    } catch (e) { console.error('Failed to load organizational data'); }
  };

  useEffect(() => {
    if (isComposeOpen && (teamMembers.length === 0 || departments.length === 0)) {
      fetchTeam();
    }
  }, [isComposeOpen]);

  // Handle deep-linking from Staff Directory
  useEffect(() => {
    if (location.state?.recipient) {
      if (teamMembers.length === 0) {
        fetchTeam().then(() => setIsComposeOpen(true));
      } else {
        setIsComposeOpen(true);
      }
    }
  }, [location.state?.recipient]);

  useEffect(() => {
    if (isComposeOpen && location.state?.recipient && teamMembers.length > 0) {
      const targetUser = teamMembers.find(t => t.name === location.state.recipient);
      if (targetUser && !composeData.to) {
        setComposeData(prev => ({
          ...prev,
          to: targetUser.email || prev.to,
          departmentId: targetUser.departmentId || 'all'
        }));
      }
    }
  }, [teamMembers, isComposeOpen, location.state?.recipient]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await secureFetch(import.meta.env.VITE_API_BASE_URL + '/api/v1/contact');
      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error("Message Center load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/contact/${id}/read`, { method: 'PATCH' });
      fetchMessages();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this message?")) return;
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/contact/${id}`, { method: 'DELETE' });
      setActiveMessage(null);
      fetchMessages();
    } catch (e) { console.error(e); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText || !activeMessage) return;
    setIsReplying(true);
    try {
      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/contact/${activeMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText })
      });
      if (response.ok) {
        alert('Reply delivered!');
        fetchMessages();
        setActiveMessage(prev => ({ ...prev, status: 'replied', replyContent: replyText }));
        setReplyText('');
      } else {
        alert('Failed to send reply');
      }
    } catch (err) { alert('Error connecting'); } finally { setIsReplying(false); }
  };

  const handleSendNewEmail = async (e) => {
    e.preventDefault();
    if (!composeData.to || !composeData.subject || !composeData.body) return;
    setIsReplying(true);
    try {
      const htmlBody = composeData.isBranded
        ? `
<div style="font-family: 'Inter', Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #1B5E20, #2E7D32); padding: 30px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">DRAVANUA HUB</h1>
    <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 2px;">Official Correspondence</p>
  </div>

  <div style="padding: 40px 35px; line-height: 1.7; color: #1e293b;">
    <h2 style="color: #1B5E20; margin-top: 0; font-size: 20px; font-weight: 800;">${composeData.subject}</h2>

    <div style="margin: 25px 0; font-size: 16px; color: #334155;">
      ${composeData.body.replace(/\n/g, '<br/>')}
    </div>

    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #1B5E20; margin-top: 30px;">
       <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600;">Broadcast Reference Context:</p>
       <p style="margin: 5px 0 0; font-size: 12px; color: #94a3b8;">Ref: DVS-COMMS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}</p>
    </div>

    <p style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 25px; font-size: 15px; color: #64748b;">
      Best regards,<br/>
      <strong style="color: #1B5E20;">Dravanua Hub Operations</strong>
    </p>
  </div>

  <div style="background: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
    <p style="margin: 5px 0;">DRAVANUA HUB • Fine Art, Studio & Creative Supplies</p>
    <p style="margin: 5px 0;">Kigali, Rwanda • info@dravanuahub.com</p>
    <p style="margin: 15px 0 0; font-size: 11px; opacity: 0.7;">This is an authorized institutional broadcast. Please do not share sensitive access tokens.</p>
  </div>
</div>
`
        : `<div>${composeData.body}</div>`;

      const response = await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/reports/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeData.to,
          subject: composeData.subject,
          htmlBody,
          moduleCode: 'MSG',
          departmentId: composeData.departmentId === 'all' ? null : composeData.departmentId
        })
      });

      if (response.ok) {
        alert(`Broadcast transmitted to ${composeData.to}`);
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '', isBranded: true, departmentId: 'all' });
        fetchMessages();
      }
    } catch (err) { alert('Network Error'); } finally { setIsReplying(false); }
  };

  const toggleStatus = async (id, newStatus) => {
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/contact/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchMessages();
      if (activeMessage?.id === id) setActiveMessage(prev => ({ ...prev, status: newStatus }));
    } catch (e) { alert('Status update failed'); }
  };

  const handleEditContent = async (id, currentContent) => {
    const newContent = window.prompt("Edit official archive content:", currentContent);
    if (!newContent || newContent === currentContent) return;
    try {
      await secureFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      fetchMessages();
      if (activeMessage?.id === id) setActiveMessage(prev => ({ ...prev, content: newContent }));
    } catch (e) { alert('Archive update failed'); }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesInbox = inboxFilter === 'all' || (inboxFilter === 'urgent' && msg.urgent) || (inboxFilter === 'replied' && msg.status === 'replied') || (inboxFilter === 'pending' && msg.status === 'pending');
    const matchesSearch = (msg.senderName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (msg.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesInbox && matchesSearch;
  });

  const pendingCount = messages.filter(m => m.status === 'pending').length;
  const repliedCount = messages.filter(m => m.status === 'replied').length;

  if (loading) {
    return (
      <div className="admin-page center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#1B5E20' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fadeIn">
      <Header title="Communications Center" subtitle="Manage client engagement, internal messaging, and organizational archives." />

      {/* Summary Cards */}
      <div className="admin-card" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>TOTAL MESSAGES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{messages.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>PENDING RESPONSE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{pendingCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>REPLIED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#A5D6A7' }}>{repliedCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.05em' }}>FILTERED VIEW</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{filteredMessages.length}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="admin-search-wrapper" style={{ width: '280px', height: '44px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontWeight: 700 }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {['all', 'pending', 'replied'].map(f => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    background: inboxFilter === f ? '#1B5E20' : '#f8fafc',
                    color: inboxFilter === f ? 'white' : '#64748b',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    borderColor: inboxFilter === f ? '#1B5E20' : '#e2e8f0'
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowBalances(!showBalances)}
              style={{
                padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
              {showBalances ? 'Hide' : 'Show'}
            </button>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="btn btn-primary"
              style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> New Message
            </button>
          </div>
        </div>
      </div>

      {/* Main Messages Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', height: 'calc(100vh - 320px)' }}>
        {/* Sidebar - Message List */}
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px' }}>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              COMMUNICATION ARCHIVE
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>
              {filteredMessages.length} MESSAGE{filteredMessages.length !== 1 ? 'S' : ''}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredMessages.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                <Mail size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No messages found</p>
              </div>
            ) : filteredMessages.map((msg, idx) => (
              <div
                key={msg.id}
                onClick={() => { setActiveMessage(msg); if (!msg.isRead) markAsRead(msg.id); }}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #f1f5f9',
                  background: activeMessage?.id === msg.id ? '#f8fafc' : (idx % 2 === 0 ? 'white' : '#fafcfb'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  borderLeft: activeMessage?.id === msg.id ? '4px solid #1B5E20' : '4px solid transparent'
                }}
                className="hover-row"
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: msg.senderName === 'SYSTEM BROADCAST' ? '#64748b' : 'linear-gradient(135deg, #1B5E20, #32CD32)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {msg.senderImage ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}${msg.senderImage}`} alt="S" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    msg.senderName === 'SYSTEM BROADCAST' ? <Send size={16} /> : (msg.senderName?.charAt(0) || '?')
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: msg.senderName === 'SYSTEM BROADCAST' ? '#64748b' : '#1e293b' }}>
                      {msg.senderName === 'SYSTEM BROADCAST' ? 'OUTBOUND' : msg.senderName}
                    </div>
                    {msg.status === 'pending' ? (
                      <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 800, whiteSpace: 'nowrap' }}>PENDING</span>
                    ) : (
                      <span style={{ fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: 800, whiteSpace: 'nowrap' }}>REPLIED</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{msg.subject}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Message Detail */}
        <div style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column' }}>
          {activeMessage ? (
            <>
              {/* Message Header */}
              <div style={{ background: 'linear-gradient(135deg, #0D3B0D, #1B5E20)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #1B5E20, #32CD32)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      overflow: 'hidden'
                    }}
                  >
                    {activeMessage.senderImage ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL}${activeMessage.senderImage}`} alt="S" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      activeMessage.senderName?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 900, color: 'white' }}>{activeMessage.subject}</h2>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>From: {activeMessage.senderName} ({activeMessage.senderEmail})</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleDelete(activeMessage.id)} className="btn" style={{ padding: '6px 10px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => toggleStatus(activeMessage.id, 'replied')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', background: activeMessage.status === 'replied' ? '#dcfce7' : '#1B5E20', color: activeMessage.status === 'replied' ? '#166534' : 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                  <CheckCircle size={14} /> MARK REPLIED
                </button>
                <button onClick={() => toggleStatus(activeMessage.id, 'pending')} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', background: activeMessage.status === 'pending' ? '#fef3c7' : '#f8fafc', color: activeMessage.status === 'pending' ? '#92400e' : '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                  <Clock size={14} /> SET PENDING
                </button>
                <button onClick={() => handleEditContent(activeMessage.id, activeMessage.content)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', color: '#1B5E20', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                  <FileText size={14} /> EDIT
                </button>
              </div>

              {/* Message Content */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem', lineHeight: '1.6', color: '#1e293b', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {activeMessage.content}
                </div>
                {activeMessage.replyContent && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: '#1B5E20', color: 'white', padding: '1.5rem', borderRadius: '12px', maxWidth: '80%', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {activeMessage.replyContent}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Section */}
              {activeMessage.status === 'pending' && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', background: 'white' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Response Message</label>
                  <textarea
                    disabled={isReplying}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      borderRadius: '12px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      resize: 'vertical'
                    }}
                    placeholder="Compose your response..."
                  />
                  <button
                    onClick={handleReply}
                    disabled={isReplying || !replyText}
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#1B5E20',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: isReplying || !replyText ? 'not-allowed' : 'pointer',
                      opacity: isReplying || !replyText ? 0.6 : 1
                    }}
                  >
                    {isReplying ? (
                      <>
                        <Loader2 size={16} className="spin" /> SENDING...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> SEND RESPONSE
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#cbd5e1' }}>
              <MessageCircle size={56} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>Select a message to view</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '900px', width: '95%', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: 'linear-gradient(135deg, #1B5E20, #32CD32)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Send size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>New Message Broadcast</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#e2e8f0' }}>Compose and send organizational communications</p>
                </div>
              </div>
              <button onClick={() => setIsComposeOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>

            <div style={{ display: 'flex', background: '#f8fafc', flex: 1, overflow: 'hidden' }}>
              {/* Staff Directory Panel */}
              <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Organization Directory</h4>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  {teamMembers.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>Loading directory...</div>
                  ) : teamMembers.map(staff => (
                    <div
                      key={staff.id}
                      onClick={() => setComposeData({ ...composeData, to: staff.email, departmentId: staff.departmentId || 'all' })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: composeData.to === staff.email ? '#ecfdf5' : 'transparent',
                        border: composeData.to === staff.email ? '1px solid #10b981' : '1px solid transparent'
                      }}
                      className="hover-row"
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: composeData.to === staff.email ? '#065f46' : '#1e293b' }}>{staff.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{staff.role.replace('_', ' ').toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compose Area */}
              <div style={{ flex: 1, padding: '1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Recipient Email</label>
                    <input
                      type="email"
                      value={composeData.to}
                      onChange={e => setComposeData({ ...composeData, to: e.target.value })}
                      placeholder="Select from directory..."
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#1B5E20'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Department Scope</label>
                    <select
                      value={composeData.departmentId}
                      onChange={(e) => setComposeData({ ...composeData, departmentId: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', background: 'white', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = '#1B5E20'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="all">Global Broadcast</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Message Subject</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                    placeholder="Subject line..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#1B5E20'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Message Content</label>
                  <textarea
                    value={composeData.body}
                    onChange={e => setComposeData({ ...composeData, body: e.target.value })}
                    placeholder="Compose your message..."
                    style={{ width: '100%', flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', resize: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#1B5E20'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button
                    onClick={() => setIsComposeOpen(false)}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', color: '#1e293b' }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSendNewEmail}
                    disabled={isReplying || !composeData.to || !composeData.subject || !composeData.body}
                    style={{
                      background: '#1B5E20',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: isReplying ? 'not-allowed' : 'pointer',
                      opacity: isReplying ? 0.7 : 1
                    }}
                  >
                    {isReplying ? (
                      <>
                        <Loader2 size={16} className="spin" /> SENDING...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> SEND BROADCAST
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '16px', border: '4px solid white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImage(null)}
            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={24} />
          </button>
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

export default MessageCenter;