import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, MessageCircle, Loader2 } from 'lucide-react';

const Contact = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    phone: '',
    service: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSending(true);
      const btn = document.getElementById('contact-submit-btn');
      if (btn) btn.disabled = true;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.service ? `Service Inquiry: ${formData.service}` : 'General Inquiry',
          message: `Client Phone: ${formData.phone || 'Not Provided'}\n\nClient Message:\n${formData.message}`
        })
      });
      
      const data = await response.json();
      if (data.success || response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', service: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert(data.message || 'Failed to send message. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An external server error occurred. Please try again.');
    } finally {
      setIsSending(false);
      const btn = document.getElementById('contact-submit-btn');
      if (btn) btn.disabled = false;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">Get In <span className="text-primary-dark">Touch</span></h1>
          <p className="page-description">
            Have a booking request or want to learn more about our services? We'd love to hear from you. Reach out via form, phone, or WhatsApp!
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            {/* Sidebar */}
            <div className="contact-sidebar">
              <div className="contact-info-card">
                <h3>Contact Information</h3>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <div className="contact-info-label">Our Location</div>
                    <div className="contact-info-value">Kigali, Rwanda 🇷🇼</div>
                    <a 
                      href="https://maps.app.goo.gl/GkErn7UAFp2yLxMg9" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="contact-map-link"
                      style={{ fontSize: '0.8rem', color: '#2d5a27', textDecoration: 'underline', marginTop: '4px', display: 'inline-block', fontWeight: 'bold' }}
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Phone size={22} />
                  </div>
                  <div>
                    <div className="contact-info-label">Phone Number</div>
                    <div className="contact-info-value">+250 795 520 554</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <Mail size={22} />
                  </div>
                  <div>
                    <div className="contact-info-label">Email Address</div>
                    <div className="contact-info-value">info@dravanuahub.com</div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="whatsapp-card">
                <h3>💬 Quick Order via WhatsApp</h3>
                <p>Click below to instantly start a conversation and book any of our services.</p>
                <a
                  href="https://wa.me/250795520554?text=Hello%20DRA%20VANUA%20HUB!%20I%20would%20like%20to%20book%20a%20service."
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp btn-full"
                  id="contact-whatsapp-btn"
                >
                  <MessageCircle size={20} />
                  Chat on WhatsApp
                </a>
              </div>

              {/* Removed Working Hours from sidebar */}
            </div>

            {/* Form */}
            <div className="contact-form-wrapper">
              {/* Short Communication Message */}
              <div style={{ marginBottom: '1rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>Send a Quick Inquiry</h3>
                <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                  Have a question or ready to book? Fill out this short form for rapid 24/7 communication.
                </p>
              </div>

              {submitted ? (
                <div className="contact-success">
                  <div className="contact-success-icon">
                    <CheckCircle size={80} />
                  </div>
                  <h2>Message Sent! 🌿</h2>
                  <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="btn btn-outline">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} id="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                        className="form-input"
                        id="contact-name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+250 7XX XXX XXX"
                        className="form-input"
                        id="contact-phone"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="form-input"
                        id="contact-email"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Service Needed</label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="form-input"
                        id="contact-service"
                      >
                        <option value="">Select a service</option>
                        <option value="studio">📸 Studio Photo</option>
                        <option value="Stationery & Office Supplies">📄 Stationery & Office Supplies</option>
                        <option value="Flower Gifts">💐 Flower Selling</option>
                        <option value="Classic Fashion">💍 Classic Fashion Styling</option>
                        <option value="other">Other / Custom</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      maxLength="250"
                      placeholder="Tell us about your needs — event date, type of service, budget, etc. (Max 250 characters)"
                      className="form-input"
                      id="contact-message"
                    ></textarea>
                    <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#999', marginTop: '2px' }}>
                      {formData.message.length}/250
                    </div>
                  </div>
                  <button type="submit" disabled={isSending} className="btn btn-primary btn-full" id="contact-submit-btn" style={{ marginTop: '0.25rem', padding: '0.65rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {isSending ? <><Loader2 size={18} className="spin-animation" /> Sending...</> : <>Send Message <Send size={18} /></>}
                  </button>
                </form>
              )}

              {/* 24/7 Availability Status */}
              <div style={{ 
                marginTop: '1.25rem', 
                paddingTop: '1rem', 
                borderTop: '1px solid #f0f0f0', 
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--primary-dark)',
                fontWeight: 800,
                letterSpacing: '0.05em'
              }}>
                <span style={{ fontSize: '1rem' }}>🕒</span> Open 24 Hours / 7 Days a Week
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
