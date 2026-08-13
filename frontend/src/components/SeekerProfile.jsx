import React, { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, Award, BookOpen, Clock, Code } from 'lucide-react';

export default function SeekerProfile({ seekerProfile, onUploadResume }) {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [localProfile, setLocalProfile] = useState(seekerProfile || {});

  const parsed = localProfile.parsed_profile || {
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    experience_years: 4,
    education: 'B.S. Computer Science',
    summary: 'Full Stack Engineer with 4 years building web services.'
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      const res = await onUploadResume(resumeText);
      if (res && res.parsedProfile) {
        setLocalProfile({
          ...localProfile,
          parsed_profile: res.parsedProfile
        });
        alert('Resume parsed & skills extracted successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const currentSkills = parsed.skills || [];
    if (!currentSkills.includes(newSkill.trim())) {
      const updated = {
        ...parsed,
        skills: [...currentSkills, newSkill.trim()]
      };
      setLocalProfile({ ...localProfile, parsed_profile: updated });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    const updated = {
      ...parsed,
      skills: (parsed.skills || []).filter(s => s !== skillToRemove)
    };
    setLocalProfile({ ...localProfile, parsed_profile: updated });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your Candidate Profile & Resume NLP</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload your resume text or PDF to automatically extract your skills, experience, and education for insider matching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Upload Resume / Raw Text Parser */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            Resume Upload & NLP Parser
          </h3>

          <form onSubmit={handleResumeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Paste Resume Plain Text (or PDF text)
              </label>
              <textarea
                rows="8"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here (e.g. David Kim, Senior Software Engineer with 5 years experience in React, Node.js, PostgreSQL, Docker...)"
                className="w-full p-3 rounded-xl glass-input text-xs font-mono text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !resumeText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? (
                <span>Parsing with NLP engine...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Skills & Parse Resume</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Parsed Profile Preview */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Extracted Profile Metadata
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Profile Match Active
            </span>
          </div>

          {/* Experience & Education Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-indigo-400" /> Experience
              </span>
              <p className="text-lg font-bold text-white mt-1">
                {parsed.experience_years} Years
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Education
              </span>
              <p className="text-xs font-semibold text-white mt-2 truncate">
                {parsed.education}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Professional Summary
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              {parsed.summary}
            </p>
          </div>

          {/* Skills Management */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Extracted Skill Badges
            </span>

            <div className="flex flex-wrap gap-2 mb-3">
              {(parsed.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                >
                  <Code className="w-3 h-3 text-indigo-400" />
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-rose-400 text-slate-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add Custom Skill */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add custom skill (e.g. Kubernetes, PyTorch)..."
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-white"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Add Skill
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
