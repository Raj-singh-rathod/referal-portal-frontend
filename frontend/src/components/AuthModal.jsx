import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Building2, User, Sparkles, X, Briefcase, UserCheck, Phone } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, initialRole = 'job_seeker', companies = [] }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  if (!isOpen) return null;

  const isEmployeeMode = role === 'employee';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginTab) {
        await onLogin({ email, password });
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
      }
      onClose();
    } catch (err) {
      alert(err.message || 'Authentication failed');
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
              isEmployeeMode ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isEmployeeMode ? <Briefcase className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {isLoginTab ? 'Sign In to ReferralConnect' : isEmployeeMode ? 'Give Referral (Insider / HR)' : 'Take Referral (Job Seeker)'}
              </h2>
              <p className="text-xs text-slate-400">
                {isLoginTab ? 'Access your account' : isEmployeeMode ? 'Post jobs & refer candidates' : 'Request free employee referrals'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Tab Switcher */}
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

        <form onSubmit={handleSubmit} className="space-y-4">

          {!isLoginTab && (
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

          {/* Mandatory Phone Number for Job Seeker */}
          {!isLoginTab && !isEmployeeMode && (
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
            />
          </div>

          {/* Employee/HR specific fields */}
          {!isLoginTab && isEmployeeMode && (
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
              isEmployeeMode
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-600/30'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/30'
            }`}
          >
            {loading ? 'Authenticating...' : isLoginTab ? 'Sign In' : isEmployeeMode ? 'Register as Insider / HR' : 'Register as Job Seeker'}
          </button>
        </form>

      </div>
    </div>
  );
}
