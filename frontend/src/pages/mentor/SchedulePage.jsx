import React, { useState, useEffect } from 'react';
import { mentorApi } from '../../api/mentor.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import FeedbackModal from '../../components/forms/FeedbackModal';
import MeetingForm from '../../components/forms/MeetingForm';
import { formatDate, formatTime } from '../../utils/dateUtils';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  Star,
  Edit3,
  PlusCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function SchedulePage() {
  const [meetings, setMeetings] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMeetingForFeedback, setSelectedMeetingForFeedback] = useState(null);
  const [selectedMeetingForNotes, setSelectedMeetingForNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedMenteeForSchedule, setSelectedMenteeForSchedule] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Confirmation popup state
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const [mtData, menteeData] = await Promise.all([
        mentorApi.getMentorMeetings(),
        mentorApi.getAssignedMentees(),
      ]);
      setMeetings(mtData.meetings || []);
      setMentees(menteeData.mentees || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch meetings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      await mentorApi.updateMeeting(meetingId, { status: newStatus });
      setMessage(`Meeting status changed to ${newStatus}.`);
      setConfirmationPopup({
        isOpen: true,
        title: 'Meeting Status Updated!',
        message: `Meeting #${meetingId} marked as ${newStatus}.`,
        type: 'success',
      });
      await loadMeetings();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update meeting status.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Status Update Failed',
        message: errMsg,
        type: 'error',
      });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMeetingForNotes) return;
    setIsSubmitting(true);
    try {
      await mentorApi.updateMeeting(selectedMeetingForNotes.meetingid, {
        discussion: notesText,
      });
      setMessage('Discussion notes / minutes updated successfully.');
      setSelectedMeetingForNotes(null);
      setConfirmationPopup({
        isOpen: true,
        title: 'Discussion Notes Saved!',
        message: 'Meeting minutes have been recorded in the database.',
        type: 'success',
      });
      await loadMeetings();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to save discussion notes.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Save Notes Failed',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    setIsSubmitting(true);
    try {
      await mentorApi.submitFeedback(feedbackData.meetingId, feedbackData);
      setMessage('Session evaluation and rating recorded successfully!');
      setSelectedMeetingForFeedback(null);
      setConfirmationPopup({
        isOpen: true,
        title: 'Session Feedback Recorded!',
        message: 'Your rating and evaluation remarks have been saved.',
        type: 'success',
      });
      await loadMeetings();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to record feedback.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Feedback Submission Failed',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await mentorApi.scheduleMeeting({
        ...data,
        mentorshipId: selectedMenteeForSchedule,
      });
      setMessage('New meeting scheduled successfully!');
      setIsScheduleOpen(false);
      setSelectedMenteeForSchedule('');
      setConfirmationPopup({
        isOpen: true,
        title: 'Meeting Scheduled Successfully!',
        message: 'Your guidance session has been scheduled and recorded in the database.',
        type: 'success',
      });
      await loadMeetings();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to schedule meeting.';
      setError(errMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Scheduling Failed',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    if (statusFilter === 'All') return true;
    return m.status === statusFilter;
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
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#A44D2D]" />
                Meetings &amp; Sessions
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Manage upcoming meetings, record notes, and submit session feedback
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsScheduleOpen(true)}
                disabled={mentees.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                Schedule Meeting
              </button>

              <button
                onClick={loadMeetings}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Alerts */}
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

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 mb-6 bg-white p-1 rounded-lg border border-[#E6E0D5] inline-flex">
            {['All', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-[#A44D2D] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F5]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Meeting Cards List */}
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#E6E0D5] p-12 text-center">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-serif font-bold text-stone-700">No Meetings Found</h3>
              <p className="text-xs text-stone-400 mt-1">
                No session matching "{statusFilter}" was found for your active pairings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((mt) => {
                const isCompleted = mt.status === 'Completed';
                const isScheduled = mt.status === 'Scheduled';
                return (
                  <div
                    key={mt.meetingid}
                    className="bg-white rounded-xl border border-[#E6E0D5] p-5 shadow-xs hover:border-[#C7B59D] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Mentee details, date, mode */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-stone-400">
                            #{mt.meetingid}
                          </span>
                          <h4 className="text-base font-serif font-bold text-stone-900">{mt.menteename}</h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4EFE6] font-semibold text-stone-700 border border-[#E6E0D5]">
                            {mt.menteedepartment} (Yr {mt.menteeyear})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-2">
                          <span className="flex items-center gap-1 font-semibold text-stone-800">
                            <Calendar className="w-3.5 h-3.5 text-[#A44D2D]" />
                            {formatDate(mt.meetingdate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {formatTime(mt.meetingtime)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] border ${
                              mt.mode === 'Online'
                                ? 'bg-[#FAF8F5] text-stone-700 border-[#E6E0D5]'
                                : 'bg-[#FDF9EF] text-[#945C10] border-[#F5DEB0]'
                            }`}
                          >
                            {mt.mode === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {mt.mode}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                              isCompleted
                                ? 'bg-[#F5F7F4] text-[#435940] border-[#CCD7C9]'
                                : isScheduled
                                ? 'bg-[#FDF7F4] text-[#A44D2D] border-[#F2D3C4]'
                                : 'bg-[#FAF8F5] text-stone-600 border-[#DCD0BD]'
                            }`}
                          >
                            {mt.status}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isScheduled && (
                          <>
                            <button
                              onClick={() => handleStatusChange(mt.meetingid, 'Completed')}
                              className="px-3 py-1.5 text-xs font-semibold text-[#435940] bg-[#F5F7F4] hover:bg-[#E6EBE4] border border-[#CCD7C9] rounded-lg transition-colors"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleStatusChange(mt.meetingid, 'Cancelled')}
                              className="px-3 py-1.5 text-xs font-semibold text-[#863B20] bg-[#FDF7F4] hover:bg-[#F9EBE4] border border-[#F2D3C4] rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedMeetingForNotes(mt);
                            setNotesText(mt.discussion || '');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-[#FAF8F5] hover:bg-[#F4EFE6] border border-[#E6E0D5] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Minutes / Notes
                        </button>

                        <button
                          onClick={() => setSelectedMeetingForFeedback(mt)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#945C10] bg-[#FDF9EF] hover:bg-[#FBF0D8] border border-[#F5DEB0] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#D4922A] text-[#D4922A]" />
                          {mt.mentorrating ? `Rating: ${mt.mentorrating}/5` : 'Rate Session'}
                        </button>
                      </div>
                    </div>

                    {/* Discussion Agenda / Minutes */}
                    {mt.discussion && (
                      <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-700">
                        <span className="font-semibold text-stone-900 block mb-1">Agenda &amp; Discussion Points:</span>
                        <p className="leading-relaxed whitespace-pre-wrap">{mt.discussion}</p>
                      </div>
                    )}

                    {/* Bilateral Feedback Display */}
                    {(mt.mentorrating || mt.menteerating) && (
                      <div className="mt-3 pt-3 border-t border-[#E6E0D5] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {mt.mentorrating && (
                          <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#E6E0D5]">
                            <div className="flex items-center gap-1 font-semibold text-stone-900 mb-1">
                              <Star className="w-3.5 h-3.5 fill-[#D4922A] text-[#D4922A]" />
                              <span>Faculty Mentor Rating: {mt.mentorrating} / 5</span>
                            </div>
                            <p className="text-stone-700 text-[11px] italic">"{mt.mentorremarks}"</p>
                          </div>
                        )}
                        {mt.menteerating && (
                          <div className="p-2.5 bg-[#F5F7F4] rounded-lg border border-[#CCD7C9]">
                            <div className="flex items-center gap-1 font-semibold text-[#435940] mb-1">
                              <Star className="w-3.5 h-3.5 fill-[#D4922A] text-[#D4922A]" />
                              <span>Student Mentee Feedback: {mt.menteerating} / 5</span>
                            </div>
                            <p className="text-[#324330] text-[11px] italic">"{mt.menteeremarks}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Notes Modal */}
          <Modal
            isOpen={!!selectedMeetingForNotes}
            onClose={() => setSelectedMeetingForNotes(null)}
            title="Update Meeting Minutes &amp; Discussion Record"
          >
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Document formal minutes, project milestones reviewed, or agreed next steps.
              </p>
              <textarea
                rows={5}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter detailed meeting notes and discussion conclusions..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none placeholder:text-stone-400 text-stone-800"
              />
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E6E0D5]">
                <button
                  type="button"
                  onClick={() => setSelectedMeetingForNotes(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveNotes}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#A44D2D] hover:bg-[#863B20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Minutes'}
                </button>
              </div>
            </div>
          </Modal>

          {/* Feedback Modal */}
          <Modal
            isOpen={!!selectedMeetingForFeedback}
            onClose={() => setSelectedMeetingForFeedback(null)}
            title="Faculty Session Evaluation &amp; Rating"
          >
            {selectedMeetingForFeedback && (
              <FeedbackModal
                meeting={selectedMeetingForFeedback}
                userRole="Mentor"
                onSubmit={handleFeedbackSubmit}
                onCancel={() => setSelectedMeetingForFeedback(null)}
                isSubmitting={isSubmitting}
              />
            )}
          </Modal>

          {/* Schedule New Meeting Modal */}
          <Modal
            isOpen={isScheduleOpen}
            onClose={() => setIsScheduleOpen(false)}
            title="Schedule New Mentorship Session"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select Assigned Mentee
                </label>
                <select
                  value={selectedMenteeForSchedule}
                  onChange={(e) => setSelectedMenteeForSchedule(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
                >
                  <option value="">-- Choose active student mentee --</option>
                  {mentees.map((m) => (
                    <option key={m.mentorshipid} value={m.mentorshipid}>
                      {m.menteename} ({m.department}, Year {m.year})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMenteeForSchedule && (
                <MeetingForm
                  mentorshipId={selectedMenteeForSchedule}
                  onSubmit={handleScheduleSubmit}
                  onCancel={() => setIsScheduleOpen(false)}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </Modal>

          {/* Confirmation Success/Error Popup */}
          <ConfirmationPopup
            isOpen={confirmationPopup.isOpen}
            onClose={() => setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))}
            title={confirmationPopup.title}
            message={confirmationPopup.message}
            type={confirmationPopup.type}
          />
        </main>
      </div>
    </div>
  );
}
