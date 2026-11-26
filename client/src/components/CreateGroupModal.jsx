import React, { useState } from 'react';
import { Users, Lock, Globe, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [iconBg, setIconBg] = useState('from-indigo-500 to-purple-600');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const gradients = [
    { label: 'Indigo', val: 'from-indigo-500 to-purple-600' },
    { label: 'Cyan', val: 'from-cyan-500 to-blue-600' },
    { label: 'Emerald', val: 'from-emerald-500 to-teal-600' },
    { label: 'Amber', val: 'from-amber-500 to-orange-600' },
    { label: 'Rose', val: 'from-rose-500 to-pink-600' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/groups', {
        name,
        description,
        category,
        isPrivate,
        accessCode: isPrivate ? accessCode : null,
        iconBg
      });
      if (onGroupCreated) onGroupCreated(res.data.group);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
        >
          ×
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Group
            </h2>
            <p className="text-xs text-slate-400">Collaborate with peers, share notes and chat in real-time</p>
          </div>
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
              Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operating Systems Lab Study Circle"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Academic">Academic Class</option>
                <option value="Laboratory">Laboratory & Practicals</option>
                <option value="Study Group">Study Group</option>
                <option value="Club">College Club / Tech Society</option>
                <option value="Project Team">Project Team</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Accent Theme
              </label>
              <div className="flex items-center gap-2 pt-1">
                {gradients.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setIconBg(g.val)}
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${g.val} transition-transform ${
                      iconBg === g.val ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about? Guidelines, subjects, or viva preparation..."
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Visibility Option */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? <Lock size={16} className="text-amber-500" /> : <Globe size={16} className="text-emerald-500" />}
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isPrivate ? 'Private Group (Code Required)' : 'Public Group (Anyone Can Join)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isPrivate ? 'Students must enter an invite passkey' : 'Discoverable in the campus directory'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            {isPrivate && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Custom Access Passkey (e.g. HACK26)
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Leave empty to auto-generate"
                  className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
