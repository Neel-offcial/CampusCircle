import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername, demoPass = 'password123') => {
    setError('');
    setLoading(true);
    try {
      await login(demoUsername, demoPass);
      navigate('/');
    } catch (err) {
      setError('Demo login failed. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-indigo-50/30 to-purple-50/20 dark:from-[#0b0f17] dark:via-[#111625] dark:to-[#0b0f17]">
      <div className="w-full max-w-4xl grid md:grid-cols-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Left Side: Branding & Lab Showcase */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>

          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-2xl mb-6 shadow-inner">
              C
            </div>
            <h1 className="text-2xl font-black tracking-tight leading-tight mb-2">
              CampusCircle
            </h1>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              Academic Group Collaboration, Real-Time Chat & Resource Sharing Platform
            </p>
          </div>

          <div className="my-8 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-indigo-100 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
              <ShieldCheck size={16} className="text-emerald-300 flex-shrink-0" />
              <span>Zero-Knowledge Edu Email Verification</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-indigo-100 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
              <Sparkles size={16} className="text-amber-300 flex-shrink-0" />
              <span>Student Hub ERP Attendance & Timetable Sync</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-indigo-100 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
              <Sparkles size={16} className="text-pink-300 flex-shrink-0" />
              <span>100% Anonymous Campus Confessions</span>
            </div>
          </div>

          <p className="text-[11px] text-indigo-200">
            React Lab Project • Atria Institute of Technology
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-3 p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with your student credentials
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. neel_dev"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Logins for Lab Evaluator */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              ⚡ 1-Click Demo Evaluation Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('neel_dev')}
                className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold text-center transition-colors"
              >
                Neel (Student)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('sarah_admin')}
                className="p-2 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[11px] font-semibold text-center transition-colors"
              >
                Sarah (Admin/CR)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('prof_prathyusha')}
                className="p-2 rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/30 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold text-center transition-colors"
              >
                Prof. Prathyusha
              </button>
            </div>
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
