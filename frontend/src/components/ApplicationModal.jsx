import React, { useState, useEffect } from 'react';
import { Sparkles, Building2, UserCheck, FileCheck, Phone, MapPin, X, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ApplicationModal({ isOpen, onClose, posting, currentUser, seekerProfile, onSubmitApplication }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Remote');
  const [expYears, setExpYears] = useState(3);
  const [resumeFile, setResumeFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setFullName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
    if (seekerProfile) {
      if (seekerProfile.name) setFullName(seekerProfile.name);
      if (seekerProfile.phone || seekerProfile.user_phone) setPhone(seekerProfile.phone || seekerProfile.user_phone);
      if (seekerProfile.location) setLocation(seekerProfile.location);
      if (seekerProfile.parsed_profile && seekerProfile.parsed_profile.experience_years) {
        setExpYears(seekerProfile.parsed_profile.experience_years);
      }
    }
  }, [currentUser, seekerProfile, isOpen]);

  if (!isOpen || !posting) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) return;

    // Strict 5MB file size limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds the maximum limit of 5MB.');
      setResumeFile(null);
      return;
    }

    // Strict PDF format limit
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Only PDF files (.pdf) are allowed.');
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFileError('');

    try {
      await onSubmitApplication({
        jobPostingId: posting.posting_id,
        name: fullName,
        phone: phone,
        location: location,
        experience_years: expYears,
        resumeFile: resumeFile
      });
      onClose();
    } catch (err) {
      setFileError(err.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-emerald-500/30 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Free Referral Application</h2>
              <p className="text-xs text-slate-400">Apply via Insider {posting.insider?.name} at {posting.company?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Posting Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
              Target Position
            </span>
            <h3 className="text-sm font-bold text-white">{posting.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{posting.company?.name}</span>
              <span>•</span>
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{posting.location}</span>
            </p>
          </div>
          
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
            {posting.match_score || 85}% Match
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="David Kim"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA / Remote"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Years of Experience</label>
              <input
                type="number"
                required
                min="0"
                max="40"
                value={expYears}
                onChange={(e) => setExpYears(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>
          </div>

          {/* Strict PDF Resume Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Upload PDF Resume</span>
              <span className="text-[11px] text-emerald-400 font-medium">Strictly PDF • Max 5MB • English Only</span>
            </label>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-5 text-center transition-colors bg-slate-900/40">
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="modal-pdf-file-input"
              />
              <label htmlFor="modal-pdf-file-input" className="cursor-pointer flex flex-col items-center">
                <FileCheck className="w-8 h-8 text-emerald-400 mb-1.5" />
                <span className="text-xs font-semibold text-white">
                  {resumeFile ? resumeFile.name : 'Click to select or drop your PDF resume here'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {resumeFile ? `${(resumeFile.size / (1024 * 1024)).toFixed(2)} MB PDF selected` : 'Only .PDF format accepted (Max 5MB)'}
                </span>
              </label>
            </div>

            {fileError && (
              <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
            >
              {loading ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <span>Submit Free Referral Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
