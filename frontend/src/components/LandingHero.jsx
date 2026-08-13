import React from 'react';
import { Sparkles, UserCheck, Briefcase, ArrowRight, ShieldCheck, Zap, Award, Target, CheckCircle2, TrendingUp, Cpu, FileCheck } from 'lucide-react';

export default function LandingHero({ onSelectOption, currentUser }) {
  return (
    <div className="space-y-16 py-6">
      
      {/* Main Hero Header */}
      <div className="relative glass-card rounded-3xl p-8 sm:p-12 border border-indigo-500/20 overflow-hidden text-center max-w-6xl mx-auto">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>100% Free Platform • No Subscription Paywalls • AI Match Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Direct Employee Referrals Powered by <span className="bg-gradient-to-r from-indigo-400 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">AI Candidate Matching</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Connect job seekers directly with verified company insiders & HR recruiters at top companies. Skip the ATS black hole and get referred internally — completely free.
          </p>

          {/* TWO MAIN OPTIONS: GIVE REFERRAL & TAKE REFERRAL */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            
            {/* Option 1: Give Referral (Employees / HR) */}
            <div
              onClick={() => onSelectOption('give')}
              className="glass-card glass-card-hover rounded-2xl p-6 border border-indigo-500/40 text-left cursor-pointer group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 mb-2 inline-block">
                For Company Insiders & HR
              </span>
              <h3 className="text-xl font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                Give Referral
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Post internal job openings with AI JD parsing, view pre-ranked candidate fit scores, and refer top talent to your ATS or referral portal.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Post Job & Screen Candidates</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Option 2: Take Referral (Job Seekers) */}
            <div
              onClick={() => onSelectOption('take')}
              className="glass-card glass-card-hover rounded-2xl p-6 border border-emerald-500/40 text-left cursor-pointer group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 mb-2 inline-block">
                For Job Seekers
              </span>
              <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                Take Referral
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Upload your PDF resume, view your calculated match score % across active postings, and request free referrals from verified insiders.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Browse Jobs & Apply</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION: What We Do */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How ReferralConnect Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            A free, automated referral ecosystem designed to eliminate paid paywalls and connect talent with insiders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              1
            </div>
            <h4 className="text-base font-bold text-white">Verified Insider Network</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              We verify staff members and HR recruiters from top companies (Stripe, Google, Meta) ensuring seekers connect with genuine internal referrers.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              2
            </div>
            <h4 className="text-base font-bold text-white">AI JD & Resume Matching</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our intelligent engine parses candidate resumes against job descriptions, calculating an accurate 0–100% fit score automatically.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              3
            </div>
            <h4 className="text-base font-bold text-white">Automated ATS & Status Tracking</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              One-click referral submission directly integrates into Greenhouse or Lever ATS with real-time candidate status updates.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: Benefits of Finding Jobs Through ReferralConnect */}
      <div className="max-w-6xl mx-auto px-4 glass-card rounded-3xl p-8 sm:p-10 border border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Key Advantages & Benefits
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            Why Job Seekers & HR Recruiters Choose ReferralConnect
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white">100% Free Forever</h4>
            <p className="text-xs text-slate-400">
              No hidden fees, monthly subscriptions, or request caps like paid competitors.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <TrendingUp className="w-6 h-6 text-indigo-400 mb-2" />
            <h4 className="text-sm font-bold text-white">4x Higher Interview Rate</h4>
            <p className="text-xs text-slate-400">
              Internal referrals are prioritized by recruiters over generic ATS applications.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <Cpu className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="text-sm font-bold text-white">AI Candidate Screening for HR</h4>
            <p className="text-xs text-slate-400">
              HR recruiters save hundreds of manual review hours — candidates are pre-ranked by exact JD skill overlap %.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <FileCheck className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Real-Time Application Status</h4>
            <p className="text-xs text-slate-400">
              Track your referral journey from Applied ➔ Under Review ➔ Referred ➔ Interview ➔ Hired.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
