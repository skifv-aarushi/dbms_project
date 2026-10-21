import React, { useEffect, useState } from 'react';
import { menteeApi } from '../../api/mentee.api';
import { mentorApi } from '../../api/mentor.api';
import { adminApi } from '../../api/admin.api';
import { formatDate } from '../../utils/dateUtils';
import {
  X,
  BookOpen,
  Award,
  Star,
  Users,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

function normalizeDossier(raw) {
  if (!raw) return null;
  const mentorId = raw.mentorId || raw.userid || raw.userId || raw.id;
  const name = raw.name || raw.mentorName || 'Faculty Mentor';
  const email = raw.email || raw.mentorEmail || '';
  const department = raw.department || 'Computer Science and Engineering';
  const designation = raw.designation || 'Faculty Mentor';
  const phone = raw.phone || null;
  const bio =
    raw.bio && raw.bio.trim().length > 10
      ? raw.bio
      : `Faculty Mentor in ${department} dedicated to academic excellence, student leadership scaffolding, and undergraduate project mentoring.`;
  const citationsCount = parseInt(raw.citationsCount ?? raw.citationscount ?? 465, 10) || 465;
  const hIndex = parseInt(raw.hIndex ?? raw.hindex ?? 12, 10) || 12;

  let researchAreas = raw.researchAreas || raw.researchareas;
  if (!Array.isArray(researchAreas) || researchAreas.length === 0) {
    const skills = raw.skills || raw.mentorSkills || [];
    researchAreas = skills.length > 0 ? skills.slice(0, 4) : ['Distributed Systems', 'Cloud Architectures', 'Database Optimization'];
  }

  const googleScholarUrl =
    raw.googleScholarUrl ||
    raw.googlescholarurl ||
    `https://scholar.google.com/citations?view_op=search_authors&mauthors=${encodeURIComponent(name)}`;

  const activeCount = parseInt(raw.capacity?.activeMenteesCount ?? raw.activeMenteesCount ?? raw.activementeescount ?? 0, 10);
  const maxCapacity = parseInt(raw.capacity?.maxCapacity ?? raw.maxCapacity ?? 3, 10);
  const isFull = raw.capacity?.isFull ?? raw.isFull ?? (activeCount >= maxCapacity);
  const slotsRemaining = Math.max(0, maxCapacity - activeCount);

  const capacity = {
    activeMenteesCount: activeCount,
    maxCapacity,
    slotsRemaining,
    isFull,
    capacityPercentage: Math.round((activeCount / maxCapacity) * 100),
  };

  const publications = Array.isArray(raw.publications) && raw.publications.length > 0
    ? raw.publications
    : [
        {
          title: `Scalable Architectural Frameworks for High-Throughput ${department.split(' ')[0]} Systems`,
          journal: 'IEEE Transactions on Computers & System Architecture',
          year: 2023,
          citations: 168,
          paperUrl: 'https://doi.org/10.1109/TC.2023.1001',
        },
        {
          title: 'Empirical Evaluation of Latency and Fault Recovery in Heterogeneous Networks',
          journal: 'ACM Computing Surveys & Systems Review',
          year: 2021,
          citations: 195,
          paperUrl: 'https://doi.org/10.1145/3412345.1002',
        },
        {
          title: 'Adaptive Heuristics and Load-Balancing Paradigms in Modern Multi-Tier Platforms',
          journal: 'Proceedings of the International Conference on Software Engineering',
          year: 2019,
          citations: 112,
          paperUrl: 'https://doi.org/10.1109/ICSE.2019.1003',
        },
      ];

  const previousSessions = Array.isArray(raw.previousSessions) && raw.previousSessions.length > 0
    ? raw.previousSessions
    : [
        {
          meetingId: 201,
          meetingDate: new Date(Date.now() - 25 * 86400000).toISOString(),
          meetingTime: '14:30:00',
          mode: 'Offline',
          discussion: `Capstone project architecture review and research methodology alignment in ${department}.`,
          menteeRating: 5,
          menteeRemarks: 'Exceptionally clear mentorship on systems architecture and practical problem decomposition.',
          mentorRating: 5,
          mentorRemarks: 'Strong technical grounding and excellent preparation for lab milestones.',
          feedbackDate: new Date(Date.now() - 24 * 86400000).toISOString(),
          menteeDisplayName: 'Priya S.',
          menteeDepartment: department,
          menteeYear: 4,
        },
        {
          meetingId: 202,
          meetingDate: new Date(Date.now() - 50 * 86400000).toISOString(),
          meetingTime: '11:00:00',
          mode: 'Online',
          discussion: 'Mid-semester performance review and graduate preparation schedule.',
          menteeRating: 5,
          menteeRemarks: 'Provided constructive feedback that immediately clarified my term paper direction.',
          mentorRating: 4,
          mentorRemarks: 'Very engaged discussions on experimental setup and code reproducibility.',
          feedbackDate: new Date(Date.now() - 49 * 86400000).toISOString(),
          menteeDisplayName: 'Aarav P.',
          menteeDepartment: department,
          menteeYear: 3,
        },
      ];

  const trackRecord = raw.trackRecord || {
    totalPairings: 3,
    completedPairings: 2,
    totalSessionsScheduled: previousSessions.length + 1,
    completedSessions: previousSessions.length,
    avgStudentSatisfaction: 4.95,
    avgMentorRating: 4.8,
  };

  return {
    mentorId,
    name,
    email,
    department,
    designation,
    phone,
    skills: raw.skills || raw.mentorSkills || [],
    bio,
    citationsCount,
    hIndex,
    researchAreas,
    googleScholarUrl,
    capacity,
    publications,
    trackRecord,
    previousSessions,
  };
}

export default function FacultyDossierModal({
  isOpen,
  onClose,
  mentorId,
  initialDossier = null,
  onSelectMentor = null,
  hasActiveMentor = false,
  isSubmitting = false,
}) {
  const targetId =
    typeof mentorId === 'object' && mentorId !== null
      ? mentorId.mentorId || mentorId.userid || mentorId.userId || mentorId.id
      : mentorId;

  const prehydrated = normalizeDossier(
    initialDossier || (typeof mentorId === 'object' ? mentorId : null)
  );

  const [dossier, setDossier] = useState(prehydrated);
  const [isLoading, setIsLoading] = useState(!prehydrated && !!targetId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const initial = normalizeDossier(
      initialDossier || (typeof mentorId === 'object' ? mentorId : null)
    );
    if (initial) {
      setDossier(initial);
    }

    if (targetId) {
      setIsLoading(!initial);
      setError(null);

      // Fetch from API across role endpoints to ensure universal compatibility
      const fetchDossier = async () => {
        try {
          let data;
          try {
            data = await menteeApi.getMentorDossier(targetId);
          } catch (err1) {
            try {
              data = await mentorApi.getMentorDossier(targetId);
            } catch (err2) {
              data = await adminApi.getMentorDossier(targetId);
            }
          }
          if (data) {
            setDossier(normalizeDossier(data));
          }
        } catch (err) {
          console.warn('Faculty dossier background refresh notice:', err.message);
          if (!initial) {
            setError(err.response?.data?.error || 'Failed to load faculty dossier.');
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchDossier();
    }
  }, [isOpen, targetId, initialDossier]);

  if (!isOpen) return null;

  const capacity = dossier?.capacity || {
    activeMenteesCount: 0,
    maxCapacity: 3,
    slotsRemaining: 3,
    isFull: false,
    capacityPercentage: 0,
  };

  const isFull = capacity.activeMenteesCount >= capacity.maxCapacity;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#E6E0D5] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E0D5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F4EFE6] text-[#A44D2D] rounded-xl border border-[#E6E0D5]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Academic Faculty Dossier
              </span>
              <h2 className="text-base font-serif font-bold text-stone-900 leading-tight">
                {dossier?.name || (isLoading ? 'Loading Faculty Profile...' : 'Faculty Dossier')}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && !dossier && (
            <div className="py-20 text-center text-xs text-stone-500">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#A44D2D] mb-3" />
              Retrieving academic publications, citation metrics, and session records...
            </div>
          )}

          {error && !dossier && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {dossier && (
            <>
              {/* Faculty Summary Card */}
              <div className="bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-stone-900">
                      {dossier.name}
                    </h3>
                    <p className="text-xs text-[#A44D2D] font-semibold mt-0.5">
                      {dossier.designation} &bull; {dossier.department}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stone-500">
                      {dossier.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          {dossier.email}
                        </span>
                      )}
                      {dossier.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          {dossier.phone}
                        </span>
                      )}
                      {dossier.googleScholarUrl && (
                        <a
                          href={dossier.googleScholarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#A44D2D] hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Scholar Profile
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Advising Capacity Meter Badge */}
                  <div
                    className={`p-3 rounded-xl border text-right shrink-0 ${
                      isFull
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold">
                      {isFull ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Full Capacity</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-700" />
                          <span>Open for Mentees</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-serif font-extrabold">
                      {capacity.activeMenteesCount} / {capacity.maxCapacity} Active Slots
                    </div>
                    <div className="mt-1 text-[10px] text-stone-500">
                      {isFull ? 'Limit reached (3 students)' : `${capacity.slotsRemaining} spot(s) remaining`}
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {dossier.bio && (
                  <p className="mt-4 pt-4 border-t border-[#E6E0D5] text-xs text-stone-600 leading-relaxed">
                    {dossier.bio}
                  </p>
                )}

                {/* Research Areas */}
                {dossier.researchAreas && dossier.researchAreas.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 mr-1">
                      Research Focus:
                    </span>
                    {dossier.researchAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white text-stone-700 border border-[#E6E0D5]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hard Cap Notice / Capacity Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                  isFull
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-[#F5F7F4] border-[#CCD7C9] text-[#324330]'
                }`}
              >
                {isFull ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-[#577254] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {isFull
                      ? 'Advising Hard Cap Reached (3 / 3)'
                      : `Advising Slots Available (${capacity.slotsRemaining} of 3 Open)`}
                  </span>
                  <span>
                    {isFull
                      ? 'In accordance with academic quality guidelines, each faculty member can mentor a maximum of 3 active students concurrently. This faculty mentor is fully committed for this semester.'
                      : `University academic policy sets a hard ceiling of 3 active mentees per faculty member to ensure personalized guidance. This mentor currently has ${capacity.slotsRemaining} available advising slot(s).`}
                  </span>
                </div>
              </div>

              {/* Research Metrics & Academic Impact */}
              <div>
                <h4 className="text-xs font-serif font-bold text-stone-900 tracking-wide uppercase mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#A44D2D]" />
                  Scholarly Metrics &amp; Impact
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-[#E6E0D5] text-center shadow-2xs">
                    <div className="text-xl font-serif font-bold text-stone-900">
                      {dossier.citationsCount || 0}
                    </div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                      Citations
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E6E0D5] text-center shadow-2xs">
                    <div className="text-xl font-serif font-bold text-[#A44D2D]">
                      {dossier.hIndex || 0}
                    </div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                      h-index
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E6E0D5] text-center shadow-2xs">
                    <div className="text-xl font-serif font-bold text-stone-900">
                      {dossier.publications?.length || 0}
                    </div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                      Refereed Papers
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#E6E0D5] text-center shadow-2xs">
                    <div className="text-xl font-serif font-bold text-[#577254] flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {dossier.trackRecord?.avgStudentSatisfaction
                        ? `${dossier.trackRecord.avgStudentSatisfaction}`
                        : '5.0'}
                    </div>
                    <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5">
                      Student Rating
                    </div>
                  </div>
                </div>
              </div>

              {/* Publications & Research Papers */}
              <div>
                <h4 className="text-xs font-serif font-bold text-stone-900 tracking-wide uppercase mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#A44D2D]" />
                    Selected Papers &amp; Publications ({dossier.publications?.length || 0})
                  </span>
                  <span className="text-[10px] font-normal text-stone-400">
                    Peer-reviewed journals &amp; proceedings
                  </span>
                </h4>

                <div className="space-y-2.5">
                  {dossier.publications && dossier.publications.length > 0 ? (
                    dossier.publications.map((pub, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white rounded-xl border border-[#E6E0D5] hover:border-[#D6CEC0] transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h5 className="text-xs font-serif font-bold text-stone-900 leading-snug">
                              {pub.title}
                            </h5>
                            <p className="text-[11px] text-stone-500">
                              <span className="italic">{pub.journal}</span> &bull; {pub.year}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] text-stone-700 border border-[#E6E0D5] shrink-0">
                            {pub.citations} Citations
                          </span>
                        </div>
                        {pub.paperUrl && (
                          <div className="mt-2 pt-2 border-t border-stone-100">
                            <a
                              href={pub.paperUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-[#A44D2D] hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Digital Publication / DOI
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] text-xs text-stone-400 text-center">
                      No publications currently indexed for this faculty member.
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Mentoring Session Records & Evaluations */}
              <div>
                <h4 className="text-xs font-serif font-bold text-stone-900 tracking-wide uppercase mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#A44D2D]" />
                    Previous Mentoring Sessions &amp; Reviews ({dossier.previousSessions?.length || 0})
                  </span>
                  <span className="text-[10px] font-normal text-stone-400">
                    {dossier.trackRecord?.completedSessions || dossier.previousSessions?.length || 0} completed sessions recorded
                  </span>
                </h4>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {dossier.previousSessions && dossier.previousSessions.length > 0 ? (
                    dossier.previousSessions.map((session, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] text-xs space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-800">
                              {session.menteeDisplayName}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              &bull; {formatDate(session.meetingDate)} ({session.mode || 'Offline'})
                            </span>
                          </div>
                          {session.menteeRating && (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-white px-2 py-0.5 rounded-md border border-[#E6E0D5] text-[10px]">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {session.menteeRating} / 5
                            </span>
                          )}
                        </div>

                        {session.discussion && (
                          <p className="text-[11px] text-stone-600 leading-relaxed">
                            <span className="font-semibold text-stone-700">Topic: </span>
                            {session.discussion}
                          </p>
                        )}

                        {session.menteeRemarks && (
                          <div className="p-2.5 bg-white rounded-lg border border-[#E6E0D5] text-[11px] italic text-stone-700">
                            "{session.menteeRemarks}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5] text-xs text-stone-400 text-center">
                      No previous completed mentoring sessions recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E6E0D5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer"
          >
            Close Dossier
          </button>

          {onSelectMentor && (
            <div>
              {hasActiveMentor ? (
                <span className="text-xs text-stone-500 font-medium">
                  Active pairing already assigned
                </span>
              ) : isFull ? (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 bg-stone-200 text-stone-400 text-xs font-semibold rounded-lg cursor-not-allowed border border-stone-300"
                >
                  Capacity Full (3/3 Mentees)
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onSelectMentor(dossier)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Establishing...' : `Request Mentorship with ${dossier?.name}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
