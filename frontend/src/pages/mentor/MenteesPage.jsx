import React, { useState, useEffect } from 'react';
import { mentorApi } from '../../api/mentor.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import MenteeCard from '../../components/cards/MenteeCard';
import Modal from '../../components/common/Modal';
import MeetingForm from '../../components/forms/MeetingForm';
import ProgressForm from '../../components/forms/ProgressForm';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import { Users, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function MenteesPage() {
  const [mentees, setMentees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMenteeForMeeting, setSelectedMenteeForMeeting] = useState(null);
  const [selectedMenteeForProgress, setSelectedMenteeForProgress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    confirmText: 'Done',
  });

  const fetchMentees = async () => {
    setIsLoading(true);
    try {
      const data = await mentorApi.getAssignedMentees();
      setMentees(data.mentees || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assigned mentees.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const handleScheduleSubmit = async (meetingData) => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    const menteeName = selectedMenteeForMeeting?.menteename || 'student';
    try {
      await mentorApi.scheduleMeeting(meetingData);
      setMessage(`Mentorship session scheduled successfully with ${menteeName}.`);
      setSelectedMenteeForMeeting(null);
      await fetchMentees();
      setConfirmationPopup({
        isOpen: true,
        title: 'Meeting Scheduled',
        message: `Your mentoring session with ${menteeName} has been booked and added to your schedule.`,
        type: 'success',
        confirmText: 'Done',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to schedule meeting.';
      setError(errorMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Scheduling Failed',
        message: errorMsg,
        type: 'error',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressSubmit = async (progressData) => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    const menteeName = selectedMenteeForProgress?.menteename || 'student';
    try {
      await mentorApi.logProgress(progressData.menteeId, progressData);
      setMessage(`Progress evaluation recorded for ${menteeName}.`);
      setSelectedMenteeForProgress(null);
      await fetchMentees();
      setConfirmationPopup({
        isOpen: true,
        title: 'Progress Recorded',
        message: `Evaluation and academic milestone review logged successfully for ${menteeName}.`,
        type: 'success',
        confirmText: 'Done',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to record progress.';
      setError(errorMsg);
      setConfirmationPopup({
        isOpen: true,
        title: 'Submission Failed',
        message: errorMsg,
        type: 'error',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsSubmitting(false);
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
                <Users className="w-6 h-6 text-[#A44D2D]" />
                My Mentees
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                View assigned students, schedule advising sessions, and record progress updates
              </p>
            </div>

            <button
              onClick={fetchMentees}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
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

          {/* Mentee Cards Grid */}
          {mentees.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#E6E0D5] p-12 text-center">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-serif font-bold text-stone-700">No Students Assigned Yet</h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                You do not have any students assigned to your mentorship roster yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentees.map((mentee) => (
                <MenteeCard
                  key={mentee.menteeid}
                  mentee={mentee}
                  onScheduleMeeting={(m) => setSelectedMenteeForMeeting(m)}
                  onLogProgress={(m) => setSelectedMenteeForProgress(m)}
                />
              ))}
            </div>
          )}

          {/* Schedule Meeting Modal */}
          <Modal
            isOpen={!!selectedMenteeForMeeting}
            onClose={() => setSelectedMenteeForMeeting(null)}
            title="Schedule Meeting"
          >
            {selectedMenteeForMeeting && (
              <MeetingForm
                mentorshipId={selectedMenteeForMeeting.mentorshipid}
                menteeName={selectedMenteeForMeeting.menteename}
                onSubmit={handleScheduleSubmit}
                onCancel={() => setSelectedMenteeForMeeting(null)}
                isSubmitting={isSubmitting}
              />
            )}
          </Modal>

          {/* Log Progress Modal */}
          <Modal
            isOpen={!!selectedMenteeForProgress}
            onClose={() => setSelectedMenteeForProgress(null)}
            title="Record Student Progress"
          >
            {selectedMenteeForProgress && (
              <ProgressForm
                mentee={selectedMenteeForProgress}
                onSubmit={handleProgressSubmit}
                onCancel={() => setSelectedMenteeForProgress(null)}
                isSubmitting={isSubmitting}
              />
            )}
          </Modal>

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
