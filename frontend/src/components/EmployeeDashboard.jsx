import React, { useState } from 'react';
import { Plus, Sparkles, Building2, User, FileText, CheckCircle2, ExternalLink, Copy, Settings, Check, ChevronRight, Award } from 'lucide-react';

export default function EmployeeDashboard({
  dashboardItems = [],
  onOpenJdModal,
  onOpenAtsSettings,
  onReferCandidate,
  onUpdateStatus
}) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [fallbackModalData, setFallbackModalData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleReferClick = async (item) => {
    setLoadingId(item.id);
    try {
      const res = await onReferCandidate(item.id);
      if (res && res.result) {
        if (res.result.atsType === 'clipboard_fallback') {
          setFallbackModalData(res.result);
        } else {
          alert(`Success! Candidate referred to ATS (${res.result.atsType}). Referral ID: ${res.result.atsReferralId}`);
        }
      }
    } catch (err) {
      alert(err.message || 'Error processing referral');
    } finally {
      setLoadingId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-indigo-500/20">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Insider Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Employee Referral Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Review candidate applications ranked by AI match score and refer verified talent to your company.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenAtsSettings}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Configure ATS Integration</span>
          </button>

          <button
            onClick={onOpenJdModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Paste JD & Create Posting with AI</span>
          </button>
        </div>
      </div>

      {/* Applicant Table / Pipeline */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Applicant Candidates (Sorted by Match Score)
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{dashboardItems.length} Total Applicants</span>
        </div>

        {dashboardItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No applicant requests received yet. Click "Paste JD & Create Posting with AI" above to post an internal job!
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Job Role</th>
                  <th className="py-3 px-4">Match %</th>
                  <th className="py-3 px-4">Extracted Skills</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Referral Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {dashboardItems.map((item) => {
                  const match = item.match_score;
                  const isReferred = item.status === 'referred' || item.status === 'interview' || item.status === 'hired';

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      
                      {/* Candidate Name & Avatar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.candidate_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.candidate_name}`}
                            alt={item.candidate_name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-semibold text-white text-xs">{item.candidate_name}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{item.candidate_headline}</p>
                          </div>
                        </div>
                      </td>

                      {/* Job Role */}
                      <td className="py-4 px-4 font-medium text-slate-300">
                        {item.posting_title}
                      </td>

                      {/* Match Score Badge */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                          match >= 85
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : match >= 70
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {match}% Match
                        </span>
                      </td>

                      {/* Candidate Skills */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(item.candidate_skills || []).slice(0, 3).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="py-4 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                          className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg text-[11px] px-2 py-1"
                        >
                          <option value="applied">Applied</option>
                          <option value="under_review">Under Review</option>
                          <option value="referred">Referred</option>
                          <option value="interview">Interview</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedCandidate(item)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                            title="View Resume Summary"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={loadingId === item.id}
                            onClick={() => handleReferClick(item)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-all ${
                              isReferred
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            }`}
                          >
                            {loadingId === item.id ? (
                              <span>Processing...</span>
                            ) : isReferred ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Referred</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Refer Candidate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Candidate Details</h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex items-center space-x-3">
              <img
                src={selectedCandidate.candidate_avatar}
                alt={selectedCandidate.candidate_name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h4 className="font-bold text-white text-sm">{selectedCandidate.candidate_name}</h4>
                <p className="text-xs text-slate-400">{selectedCandidate.candidate_email}</p>
                <p className="text-[11px] text-indigo-300">{selectedCandidate.candidate_headline}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-400 font-semibold">Summary & Experience:</p>
              <p className="p-3 bg-slate-900/60 rounded-xl text-slate-300 border border-slate-800">
                {selectedCandidate.candidate_summary || 'Full Stack Engineer with 4+ years experience in software development.'}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold text-xs mb-1.5">Extracted Skills:</p>
              <div className="flex flex-wrap gap-1.5">
                {(selectedCandidate.candidate_skills || []).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Clipboard + Portal Redirect Overlay Modal */}
      {fallbackModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card rounded-2xl max-w-lg w-full p-6 space-y-5 border border-indigo-500/40">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Fallback Referral Workflow Ready!</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your company does not have an active Greenhouse or Lever API key connected. Candidate referral snippet is prepared below.
            </p>

            {/* Snippet box */}
            <div className="relative">
              <textarea
                readOnly
                rows="6"
                value={fallbackModalData.clipboardSnippet}
                className="w-full p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-300 border border-slate-800"
              />
              <button
                onClick={() => copyToClipboard(fallbackModalData.clipboardSnippet)}
                className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setFallbackModalData(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>

              <a
                href={fallbackModalData.portalUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setFallbackModalData(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
              >
                <span>Open Internal Company Referral Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
