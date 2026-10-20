import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { GraduationCap, Shield, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Mentee');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [year, setYear] = useState('3');
  const [cgpa, setCgpa] = useState('8.50');
  const [skills, setSkills] = useState('Data Structures, Web Development, Python');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        phone,
        department,
        designation: role === 'Mentor' ? designation : undefined,
        year: role === 'Mentee' ? parseInt(year, 10) : undefined,
        cgpa: role === 'Mentee' ? parseFloat(cgpa) : undefined,
        skills: role === 'Mentee' ? skills : undefined,
      };

      const data = await authApi.register(payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (role === 'Admin') navigate('/admin/allocations');
      else if (role === 'Mentor') navigate('/mentor/mentees');
      else navigate('/mentee');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check input parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-[#A44D2D] mx-auto flex items-center justify-center text-white shadow-xs mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">Create an Account</h2>
        <p className="mt-1 text-xs text-stone-600">
          Join the university mentorship platform for academic guidance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xs rounded-xl sm:px-10 border border-[#E6E0D5]">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-700 mb-2">Select Account Role</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { r: 'Mentee', icon: GraduationCap, label: 'Student Mentee' },
                { r: 'Mentor', icon: BookOpen, label: 'Faculty Mentor' },
                { r: 'Admin', icon: Shield, label: 'Administrator' },
              ].map(({ r, icon: Icon, label }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-2.5 text-center rounded-lg border transition-all ${
                    role === r
                      ? 'bg-[#FDF7F4] border-[#A44D2D] text-[#8C381C] ring-1 ring-[#A44D2D] shadow-xs'
                      : 'bg-[#FAF8F5] border-[#E6E0D5] text-stone-600 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1 text-stone-700" />
                  <span className="block text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@student.edu"
                  className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9123456780"
                  className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5] text-stone-800"
              >
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            {/* Mentor-Specific Fields */}
            {role === 'Mentor' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g., Associate Professor, HOD"
                  className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                />
              </div>
            )}

            {/* Mentee-Specific Fields */}
            {role === 'Mentee' && (
              <>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5] text-stone-800"
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5</option>
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
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g., 9.25"
                      className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Areas of Interest &amp; Skills (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Python, Web Development, Data Structures, React"
                    className="w-full px-3 py-2 text-xs border border-[#DCD0BD] rounded-lg focus:ring-1 focus:ring-[#A44D2D] focus:border-[#A44D2D] focus:outline-none bg-[#FAF8F5]"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Subjects and tools you're interested in learning</p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#8C381C] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
