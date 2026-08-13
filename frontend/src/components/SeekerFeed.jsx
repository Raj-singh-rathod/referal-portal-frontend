import React, { useState } from 'react';
import { Sparkles, Building2, MapPin, Briefcase, CheckCircle, ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';

export default function SeekerFeed({ feedItems, currentUser, onRequestReferral, onRequestSuccess }) {
  const [loadingId, setLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');

  const filteredItems = feedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.required_skills && item.required_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCompany = companyFilter === 'ALL' || item.company.name === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const companiesList = Array.from(new Set(feedItems.map(i => i.company.name)));

  const handleRequest = async (item) => {
    if (!currentUser) {
      alert('Please sign in or register as a Job Seeker to request free referrals!');
      return;
    }
    if (currentUser.role !== 'job_seeker') {
      alert('Only Job Seekers can request referrals. Use the Quick Switcher in the top right to test as a Job Seeker!');
      return;
    }

    setLoadingId(item.id);
    try {
      await onRequestReferral(item.posting_id);
    } catch (err) {
      alert(err.message || 'Error requesting referral');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="relative glass-card rounded-3xl p-8 mb-10 overflow-hidden border border-indigo-500/20">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Guaranteed 100% Free — Zero Subscriptions & No Request Limits</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Get Referred Directly by Verified Insiders at Top Tech Companies
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Skip the ATS black hole. Connect with employees at Stripe, Google, Meta, and more who review your fit score and submit your resume internally.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by job title, skill (e.g. React, Node.js), or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-400"
            />
          </div>
          <div className="sm:w-56">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-slate-200"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Companies</option>
              {companiesList.map(c => (
                <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Referral Cards Feed (Refer.me style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const match = item.match_score || 80;
          const isRequested = item.request_status !== null;

          return (
            <div
              key={item.id}
              className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border border-slate-800"
            >
              {/* Top Row: Insider Badge + Match % Circular/Badge */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={item.insider.avatar_url}
                        alt={item.insider.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500/50"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0b0f19] flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Referral Insider</p>
                      <h4 className="text-sm font-semibold text-white leading-tight">
                        via {item.insider.name}
                      </h4>
                      <p className="text-[11px] text-indigo-300 font-medium">{item.insider.role}</p>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex flex-col items-end">
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                      match >= 85
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : match >= 70
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{match}% Match</span>
                    </div>
                  </div>
                </div>

                {/* Posting Info */}
                <div className="mt-5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{item.company.name}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {item.company.ats_type === 'none' ? 'Direct Portal' : `${item.company.ats_type} ATS`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white hover:text-indigo-300 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      {item.employment_type}
                    </span>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(item.required_skills || []).slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                  {(item.required_skills || []).length > 4 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400">
                      +{(item.required_skills || []).length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Action Row */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Free Referral
                </span>

                <button
                  disabled={isRequested || loadingId === item.id}
                  onClick={() => handleRequest(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    isRequested
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-105'
                  }`}
                >
                  {loadingId === item.id ? (
                    <span>Submitting...</span>
                  ) : isRequested ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="capitalize">{item.request_status}</span>
                    </>
                  ) : (
                    <>
                      <span>Request Referral</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
