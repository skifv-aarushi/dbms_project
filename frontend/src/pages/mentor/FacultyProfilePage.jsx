import React, { useState, useEffect } from 'react';
import { mentorApi } from '../../api/mentor.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import FacultyDossierModal from '../../components/common/FacultyDossierModal';
import { formatDate } from '../../utils/dateUtils';
import {
  Award,
  BookOpen,
  FileText,
  Star,
  Users,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mentorApi.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load faculty academic profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const capacity = profile?.capacity || {
    activeMenteesCount: 0,
    maxCapacity: 3,
    slotsRemaining: 3,
    isFull: false,
    capacityPercentage: 0,
  };

  const isFull = capacity.activeMenteesCount >= capacity.maxCapacity;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Award className="w-6 h-6 text-[#A44D2D]" />
                Faculty Academic Profile &amp; Research
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                View your scholarly publications, citations, advising capacity, and student session reviews
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={!profile}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#A44D2D] bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
                title="See how prospective student mentees view your profile"
              >
                <Eye className="w-4 h-4" />
                <span>Student View Preview</span>
              </button>

              <button
                onClick={fetchProfile}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-24 text-center text-xs text-stone-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#A44D2D] mb-3" />
              Loading faculty academic profile and research portfolio...
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Faculty Hero Dossier Card */}
              <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#F5F7F4] text-[#435940] border border-[#CCD7C9] mb-3">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Faculty Member &bull; {profile.department}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                      {profile.name}
                    </h2>
                    <p className="text-xs text-[#A44D2D] font-semibold mt-1">
                      {profile.designation}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {profile.email}
                      </span>
                      {profile.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          {profile.phone}
                        </span>
                      )}
                      {profile.googleScholarUrl && (
                        <a
                          href={profile.googleScholarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#A44D2D] hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Google Scholar Profile
                        </a>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="mt-4 text-xs text-stone-600 leading-relaxed max-w-3xl">
                        {profile.bio}
                      </p>
                    )}

                    {profile.researchAreas && profile.researchAreas.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-stone-400 mr-1 uppercase tracking-wider">
                          Research Focus:
                        </span>
                        {profile.researchAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FAF8F5] text-stone-700 border border-[#E6E0D5]"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Advising Capacity Card */}
                  <div className={`p-5 rounded-xl border text-center sm:text-right shrink-0 min-w-[240px] ${
                    isFull
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-xs font-bold mb-1">
                      {isFull ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Full Advising Capacity</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          <span>Advising Slots Available</span>
                        </>
                      )}
                    </div>

                    <div className="text-3xl font-serif font-extrabold my-1">
                      {capacity.activeMenteesCount} / {capacity.maxCapacity}
                    </div>
                    <div className="text-xs text-stone-600 font-medium">
                      Active Student Mentees (Hard Cap: 3)
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-3 w-full bg-white rounded-full h-2 overflow-hidden border border-[#E6E0D5]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFull ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, (capacity.activeMenteesCount / capacity.maxCapacity) * 100)}%` }}
                      ></div>
                    </div>

                    <p className="mt-2 text-[10px] text-stone-500">
                      {isFull
                        ? 'Maximum student limit reached for this term'
                        : `${capacity.slotsRemaining} student slot(s) currently open`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Research Metrics & Scholarly Impact */}
              <div>
                <h3 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#A44D2D]" />
                  Scholarly Research Metrics &amp; Mentoring Performance
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-[#E6E0D5] shadow-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                      Scholarly Citations
                    </span>
                    <div className="text-2xl font-serif font-bold text-stone-900">
                      {profile.citationsCount || 0}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Indexed across research publications
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E6E0D5] shadow-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                      Faculty h-index
                    </span>
                    <div className="text-2xl font-serif font-bold text-[#A44D2D]">
                      {profile.hIndex || 0}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Academic productivity &amp; citation impact
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E6E0D5] shadow-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                      Refereed Publications
                    </span>
                    <div className="text-2xl font-serif font-bold text-stone-900">
                      {profile.publications?.length || 0}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Peer-reviewed journal &amp; conference papers
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-[#E6E0D5] shadow-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                      Student Satisfaction
                    </span>
                    <div className="text-2xl font-serif font-bold text-[#577254] flex items-center gap-1">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      {profile.trackRecord?.avgStudentSatisfaction
                        ? `${profile.trackRecord.avgStudentSatisfaction} / 5`
                        : '5.0 / 5'}
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      From {profile.trackRecord?.completedSessions || 0} completed mentoring sessions
                    </span>
                  </div>
                </div>
              </div>

              {/* Refereed Papers & Publications */}
              <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#A44D2D]" />
                    Refereed Publications &amp; Works ({profile.publications?.length || 0})
                  </h3>
                  <span className="text-xs text-stone-400 font-medium">
                    Verified scholarly bibliography
                  </span>
                </div>

                <div className="space-y-3">
                  {profile.publications && profile.publications.length > 0 ? (
                    profile.publications.map((pub, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] hover:border-[#D6CEC0] transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-serif font-bold text-stone-900">
                              {pub.title}
                            </h4>
                            <p className="text-xs text-stone-600">
                              <span className="font-semibold italic">{pub.journal}</span> &bull; {pub.year}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-stone-800 border border-[#E6E0D5] shrink-0 self-start">
                            {pub.citations} Citations
                          </span>
                        </div>

                        {pub.paperUrl && (
                          <div className="mt-3 pt-2.5 border-t border-[#E6E0D5]/60 flex items-center justify-between text-xs">
                            <a
                              href={pub.paperUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#A44D2D] hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Publication DOI / Repository
                            </a>
                            <span className="text-stone-400 text-[11px]">Refereed Archival Record</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-400">
                      No publications currently listed.
                    </div>
                  )}
                </div>
              </div>

              {/* Current Active Mentees & 3-Slot Visual Roster */}
              <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#A44D2D]" />
                      Advising Roster &amp; Quota Slots ({capacity.activeMenteesCount} / 3 Assigned)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Each faculty member can actively mentor at most 3 students per semester.
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    isFull
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isFull ? 'Limit Reached' : `${capacity.slotsRemaining} Slot(s) Available`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((slotIdx) => {
                    const mentee = profile.activeMentees?.[slotIdx];
                    if (mentee) {
                      return (
                        <div
                          key={slotIdx}
                          className="p-4 rounded-xl border border-[#CCD7C9] bg-[#F5F7F4]/60 space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#435940]">
                              Mentee Slot #{slotIdx + 1} &bull; Active
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-white text-stone-700 font-semibold border border-[#CCD7C9]">
                              Year {mentee.year}
                            </span>
                          </div>

                          <h4 className="text-sm font-serif font-bold text-stone-900">
                            {mentee.menteeName}
                          </h4>
                          <p className="text-xs text-stone-500">
                            {mentee.department} &bull; CGPA {mentee.cgpa}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Pairing Active Since {formatDate(mentee.startDate)}
                          </p>

                          {mentee.skills && mentee.skills.length > 0 && (
                            <div className="pt-2 border-t border-[#CCD7C9]/60 flex flex-wrap gap-1">
                              {mentee.skills.slice(0, 3).map((sk, sidx) => (
                                <span
                                  key={sidx}
                                  className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-[#CCD7C9] text-stone-600"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slotIdx}
                        className="p-4 rounded-xl border border-dashed border-[#E6E0D5] bg-[#FAF8F5]/60 flex flex-col items-center justify-center text-center py-8"
                      >
                        <div className="w-8 h-8 rounded-full bg-white border border-[#E6E0D5] flex items-center justify-center text-stone-400 mb-2">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-stone-700">
                          Slot #{slotIdx + 1} Available
                        </span>
                        <p className="text-[11px] text-stone-400 mt-1 max-w-[180px]">
                          Open for student mentorship requests based on mutual compatibility
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Previous Mentoring Sessions & Longitudinal Feedback */}
              <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#A44D2D]" />
                    Mentoring Session History &amp; Student Evaluations ({profile.previousSessions?.length || 0})
                  </h3>
                  <span className="text-xs text-stone-400 font-medium">
                    Verified session feedback logs
                  </span>
                </div>

                <div className="space-y-3">
                  {profile.previousSessions && profile.previousSessions.length > 0 ? (
                    profile.previousSessions.map((session, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] text-xs space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-stone-900 text-sm">
                              {session.menteeDisplayName}
                            </span>
                            <span className="text-stone-400">
                              ({session.menteeDepartment} &bull; Year {session.menteeYear})
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-stone-500 text-[11px]">
                              {formatDate(session.meetingDate)} ({session.mode})
                            </span>
                            {session.menteeRating && (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-md border border-[#E6E0D5]">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {session.menteeRating} / 5
                              </span>
                            )}
                          </div>
                        </div>

                        {session.discussion && (
                          <p className="text-xs text-stone-600">
                            <strong className="text-stone-800">Topic: </strong>
                            {session.discussion}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E6E0D5]">
                          {session.menteeRemarks && (
                            <div className="p-3 bg-white rounded-lg border border-[#CCD7C9]">
                              <span className="text-[10px] font-bold text-[#435940] uppercase block mb-1">
                                Student Feedback Remarks:
                              </span>
                              <p className="italic text-stone-700 text-[11px]">
                                "{session.menteeRemarks}"
                              </p>
                            </div>
                          )}

                          {session.mentorRemarks && (
                            <div className="p-3 bg-white rounded-lg border border-[#E6E0D5]">
                              <span className="text-[10px] font-bold text-[#A44D2D] uppercase block mb-1">
                                Your Advisor Remarks:
                              </span>
                              <p className="italic text-stone-700 text-[11px]">
                                "{session.mentorRemarks}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-stone-400">
                      No completed session records logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Student View Modal Preview */}
          <FacultyDossierModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            mentorId={profile?.mentorId}
            initialDossier={profile}
            hasActiveMentor={true}
          />
        </main>
      </div>
    </div>
  );
}
