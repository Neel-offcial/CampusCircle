import React, { useState } from 'react';
import { Search, Bell, ShieldAlert, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenVerifyModal, searchQuery, setSearchQuery }) {
  const { user, isVerified } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'CIE-2 Schedule Released', group: 'CSE 5th Sem - Section C', time: '10m ago' },
    { id: 2, title: 'React Lab Manual Uploaded', group: 'React Lab (BRALB507)', time: '1h ago' },
    { id: 3, title: 'AI Minimax Assignment Due in 3 Days', group: 'CSE 5th Sem', time: '3h ago' }
  ];

  return (
    <header className="h-16 px-8 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0e131f]/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors duration-200">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          placeholder="Search groups, subjects, assignments..."
          className="w-full pl-9 pr-10 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
          ⌘F
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Verification Status Pill */}
        {!isVerified ? (
          <button
            onClick={onOpenVerifyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors animate-pulse"
          >
            <ShieldAlert size={14} />
            <span>Verify College Edu Email</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 text-[11px] font-semibold">
            <CheckCircle2 size={13} />
            <span>Verified Student</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors relative"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                <span className="text-[10px] text-indigo-500 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{n.group}</span>
                      <span>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img
            src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Student'}
            alt={user?.fullName}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
          />
          <div className="hidden md:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              Student • Sec {user?.section || 'C'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
