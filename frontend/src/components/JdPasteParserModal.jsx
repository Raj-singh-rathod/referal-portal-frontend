import React, { useState } from 'react';
import { Sparkles, CheckCircle2, FileText, Plus, X, Edit3, Briefcase } from 'lucide-react';

export default function JdPasteParserModal({ isOpen, onClose, onParseJd, onPublishPosting }) {
  const [step, setStep] = useState(1); // Step 1: Paste JD -> Step 2: Human-in-the-loop review/edit -> Step 3: Publish
  const [rawJdText, setRawJdText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const [extractedData, setExtractedData] = useState({
    job_title: '',
    company_name: '',
    required_skills: [],
    experience_min_years: 0,
    experience_max_years: 2,
    location: 'Remote',
    employment_type: 'Full-time',
    responsibilities: [],
    qualifications: []
  });

  if (!isOpen) return null;

  const handleParse = async (e) => {
    e.preventDefault();
    if (!rawJdText.trim()) return;
    setParsing(true);
    try {
      const res = await onParseJd(rawJdText);
      if (res && res.extractedFields) {
        setExtractedData(res.extractedFields);
        setStep(2); // Move to Human-in-the-loop review step
      }
    } catch (err) {
      alert(err.message || 'Error parsing JD text');
    } finally {
      setParsing(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublishPosting({
        title: extractedData.job_title,
        location: extractedData.location,
        employmentType: extractedData.employment_type,
        rawJdText: rawJdText,
        structuredFields: extractedData
      });
      alert('Job posting reviewed & published live!');
      onClose();
    } catch (err) {
      alert(err.message || 'Error publishing job posting');
    } finally {
      setPublishing(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setExtractedData({
      ...extractedData,
      required_skills: [...extractedData.required_skills, newSkill.trim()]
    });
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setExtractedData({
      ...extractedData,
      required_skills: extractedData.required_skills.filter(s => s !== skill)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Job Description Parser</h2>
              <p className="text-xs text-slate-400">Step {step} of 2: {step === 1 ? 'Paste Raw JD Text' : 'Human-in-the-Loop Field Review'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Paste Raw JD Text */}
        {step === 1 && (
          <form onSubmit={handleParse} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Paste Raw Job Description copied from your internal portal:
              </label>
              <textarea
                rows="10"
                value={rawJdText}
                onChange={(e) => setRawJdText(e.target.value)}
                placeholder="Stripe is looking for a Senior Backend Engineer to join the Financial Infrastructure team... Requirements: 4+ years Node.js, PostgreSQL, TypeScript, Redis..."
                className="w-full p-4 rounded-2xl glass-input text-xs font-mono text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={parsing || !rawJdText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
              >
                {parsing ? (
                  <span>Extracting with Ollama/AI LLM...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Structured Fields</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Human-in-the-loop review & edit pre-filled fields before publishing */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>AI Extraction Complete! Review & edit the pre-filled fields below before final publishing.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Job Title</label>
                <input
                  type="text"
                  value={extractedData.job_title || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, job_title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={extractedData.company_name || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, company_name: e.target.value })}
                  placeholder="e.g. Wyreflow Technologies"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={extractedData.location || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, location: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Min Experience (Years)</label>
                <input
                  type="number"
                  value={extractedData.experience_min_years}
                  onChange={(e) => setExtractedData({ ...extractedData, experience_min_years: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Employment Type</label>
                <input
                  type="text"
                  value={extractedData.employment_type || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, employment_type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>
            </div>

            {/* Skills Tag Management */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Required Skills (Matching Weights)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {extractedData.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-rose-400 text-slate-400">✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill tag..."
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-white"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Back to Raw Text
              </button>

              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
              >
                {publishing ? (
                  <span>Publishing & Triggering Matching Engine...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Publish Posting</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
