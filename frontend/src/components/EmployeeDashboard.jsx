import React, { useState } from 'react';
import { Plus, Sparkles, Building2, User, FileText, CheckCircle2, Download, Phone, Mail, Settings, Check, Briefcase, Award } from 'lucide-react';

export default function EmployeeDashboard({
  dashboardItems = [],
  onOpenJdModal,
  onOpenAtsSettings,
  onReferCandidate,
  onUpdateStatus
}) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const getFullResumeUrl = (rawUrl) => {
    if (!rawUrl) return '/demo-resumes/resume.pdf';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    return rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  };

  const handleReferClick = async (item) => {
    setLoadingId(item.id);
    try {
      await onReferCandidate(item.id);
      onUpdateStatus(item.id, 'referred');
    } catch (err) {
      alert(err.message || 'Error processing referral');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-indigo-500/20">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Referrer Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Employee Referral Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Review candidate applications ranked by AI match score and download PDF resumes directly.
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
                  <th className="py-3 px-4">Candidate Contact</th>
                  <th className="py-3 px-4">Job Role & Company</th>
                  <th className="py-3 px-4">Match %</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Resume & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {dashboardItems.map((item) => {
                  const match = item.match_score || 80;
                  const isReferred = item.status === 'referred' || item.status === 'interview' || item.status === 'hired';
                  const expYears = item.candidate_exp_years !== undefined ? item.candidate_exp_years : (item.experience_years || 0);

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      
                      {/* Candidate Name & Contact Phone/Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.candidate_avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                            alt={item.candidate_name || 'Candidate'}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{item.candidate_name || 'David Kim'}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {item.candidate_email || 'candidate@gmail.com'}
                            </p>
                            <p className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3 text-indigo-400" />
                              {item.candidate_phone || item.phone || item.user_phone || 'Not Provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Job Role & Company Name */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-white text-xs">{item.posting_title || 'Data Analyst'}</p>
                          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-emerald-500" />
                            {item.posting_company_name || item.company_name || 'Wyreflow Technologies'}
                          </p>
                        </div>
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

                      {/* Experience */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700">
                          {expYears === 0 ? 'Fresher / 0 Yrs' : `${expYears} Yrs Exp`}
                        </span>
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

                      {/* Resume Download & Action Button */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          
                          {/* Direct PDF Resume Download */}
                          <a
                            href={item.candidate_resume || item.resume_url || '/demo-resumes/resume.pdf'}
                            download={`${(item.candidate_name || 'candidate').replace(/\s+/g, '_')}_resume.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            title="Download PDF Resume"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Resume PDF</span>
                          </a>

                          <button
                            onClick={() => setSelectedCandidate(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                            title="View Full Candidate Profile"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            disabled={loadingId === item.id || isReferred}
                            onClick={() => handleReferClick(item)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-all ${
                              isReferred
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
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
          <div className="glass-card rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Candidate Full Profile & Contact
              </h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="flex items-center space-x-4">
              <img
                src={selectedCandidate.candidate_avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                alt={selectedCandidate.candidate_name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40"
              />
              <div>
                <h4 className="font-bold text-white text-base">{selectedCandidate.candidate_name || 'David Kim'}</h4>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedCandidate.candidate_email || 'candidate@gmail.com'}
                </p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedCandidate.candidate_phone || selectedCandidate.phone || selectedCandidate.user_phone || 'Not Provided'}
                </p>
              </div>
            </div>

            {/* Candidate Metadata Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Match Score</p>
                <p className="text-sm font-bold text-emerald-400">{selectedCandidate.match_score || 85}% Match</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Experience</p>
                <p className="text-sm font-bold text-indigo-300">
                  {selectedCandidate.candidate_exp_years === 0 ? 'Fresher / 0 Yrs' : `${selectedCandidate.candidate_exp_years || 0} Years`}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-400 font-semibold">Headline & Summary:</p>
              <p className="p-3 bg-slate-900/60 rounded-xl text-slate-300 border border-slate-800 leading-relaxed">
                {selectedCandidate.candidate_headline || selectedCandidate.candidate_summary || 'Full Stack / Data Analyst candidate.'}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-semibold text-xs mb-1.5">Extracted Skills:</p>
              <div className="flex flex-wrap gap-1.5">
                {(selectedCandidate.candidate_skills || []).map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>

              <a
                href={selectedCandidate.candidate_resume || selectedCandidate.resume_url || '/demo-resumes/resume.pdf'}
                download={`${(selectedCandidate.candidate_name || 'candidate').replace(/\s+/g, '_')}_resume.pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Resume</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
