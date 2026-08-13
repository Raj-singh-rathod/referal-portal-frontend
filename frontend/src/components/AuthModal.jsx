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
          <h2 className="text-xl font-extrabold text-white">
            {isLoginTab ? 'Welcome Back!' : role === 'employee' ? 'Join as Give Referral (Insider/HR)' : 'Join as Take Referral (Job Seeker)'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
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
          
          {/* Register role selector */}
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Account Goal</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    role === 'employee'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>Give Referral (Insider/HR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('job_seeker')}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    role === 'job_seeker'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Take Referral (Seeker)</span>
                </button>
              </div>
            </div>
          )}

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

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number <span className="text-emerald-400">*</span>
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

          {/* Role specific fields */}
          {!isLoginTab && role === 'employee' && (
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all mt-2"
          >
            {loading ? 'Authenticating...' : isLoginTab ? 'Sign In' : 'Create Free Account'}
          </button>
        </form>

      </div>
    </div>
  );
}
