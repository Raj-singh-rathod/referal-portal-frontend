import React, { useState } from 'react';
import { UserCheck, Shield, Briefcase, Bell, LogIn, LogOut, Sparkles, ChevronDown } from 'lucide-react';

export default function Navbar({ currentUser, activeTab, setActiveTab, onOpenAuth, onLogout, notifications = [], onMarkNotifRead }) {
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-slate-800 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                ReferralConnect
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Free
              </span>
            </div>
          </div>

          {/* Core Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            
            {/* Take Referral Option (Job Seekers) */}
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'feed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Take Referral (Browse Jobs)</span>
            </button>

            {/* Give Referral Option (Employees / HR) */}
            <button
              onClick={() => {
                if (currentUser && (currentUser.role === 'employee' || currentUser.role === 'admin')) {
                  setActiveTab('employee_dashboard');
                } else {
                  onOpenAuth('employee');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === 'employee_dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Give Referral (Post & Screen Talent)</span>
            </button>

            {/* Seeker Specific Tabs */}
            {currentUser && currentUser.role === 'job_seeker' && (
              <>
                <button
                  onClick={() => setActiveTab('seeker_profile')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'seeker_profile'
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My Resume & AI Profile
                </button>

                <button
                  onClick={() => setActiveTab('seeker_tracker')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'seeker_tracker'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Referral Status Tracker
                </button>
              </>
            )}

            {/* Admin Portal Tab */}
            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin_portal')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'admin_portal'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin Verification
              </button>
            )}
          </div>

          {/* User Profile & Notifications */}
          <div className="flex items-center space-x-3">

            {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                  className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors border border-slate-700/50"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Drawer */}
                {showNotifDrawer && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card rounded-2xl p-4 shadow-2xl z-50 border border-slate-700/80">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-400" /> Notifications
                      </h4>
                      <span className="text-xs text-slate-400">{unreadCount} unread</span>
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => onMarkNotifRead(notif.id)}
                            className={`p-3 rounded-xl transition-all cursor-pointer border ${
                              notif.read_at
                                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                                : 'bg-indigo-950/40 border-indigo-500/30 text-white shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-xs font-semibold">{notif.title}</p>
                              {!notif.read_at && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center space-x-3 bg-slate-900/80 p-1.5 pl-3 pr-2 rounded-2xl border border-slate-800">
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-indigo-500/50 object-cover"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-100">{currentUser.name}</p>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    {currentUser.role === 'employee' ? 'Insider / HR' : currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('job_seeker')}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}
