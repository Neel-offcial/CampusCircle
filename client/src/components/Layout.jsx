import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import EduVerificationModal from './EduVerificationModal';
import CreateGroupModal from './CreateGroupModal';

export default function Layout() {
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Fixed Sidebar */}
      <Sidebar onOpenCreateGroup={() => setIsCreateGroupOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenVerifyModal={() => setIsVerifyOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ searchQuery, onOpenCreateGroup: () => setIsCreateGroupOpen(true) }} />
        </main>
      </div>

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
