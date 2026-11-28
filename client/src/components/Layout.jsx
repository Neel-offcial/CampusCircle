import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  TrendingUp,
  Clock,
  Flame,
  Menu,
  X
} from 'lucide-react';
import Sidebar, { SidebarContent } from './Sidebar';
import Navbar from './Navbar';
import EduVerificationModal from './EduVerificationModal';
import CreateGroupModal from './CreateGroupModal';

export default function Layout() {
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Fixed Sidebar */}
      <Sidebar onOpenCreateGroup={() => setIsCreateGroupOpen(true)} />

      {/* Mobile Slide-Over Drawer */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileNavOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0e131f] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  C
                </div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  CampusCircle
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent
                onOpenCreateGroup={() => {
                  setIsCreateGroupOpen(true);
                  setIsMobileNavOpen(false);
                }}
                onItemClick={() => setIsMobileNavOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenVerifyModal={() => setIsVerifyOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet context={{ searchQuery, onOpenCreateGroup: () => setIsCreateGroupOpen(true) }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Persistent on Phone) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e131f]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <LayoutGrid size={18} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/gpa-predictor"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <TrendingUp size={18} />
          <span>GPA</span>
        </NavLink>
        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Clock size={18} />
          <span>Attendance</span>
        </NavLink>
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Flame size={18} />
          <span>Pulse</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Global Modals */}
      <EduVerificationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  );
}
