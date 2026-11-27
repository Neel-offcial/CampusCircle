import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Moon,
  Sun,
  User,
  LogOut,
  Check,
  X,
  RefreshCw,
  Mail,
  Sparkles,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onOpenVerifyModal, searchQuery, setSearchQuery }) {
  const { user, isVerified, updateProfile, logout } = useAuth();
  const { theme, toggleTheme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Profile Form Edit State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    department: user?.department || 'Computer Science and Engineering',
    semester: user?.semester || 'V',
    section: user?.section || 'C',
    batch: user?.batch || 'B1',
    emailAlerts: user?.emailAlerts ?? true,
    avatarUrl: user?.avatarUrl || ''
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Refs for click-outside detection
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Sync form data whenever user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        bio: user.bio || '',
        department: user.department || 'Computer Science and Engineering',
        semester: user.semester || 'V',
        section: user.section || 'C',
        batch: user.batch || 'B1',
        emailAlerts: user.emailAlerts ?? true,
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  // Click-outside listener: automatically closes dropdowns when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const notifications = [
    { id: 1, title: 'CIE-2 Schedule Released', group: 'CSE 5th Sem - Section C', time: '10m ago' },
    { id: 2, title: 'React Lab Manual Uploaded', group: 'React Lab (BRALB507)', time: '1h ago' },
    { id: 3, title: 'AI Minimax Assignment Due in 3 Days', group: 'CSE 5th Sem', time: '3h ago' }
  ];

  // Randomize Avatar
  const handleShuffleAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(randomSeed)}&backgroundColor=4f46e5`;
    setFormData((prev) => ({ ...prev, avatarUrl: newAvatar }));
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="h-16 px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0e131f]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors duration-200">
      {/* Search Bar */}
      <div className="relative w-72 lg:w-80">
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
      <div className="flex items-center gap-3">
        {/* Verification Status Pill */}
        {!isVerified ? (
          <button
            onClick={onOpenVerifyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors animate-pulse"
          >
            <ShieldAlert size={14} />
            <span className="hidden sm:inline">Verify College Edu Email</span>
            <span className="sm:hidden">Verify</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 text-[11px] font-semibold">
            <CheckCircle2 size={13} />
            <span>Verified Student</span>
          </div>
        )}

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative ${
              showNotifications
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setShowNotifications(false)}
                    className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
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

        {/* ============================================================== */}
        {/* INTERACTIVE PROFILE & SETTINGS DROPDOWN                          */}
        {/* ============================================================== */}
        <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className={`flex items-center gap-2.5 p-1.5 rounded-2xl transition-all duration-150 cursor-pointer ${
              showProfileMenu
                ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Open Profile & Settings"
          >
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Student'}
              alt={user?.fullName}
              className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/20"
            />
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.fullName?.split(' ')[0]}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Sec {user?.section || 'C'} • {user?.batch || 'B1'}
              </p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile & Appearance Menu Card */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
              {/* Header: User Summary */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={formData.avatarUrl || user?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=Student'}
                      alt={user?.fullName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleShuffleAvatar}
                      title="Shuffle Avatar"
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shadow-sm hover:scale-110 transition-transform"
                    >
                      <Sparkles size={11} />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{user?.fullName}</span>
                      {isVerified && <ShieldCheck size={14} className="text-emerald-500" title="Verified Student" />}
                    </h3>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      @{user?.username} • {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
                >
                  <X size={16} />
                </button>
              </div>

              {/* APPEARANCE SECTION */}
              <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    {isDark ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
                    Theme Appearance
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme && setTheme('light')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      !isDark
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Sun size={13} className={!isDark ? 'text-amber-500' : ''} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme && setTheme('dark')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isDark
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Moon size={13} className={isDark ? 'text-indigo-200' : ''} />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* EDIT DETAILS FORM */}
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                  Update Student Details
                </div>

                {saveSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={15} />
                    <span>Profile details updated successfully!</span>
                  </div>
                )}

                {saveError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
                    {saveError}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Bio / Status
                  </label>
                  <input
                    type="text"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="e.g. 5th Sem CSE Student @ Atria"
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Computer Science and Engineering">Computer Science & Engineering</option>
                    <option value="Information Science and Engineering">Information Science & Engineering</option>
                    <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence & ML</option>
                    <option value="Electronics and Communication Engineering">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                {/* Semester, Section & Batch */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
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
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Section
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    >
                      <option value="A">Sec A</option>
                      <option value="B">Sec B</option>
                      <option value="C">Sec C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Lab Batch
                    </label>
                    <select
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium"
                    >
                      <option value="B1">Batch B1</option>
                      <option value="B2">Batch B2</option>
                      <option value="B3">Batch B3</option>
                    </select>
                  </div>
                </div>

                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Assignment Email Alerts
                      </p>
                      <p className="text-[10px] text-slate-400">Receive email alerts when assignments are posted</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.emailAlerts}
                    onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Save Changes Button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={14} />}
                    <span>{saving ? 'Saving Details...' : 'Save Profile Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
