import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EduVerificationModal({ isOpen, onClose }) {
  const { sendEduOtp, verifyEduOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await sendEduOtp(email);
      setDemoCode(res.demoOtp || '');
      setPreviewUrl(res.previewUrl || '');
      setStep('otp');
      setSuccess('Verification code generated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEduOtp(otp);
      setSuccess('Verified successfully! Your student status is active.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
        >
          ×
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              One-Time College Verification
            </h2>
            <p className="text-xs text-slate-400">Zero-Knowledge Student Authentication</p>
          </div>
        </div>

        {/* Privacy Callout */}
        <div className="p-3.5 mb-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
            <Lock size={13} className="text-indigo-500" />
            <span>Privacy Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Your email is used <strong>once</strong> to verify you are a genuine college student, then permanently deleted. Only an irreversible SHA-256 hash is kept to prevent duplicate accounts. Confessions remain 100% anonymous.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Sparkles size={15} />
            <span>{success}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                College Edu Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. 21bce123@atria.edu"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Accepted domains: @atria.edu, @atriadigitalcampus.com, or college domains.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEmail('neelkumar.gupta@atria.edu')}
                className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
              >
                Use Demo Atria Email
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Generating Code...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Enter 6-Digit Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 482917"
                  className="w-full pl-10 pr-4 py-2.5 text-sm tracking-widest font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              {previewUrl && (
                <div className="mt-2 text-center">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold underline hover:text-indigo-800"
                  >
                    View Test Email in Web Inbox ↗
                  </a>
                </div>
              )}
              {demoCode && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <span>Demo Code for Lab: <strong>{demoCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp(demoCode)}
                    className="underline text-[10px] font-bold"
                  >
                    Auto-fill
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Complete Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
