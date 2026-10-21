import React from 'react';
import { Calendar, Clock, PlusCircle, Star, XCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

export default function MenteeCard({
  mentee,
  onScheduleMeeting,
  onLogProgress,
  onTerminateMentorship,
}) {
  const latestProgress = mentee.latestprogress;
  const nextMeeting = mentee.nextmeeting;
  const skills = Array.isArray(mentee.skills) ? mentee.skills : [];
  const attendanceVal = latestProgress?.attendancePercentage
    ? parseFloat(latestProgress.attendancePercentage)
    : null;

  return (
    <div className="bg-white rounded-xl border border-[#E6E0D5] p-6 shadow-xs hover:border-[#C7B59D] transition-colors flex flex-col justify-between group">
      <div>
        {/* Top Header: Avatar, Name, and CGPA */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#FDF7F4] border border-[#F2D3C4] flex items-center justify-center text-[#A44D2D] font-serif font-bold text-lg shrink-0">
              {mentee.menteename ? mentee.menteename.charAt(0) : 'S'}
            </div>
            <div>
              <h4 className="text-base font-serif font-bold text-stone-900 group-hover:text-[#A44D2D] transition-colors">
                {mentee.menteename}
              </h4>
              <p className="text-[11px] text-stone-500 font-medium">{mentee.menteeemail}</p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FDF9EF] text-[#945C10] border border-[#F5DEB0]">
              <Star className="w-3 h-3 fill-[#D4922A] text-[#D4922A]" />
              {mentee.cgpa ? parseFloat(mentee.cgpa).toFixed(2) : 'N/A'}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 font-semibold uppercase tracking-wider">
              Year {mentee.year || '3'}
            </span>
          </div>
        </div>

        {/* Department Pill */}
        <div className="mt-3.5 inline-block">
          <span className="text-[11px] font-semibold text-stone-700 bg-[#F4EFE6] px-2.5 py-1 rounded-lg border border-[#E6E0D5]">
            {mentee.department}
          </span>
        </div>

        {/* Skills & Coursework */}
        <div className="mt-4">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Skills &amp; Interests
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.length > 0 ? (
              skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF8F5] text-stone-700 rounded-md border border-[#E6E0D5]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-stone-400 italic">No skills listed</span>
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="mt-5 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E0D5]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-500 font-medium text-[11px]">Attendance</span>
            <span className="font-bold text-stone-800">
              {attendanceVal !== null ? `${attendanceVal.toFixed(1)}%` : 'Pending'}
            </span>
          </div>

          {attendanceVal !== null && (
            <div className="w-full bg-[#E6E0D5] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  attendanceVal >= 90
                    ? 'bg-[#577254]'
                    : attendanceVal >= 75
                    ? 'bg-[#D4922A]'
                    : 'bg-[#A44D2D]'
                }`}
                style={{ width: `${Math.min(attendanceVal, 100)}%` }}
              ></div>
            </div>
          )}

          {latestProgress?.academicProgress && (
            <p className="text-[11px] text-stone-600 mt-2 font-medium line-clamp-1">
              &bull; Status: <strong className="text-stone-800">{latestProgress.academicProgress}</strong>
            </p>
          )}
        </div>

        {/* Next Meeting Callout */}
        {nextMeeting && (
          <div className="mt-3 p-3 bg-[#FDF9EF] border border-[#F5DEB0] rounded-xl flex items-center gap-2.5 text-xs text-[#73440A]">
            <Clock className="w-4 h-4 text-[#B8781B] shrink-0" />
            <div className="truncate">
              <span className="font-bold">Next Session: </span>
              <span>{formatDateTime(nextMeeting.meetingDate, nextMeeting.meetingTime)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-[#E6E0D5] space-y-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onScheduleMeeting(mentee)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A44D2D] bg-[#FDF7F4] hover:bg-[#F9EBE4] border border-[#F2D3C4] rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() => onLogProgress(mentee)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#435940] bg-[#F5F7F4] hover:bg-[#E6EBE4] border border-[#CCD7C9] rounded-lg transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Progress</span>
          </button>
        </div>
        {onTerminateMentorship && (
          <button
            onClick={() => onTerminateMentorship(mentee)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Terminate Mentorship</span>
          </button>
        )}
      </div>
    </div>
  );
}
