import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own portal if they have another valid role
    if (user.role === 'Admin') return <Navigate to="/admin/allocations" replace />;
    if (user.role === 'Mentor') return <Navigate to="/mentor/mentees" replace />;
    if (user.role === 'Mentee') return <Navigate to="/mentee" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
