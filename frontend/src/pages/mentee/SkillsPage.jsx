import React, { useState, useEffect } from 'react';
import { menteeApi } from '../../api/mentee.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import { Award, Plus, X, Save, CheckCircle, AlertCircle } from 'lucide-react';

const SUGGESTED_SKILLS = [
  'Data Structures',
  'Web Development',
  'Database Systems',
  'Machine Learning',
  'Cloud Computing',
  'Python',
  'Java',
  'Algorithms',
  'Computer Networks',
  'Operating Systems',
  'React',
  'Artificial Intelligence',
  'Cybersecurity',
  'Mobile App Development',
];

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [inputSkill, setInputSkill] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    confirmText: 'Done',
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await menteeApi.getDashboard();
      setSkills(data.profile?.skills || []);
    } catch (err) {
      setError('Failed to load profile skills.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddSkill = (skillToAdd) => {
    const val = (skillToAdd || inputSkill).trim();
    if (!val) return;
    if (skills.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setError(`"${val}" is already added.`);
      return;
    }
    setError(null);
    setSkills([...skills, val]);
    setInputSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await menteeApi.updateSkills(skills);
      setSkills(res.skills || skills);
      setMessage('Skills and interests updated successfully!');
      setConfirmationPopup({
        isOpen: true,
        title: 'Skills & Interests Saved',
        message: 'Your profile skills have been saved to your account. Recommendation algorithms will prioritize faculty aligned with these areas.',
        type: 'success',
        confirmText: 'Done',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save skills.';
      setError(errorMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Save Failed',
        message: errorMsg,
        type: 'error',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Award className="w-6 h-6 text-[#A44D2D]" />
                My Skills &amp; Interests
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Add subjects and areas you want guidance in so we can recommend the best mentors for you.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-[#F5F7F4] border border-[#CCD7C9] text-[#324330] text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#577254] shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#A44D2D] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tag Editor Card */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs mb-6">
            <h3 className="text-sm font-serif font-bold text-stone-800 mb-2">My Skills ({skills.length})</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add or remove subjects and skills you are working on.
            </p>

            {/* Input field */}
            <div className="flex gap-2 max-w-md mb-6">
              <input
                type="text"
                value={inputSkill}
                onChange={(e) => setInputSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a subject or skill (e.g. Machine Learning)..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Current Chips */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] min-h-[90px] flex flex-wrap gap-2 items-center">
              {skills.length === 0 ? (
                <span className="text-xs text-stone-400 italic">
                  No skills added yet. Type a subject above or choose from the suggestions below.
                </span>
              ) : (
                skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-800 border border-[#E6E0D5] shadow-2xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-stone-400 hover:text-[#863B20] rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quick Add Suggestions */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Popular Subjects &amp; Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SKILLS.map((suggested) => {
                const isAdded = skills.some((s) => s.toLowerCase() === suggested.toLowerCase());
                return (
                  <button
                    key={suggested}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddSkill(suggested)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isAdded
                        ? 'bg-[#F4EFE6] text-stone-400 border border-[#E6E0D5] cursor-not-allowed'
                        : 'bg-[#FAF8F5] hover:bg-[#F4EFE6] text-stone-700 border border-[#E6E0D5]'
                    }`}
                  >
                    <Plus className="w-3 h-3 text-stone-400" />
                    <span>{suggested}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ConfirmationPopup
            isOpen={confirmationPopup.isOpen}
            onClose={() => setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))}
            title={confirmationPopup.title}
            message={confirmationPopup.message}
            type={confirmationPopup.type}
            confirmText={confirmationPopup.confirmText}
          />
        </main>
      </div>
    </div>
  );
}
