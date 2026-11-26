import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import ExploreGroupsPage from './pages/ExploreGroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import GpaPredictorPage from './pages/GpaPredictorPage';
import AttendancePage from './pages/AttendancePage';
import ConfessionsPage from './pages/ConfessionsPage';
import CampusPulsePage from './pages/CampusPulsePage';
import MarketplacePage from './pages/MarketplacePage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-xs text-slate-400">
        Loading CampusCircle...
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:groupId" element={<GroupDetailPage />} />
        <Route path="explore" element={<ExploreGroupsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="gpa-predictor" element={<GpaPredictorPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="confessions" element={<ConfessionsPage />} />
        <Route path="feed" element={<CampusPulsePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
