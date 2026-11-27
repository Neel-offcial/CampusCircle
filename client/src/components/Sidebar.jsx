import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  FileCheck,
  TrendingUp,
  Clock,
  Sparkles,
  Settings,
  LogOut,
  PlusCircle,
  Moon,
  Sun,
  ShieldCheck,
  Compass,
  Flame,
  ShoppingBag,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ onOpenCreateGroup }) {
  const { user, logout, isVerified } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Top Item: Dashboard
  const mainLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutGrid, exact: true }
  ];

  // Highlighted Campus Life (Pushed to the top)
  const campusLifeLinks = [
    { to: '/feed', label: 'Campus Pulse', icon: Flame, badge: 'HOT' },
    { to: '/marketplace', label: 'Marketplace & Gigs', icon: ShoppingBag, badge: 'NEW' },
    { to: '/confessions', label: 'Anon Confessions', icon: Sparkles, badge: 'ANON' }
  ];

  // Academic Suite
  const academicLinks = [
    { to: '/attendance', label: 'Attendance & Time', icon: Clock },
    { to: '/assignments', label: 'Assignments', icon: FileCheck },
    { to: '/gpa-predictor', label: 'GPA Predictor', icon: TrendingUp },
    { to: '/groups', label: 'My Groups', icon: Users },
    { to: '/explore', label: 'Explore Groups', icon: Compass }
  ];

  const renderLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.exact}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            isActive
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm shadow-indigo-500/5'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Icon size={18} />
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                item.badge === 'HOT'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                  : item.badge === 'NEW'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              }`}
            >
              {item.badge}
            </span>
          )}
        </div>
      </NavLink>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#0e131f] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 min-h-screen transition-colors duration-200">
      <div className="overflow-y-auto pr-1 -mr-1">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 px-2 py-1 mb-6 group cursor-pointer hover:opacity-95 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-xl group-hover:scale-105 transition-transform">
            C
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              CampusCircle
            </h1>
            <p className="text-xs text-slate-400 font-medium">Academic Network</p>
          </div>
        </Link>

        {/* Dashboard Link */}
        <div className="space-y-1 mb-5">
          {mainLinks.map(renderLink)}
        </div>

        {/* CAMPUS LIFE (Pushed to Top) */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Flame size={12} className="text-rose-500" />
              Campus Life
            </span>
            <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          <div className="space-y-1">
            {campusLifeLinks.map(renderLink)}
          </div>
        </div>

        {/* ACADEMIC SUITE */}
        <div className="mb-5">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <BookOpen size={12} className="text-indigo-500" />
            Academics
          </div>
          <div className="space-y-1">
            {academicLinks.map(renderLink)}
          </div>
        </div>

        {/* SETTINGS / UTILITIES */}
        <div>
          <div className="space-y-1">
            {renderLink({ to: '/settings', label: 'Settings', icon: Settings })}
          </div>
        </div>

        {/* Quick Add Group Promo Card */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-100 dark:border-indigo-900/40 text-center">
          <div className="flex justify-center -space-x-2 mb-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">A</span>
            <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">N</span>
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">S</span>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Start a Study Group</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">Share notes & discuss labs</p>
          <button
            onClick={onOpenCreateGroup}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PlusCircle size={13} />
            Create Group
          </button>
        </div>
      </div>

      {/* Footer / User Profile & Controls */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Theme Toggle Button */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
            Appearance
          </span>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle Light / Dark mode"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Current User Pill */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Student'}
              alt={user?.fullName}
              className="w-9 h-9 rounded-full object-cover border border-indigo-200 dark:border-indigo-800 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.fullName?.split(' ')[0]}
                </p>
                {isVerified && (
                  <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" title="Verified Student" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.department?.split(' ')[0] || 'CSE'} • {user?.semester}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
