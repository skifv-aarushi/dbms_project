import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import FacultyDossierModal from '../../components/common/FacultyDossierModal';
import { formatDate } from '../../utils/dateUtils';
import {
  GitPullRequest,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Target,
  UserPlus,
  FileText,
} from 'lucide-react';

export default function AllocationsPage() {
  const [unassignedMentees, setUnassignedMentees] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentorForDossier, setSelectedMentorForDossier] = useState(null);

  // Confirmation popup state
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Recommendations state
  const [recommendations, setRecommendations] = useState({});
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Auto-Match Modal state
  const [isAutoMatchModalOpen, setIsAutoMatchModalOpen] = useState(false);
  const [autoMatchPreview, setAutoMatchPreview] = useState(null);
  const [isApplyingAutoMatch, setIsApplyingAutoMatch] = useState(false);

  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menteesRes, mentorsRes, allocRes] = await Promise.all([
        adminApi.getUnassignedMentees(),
        adminApi.getMentorsLoad(),
        adminApi.getAllAllocations(),
      ]);

      setUnassignedMentees(menteesRes.unassignedMentees || []);
      setMentors(mentorsRes.mentors || []);
      setAllocations(allocRes.allocations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch allocations data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch recommendations whenever an unassigned mentee is selected
  useEffect(() => {
    if (!selectedMentee) {
      setRecommendations({});
      return;
    }

    const fetchRecs = async () => {
      setIsLoadingRecs(true);
      try {
        const menteeId = selectedMentee.userid || selectedMentee.UserID;
        const res = await adminApi.getRecommendations(menteeId);
        const map = {};
        (res.recommendations || []).forEach((r) => {
          map[r.mentorId] = r;
        });
        setRecommendations(map);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setIsLoadingRecs(false);
      }
    };

    fetchRecs();
  }, [selectedMentee]);

  const handleCreatePairing = async () => {
    if (!selectedMentee || !selectedMentor) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const menteeId = selectedMentee.userid || selectedMentee.UserID;
    const mentorId = selectedMentor.userid || selectedMentor.UserID;
    const menteeName = selectedMentee.name || 'Student';
    const mentorName = selectedMentor.name || 'Faculty Mentor';

    const activeCount = parseInt(selectedMentor.activementeescount || selectedMentor.activeMenteesCount || 0, 10);
    if (activeCount >= 3) {
      const errMsg = `Faculty Mentor ${mentorName} has reached the maximum institutional capacity of 3 active mentees.`;
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Advising Capacity Full',
        message: errMsg,
        type: 'error',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await adminApi.createAllocation({ mentorId, menteeId });
      setMessage(res.message || 'Mentorship pairing created successfully!');
      setConfirmationPopup({
        isOpen: true,
        title: 'Mentorship Pairing Established!',
        message: res.message || `Successfully assigned ${menteeName} to ${mentorName}.`,
        type: 'success',
      });
      setSelectedMentee(null);
      setSelectedMentor(null);
      await loadData();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        'Failed to create pairing. Database constraint violated.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Failed to Establish Pairing',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (mentorshipId, status) => {
    setError(null);
    setMessage(null);
    try {
      const res = await adminApi.updateAllocationStatus(mentorshipId, status);
      setMessage(res.message || `Mentorship status updated to ${status}.`);
      setConfirmationPopup({
        isOpen: true,
        title: 'Status Updated!',
        message: res.message || `Mentorship status updated to ${status}.`,
        type: 'success',
      });
      await loadData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update mentorship status.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Update Failed',
        message: errMsg,
        type: 'error',
      });
    }
  };

  const handleOpenAutoMatch = async () => {
    setIsAutoMatchModalOpen(true);
    setAutoMatchPreview(null);
    try {
      const res = await adminApi.getAutoMatchBatch();
      setAutoMatchPreview(res);
    } catch (err) {
      setError('Failed to compute auto-match suggestions.');
      setIsAutoMatchModalOpen(false);
    }
  };

  const handleApplyAutoMatch = async () => {
    setIsApplyingAutoMatch(true);
    try {
      const res = await adminApi.applyAutoMatch();
      const count = res.pairings?.length || res.assignedCount || 0;
      setMessage(res.message || `Successfully created ${count} mentorship pairings!`);
      setIsAutoMatchModalOpen(false);
      setConfirmationPopup({
        isOpen: true,
        title: 'Auto-Match Completed!',
        message: res.message || `Successfully committed ${count} rule-recommended mentorship pairings to the database.`,
        type: 'success',
      });
      await loadData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to commit auto-match pairings.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Auto-Match Failed',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsApplyingAutoMatch(false);
    }
  };

  // Filter unassigned mentees
  const filteredMentees = unassignedMentees.filter((m) => {
    if (deptFilter !== 'All' && m.department !== deptFilter) return false;
    if (yearFilter !== 'All' && String(m.year) !== yearFilter) return false;
    return true;
  });

  // Sort mentors: when a mentee is selected, sort by recommendation matchScore descending
  const sortedMentors = [...mentors].sort((a, b) => {
    const aId = a.userid || a.UserID;
    const bId = b.userid || b.UserID;
    if (selectedMentee && recommendations[aId] && recommendations[bId]) {
      return recommendations[bId].matchScore - recommendations[aId].matchScore;
    }
    if (selectedMentee && recommendations[aId]) return -1;
    if (selectedMentee && recommendations[bId]) return 1;
    return parseInt(a.activeMenteesCount ?? a.activementeescount ?? 0, 10) - parseInt(b.activeMenteesCount ?? b.activementeescount ?? 0, 10);
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#FDF7F4] text-[#A44D2D] border border-[#F2D3C4] flex items-center justify-center font-bold">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                  Mentor &amp; Student Allocations
                </h1>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Match faculty mentors and students based on shared skills, department, and faculty availability
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/admin/directory"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A44D2D] bg-[#FDF7F4] border border-[#F2D3C4] hover:bg-[#F9EBE4] rounded-lg transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Mentor / Mentee
              </Link>

              <button
                onClick={handleOpenAutoMatch}
                disabled={unassignedMentees.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-40"
              >
                <Target className="w-4 h-4" />
                Auto Match All ({unassignedMentees.length})
              </button>

              <button
                onClick={loadData}
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

          {/* Interactive Staging Workbench */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E6E0D5] mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-serif font-bold text-stone-900">Manual Assignment</h3>
                  {selectedMentee && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F5F7F4] text-[#435940] border border-[#CCD7C9]">
                      Student Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select an unassigned student to view suggested faculty mentors based on skills and department.
                </p>
              </div>

              <button
                onClick={handleCreatePairing}
                disabled={!selectedMentee || !selectedMentor || isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <GitPullRequest className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Assign Mentor'}
              </button>
            </div>

            {/* Selection Bar with Recommender Highlights */}
            {selectedMentee && (
              <div className="mb-6 p-4 bg-[#FAF8F5] border border-[#E6E0D5] rounded-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-stone-600 uppercase tracking-wider text-[11px] block mb-1">
                      Selected Student:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-white rounded-lg font-bold text-stone-900 border border-[#E6E0D5] flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#577254]" />
                        {selectedMentee.name} (Year {selectedMentee.year}, CGPA {selectedMentee.cgpa})
                      </span>
                      <span className="text-stone-400">&bull;</span>
                      <span className="text-stone-700 font-semibold">{selectedMentee.department}</span>
                    </div>

                    {/* Mentee skills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-stone-500 font-semibold uppercase">Interests &amp; Skills:</span>
                      {(selectedMentee.skills || []).map((sk, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white text-stone-700 rounded-md text-[10px] font-semibold border border-[#E6E0D5]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 1-click select best match */}
                    {sortedMentors[0] && (
                      <button
                        onClick={() => setSelectedMentor(sortedMentors[0])}
                        className="px-3 py-1.5 bg-[#577254] hover:bg-[#435940] text-white font-semibold rounded-lg transition-colors text-[11px] flex items-center gap-1"
                      >
                        <Target className="w-3.5 h-3.5" />
                        Select Top Match
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMentee(null);
                        setSelectedMentor(null);
                      }}
                      className="text-xs text-[#A44D2D] hover:text-[#863B20] font-semibold px-2 py-1"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Pane: Unassigned Mentees */}
              <div className="bg-[#FAF8F5] rounded-xl p-5 border border-[#E6E0D5]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B8781B]"></span>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                      Unassigned Students ({filteredMentees.length})
                    </h4>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="text-xs px-2.5 py-1 bg-white border border-[#E6E0D5] rounded-lg text-stone-700 focus:outline-none"
                    >
                      <option value="All">All Years</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>

                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="text-xs px-2.5 py-1 bg-white border border-[#E6E0D5] rounded-lg text-stone-700 focus:outline-none max-w-[130px] truncate"
                    >
                      <option value="All">All Depts</option>
                      <option value="Computer Science and Engineering">CSE</option>
                      <option value="Information Technology">IT</option>
                      <option value="Electronics & Communication">ECE</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {filteredMentees.length === 0 ? (
                    <div className="p-8 text-center text-xs text-stone-400 bg-white rounded-xl border border-dashed border-[#E6E0D5]">
                      All enrolled students currently have active mentorship pairings!
                    </div>
                  ) : (
                    filteredMentees.map((mentee) => {
                      const id = mentee.userid || mentee.UserID;
                      const isSelected = selectedMentee && (selectedMentee.userid || selectedMentee.UserID) === id;
                      const skills = Array.isArray(mentee.skills) ? mentee.skills : [];
                      return (
                        <div
                          key={id}
                          onClick={() => setSelectedMentee(mentee)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#FDF7F4] border-[#A44D2D] ring-2 ring-[#A44D2D]/20 shadow-xs'
                              : 'bg-white border-[#E6E0D5] hover:border-[#C7B59D]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-serif font-bold text-stone-900">{mentee.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4EFE6] font-semibold text-stone-700">
                                  Yr {mentee.year}
                                </span>
                                {mentee.cgpa && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FDF9EF] text-[#945C10] font-bold border border-[#F5DEB0]">
                                    CGPA {parseFloat(mentee.cgpa).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 block mt-0.5">{mentee.department}</span>
                            </div>

                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-[#A44D2D]" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                            )}
                          </div>

                          {/* Skill pills preview */}
                          {skills.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {skills.slice(0, 3).map((sk, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-stone-600 font-medium border border-[#E6E0D5]">
                                  {sk}
                                </span>
                              ))}
                              {skills.length > 3 && (
                                <span className="text-[10px] text-stone-400">+{skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Pane: Faculty Mentors with Compatibility */}
              <div className="bg-[#FAF8F5] rounded-xl p-5 border border-[#E6E0D5]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A44D2D]"></span>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                      Faculty Mentors ({mentors.length})
                    </h4>
                  </div>
                  {selectedMentee ? (
                    <span className="text-[11px] text-[#A44D2D] font-semibold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Ranked by Compatibility
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400 font-medium">Availability</span>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {sortedMentors.map((mentor) => {
                    const id = mentor.userid || mentor.UserID;
                    const isSelected = selectedMentor && (selectedMentor.userid || selectedMentor.UserID) === id;
                    const count = parseInt(mentor.activeMenteesCount ?? mentor.activementeescount ?? 0, 10);
                    const rec = recommendations[id];

                    return (
                      <div
                        key={id}
                        onClick={() => setSelectedMentor(mentor)}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#FDF7F4] border-[#A44D2D] ring-2 ring-[#A44D2D]/20 shadow-xs'
                            : 'bg-white border-[#E6E0D5] hover:border-[#C7B59D]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-serif font-bold text-stone-900">{mentor.name}</span>
                              <span className="text-[10px] text-[#A44D2D] font-semibold bg-[#FDF7F4] border border-[#F2D3C4] px-1.5 py-0.5 rounded-md">
                                {mentor.designation || 'Faculty'}
                              </span>
                              {count >= 3 ? (
                                <span className="text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                                  Full (3/3)
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#435940] font-semibold bg-[#F5F7F4] border border-[#CCD7C9] px-1.5 py-0.5 rounded-md">
                                  {count}/3 Slots
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 block mt-0.5">{mentor.department}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Recommender Badge if active */}
                            {rec && (
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                                    rec.matchScore >= 80
                                      ? 'bg-[#F5F7F4] text-[#435940] border-[#CCD7C9]'
                                      : rec.matchScore >= 65
                                      ? 'bg-[#FDF9EF] text-[#945C10] border-[#F5DEB0]'
                                      : 'bg-[#F4EFE6] text-stone-700 border-[#DCD0BD]'
                                  }`}
                                >
                                  {rec.matchScore}% Match
                                </span>
                              </div>
                            )}

                            {isSelected ? (
                              <CheckCircle className="w-5 h-5 text-[#A44D2D]" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                            )}
                          </div>
                        </div>

                        {/* Rationale & Skills Overlap */}
                        {rec && rec.matchedSkills && rec.matchedSkills.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#E6E0D5] flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#435940] flex items-center gap-1">
                              <Target className="w-3 h-3" /> Shared Skills:
                            </span>
                            {rec.matchedSkills.map((sk, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 bg-[#F5F7F4] text-[#435940] rounded-md font-semibold border border-[#CCD7C9]">
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
                          <span>
                            {count >= 3 ? (
                              <strong className="text-rose-600 font-bold">Capacity Full (3 / 3 Students)</strong>
                            ) : count === 0 ? (
                              <strong className="text-[#577254]">Available (0 / 3 Students)</strong>
                            ) : (
                              `${count} / 3 Students assigned (${3 - count} slot remaining)`
                            )}
                          </span>
                          {rec && <span className="text-[10px] font-medium text-stone-400">{rec.matchTier}</span>}
                        </div>

                        {/* Dossier inspection button for Admin */}
                        <div className="mt-2.5 pt-2 border-t border-[#E6E0D5] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMentorForDossier(mentor);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F4EFE6] text-[#A44D2D] border border-[#E6E0D5] hover:border-[#A44D2D] text-[10px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="Inspect faculty publications, citations, bio, and student reviews"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Profile &amp; Works</span>
                          </button>
                          <span className="text-[10px] text-stone-400 font-medium">Click card to select</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Active Allocations Ledger Table */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">
                  All Mentorship Pairings
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Active and completed pairings across all departments
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-[#F4EFE6] text-stone-700 rounded-lg border border-[#E6E0D5]">
                {allocations.length} Total Pairings
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-[#FAF8F5] text-stone-500 uppercase font-semibold text-[10px] border-b border-[#E6E0D5]">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Mentor</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Meetings</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D5] font-medium">
                  {allocations.map((a) => {
                    const id = a.mentorshipid || a.MentorshipID;
                    const status = a.status || a.Status;
                    return (
                      <tr key={id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-stone-900">#{id}</td>
                        <td className="px-4 py-3">
                          <p className="font-serif font-bold text-stone-900">{a.mentorname}</p>
                          <p className="text-[11px] text-stone-400">{a.mentordepartment}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <p className="font-serif font-bold text-stone-900">{a.menteename}</p>
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#F4EFE6] rounded-md text-stone-600 font-semibold">
                              Yr {a.menteeyear}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400">{a.menteedepartment}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-stone-700">
                          {formatDate(a.startdate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-stone-900">
                            {a.completedmeetings || 0}
                          </span>
                          <span className="text-stone-400"> / </span>
                          <span className="text-stone-600">{a.totalmeetings || 0} sessions</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                              status === 'Active'
                                ? 'bg-[#F5F7F4] text-[#435940] border-[#CCD7C9]'
                                : status === 'Completed'
                                ? 'bg-[#FAF8F5] text-stone-700 border-[#DCD0BD]'
                                : 'bg-[#FDF7F4] text-[#863B20] border-[#F2D3C4]'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {status === 'Active' ? (
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(id, 'Completed')}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#435940] bg-[#F5F7F4] hover:bg-[#E6EBE4] rounded-lg transition-colors border border-[#CCD7C9]"
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(id, 'Terminated')}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#863B20] bg-[#FDF7F4] hover:bg-[#F9EBE4] rounded-lg transition-colors border border-[#F2D3C4]"
                              >
                                Terminate
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auto-Match Preview Modal */}
          <Modal
            isOpen={isAutoMatchModalOpen}
            onClose={() => setIsAutoMatchModalOpen(false)}
            title="Automatic Mentor Matching"
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Matches are suggested for unassigned students by prioritizing shared skills, department alignment, and faculty advising availability.
              </p>

              {autoMatchPreview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs font-semibold text-stone-800">
                    <span>Suggested Pairings: {autoMatchPreview.matchesCount}</span>
                    <span className="text-[#577254] font-bold">Ready to Assign</span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {autoMatchPreview.matches.map((m, idx) => (
                      <div key={idx} className="p-3 bg-white border border-[#E6E0D5] rounded-lg shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-[#577254]" />
                            <span className="font-serif font-bold text-stone-900 text-xs">{m.menteeName}</span>
                            <ArrowRight className="w-3 h-3 text-stone-400" />
                            <BookOpen className="w-4 h-4 text-[#A44D2D]" />
                            <span className="font-serif font-bold text-[#A44D2D] text-xs">{m.mentorName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F5F7F4] text-[#435940] border border-[#CCD7C9]">
                            {m.matchScore}% Match
                          </span>
                        </div>

                        {m.matchedSkills && m.matchedSkills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                            <span className="text-stone-400 font-semibold">Matched:</span>
                            {m.matchedSkills.map((sk, sidx) => (
                              <span key={sidx} className="px-1.5 py-0.5 bg-[#FAF8F5] text-stone-700 rounded-md font-medium border border-[#E6E0D5]">
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E0D5]">
                    <button
                      type="button"
                      onClick={() => setIsAutoMatchModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isApplyingAutoMatch}
                      onClick={handleApplyAutoMatch}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#577254] hover:bg-[#435940] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isApplyingAutoMatch ? 'Saving...' : 'Confirm & Assign'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-stone-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#A44D2D] mb-2" />
                  Finding best mentor matches...
                </div>
              )}
            </div>
          </Modal>

          {/* Confirmation Popup Modal */}
          <ConfirmationPopup
            isOpen={confirmationPopup.isOpen}
            onClose={() => setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))}
            title={confirmationPopup.title}
            message={confirmationPopup.message}
            type={confirmationPopup.type}
          />

          {/* Faculty Dossier Modal for Admin Inspection */}
          <FacultyDossierModal
            isOpen={!!selectedMentorForDossier}
            onClose={() => setSelectedMentorForDossier(null)}
            mentorId={selectedMentorForDossier?.userid || selectedMentorForDossier?.mentorId || selectedMentorForDossier}
            initialDossier={selectedMentorForDossier}
            hasActiveMentor={false}
          />
        </main>
      </div>
    </div>
  );
}
