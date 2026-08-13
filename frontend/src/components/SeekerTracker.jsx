import React from 'react';
import { Clock, CheckCircle2, Building2, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

const STEPS = [
  { key: 'applied', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'referred', label: 'Referred' },
  { key: 'interview', label: 'Interview' },
  { key: 'hired', label: 'Hired' }
];

export default function SeekerTracker({ myRequests = [] }) {
  const getStepIndex = (status) => {
    if (status === 'rejected') return -1;
    const idx = STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Referral Request Tracking</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your referral progress across company insiders in real-time.
        </p>
      </div>

      {myRequests.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No active referral requests yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Head to the Match Feed to request free referrals from company insiders!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {myRequests.map((req) => {
            const currentStepIdx = getStepIndex(req.status);
            const isRejected = req.status === 'rejected';

            return (
              <div key={req.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-white">{req.company_name}</span>
                      <span>•</span>
                      <span>via Insider {req.employee_name} ({req.employee_role})</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{req.posting_title}</h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {req.match_score}% Match
                    </span>
                    {req.ats_referral_id && (
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        ATS ID: {req.ats_referral_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Stepper Progress */}
                {isRejected ? (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>This referral request was marked as Not Proceeding by the insider.</span>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="relative flex items-center justify-between">
                      
                      {/* Connecting line */}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-0">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                          style={{
                            width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%`
                          }}
                        ></div>
                      </div>

                      {/* Step Nodes */}
                      {STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isCompleted
                                  ? 'bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-[#0b0f19]'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[11px] font-medium mt-2 capitalize ${
                                isCurrent ? 'text-emerald-400 font-bold' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}

                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
