import React, { useState, useEffect } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, Award, BookOpen, Clock, Code, Phone, MapPin, User, FileCheck, AlertTriangle } from 'lucide-react';

export default function SeekerProfile({ seekerProfile, onUploadResume }) {
  const [fullName, setFullName] = useState(seekerProfile?.name || '');
  const [phone, setPhone] = useState(seekerProfile?.user_phone || seekerProfile?.phone || '');
  const [location, setLocation] = useState(seekerProfile?.location || 'San Francisco, CA');
  const [expYears, setExpYears] = useState(seekerProfile?.parsed_profile?.experience_years || 3);
  const [headline, setHeadline] = useState(seekerProfile?.headline || 'Senior Software Engineer');
  const [bio, setBio] = useState(seekerProfile?.bio || '');
  
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');

  const [localParsed, setLocalParsed] = useState(seekerProfile?.parsed_profile || {
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    experience_years: 3,
    education: 'B.S. Computer Science',
    summary: 'Driven software developer passionate about building scalable web applications.'
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (seekerProfile) {
      if (seekerProfile.name) setFullName(seekerProfile.name);
      if (seekerProfile.user_phone || seekerProfile.phone) setPhone(seekerProfile.user_phone || seekerProfile.phone);
      if (seekerProfile.location) setLocation(seekerProfile.location);
      if (seekerProfile.headline) setHeadline(seekerProfile.headline);
      if (seekerProfile.bio) setBio(seekerProfile.bio);
      if (seekerProfile.parsed_profile) {
        setLocalParsed(seekerProfile.parsed_profile);
        if (seekerProfile.parsed_profile.experience_years) setExpYears(seekerProfile.parsed_profile.experience_years);
      }
    }
  }, [seekerProfile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) return;

    // Strict 5MB file size check
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds the 5MB maximum limit. Please upload a smaller PDF resume.');
      setResumeFile(null);
      return;
    }

    // Strict PDF format check
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Invalid file type. Only PDF documents (.pdf) are allowed.');
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFileError('');

    try {
      const formData = new FormData();
      formData.append('name', fullName);
      formData.append('phone', phone);
      formData.append('location', location);
      formData.append('experience_years', expYears);
      formData.append('headline', headline);
      formData.append('bio', bio);
      formData.append('resumeText', resumeText);

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      // Perform upload
      const token = localStorage.getItem('referal_token');
      const res = await fetch('/api/seekers/resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      if (data.parsedProfile) {
        setLocalParsed(data.parsedProfile);
      }

      alert('Profile details & PDF resume updated successfully!');
    } catch (err) {
      setFileError(err.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const currentSkills = localParsed.skills || [];
    if (!currentSkills.includes(newSkill.trim())) {
      setLocalParsed({
        ...localParsed,
        skills: [...currentSkills, newSkill.trim()]
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setLocalParsed({
      ...localParsed,
      skills: (localParsed.skills || []).filter(s => s !== skillToRemove)
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Candidate Profile & PDF Resume</h1>
        <p className="text-sm text-slate-400 mt-1">
          Fill in your details manually and upload your PDF resume (Strictly max 5MB in English).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Manual Form & PDF Upload (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            Personal & Professional Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            
            {/* Full Name & Phone */}
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

            {/* Location & Experience Years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
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

            {/* Headline */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Full Stack Engineer | React, Node.js, PostgreSQL"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
              />
            </div>

            {/* Strict PDF Resume Upload Box */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Upload PDF Resume</span>
                <span className="text-[11px] text-emerald-400 font-medium">Strictly PDF • Max 5MB • English Only</span>
              </label>

              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-5 text-center transition-colors bg-slate-900/40">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-file-input"
                />
                <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center">
                  <FileCheck className="w-8 h-8 text-indigo-400 mb-2" />
                  <span className="text-xs font-semibold text-white">
                    {resumeFile ? resumeFile.name : 'Click to browse or drop your PDF resume here'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all mt-4"
            >
              {loading ? (
                <span>Saving Details & Parsing PDF...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Details & Update Profile</span>
                </>
              )}
            </button>

          </form>

        </div>

        {/* Right Column: AI Extracted Metadata & Skills Preview (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Live Candidate Badge
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Match Profile
            </span>
          </div>

          <div className="space-y-4 text-xs">
            
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block">Full Name & Contact:</span>
              <p className="text-sm font-bold text-white">{fullName || 'Candidate Name'}</p>
              <p className="text-slate-300 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-indigo-400" /> {phone || 'Not provided'}
              </p>
              <p className="text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {location || 'Remote'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Total Experience:</span>
              <span className="text-base font-extrabold text-emerald-400">{expYears} Years</span>
            </div>

            {/* Extracted Skills List */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">Skill Badges for AI Matching</span>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(localParsed.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
                  >
                    <Code className="w-3 h-3 text-indigo-400" />
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-rose-400 text-slate-500 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add custom skill (e.g. AWS, GraphQL)..."
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-xs text-white"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
