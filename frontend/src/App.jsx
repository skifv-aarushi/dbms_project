import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AllocationsPage from './pages/admin/AllocationsPage';
import DirectoryPage from './pages/admin/DirectoryPage';
import ReportsPage from './pages/admin/ReportsPage';

// Mentor Pages
import MenteesPage from './pages/mentor/MenteesPage';
import SchedulePage from './pages/mentor/SchedulePage';
import FacultyProfilePage from './pages/mentor/FacultyProfilePage';

// Mentee Pages
import MenteeHome from './pages/mentee/MenteeHome';
import MyFeedbackPage from './pages/mentee/MyFeedbackPage';
import SkillsPage from './pages/mentee/SkillsPage';
import FindMentorPage from './pages/mentee/FindMentorPage';

function RootRedirect() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  try {
    const user = JSON.parse(userStr);
    if (user.role === 'Admin') return <Navigate to="/admin/allocations" replace />;
    if (user.role === 'Mentor') return <Navigate to="/mentor/mentees" replace />;
    if (user.role === 'Mentee') return <Navigate to="/mentee" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Administrator Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<Navigate to="/admin/allocations" replace />} />
          <Route path="/admin/allocations" element={<AllocationsPage />} />
          <Route path="/admin/directory" element={<DirectoryPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>

        {/* Faculty Mentor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Mentor', 'Admin']} />}>
          <Route path="/mentor" element={<Navigate to="/mentor/mentees" replace />} />
          <Route path="/mentor/mentees" element={<MenteesPage />} />
          <Route path="/mentor/meetings" element={<SchedulePage />} />
          <Route path="/mentor/profile" element={<FacultyProfilePage />} />
        </Route>

        {/* Student Mentee Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Mentee', 'Admin']} />}>
          <Route path="/mentee" element={<MenteeHome />} />
          <Route path="/mentee/find-mentor" element={<FindMentorPage />} />
          <Route path="/mentee/feedback" element={<MyFeedbackPage />} />
          <Route path="/mentee/skills" element={<SkillsPage />} />
        </Route>

        {/* Root & Fallback */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
