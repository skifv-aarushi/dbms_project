import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import {
  GraduationCap,
  LogOut,
  User,
  Shield,
  BookOpen,
  ArrowRightLeft,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleQuickSwitch = async (email, defaultRoute) => {
    try {
      const data = await authApi.login(email, 'password123');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(defaultRoute);
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F4ECE4] text-[#8C381C] border border-[#E5D2C2]">
            <Shield className="w-3 h-3 text-[#8C381C]" /> Admin
          </span>
        );
      case 'Mentor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAE4DC] text-[#5C472E] border border-[#DACFBF]">
            <BookOpen className="w-3 h-3 text-[#5C472E]" /> Faculty Mentor
          </span>
        );
      case 'Mentee':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EAF0E9] text-[#3E5C3B] border border-[#CFDDCF]">
            <GraduationCap className="w-3 h-3 text-[#3E5C3B]" /> Student Mentee
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF9] border-b border-[#E8E2D7] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#A44D2D] flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="text-base font-bold font-serif text-stone-900 tracking-tight hover:text-[#A44D2D] transition"
                >
                  Mentor &amp; Mentee Platform
                </Link>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F4EFE6] text-stone-600 border border-[#E6E0D5] hidden sm:inline-block">
                  University Academic Portal
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-normal hidden sm:block">
                Academic Advising &amp; Mentorship
              </p>
            </div>
          </div>

          {/* User Details & Switcher */}
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Quick Persona Switcher in Header */}
              <div className="hidden lg:flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-lg text-[11px] font-medium text-stone-600 border border-[#E8E2D7]">
                <span className="px-2 text-stone-500 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> Quick Switch:
                </span>
                <button
                  onClick={() => handleQuickSwitch('admin@university.edu', '/admin/allocations')}
                  className={`px-2 py-1 rounded-md transition ${
                    user.role === 'Admin'
                      ? 'bg-[#8C381C] text-white font-semibold'
                      : 'hover:bg-white text-stone-700'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => handleQuickSwitch('sunita.rao@university.edu', '/mentor/mentees')}
                  className={`px-2 py-1 rounded-md transition ${
                    user.role === 'Mentor'
                      ? 'bg-[#624424] text-white font-semibold'
                      : 'hover:bg-white text-stone-700'
                  }`}
                >
                  Mentor
                </button>
                <button
                  onClick={() => handleQuickSwitch('aarav.patel@student.edu', '/mentee')}
                  className={`px-2 py-1 rounded-md transition ${
                    user.role === 'Mentee'
                      ? 'bg-[#435940] text-white font-semibold'
                      : 'hover:bg-white text-stone-700'
                  }`}
                >
                  Mentee
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center gap-2.5 border-l border-[#E8E2D7] pl-3">
                <div className="w-8 h-8 rounded-lg bg-[#EAE1D2] border border-[#DCD0BD] flex items-center justify-center text-stone-800 font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-800 leading-tight">
                      {user.name}
                    </span>
                    {getRoleBadge(user.role)}
                  </div>
                  <span className="text-[11px] text-stone-500 block truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-[#8C381C] hover:bg-[#FDF7F4] rounded-lg transition border border-[#E6E0D5]"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-[#8C381C] hover:bg-[#FDF7F4] rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#A44D2D] hover:bg-[#863B20] rounded-lg transition shadow-xs"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
