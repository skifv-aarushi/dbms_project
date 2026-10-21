import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menteeApi } from '../../api/mentee.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import {
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
  Star,
  RefreshCw,
  Mail,
  Phone,
  Compass,
  AlertCircle,
  Target,
  XCircle,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

export default function MenteeHome() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    confirmText: 'Done',
    secondaryText: null,
    onConfirm: null,
  });

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await menteeApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load mentee dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const promptTermination = () => {
    if (!mentor) return;
    setConfirmationPopup({
      isOpen: true,
      title: 'Terminate Mentorship Pairing?',
      message: `Are you sure you want to terminate your active mentorship with ${mentor.mentorname || 'your faculty mentor'}? This will officially conclude your advising sessions, cancel upcoming scheduled meetings, and allow you to select a new faculty mentor.`,
      type: 'warning',
      confirmText: 'Yes, Terminate Mentorship',
      secondaryText: 'Keep Mentorship',
      onConfirm: handleConfirmTermination,
    });
  };

  const handleConfirmTermination = async () => {
    setIsTerminating(true);
    try {
      const res = await menteeApi.terminateMentorship();
      await fetchDashboard();
      setConfirmationPopup({
        isOpen: true,
        title: 'Mentorship Terminated',
        message: res.message || 'Your mentorship pairing has been successfully concluded.',
        type: 'success',
        confirmText: 'Done',
        secondaryText: null,
        onConfirm: null,
      });
    } catch (err) {
      setConfirmationPopup({
        isOpen: true,
        title: 'Termination Failed',
        message: err.response?.data?.error || 'Failed to terminate mentorship. Please try again.',
        type: 'error',
        confirmText: 'Dismiss',
        secondaryText: null,
        onConfirm: null,
      });
    } finally {
      setIsTerminating(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const profile = data?.profile || {};
  const mentor = data?.activeMentorship || null;
  const meetings = data?.meetings || [];
  const progressRecords = data?.progressRecords || [];
  const skills = profile.skills || [];

  const pastMeetings = meetings.filter((m) => m.status === 'Completed');

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-[#A44D2D]" />
                Student Dashboard
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Track meetings, connect with your faculty mentor, and view academic progress
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#A44D2D] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Profile Hero Card */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#F5F7F4] text-[#435940] border border-[#CCD7C9] mb-3">
                  <GraduationCap className="w-3.5 h-3.5" /> Student Profile
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">{profile.name}</h2>
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  {profile.department} &bull; Year {profile.year || '3'} &bull; {profile.email}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#FAF8F5] text-stone-700 rounded-md border border-[#E6E0D5]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[#FAF8F5] p-4 sm:p-5 rounded-xl border border-[#E6E0D5]">
                <div className="text-center px-4 border-r border-[#E6E0D5]">
                  <span className="text-[10px] uppercase font-semibold text-stone-500 block">Current CGPA</span>
                  <div className="flex items-center justify-center gap-1 text-2xl sm:text-3xl font-serif font-bold text-[#945C10] mt-0.5">
                    <Star className="w-5 h-5 fill-[#D4922A] text-[#D4922A]" />
                    <span>{profile.cgpa ? parseFloat(profile.cgpa).toFixed(2) : '9.00'}</span>
                  </div>
                </div>
                <div className="text-center px-4">
                  <span className="text-[10px] uppercase font-semibold text-stone-500 block">Completed</span>
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5 block">
                    {pastMeetings.length}
                  </span>
                  <span className="text-[10px] text-stone-400">Sessions</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Assigned Mentor Card (Left Column) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#E6E0D5]">
                  <BookOpen className="w-5 h-5 text-[#A44D2D]" />
                  <h3 className="text-base font-serif font-bold text-stone-900">Assigned Mentor</h3>
                </div>

                {mentor ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5]">
                      <div className="w-12 h-12 rounded-lg bg-[#FDF7F4] text-[#A44D2D] border border-[#F2D3C4] font-serif font-bold text-lg flex items-center justify-center mb-3">
                        {mentor.mentorname ? mentor.mentorname.charAt(0) : 'M'}
                      </div>
                      <h4 className="font-serif font-bold text-stone-900 text-base">{mentor.mentorname}</h4>
                      <p className="text-xs font-semibold text-[#A44D2D]">{mentor.mentordesignation}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{mentor.mentordepartment}</p>
                    </div>

                    <div className="space-y-2.5 text-xs text-stone-600">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E0D5]">
                        <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate font-medium">{mentor.mentoremail}</span>
                      </div>
                      {mentor.mentorphone && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E0D5]">
                          <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="font-medium">{mentor.mentorphone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E0D5]">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="font-medium">Active Since: {formatDate(mentor.startdate)}</span>
                      </div>
                      
                      <div className="pt-2 space-y-2">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E6E0D5] text-[11px] text-stone-500 flex items-start gap-2">
                          <span className="text-amber-600 font-bold">ℹ️</span>
                          <span>Institutional Policy: Mentorship pairings remain active for the full semester unless officially terminated.</span>
                        </div>

                        <button
                          type="button"
                          onClick={promptTermination}
                          className="w-full text-xs font-semibold text-[#863B20] hover:text-white hover:bg-[#863B20] flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-[#F2D3C4] bg-[#FDF7F4] transition-colors shadow-2xs"
                        >
                          <XCircle className="w-4 h-4" />
                          Terminate Mentorship
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs bg-[#FAF8F5] rounded-xl border border-dashed border-[#E6E0D5]">
                    <div className="w-10 h-10 rounded-lg bg-[#FDF9EF] text-[#B8781B] border border-[#F5DEB0] flex items-center justify-center mx-auto mb-3">
                      <Compass className="w-5 h-5" />
                    </div>
                    <p className="font-serif font-bold text-stone-800 text-sm">No Mentor Assigned Yet</p>
                    <p className="text-stone-500 text-xs mt-1 mb-4 leading-relaxed">
                      Explore faculty mentors in your department and find a mentor who matches your academic interests.
                    </p>
                    <Link
                      to="/mentee/find-mentor"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#A44D2D] hover:bg-[#863B20] text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                    >
                      <Target className="w-4 h-4" />
                      Find a Mentor
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Roadmap (Right Column) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#E6E0D5] mb-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#A44D2D]" />
                    <h3 className="text-base font-serif font-bold text-stone-900">Meetings &amp; Advising Sessions</h3>
                  </div>
                  <span className="text-xs font-semibold text-stone-700 bg-[#F4EFE6] px-2.5 py-0.5 rounded-lg border border-[#E6E0D5]">
                    {meetings.length} Total Sessions
                  </span>
                </div>

                {meetings.length === 0 ? (
                  <div className="p-10 text-center text-xs text-stone-400">
                    No mentorship meetings have been scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {meetings.map((mt) => {
                      const isCompleted = mt.status === 'Completed';
                      return (
                        <div
                          key={mt.meetingid}
                          className="p-4 rounded-xl border border-[#E6E0D5] hover:border-[#C7B59D] transition-colors bg-white shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-stone-900">
                                  {formatDateTime(mt.meetingdate, mt.meetingtime)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    mt.mode === 'Online'
                                      ? 'bg-[#FAF8F5] text-stone-700 border-[#E6E0D5]'
                                      : 'bg-[#FDF9EF] text-[#945C10] border-[#F5DEB0]'
                                  }`}
                                >
                                  {mt.mode}
                                </span>
                              </div>

                              {mt.discussion && (
                                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                                  {mt.discussion}
                                </p>
                              )}
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold shrink-0 border ${
                                isCompleted
                                  ? 'bg-[#F5F7F4] text-[#435940] border-[#CCD7C9]'
                                  : 'bg-[#FDF7F4] text-[#A44D2D] border-[#F2D3C4]'
                              }`}
                            >
                              {mt.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Academic & Attendance Progress Logs */}
          <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E6E0D5]">
              <Award className="w-5 h-5 text-[#577254]" />
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">
                  Academic Progress &amp; Attendance
                </h3>
                <p className="text-xs text-stone-400">
                  Evaluations and attendance updates from your mentor
                </p>
              </div>
            </div>

            {progressRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No formal evaluations recorded yet by your faculty mentor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-[#FAF8F5] text-stone-500 uppercase font-semibold text-[10px] border-b border-[#E6E0D5]">
                    <tr>
                      <th className="px-4 py-3">Evaluation Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Attendance %</th>
                      <th className="px-4 py-3">Mentor Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E0D5] font-medium">
                    {progressRecords.map((pr) => (
                      <tr key={pr.progressid} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="px-4 py-3 font-semibold text-stone-800">
                          {formatDate(pr.updateddate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-serif font-bold text-stone-900">{pr.academicprogress}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#F5F7F4] text-[#435940] border border-[#CCD7C9]">
                            {parseFloat(pr.attendancepercentage).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-600 max-w-md">{pr.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmationPopup
        isOpen={confirmationPopup.isOpen}
        onClose={() => setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationPopup.onConfirm}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        type={confirmationPopup.type}
        confirmText={confirmationPopup.confirmText}
        secondaryText={confirmationPopup.secondaryText}
        onSecondary={() => setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))}
        isSubmitting={isTerminating}
      />
    </div>
  );
}
