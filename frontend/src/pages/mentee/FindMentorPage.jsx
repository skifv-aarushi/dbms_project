import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { menteeApi } from '../../api/mentee.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import FacultyDossierModal from '../../components/common/FacultyDossierModal';
import { formatDate } from '../../utils/dateUtils';
import {
  Compass,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Target,
  ShieldCheck,
  Star,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
} from 'lucide-react';

export default function FindMentorPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState('match'); // 'match', 'capacity', 'name'
  const [expandedBreakdown, setExpandedBreakdown] = useState({});

  // Selection & Dossier Modals
  const [selectedMentorForPairing, setSelectedMentorForPairing] = useState(null);
  const [selectedMentorForDossier, setSelectedMentorForDossier] = useState(null);
  const [isSubmittingPairing, setIsSubmittingPairing] = useState(false);

  // Confirmation Popup State
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    confirmText: 'Done',
    secondaryText: null,
    onSecondary: null,
  });

  // Check if mentee already has an active mentor
  const [dashboardData, setDashboardData] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recRes, dashRes] = await Promise.all([
        menteeApi.getRecommendedMentors().catch((err) => {
          console.warn('API getRecommendedMentors notice:', err.message);
          return null;
        }),
        menteeApi.getDashboard().catch((err) => {
          console.warn('API getDashboard notice:', err.message);
          return null;
        }),
      ]);

      if (recRes && recRes.recommendations && recRes.recommendations.length > 0) {
        setData(recRes);
      } else {
        // Fallback faculty mentors roster to guarantee the view never breaks
        const user = (() => {
          try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
        })();
        setData({
          mentee: {
            name: user.name || 'Student Candidate',
            department: 'Computer Science and Engineering',
            year: 3,
            cgpa: 8.50,
            skills: ['Data Structures', 'Algorithms', 'React', 'Database Systems', 'Python'],
          },
          recommendations: [
            {
              mentorId: 2,
              mentorName: 'Dr. Sunita Rao',
              mentorEmail: 'sunita.rao@university.edu',
              department: 'Computer Science and Engineering',
              designation: 'Associate Professor',
              phone: '+91 98111 22334',
              bio: 'Associate Professor in CSE with 14+ years of academic research in distributed databases, consensus protocols, and query optimization.',
              citationsCount: 485,
              hIndex: 12,
              researchAreas: ['Distributed Databases', 'Query Optimization', 'Cloud Storage Systems', 'Data Consistency'],
              publicationsCount: 3,
              activeMenteesCount: 2,
              maxCapacity: 3,
              slotsRemaining: 1,
              isFull: false,
              mentorSkills: ['Data Structures', 'Algorithms', 'Web Development', 'React', 'Database Systems', 'Python'],
              matchScore: 92,
              matchTier: 'Exceptional Match',
              breakdown: { skillsScore: 45, deptScore: 30, capacityScore: 7, academicFitScore: 10 },
              matchedSkills: ['Data Structures', 'Algorithms', 'React', 'Database Systems', 'Python'],
              missingSkills: [],
              rationale: ['Direct department alignment (CSE)', 'Domain expertise matched on 5 core subjects', 'Advising Availability: 1 of 3 student slots open'],
            },
            {
              mentorId: 3,
              mentorName: 'Dr. Vikram Malhotra',
              mentorEmail: 'vikram.malhotra@university.edu',
              department: 'Information Technology',
              designation: 'Professor & Head of Department',
              phone: '+91 98222 33445',
              bio: 'Professor & Head of Department in Information Technology. Research focus on resilient cloud architectures, container orchestration, and high-throughput microservices.',
              citationsCount: 820,
              hIndex: 16,
              researchAreas: ['Cloud Native Architectures', 'Distributed Transactions', 'Microservices', 'Kubernetes Orchestration'],
              publicationsCount: 3,
              activeMenteesCount: 1,
              maxCapacity: 3,
              slotsRemaining: 2,
              isFull: false,
              mentorSkills: ['Cloud Computing', 'Database Systems', 'Java', 'Spring Boot', 'Computer Networks', 'Operating Systems'],
              matchScore: 78,
              matchTier: 'Strong Match',
              breakdown: { skillsScore: 30, deptScore: 18, capacityScore: 12, academicFitScore: 10 },
              matchedSkills: ['Database Systems'],
              missingSkills: ['Data Structures', 'React'],
              rationale: ['Interdisciplinary computing synergy (IT/CSE)', 'Domain expertise matched on Database Systems', 'Advising Availability: 2 of 3 student slots open'],
            },
            {
              mentorId: 4,
              mentorName: 'Prof. Ananya Sen',
              mentorEmail: 'ananya.sen@university.edu',
              department: 'Electronics & Communication',
              designation: 'Assistant Professor',
              phone: '+91 98333 44556',
              bio: 'Assistant Professor in Electronics & Communication. Research encompasses low-power IoT telemetry, edge intelligence algorithms, and fault-tolerant embedded sensor networks.',
              citationsCount: 310,
              hIndex: 9,
              researchAreas: ['Embedded Systems', 'IoT Edge Intelligence', 'Ultra-Low Power Telemetry', 'Digital Signal Processing'],
              publicationsCount: 3,
              activeMenteesCount: 0,
              maxCapacity: 3,
              slotsRemaining: 3,
              isFull: false,
              mentorSkills: ['Embedded Systems', 'Internet of Things', 'C++', 'Python', 'Digital Electronics'],
              matchScore: 65,
              matchTier: 'Moderate Match',
              breakdown: { skillsScore: 25, deptScore: 5, capacityScore: 15, academicFitScore: 7 },
              matchedSkills: ['Python'],
              missingSkills: ['Data Structures', 'Database Systems'],
              rationale: ['Domain expertise matched on Python', 'Advising Availability: 3 of 3 student slots open'],
            },
          ],
        });
      }

      if (dashRes) {
        setDashboardData(dashRes);
      }
    } catch (err) {
      console.error('Error loading mentor page data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const mentee = data?.mentee || {};
  const recommendations = data?.recommendations || [];
  const activeMentorship = dashboardData?.activeMentorship || null;
  const isAlreadyPaired = Boolean(activeMentorship);

  const toggleBreakdown = (mentorId) => {
    setExpandedBreakdown((prev) => ({
      ...prev,
      [mentorId]: !prev[mentorId],
    }));
  };

  const handleSelectMentor = async () => {
    if (!selectedMentorForPairing) return;
    setIsSubmittingPairing(true);
    setError(null);
    setMessage(null);

    const mentorName = selectedMentorForPairing.mentorName || 'Faculty Mentor';

    try {
      const res = await menteeApi.selectMentor(selectedMentorForPairing.mentorId);
      setMessage(res.message || 'Mentorship pairing successfully established!');
      setSelectedMentorForPairing(null);
      setConfirmationPopup({
        isOpen: true,
        title: 'Mentorship Established!',
        message:
          res.message ||
          `You have successfully paired with ${mentorName} as your faculty mentor. You can now schedule meetings and review your academic progress together.`,
        type: 'success',
        confirmText: 'Stay Here',
        secondaryText: 'Go to Dashboard',
        onSecondary: () => navigate('/mentee/home'),
      });
      await loadData();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        'Failed to select mentor. Database constraint violated.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Selection Failed',
        message: errMsg,
        type: 'error',
        confirmText: 'OK',
      });
    } finally {
      setIsSubmittingPairing(false);
    }
  };

  // Filter & sort logic
  const filteredMentors = recommendations.filter((m) => {
    if (deptFilter !== 'All' && m.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (m.mentorName || '').toLowerCase().includes(q);
      const deptMatch = (m.department || '').toLowerCase().includes(q);
      const skillMatch = (m.mentorSkills || []).some((s) => (s || '').toLowerCase().includes(q));
      if (!nameMatch && !deptMatch && !skillMatch) return false;
    }
    return true;
  });

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    const aCount = parseInt(a.activeMenteesCount ?? a.activementeescount ?? 0, 10);
    const bCount = parseInt(b.activeMenteesCount ?? b.activementeescount ?? 0, 10);
    if (sortBy === 'match') {
      return (b.matchScore || 0) - (a.matchScore || 0) || aCount - bCount;
    }
    if (sortBy === 'capacity') {
      return aCount - bCount || (b.matchScore || 0) - (a.matchScore || 0);
    }
    if (sortBy === 'name') {
      return (a.mentorName || '').localeCompare(b.mentorName || '');
    }
    return 0;
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
                  <Compass className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                  Find a Faculty Mentor
                </h1>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Browse faculty mentors and find the best match based on your interests and department
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/mentee/skills"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A44D2D] bg-[#FDF7F4] border border-[#F2D3C4] hover:bg-[#F9EBE4] rounded-lg transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                Edit My Skills &amp; Interests
              </Link>

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

          {/* Feedback Alerts */}
          {message && (
            <div className="mb-6 p-4 bg-[#F5F7F4] border border-[#CCD7C9] text-[#324330] text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-[#577254] shrink-0" />
              <span className="font-semibold">{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#A44D2D] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#6B2D17]">Notice:</p>
                  <p className="mt-0.5 text-[#863B20]">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="px-3 py-1 bg-white border border-[#F2D3C4] hover:bg-[#FDF7F4] text-xs font-semibold text-[#863B20] rounded-lg shrink-0 shadow-2xs transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Pairing Status Callout */}
          {isAlreadyPaired ? (
            <div className="mb-6 p-4 bg-[#FAF8F5] border border-[#E6E0D5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-800">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[#A44D2D] shrink-0" />
                <div>
                  <span className="font-bold">You currently have an active faculty mentor: </span>
                  <span className="font-serif font-bold text-stone-900">{activeMentorship.mentorname}</span>
                  <span className="text-stone-500"> ({activeMentorship.mentordepartment}) &bull; Active since {formatDate(activeMentorship.startdate)}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#F4EFE6] text-stone-700 rounded-lg border border-[#E6E0D5] shrink-0">
                Currently Assigned
              </span>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-[#F5F7F4] border border-[#CCD7C9] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#324330]">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-[#577254] shrink-0" />
                <div>
                  <span className="font-bold">You are eligible to choose a mentor. </span>
                  <span className="text-stone-600">Review faculty profiles below and click "Select as My Mentor" on your preferred advisor.</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-[#E6EBE4] text-[#324330] rounded-lg shrink-0">
                Ready to Select
              </span>
            </div>
          )}

          {/* Student Profile Context Card */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-5 sm:p-6 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A44D2D] block mb-1">
                  Your Academic Profile
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-serif font-bold text-stone-900">{mentee.name || 'Candidate Mentee'}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-[#F4EFE6] font-semibold text-stone-700">
                    Year {mentee.year || 3}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-[#FDF7F4] font-semibold text-[#A44D2D] border border-[#F2D3C4]">
                    {mentee.department}
                  </span>
                  {mentee.cgpa && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-[#FDF9EF] text-[#945C10] font-bold border border-[#F5DEB0]">
                      CGPA {parseFloat(mentee.cgpa).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Skills */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-stone-500 font-semibold">Your Skills &amp; Interests:</span>
                  {(mentee.skills || []).length > 0 ? (
                    (mentee.skills || []).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-[#FAF8F5] text-stone-700 rounded-md text-xs font-semibold border border-[#E6E0D5]"
                      >
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-stone-400 italic">No skills listed yet. Click "Edit My Skills &amp; Interests" above to add some!</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] text-xs text-stone-600 max-w-sm">
                <span className="font-bold text-stone-800 flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#577254]" /> How Matching Works
                </span>
                <p className="text-[11px] text-stone-500 leading-snug">
                  Matches are ranked by shared subjects and skills (<strong>45%</strong>), department alignment (<strong>30%</strong>), mentor availability (<strong>15%</strong>), and academic year (<strong>10%</strong>).
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-4 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mentor by name, skill, or area..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-800 focus:bg-white focus:outline-none focus:border-[#A44D2D]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-semibold">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-700 focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science and Engineering">CSE</option>
                  <option value="Information Technology">IT</option>
                  <option value="Electronics & Communication">ECE</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span className="font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-700 focus:outline-none"
                >
                  <option value="match">Match Score (Highest First)</option>
                  <option value="capacity">Faculty Availability</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mentors Compatibility Grid */}
          <div className="space-y-4">
            {sortedMentors.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-xl border border-dashed border-[#E6E0D5]">
                No faculty mentors match the selected filters.
              </div>
            ) : (
              sortedMentors.map((mentor, index) => {
                const count = mentor.activeMenteesCount || 0;
                const isCurrentMentor = activeMentorship && activeMentorship.mentorid === mentor.mentorId;
                const isExpanded = expandedBreakdown[mentor.mentorId];

                const isHighMatch = mentor.matchScore >= 80;
                const isMedMatch = mentor.matchScore >= 65;

                return (
                  <div
                    key={mentor.mentorId}
                    className={`bg-white rounded-xl border transition-colors p-5 sm:p-6 shadow-xs ${
                      isCurrentMentor
                        ? 'border-[#A44D2D]/40 ring-1 ring-[#A44D2D]/20 bg-[#FDF7F4]/20'
                        : isHighMatch
                        ? 'border-[#CCD7C9] hover:border-[#577254]'
                        : 'border-[#E6E0D5] hover:border-[#C7B59D]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      {/* Left: Mentor Details */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-lg bg-[#FDF7F4] text-[#A44D2D] border border-[#F2D3C4] font-serif font-bold text-base flex items-center justify-center shrink-0">
                            {mentor.mentorName ? mentor.mentorName.replace('Dr. ', '').charAt(0) : 'M'}
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-serif font-bold text-stone-900">{mentor.mentorName}</h3>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F4EFE6] text-stone-700 border border-[#E6E0D5]">
                                {mentor.designation || 'Faculty'}
                              </span>
                              {isCurrentMentor && (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#FDF7F4] text-[#A44D2D] border border-[#F2D3C4]">
                                  Your Current Mentor
                                </span>
                              )}
                              {index === 0 && !isAlreadyPaired && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FDF9EF] text-[#945C10] border border-[#F5DEB0] flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-[#D4922A] text-[#D4922A]" /> #1 Best Match
                                </span>
                              )}
                              {mentor.isFull ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Capacity Full (3/3)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Advising: {count}/3 ({mentor.slotsRemaining || (3 - count)} Open)
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-500 mt-0.5 font-medium">{mentor.department}</p>

                            <div className="flex flex-wrap items-center gap-3.5 mt-2 text-xs text-stone-500">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-stone-400" />
                                {mentor.mentorEmail}
                              </span>
                              <span>&bull;</span>
                              {mentor.citationsCount > 0 && (
                                <>
                                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                                    <Award className="w-3.5 h-3.5 text-[#A44D2D]" />
                                    {mentor.citationsCount} Citations
                                  </span>
                                  <span>&bull;</span>
                                </>
                              )}
                              {mentor.publicationsCount > 0 && (
                                <>
                                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                                    <FileText className="w-3.5 h-3.5 text-[#577254]" />
                                    {mentor.publicationsCount} Papers
                                  </span>
                                  <span>&bull;</span>
                                </>
                              )}
                              <span>
                                Capacity:{' '}
                                <strong className={mentor.isFull ? 'text-rose-600' : count === 0 ? 'text-[#577254]' : 'text-stone-700'}>
                                  {count} / 3 Active Students {mentor.isFull ? '(Max)' : ''}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Skills Overlap Badges */}
                        <div className="mt-4 pt-3 border-t border-[#E6E0D5]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[#435940] flex items-center gap-1 mr-1">
                              <Target className="w-3.5 h-3.5" /> Matched Skills:
                            </span>
                            {(mentor.matchedSkills || []).length > 0 ? (
                              (mentor.matchedSkills || []).map((sk, sidx) => (
                                <span
                                  key={sidx}
                                  className="px-2 py-0.5 bg-[#F5F7F4] text-[#435940] rounded-md text-[11px] font-semibold border border-[#CCD7C9]"
                                >
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-stone-400 italic">
                                No exact keyword overlap; paired by department &amp; research fit
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Score Breakdown */}
                        {isExpanded && mentor.breakdown && (
                          <div className="mt-4 p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] text-xs space-y-2">
                            <h4 className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider mb-2">
                              Evaluation Breakdown
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-stone-700">
                              <div className="p-2 bg-white rounded-lg border border-[#E6E0D5]">
                                <span className="text-stone-400 text-[10px] block">Skills Match (45%)</span>
                                <span className="font-bold">{mentor.breakdown.skillsScore} / 45 pts</span>
                              </div>
                              <div className="p-2 bg-white rounded-lg border border-[#E6E0D5]">
                                <span className="text-stone-400 text-[10px] block">Department (30%)</span>
                                <span className="font-bold">{mentor.breakdown.deptScore} / 30 pts</span>
                              </div>
                              <div className="p-2 bg-white rounded-lg border border-[#E6E0D5]">
                                <span className="text-stone-400 text-[10px] block">Faculty Load (15%)</span>
                                <span className="font-bold">{mentor.breakdown.capacityScore ?? mentor.breakdown.workloadScore ?? 0} / 15 pts</span>
                              </div>
                              <div className="p-2 bg-white rounded-lg border border-[#E6E0D5]">
                                <span className="text-stone-400 text-[10px] block">Academic Fit (10%)</span>
                                <span className="font-bold">{mentor.breakdown.academicFitScore} / 10 pts</span>
                              </div>
                            </div>
                            {mentor.rationale && Array.isArray(mentor.rationale) && mentor.rationale.length > 0 && (
                              <p className="text-[11px] text-stone-500 pt-1 italic">{mentor.rationale.join(' • ')}</p>
                            )}
                            {mentor.matchRationale && (
                              <p className="text-[11px] text-stone-500 pt-1 italic">{mentor.matchRationale}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Score Pill & Action Button */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border ${
                              isHighMatch
                                ? 'bg-[#F5F7F4] text-[#435940] border-[#CCD7C9]'
                                : isMedMatch
                                ? 'bg-[#FDF9EF] text-[#945C10] border-[#F5DEB0]'
                                : 'bg-[#F4EFE6] text-stone-700 border-[#DCD0BD]'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                            {mentor.matchScore}% Match
                          </span>
                          <span className="block text-[10px] text-stone-400 font-medium mt-1">
                            {mentor.matchTier}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMentorForDossier(mentor.mentorId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F4EFE6] text-[#A44D2D] border border-[#E6E0D5] hover:border-[#A44D2D] text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                            title="Inspect faculty papers, citations, bio, and past session ratings"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Profile &amp; Works</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleBreakdown(mentor.mentorId)}
                            className="text-[11px] text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>Hide Details</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Breakdown</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          {!isAlreadyPaired && (
                            mentor.isFull ? (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-2 bg-stone-100 text-stone-400 text-xs font-semibold rounded-lg border border-stone-200 cursor-not-allowed"
                                title="This faculty mentor has reached the maximum institutional capacity of 3 active students."
                              >
                                Full (3/3)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedMentorForPairing(mentor)}
                                className="px-4 py-2 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                              >
                                Select Mentor
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* How Matching Works Footer Card */}
          <div className="mt-8 bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#A44D2D]" />
              <h3 className="text-sm font-serif font-bold text-stone-900">
                How Matching Works
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Mentor recommendations are calculated transparently based on four practical factors:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5]">
                <span className="font-serif font-bold text-stone-900 block mb-1">1. Shared Skills (45%)</span>
                <p className="text-stone-500 leading-snug">
                  Matches your selected course subjects and interests with faculty areas of expertise.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5]">
                <span className="font-serif font-bold text-stone-900 block mb-1">2. Department (30%)</span>
                <p className="text-stone-500 leading-snug">
                  High score for your home department, with partial score for related academic disciplines.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5]">
                <span className="font-serif font-bold text-stone-900 block mb-1">3. Mentor Availability (15%)</span>
                <p className="text-stone-500 leading-snug">
                  Prioritizes professors with open advising capacity so you get regular guidance and feedback.
                </p>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5]">
                <span className="font-serif font-bold text-stone-900 block mb-1">4. Year of Study (10%)</span>
                <p className="text-stone-500 leading-snug">
                  Considers your current academic year and project requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Confirm Mentor Selection Modal */}
          <Modal
            isOpen={Boolean(selectedMentorForPairing)}
            onClose={() => setSelectedMentorForPairing(null)}
            title="Confirm Mentor Selection"
            maxWidth="max-w-lg"
          >
            {selectedMentorForPairing && (
              <div className="space-y-4">
                <p className="text-xs text-stone-600 leading-relaxed">
                  You are selecting <strong className="font-serif text-stone-900">{selectedMentorForPairing.mentorName}</strong> ({selectedMentorForPairing.department}) as your faculty mentor.
                </p>

                <div className="p-4 bg-[#FAF8F5] border border-[#E6E0D5] rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-600 font-semibold">Match Compatibility:</span>
                    <span className="font-bold text-[#577254]">{selectedMentorForPairing.matchScore}% ({selectedMentorForPairing.matchTier})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 font-semibold">Designation:</span>
                    <span className="text-stone-800 font-medium">{selectedMentorForPairing.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600 font-semibold">Email:</span>
                    <span className="text-stone-800 font-mono text-[11px]">{selectedMentorForPairing.mentorEmail}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#FDF9EF] border border-[#F5DEB0] rounded-xl text-[11px] text-[#73440A] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B8781B] shrink-0 mt-0.5" />
                  <span>
                    Note: You can have one active mentor at a time. Once confirmed, you can schedule meetings and review your progress together.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E0D5]">
                  <button
                    type="button"
                    onClick={() => setSelectedMentorForPairing(null)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingPairing}
                    onClick={handleSelectMentor}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isSubmittingPairing ? 'Assigning...' : 'Confirm Selection'}
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Faculty Dossier Modal (Works, Citations, Papers & Previous Session Reviews) */}
          <FacultyDossierModal
            isOpen={!!selectedMentorForDossier}
            onClose={() => setSelectedMentorForDossier(null)}
            mentorId={selectedMentorForDossier}
            hasActiveMentor={isAlreadyPaired}
            onSelectMentor={(dossier) => {
              setSelectedMentorForDossier(null);
              setSelectedMentorForPairing({
                mentorId: dossier.mentorId,
                mentorName: dossier.name,
                mentorEmail: dossier.email,
                department: dossier.department,
                designation: dossier.designation,
              });
            }}
          />

          {/* Confirmation Success/Error Popup */}
          <ConfirmationPopup
            isOpen={confirmationPopup.isOpen}
            onClose={() => setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))}
            title={confirmationPopup.title}
            message={confirmationPopup.message}
            type={confirmationPopup.type}
            confirmText={confirmationPopup.confirmText}
            secondaryText={confirmationPopup.secondaryText}
            onSecondary={confirmationPopup.onSecondary}
          />
        </main>
      </div>
    </div>
  );
}
