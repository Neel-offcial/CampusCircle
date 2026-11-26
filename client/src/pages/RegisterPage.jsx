import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Mail, AlertCircle, ArrowRight, CheckCircle2, RefreshCw, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1 = Details & Email, 2 = OTP Verification
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    department: 'Computer Science and Engineering',
    semester: 'V',
    section: 'C',
    batch: 'B1'
  });
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { initiateRegister, completeRegister } = useAuth();
  const navigate = useNavigate();

  // Step 1: Initiate Registration
  const handleInitiate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@atria.edu')) {
      setError('Registration is strictly restricted to official @atria.edu college emails (e.g. neel.21cs@atria.edu).');
      return;
    }

    if (!formData.username.trim() || !formData.fullName.trim() || !formData.password.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await initiateRegister({
        ...formData,
        email: cleanEmail
      });
      setDemoOtp(res.demoOtp || '');
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send verification code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Registration with OTP
  const handleComplete = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await completeRegister({
        email: formData.email.trim().toLowerCase(),
        otp: otp.trim()
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await initiateRegister({
        ...formData,
        email: formData.email.trim().toLowerCase()
      });
      setDemoOtp(res.demoOtp || '');
      setSuccessMsg(`A new code was sent to ${formData.email.trim().toLowerCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-indigo-50/30 to-purple-50/20 dark:from-[#0b0f17] dark:via-[#111625] dark:to-[#0b0f17]">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
            C
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Atria Student Registration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            CSE Sem V Sec C • Strictly for @atria.edu students
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-5 px-6">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              1
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Account</span>
          </div>
          <div className={`flex-1 h-0.5 mx-3 ${step === 2 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              2
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Email OTP</span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleInitiate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Neel Kumar Gupta"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Choose Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. neelkumar_26"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  College Email (@atria.edu only) *
                </label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                  <ShieldCheck size={12} /> Strict Atria domain
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. student.22cs@atria.edu"
                  className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Used strictly for assignment deadline alerts and account verification.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="I">Sem I</option>
                  <option value="II">Sem II</option>
                  <option value="III">Sem III</option>
                  <option value="IV">Sem IV</option>
                  <option value="V">Sem V</option>
                  <option value="VI">Sem VI</option>
                  <option value="VII">Sem VII</option>
                  <option value="VIII">Sem VIII</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="A">Sec A</option>
                  <option value="B">Sec B</option>
                  <option value="C">Sec C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lab Batch
                </label>
                <select
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="B1">Batch B1</option>
                  <option value="B2">Batch B2</option>
                  <option value="B3">Batch B3</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Sending OTP to @atria.edu...' : 'Continue to Email Verification'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center">
              <KeyRound size={26} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-1.5" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Check Your Atria Email
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                We sent a 6-digit verification code to:
              </p>
              <div className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
                {formData.email}
              </div>
            </div>

            {/* Viva / Lab Demo Helper Banner */}
            {demoOtp && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      ⚡ Lab Demo / Viva Code
                    </span>
                    <p className="font-mono text-base font-extrabold text-amber-900 dark:text-amber-200">
                      {demoOtp}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(demoOtp)}
                    className="px-2.5 py-1 text-[11px] bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-semibold rounded-lg transition-colors"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying Account...' : 'Complete Registration'}</span>
              <CheckCircle2 size={15} />
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>Edit details</span>
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Resend code</span>
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
