import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import {
  Users,
  Search,
  Filter,
  Shield,
  BookOpen,
  GraduationCap,
  Phone,
  Mail,
  UserPlus,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';

export default function DirectoryPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const currentAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const initialForm = {
    name: '',
    email: '',
    password: 'password123',
    role: 'Mentor', // 'Mentor' or 'Mentee'
    department: 'Computer Science and Engineering',
    phone: '',
    designation: 'Associate Professor',
    mentorSkills: 'Full Stack Development, Distributed Systems, Cloud Architecture',
    year: '3',
    cgpa: '8.50',
    menteeSkills: 'Python, Machine Learning, Web Development',
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (search) params.search = search;

      const data = await adminApi.getAllUsers(params);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, departmentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password || 'password123',
        role: formData.role,
        department: formData.department,
        phone: formData.phone.trim() || null,
        skills: formData.role === 'Mentor' ? formData.mentorSkills : formData.menteeSkills,
      };

      if (formData.role === 'Mentor') {
        payload.designation = formData.designation;
      } else if (formData.role === 'Mentee') {
        payload.year = parseInt(formData.year, 10);
        payload.cgpa = parseFloat(formData.cgpa);
      }

      const res = await adminApi.createUser(payload);
      setMessage(res.message || 'User registered successfully!');
      setIsAddUserModalOpen(false);
      setFormData(initialForm);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user. Please check email uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const id = user.userid || user.UserID;
    if (!window.confirm(`Are you sure you want to remove ${user.role} "${user.name}"? This will delete their profile and any associated mentorship records.`)) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await adminApi.deleteUser(id);
      setMessage(res.message);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user.');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'Mentor':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Mentee':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-[#A44D2D]" />
                User Directory
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                View and manage all registered mentors, students, and university staff
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setError(null);
                  setMessage(null);
                  setIsAddUserModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Mentor or Mentee
              </button>

              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {message && (
            <div className="mb-6 p-4 bg-[#F5F7F4] border border-[#CCD7C9] text-[#324330] text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-[#577254] shrink-0" />
              <span className="font-semibold">{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#A44D2D] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#6B2D17]">Notice:</p>
                <p className="mt-0.5 text-[#863B20]">{error}</p>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-5 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by full name or email address..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg focus:bg-white focus:border-[#A44D2D] focus:outline-none text-stone-800"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </form>

              <div className="flex flex-wrap items-center gap-3">
                {/* Role Tabs */}
                <div className="flex bg-[#FAF8F5] border border-[#E6E0D5] p-1 rounded-lg text-xs">
                  {['', 'Mentor', 'Mentee', 'Admin'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-md font-semibold transition text-xs ${
                        roleFilter === r
                          ? 'bg-white text-stone-900 shadow-2xs border border-[#E6E0D5]'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {r ? (r === 'Mentor' ? 'Mentors' : r === 'Mentee' ? 'Mentees' : 'Admins') : 'All Accounts'}
                    </button>
                  ))}
                </div>

                {/* Department Dropdown */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-stone-700 focus:outline-none"
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science and Engineering">CSE</option>
                  <option value="Information Technology">IT</option>
                  <option value="Electronics & Communication">ECE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E0D5] mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif font-bold text-stone-900">
                  User Directory ({users.length})
                </h3>
              </div>
              <span className="text-xs text-stone-400 font-medium">All Members</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-[#FAF8F5] text-stone-500 uppercase font-semibold text-[10px] border-b border-[#E6E0D5]">
                  <tr>
                    <th className="px-4 py-3">User &amp; Contact</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation / Academics</th>
                    <th className="px-4 py-3">Skills &amp; Interests</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D5] font-medium">
                  {users.map((u) => {
                    const id = u.userid || u.UserID;
                    const skills = Array.isArray(u.skills) ? u.skills : [];
                    const isSelf = currentAdmin.userId === id;
                    return (
                      <tr key={id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FDF7F4] border border-[#F2D3C4] flex items-center justify-center font-serif font-bold text-[#A44D2D] text-xs shrink-0">
                              {u.name ? u.name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <p className="font-serif font-bold text-stone-900">{u.name}</p>
                              <p className="text-[11px] text-stone-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              u.role === 'Mentor'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : u.role === 'Mentee'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {getRoleIcon(u.role)}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{u.department}</td>
                        <td className="px-4 py-3">
                          {u.role === 'Mentor' && (
                            <span className="text-indigo-700 font-bold bg-indigo-50/80 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                              {u.designation}
                            </span>
                          )}
                          {u.role === 'Mentee' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                Year {u.year}
                              </span>
                              {u.cgpa && (
                                <span className="text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                                  CGPA {parseFloat(u.cgpa).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                          {u.role === 'Admin' && <span className="text-slate-400 italic">Institutional Governance</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {skills.length > 0 ? (
                              skills.slice(0, 3).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">—</span>
                            )}
                            {skills.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">+{skills.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isSelf && u.role !== 'Admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Remove user and associated records"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Mentor or Mentee Modal */}
          <Modal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            title="Onboard New Mentor or Mentee"
            maxWidth="max-w-2xl"
          >
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Role Toggle Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Select User Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Mentor' })}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2.5 transition text-xs font-semibold ${
                      formData.role === 'Mentor'
                        ? 'bg-[#FDF7F4] border-[#A44D2D] text-[#A44D2D] ring-1 ring-[#A44D2D]/20'
                        : 'bg-white border-[#E6E0D5] text-stone-600 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-[#A44D2D]" />
                    Faculty Mentor
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Mentee' })}
                    className={`p-3 rounded-lg border flex items-center justify-center gap-2.5 transition text-xs font-semibold ${
                      formData.role === 'Mentee'
                        ? 'bg-[#F5F7F4] border-[#577254] text-[#435940] ring-1 ring-[#577254]/20'
                        : 'bg-white border-[#E6E0D5] text-stone-600 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-[#577254]" />
                    Student Mentee
                  </button>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formData.role === 'Mentor' ? 'e.g. Dr. Rajesh Sharma' : 'e.g. Priya Sharma'}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={formData.role === 'Mentor' ? 'rajesh.sharma@university.edu' : 'priya.sharma@student.edu'}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                  />
                </div>
              </div>

              {/* Password & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password <span className="text-stone-400 font-normal">(Default: password123)</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="password123"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Department / School <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                >
                  <option value="Computer Science and Engineering">Computer Science and Engineering (CSE)</option>
                  <option value="Information Technology">Information Technology (IT)</option>
                  <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                  <option value="Electrical Engineering">Electrical Engineering (EE)</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              {/* Role-Specific Fields */}
              {formData.role === 'Mentor' ? (
                <div className="p-4 bg-[#FAF8F5] border border-[#E6E0D5] rounded-xl space-y-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A44D2D] block">
                    Faculty Mentor Details
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Academic Designation
                    </label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                    >
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Professor & Head of Department">Professor &amp; Head of Department</option>
                      <option value="Professor">Professor</option>
                      <option value="Dean of Academic Affairs">Dean of Academic Affairs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Subjects &amp; Areas of Expertise <span className="text-stone-400 font-normal">(Comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mentorSkills}
                      onChange={(e) => setFormData({ ...formData, mentorSkills: e.target.value })}
                      placeholder="e.g. Data Structures, Web Development, Cloud Computing, Database Systems"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Used to match students with mentors based on these subjects.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#FAF8F5] border border-[#E6E0D5] rounded-xl space-y-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#577254] block">
                    Student Academic Details
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Academic Year
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#577254] focus:outline-none text-stone-800"
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Current CGPA (0.00 - 10.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        placeholder="8.50"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#577254] focus:outline-none text-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Learning Interests &amp; Skills <span className="text-stone-400 font-normal">(Comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.menteeSkills}
                      onChange={(e) => setFormData({ ...formData, menteeSkills: e.target.value })}
                      placeholder="e.g. Python, Web Development, Data Structures, React"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#577254] focus:outline-none text-stone-800"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Student will be added to the directory and available for mentor allocation.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E0D5]">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? 'Registering...' : `Create ${formData.role} Account`}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}

