import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import {
  GraduationCap,
  Shield,
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  Database,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('Admin');

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'Admin') navigate('/admin/allocations');
      else if (data.user.role === 'Mentor') navigate('/mentor/mentees');
      else if (data.user.role === 'Mentee') navigate('/mentee');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword, roleName) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setActiveRoleTab(roleName);
    setIsLoading(true);
    setError('');

    authApi
      .login(demoEmail, demoPassword)
      .then((data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'Admin') navigate('/admin/allocations');
        else if (data.user.role === 'Mentor') navigate('/mentor/mentees');
        else if (data.user.role === 'Mentee') navigate('/mentee');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Login failed.');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F4EFE6] border border-[#E6E0D5] text-stone-700 text-xs font-medium mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-[#8C381C]" />
            <span>University Mentorship Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 tracking-tight">
            Mentor and Mentee Management Platform
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 font-normal">
            Connecting students with faculty mentors for academic guidance and project reviews
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Academic Personas Showcase */}
          <div className="lg:col-span-5 bg-[#F4EFE6] border border-[#E6E0D5] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2DBD0]">
                <h3 className="font-serif font-bold text-base text-stone-900">Demo Accounts</h3>
                <span className="text-[10px] bg-white border border-[#E6E0D5] text-stone-600 px-2 py-0.5 rounded-md font-medium">
                  Quick Access
                </span>
              </div>

              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                Click any profile below to sign in instantly:
              </p>

              <div className="space-y-2.5">
                {/* Admin Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@university.edu', 'password123', 'Admin')}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                    activeRoleTab === 'Admin'
                      ? 'bg-white border-[#8C381C] shadow-xs ring-1 ring-[#8C381C]'
                      : 'bg-white border-[#E6E0D5] hover:border-[#C7B59D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[#F4ECE4] border border-[#E5D2C2] flex items-center justify-center text-[#8C381C]">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">Administrator</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#F4ECE4] text-[#8C381C] font-semibold border border-[#E5D2C2]">
                          Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">Dr. Rajesh Sharma &bull; Dean</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8C381C] transition" />
                </button>

                {/* Mentor Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sunita.rao@university.edu', 'password123', 'Mentor')}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                    activeRoleTab === 'Mentor'
                      ? 'bg-white border-[#8C381C] shadow-xs ring-1 ring-[#8C381C]'
                      : 'bg-white border-[#E6E0D5] hover:border-[#C7B59D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[#EAE4DC] border border-[#DACFBF] flex items-center justify-center text-[#5C472E]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">Faculty Mentor</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#EAE4DC] text-[#5C472E] font-semibold border border-[#DACFBF]">
                          Mentor
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">Dr. Sunita Rao &bull; CSE Dept</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8C381C] transition" />
                </button>

                {/* Mentee Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('aarav.patel@student.edu', 'password123', 'Mentee')}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                    activeRoleTab === 'Mentee'
                      ? 'bg-white border-[#8C381C] shadow-xs ring-1 ring-[#8C381C]'
                      : 'bg-white border-[#E6E0D5] hover:border-[#C7B59D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[#EAF0E9] border border-[#CFDDCF] flex items-center justify-center text-[#3E5C3B]">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">Student Mentee</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#EAF0E9] text-[#3E5C3B] font-semibold border border-[#CFDDCF]">
                          Mentee
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">Aarav Patel &bull; Year 3 (CGPA 9.42)</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8C381C] transition" />
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E2DBD0] text-[11px] text-stone-500 flex items-center justify-between">
              <span>Status</span>
              <span className="text-[#435940] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5A7357]"></span>
                System Online
              </span>
            </div>
          </div>

          {/* Right Column: Standard Auth Form */}
          <div className="lg:col-span-7 bg-white text-stone-800 rounded-xl p-6 sm:p-8 border border-[#E6E0D5] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F4EFE6]">
                <div>
                  <h2 className="text-xl font-bold font-serif text-stone-900">Sign In</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Enter your university email and password
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#F4EFE6] text-[#8C381C] border border-[#E6E0D5] flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    University Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., admin@university.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5] text-stone-900"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5] text-stone-900"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-8 pt-5 border-t border-[#F4EFE6] flex items-center justify-between text-xs text-stone-500">
              <span>Need a new student or faculty account?</span>
              <Link
                to="/register"
                className="font-semibold text-[#8C381C] hover:text-[#6E2C15] transition"
              >
                Register Here &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
