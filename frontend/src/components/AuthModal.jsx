import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Building2, User, Sparkles, X, Briefcase, UserCheck, Phone, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, initialRole = 'job_seeker', companies = [] }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [viewMode, setViewMode] = useState('auth'); // 'auth' | 'forgot_email' | 'reset_password'
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Remote');
  const [companyId, setCompanyId] = useState(companies[0]?.id || 'comp_stripe');
  const [jobTitle, setJobTitle] = useState('Senior Software Engineer / HR');
  const [department, setDepartment] = useState('Engineering / Recruitment');
  const [headline, setHeadline] = useState('');
  
  // Forgot Password state
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  if (!isOpen) return null;

  const isEmployeeMode = role === 'employee';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInfoMessage('');

    try {
      if (viewMode === 'forgot_email') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to request reset OTP');

        setInfoMessage(`OTP generated! Your 6-digit verification code is: ${data.resetOtp}`);
        setViewMode('reset_password');
      } else if (viewMode === 'reset_password') {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match. Please check and try again.');
        }

        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: resetOtp, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');

        alert(data.message || 'Password reset successfully!');
        setViewMode('auth');
        setIsLoginTab(true);
        setPassword('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else if (isLoginTab) {
        await onLogin({ email, password });
        onClose();
      } else {
        await onRegister({
          name,
          email,
          password,
          role,
          phone,
          location,
          companyId,
          jobTitle,
          department,
          headline
        });
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              viewMode !== 'auth'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : isEmployeeMode 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {viewMode !== 'auth' ? <KeyRound className="w-5 h-5" /> : isEmployeeMode ? <Briefcase className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {viewMode === 'forgot_email' 
                  ? 'Forgot Password?' 
                  : viewMode === 'reset_password' 
                  ? 'Reset Password' 
                  : isLoginTab 
                  ? 'Sign In to ReferralConnect' 
                  : isEmployeeMode 
                  ? 'Give Referral (Insider / HR)' 
                  : 'Take Referral (Job Seeker)'}
              </h2>
              <p className="text-xs text-slate-400">
                {viewMode === 'forgot_email' 
                  ? 'Enter your registered email to receive an OTP' 
                  : viewMode === 'reset_password' 
                  ? 'Enter the 6-digit OTP and your new password' 
                  : isLoginTab 
                  ? 'Access your account' 
                  : isEmployeeMode 
                  ? 'Post jobs & refer candidates' 
                  : 'Request free employee referrals'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Tab Switcher (Only in main auth mode) */}
        {viewMode === 'auth' ? (
          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsLoginTab(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLoginTab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLoginTab(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLoginTab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Free Account
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode('auth')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Registration specific full name */}
          {viewMode === 'auth' && !isLoginTab && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          )}

          {/* Email input for auth or forgot password */}
          {viewMode !== 'reset_password' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          )}

          {/* Mandatory Phone Number for Job Seeker Registration */}
          {viewMode === 'auth' && !isLoginTab && !isEmployeeMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-emerald-400 text-[11px] font-medium">Required for Job Seekers</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          )}

          {/* Sign In / Sign Up Password */}
          {viewMode === 'auth' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {isLoginTab && (
                  <button
                    type="button"
                    onClick={() => { setViewMode('forgot_email'); setInfoMessage(''); }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          )}

          {/* Reset Password Form Fields */}
          {viewMode === 'reset_password' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Verification OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-center font-bold tracking-widest text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </>
          )}

          {/* Employee/HR specific fields */}
          {viewMode === 'auth' && !isLoginTab && isEmployeeMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                >
                  <option value="comp_stripe" className="bg-slate-900">Stripe (stripe.com)</option>
                  <option value="comp_google" className="bg-slate-900">Google (google.com)</option>
                  <option value="comp_meta" className="bg-slate-900">Meta (meta.com)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Job Title (HR or Insider Role)</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Technical Recruiter / Staff Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all mt-2 text-white ${
              viewMode === 'forgot_email' || viewMode === 'reset_password'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/30'
                : isEmployeeMode
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/30'
            }`}
          >
            {loading
              ? 'Processing...'
              : viewMode === 'forgot_email'
              ? 'Send Reset OTP Code'
              : viewMode === 'reset_password'
              ? 'Update & Save New Password'
              : isLoginTab
              ? 'Sign In'
              : isEmployeeMode
              ? 'Register as Insider / HR'
              : 'Register as Job Seeker'}
          </button>
        </form>

      </div>
    </div>
  );
}

