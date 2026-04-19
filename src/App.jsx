import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import LanguageSwitcher from './components/LanguageSwitcher';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';

// Admin imports
import Login from './admin/Login';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import ManageUsers from './admin/ManageUsers';
import ManageModules from './admin/ManageModules';
import Performance from './admin/Performance';
import AttendanceLog from './admin/AttendanceLog';
import ManageGallery from './admin/ManageGallery';
import MessageCenter from './admin/MessageCenter';
import ManageCustomers from './admin/ManageCustomers';
import BusinessAnalytics from './admin/BusinessAnalytics';
import ManageBookings from './admin/ManageBookings';
import FinancialManagement from './admin/FinancialManagement';
import ManageDropbox from './admin/ManageDropbox';
import ManageReceipts from './admin/ManageReceipts';
import Signup from './admin/Signup';
import ForgotPassword from './admin/ForgotPassword';
import DailyOperations from './admin/DailyOperationsManagement';
import ManageSubscriptions from './admin/ManageSubscriptions';
import ManageReminders from './admin/ManageReminders';
import StaffIDCardGenerator from './admin/StaffIDCardGenerator';
import PayrollManagement from './admin/PayrollManagement';
import OrganizationalFinance from './admin/OrganizationalFinance';

// Customer imports
import CustomerLogin from './customer/CustomerLogin';
import CustomerSignup from './customer/CustomerSignup';
import CustomerDashboard from './customer/CustomerDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

function AppContent() {
  const { user: adminUser, login: handleLogin, logout: handleLogout } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/*"
        element={
          <div className="page-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />

                {/* Auth Public Routes within Public Layout */}
                <Route path="/admin/signup" element={<Signup />} />
                <Route path="/admin/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/admin/login"
                  element={
                    adminUser
                      ? <Navigate to="/admin/dashboard" replace />
                      : <Login onLogin={handleLogin} />
                  }
                />
              </Routes>
            </main>
            <Footer />
            <WhatsAppFloat />
            <LanguageSwitcher />
          </div>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          adminUser
            ? <AdminLayout onLogout={handleLogout} user={adminUser} />
            : <Navigate to="/admin/login" replace />
        }
      >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="modules" element={<ManageModules />} />
          <Route path="performance" element={<Performance />} />
          <Route path="attendance" element={<AttendanceLog />} />
          <Route path="gallery-admin" element={<ManageGallery />} />
          <Route path="messages-admin" element={<MessageCenter />} />
          <Route path="customers" element={<ManageCustomers />} />
          <Route path="vault" element={<ManageDropbox />} />
          <Route path="dropbox" element={<ManageReceipts />} />
          <Route path="analytics" element={<BusinessAnalytics />} />
          <Route path="finance" element={<FinancialManagement />} />
          <Route path="operations" element={<DailyOperations />} />
          <Route path="subscriptions" element={<ManageSubscriptions />} />
          <Route path="reminders" element={<ManageReminders />} />
          <Route path="id-cards" element={<StaffIDCardGenerator />} />
          <Route path="payroll" element={<PayrollManagement />} />
          <Route path="org-finance" element={<OrganizationalFinance />} />
        </Route>

        {/* Customer Portal Routes */}
        <Route path="/client/login" element={<CustomerLogin />} />
        <Route path="/client/signup" element={<CustomerSignup />} />
        <Route path="/client/dashboard" element={<CustomerDashboard />} />
      </Routes>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
