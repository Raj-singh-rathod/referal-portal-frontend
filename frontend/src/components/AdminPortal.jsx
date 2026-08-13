import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Building2, Users, FileText, Zap } from 'lucide-react';

export default function AdminPortal() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('referal_token');
      const res = await fetch('/api/admin/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      const token = localStorage.getItem('referal_token');
      const res = await fetch(`/api/admin/employees/${id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Employee Verification Management</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manual verification workflow for insider company staff accounts.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Insider Employees</p>
            <p className="text-xl font-bold text-white">{employees.length}</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Verified Staff</p>
            <p className="text-xl font-bold text-white">
              {employees.filter(e => e.verification_status === 'verified').length}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Pending Domain Approvals</p>
            <p className="text-xl font-bold text-white">
              {employees.filter(e => e.verification_status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Insider Employee Verification Directory</h3>

        {loading ? (
          <p className="text-xs text-slate-400">Loading directory...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-900/40">
                    <td className="py-4 px-4 font-semibold text-white">
                      {emp.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{emp.email}</span>
                    </td>
                    <td className="py-4 px-4">{emp.company_name} ({emp.company_domain})</td>
                    <td className="py-4 px-4">{emp.job_title}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        emp.verification_status === 'verified'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : emp.verification_status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {emp.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {emp.verification_status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleVerify(emp.id, 'verified')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerify(emp.id, 'rejected')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">No action required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
