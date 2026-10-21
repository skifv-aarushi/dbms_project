import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  GitPullRequest,
  BarChart3,
  Calendar,
  CheckCircle,
  Award,
  BookOpen,
  Database,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export default function Sidebar() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

  const adminLinks = [
    { to: '/admin/allocations', label: 'Mentor Allocations', icon: GitPullRequest, badge: 'Core' },
    { to: '/admin/directory', label: 'User Directory', icon: Users },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const mentorLinks = [
    { to: '/mentor/mentees', label: 'My Students', icon: Users },
    { to: '/mentor/meetings', label: 'Meetings', icon: Calendar },
    { to: '/mentor/profile', label: 'Faculty Profile', icon: Award, badge: 'Works' },
  ];

  const menteeLinks = [
    { to: '/mentee', label: 'My Mentorship', icon: BookOpen },
    { to: '/mentee/find-mentor', label: 'Find a Mentor', icon: Compass, badge: 'Match' },
    { to: '/mentee/feedback', label: 'Session Reviews', icon: CheckCircle },
    { to: '/mentee/skills', label: 'Skills & Profile', icon: Award },
  ];

  const links = role === 'Admin' ? adminLinks : role === 'Mentor' ? mentorLinks : menteeLinks;

  return (
    <aside className="w-64 bg-[#FDFBF9] border-r border-[#E8E2D7] shrink-0 hidden md:flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4">
      <div>
        <div className="mb-5 px-3.5 py-2.5 bg-[#F4EFE6] rounded-lg border border-[#E6E0D5]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block mb-0.5">
            Academic Workspace
          </span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#5A7357]"></div>
            <p className="text-xs font-bold text-stone-800 capitalize">
              {role || 'User'} Portal
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#A44D2D] text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#F4EFE6]'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/20 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Academic Advising Card */}
      <div className="p-3.5 bg-[#F4EFE6] rounded-xl text-stone-800 border border-[#E6E0D5]">
        <div className="flex items-center gap-2 text-[#8C381C] text-xs font-bold mb-1">
          <BookOpen className="w-4 h-4" />
          <span className="font-serif">Academic Advising</span>
        </div>
        <p className="text-[11px] text-stone-600 leading-snug">
          Mentorship tracking, session schedules, and progress reviews
        </p>
        <div className="mt-2.5 pt-2 border-t border-[#E0D7C9] flex items-center justify-between text-[10px] text-stone-500">
          <span className="flex items-center gap-1 text-[#435940] font-semibold">
            <ShieldCheck className="w-3 h-3" /> System Active
          </span>
          <span className="text-stone-500 font-medium">Semester 2026</span>
        </div>
      </div>
    </aside>
  );
}
