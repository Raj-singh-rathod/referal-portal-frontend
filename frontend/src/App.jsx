import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import SeekerFeed from './components/SeekerFeed';
import SeekerProfile from './components/SeekerProfile';
import SeekerTracker from './components/SeekerTracker';
import EmployeeDashboard from './components/EmployeeDashboard';
import JdPasteParserModal from './components/JdPasteParserModal';
import AtsSettingsModal from './components/AtsSettingsModal';
import AdminPortal from './components/AdminPortal';
import AuthModal from './components/AuthModal';
import { UserCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('landing');
  const [feedItems, setFeedItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [dashboardItems, setDashboardItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [companies, setCompanies] = useState([]);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('job_seeker');
  const [showJdModal, setShowJdModal] = useState(false);
  const [showAtsModal, setShowAtsModal] = useState(false);

  // Initial load
  useEffect(() => {
    fetchFeed();
    fetchCompanies();
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      if (currentUser.role === 'job_seeker') {
        fetchMyRequests();
        fetchSeekerProfile();
      } else if (currentUser.role === 'employee' || currentUser.role === 'admin') {
        fetchEmployeeDashboard();
      }
    }
  }, [currentUser]);

  const checkAuth = async () => {
    const token = localStorage.getItem('referal_token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.seeker) setSeekerProfile(data.seeker);
      }
    } catch (e) {}
  };

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('referal_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/referrals/feed', { headers });
      if (res.ok) {
        const data = await res.json();
        setFeedItems(data);
      }
    } catch (e) {}
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (e) {}
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('referal_token');
      const res = await fetch('/api/referrals/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (e) {}
  };

  const fetchEmployeeDashboard = async () => {
    try {
      const token = localStorage.getItem('referal_token');
      const res = await fetch('/api/referrals/employee-dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardItems(data);
      }
    } catch (e) {}
  };

  const fetchSeekerProfile = async () => {
    try {
      const token = localStorage.getItem('referal_token');
      const res = await fetch('/api/seekers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSeekerProfile(data);
      }
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('referal_token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {}
  };

  const handleOpenAuth = (role = 'job_seeker') => {
    setAuthModalRole(role);
    setShowAuthModal(true);
  };

  const handleSelectLandingOption = (option) => {
    if (option === 'give') {
      if (currentUser && (currentUser.role === 'employee' || currentUser.role === 'admin')) {
        setActiveTab('employee_dashboard');
      } else {
        handleOpenAuth('employee');
      }
    } else if (option === 'take') {
      setActiveTab('feed');
    }
  };

  // Quick Demo Role Switcher Helper
  const handleQuickSwitchRole = async (email) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('referal_token', data.token);
        setCurrentUser(data.user);
        if (data.user.role === 'job_seeker') setActiveTab('feed');
        else if (data.user.role === 'employee') setActiveTab('employee_dashboard');
        else if (data.user.role === 'admin') setActiveTab('admin_portal');
        fetchFeed();
      }
    } catch (e) {
      alert('Quick switch failed: ' + e.message);
    }
  };

  const handleLogin = async ({ email, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('referal_token', data.token);
    setCurrentUser(data.user);
    if (data.user.role === 'employee' || data.user.role === 'admin') {
      setActiveTab('employee_dashboard');
    } else {
      setActiveTab('feed');
    }
    fetchFeed();
  };

  const handleRegister = async (formPayload) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('referal_token', data.token);
    setCurrentUser(data.user);
    if (data.user.role === 'employee' || data.user.role === 'admin') {
      setActiveTab('employee_dashboard');
    } else {
      setActiveTab('feed');
    }
    fetchFeed();
  };

  const handleLogout = () => {
    localStorage.removeItem('referal_token');
    setCurrentUser(null);
    setActiveTab('landing');
  };

  // Submit Application modal action (Save profile details & Submit request)
  const handleSubmitApplication = async ({ jobPostingId, name, phone, location, experience_years, resumeFile }) => {
    const token = localStorage.getItem('referal_token');
    
    // Step 1: Upload PDF Resume & update profile details if provided
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('location', location);
    formData.append('experience_years', experience_years);
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    const updateRes = await fetch('/api/seekers/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const updateText = await updateRes.text();
    let updateData;
    try {
      updateData = JSON.parse(updateText);
    } catch(e) {
      throw new Error('Upload size exceeded Nginx limit. Please ensure file is a valid PDF under 5MB.');
    }

    if (!updateRes.ok) throw new Error(updateData.error || 'Failed to process resume');

    // Step 2: Submit referral request to insider
    const reqRes = await fetch('/api/referrals/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ jobPostingId })
    });

    const reqText = await reqRes.text();
    let reqData;
    try {
      reqData = JSON.parse(reqText);
    } catch(e) {
      throw new Error('Referral request error.');
    }

    if (!reqRes.ok) throw new Error(reqData.error || 'Failed to submit referral request');

    alert('Free Referral Request & PDF resume submitted successfully!');

    fetchFeed();
    fetchMyRequests();
    fetchNotifications();
    fetchSeekerProfile();
    return reqData;
  };

  // Employee actions
  const handleParseJd = async (rawJdText) => {
    const token = localStorage.getItem('referal_token');
    const res = await fetch('/api/jobs/parse-jd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rawJdText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Parse failed');
    return data;
  };

  const handlePublishPosting = async (postingPayload) => {
    const token = localStorage.getItem('referal_token');
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(postingPayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Publish failed');
    fetchFeed();
    fetchEmployeeDashboard();
    return data;
  };

  const handleReferCandidate = async (requestId) => {
    const token = localStorage.getItem('referal_token');
    const res = await fetch(`/api/referrals/${requestId}/refer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Refer action failed');
    fetchEmployeeDashboard();
    return data;
  };

  const handleUpdateStatus = async (requestId, status) => {
    const token = localStorage.getItem('referal_token');
    const res = await fetch(`/api/referrals/${requestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchEmployeeDashboard();
    }
  };

  const handleSaveAtsSettings = async (settings) => {
    const token = localStorage.getItem('referal_token');
    const companyId = currentUser?.employeeId ? 'comp_stripe' : 'comp_stripe';
    const res = await fetch(`/api/admin/companies/${companyId}/ats`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update ATS settings');
    return data;
  };

  const handleMarkNotifRead = async (notifId) => {
    const token = localStorage.getItem('referal_token');
    await fetch(`/api/notifications/${notifId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Quick Demo Switcher Bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-2 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Quick Role Testing Toolbar:</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuickSwitchRole('david.kim@gmail.com')}
              className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold"
            >
              Take Referral (David Kim)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('alex.chen@stripe.com')}
              className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold"
            >
              Give Referral (Stripe Alex Chen / HR)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('sarah.jenkins@google.com')}
              className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold"
            >
              Give Referral (Google Sarah / HR)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('admin@referalportal.com')}
              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
            >
              Admin (Elena)
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotifRead={handleMarkNotifRead}
      />

      {/* Dynamic Tab Content */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingHero
            onSelectOption={handleSelectLandingOption}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'feed' && (
          <SeekerFeed
            feedItems={feedItems}
            currentUser={currentUser}
            seekerProfile={seekerProfile}
            onSubmitApplication={handleSubmitApplication}
          />
        )}

        {activeTab === 'seeker_profile' && (
          <SeekerProfile
            seekerProfile={seekerProfile}
            onUploadResume={handleSubmitApplication}
          />
        )}

        {activeTab === 'seeker_tracker' && (
          <SeekerTracker
            myRequests={myRequests}
          />
        )}

        {activeTab === 'employee_dashboard' && (
          <EmployeeDashboard
            dashboardItems={dashboardItems}
            onOpenJdModal={() => setShowJdModal(true)}
            onOpenAtsSettings={() => setShowAtsModal(true)}
            onReferCandidate={handleReferCandidate}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'admin_portal' && (
          <AdminPortal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500 mt-12 glass-card">
        <p>© 2026 ReferralConnect — Completely Free Employee Referral & AI Screening Platform.</p>
        <p className="mt-1">Zero Paywalls for Seekers or Insiders • Greenhouse & Lever ATS Enabled</p>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        initialRole={authModalRole}
        companies={companies}
      />

      <JdPasteParserModal
        isOpen={showJdModal}
        onClose={() => setShowJdModal(false)}
        onParseJd={handleParseJd}
        onPublishPosting={handlePublishPosting}
      />

      <AtsSettingsModal
        isOpen={showAtsModal}
        onClose={() => setShowAtsModal(false)}
        onSaveAtsSettings={handleSaveAtsSettings}
      />

    </div>
  );
}
