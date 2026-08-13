import React, { useState } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Lock, AlertTriangle, X } from 'lucide-react';

export default function AtsSettingsModal({ isOpen, onClose, companyInfo, onSaveAtsSettings }) {
  const [atsType, setAtsType] = useState(companyInfo?.ats_type || 'greenhouse');
  const [apiKey, setApiKey] = useState('');
  const [portalUrl, setPortalUrl] = useState(companyInfo?.portal_url || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSaveAtsSettings({
        atsType,
        apiKey,
        portalUrl
      });
      alert('ATS Integration settings saved & API key encrypted at rest (AES-256)!');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save ATS settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-700">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ATS Plugin Adapter Configuration</h2>
              <p className="text-xs text-slate-400">Greenhouse Harvest API v3 & Lever API</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ATS Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select ATS Provider
            </label>
            <select
              value={atsType}
              onChange={(e) => setAtsType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
            >
              <option value="greenhouse" className="bg-slate-900">Greenhouse (Harvest API v3)</option>
              <option value="lever" className="bg-slate-900">Lever Opportunities API</option>
              <option value="none" className="bg-slate-900">None (Use Clipboard & Direct Portal Fallback)</option>
            </select>
          </div>

          {/* Encryption Note */}
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">AES-256-GCM Encryption at Rest</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                API keys are encrypted at rest using AES-256-GCM and never stored or logged in plain text.
              </p>
            </div>
          </div>

          {/* Greenhouse v3 note */}
          {atsType === 'greenhouse' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
              <strong>Greenhouse Note:</strong> Configured for Harvest API v3 with Basic Auth & rate limit throttling.
            </div>
          )}

          {/* API Key Input */}
          {atsType !== 'none' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {atsType === 'greenhouse' ? 'Greenhouse Harvest API Key' : 'Lever API Key'}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste API Key (encrypted at rest)..."
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
              />
            </div>
          )}

          {/* Portal Fallback URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Internal Company Referral Portal URL (Fallback)
            </label>
            <input
              type="url"
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              placeholder="https://company.com/careers/referral"
              className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white"
            />
          </div>

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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              {loading ? 'Encrypting & Saving...' : 'Save & Encrypt ATS Key'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
