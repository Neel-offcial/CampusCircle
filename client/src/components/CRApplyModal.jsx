import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function CRApplyModal({ isOpen, onClose, user, onApplied }) {
  if (!isOpen) return null;

  const [usn, setUsn] = useState('1AT24CS137');
  const [department, setDepartment] = useState(user?.department || 'Computer Science and Engineering');
  const [semester, setSemester] = useState(user?.semester || 'V');
  const [section, setSection] = useState(user?.section || 'C');
  const [reason, setReason] = useState('Elected as Section C Class Representative for lab batch coordination');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/admin/cr-apply', {
        usn,
        department,
        semester,
        section,
        reason
      });

      setSuccess(true);
      if (onApplied) onApplied(res.data.application);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Apply for Class Representative (CR)
            </h3>
            <p className="text-[11px] text-slate-400">Section Coordinator Privileges</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          CRs receive edit access <strong>strictly limited to their own section</strong> to update upcoming Lab IA batch dates, announce test portions, and coordinate class notices.
        </p>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/60">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 animate-bounce" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Application Submitted!</h4>
            <p className="text-xs text-slate-500">
              Your request has been routed to <strong>Super Admin Neel</strong> for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                College USN
              </label>
              <input
                type="text"
                required
                value={usn}
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                placeholder="e.g. 1AT24CS137"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-100 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="Computer Science and Engineering">CSE</option>
                  <option value="Information Science and Engineering">ISE</option>
                  <option value="Artificial Intelligence and Machine Learning">AIML</option>
                  <option value="Electronics and Communication Engineering">ECE</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Section & Sem
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="V">Sem V</option>
                    <option value="III">Sem III</option>
                    <option value="VII">Sem VII</option>
                  </select>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-16 px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="C">Sec C</option>
                    <option value="A">Sec A</option>
                    <option value="B">Sec B</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Note for Verification
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason or role confirmation..."
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit to Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
