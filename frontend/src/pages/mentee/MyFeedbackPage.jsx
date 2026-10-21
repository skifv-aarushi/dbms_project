import React, { useState, useEffect } from 'react';
import { menteeApi } from '../../api/mentee.api';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Modal from '../../components/common/Modal';
import FeedbackModal from '../../components/forms/FeedbackModal';
import ConfirmationPopup from '../../components/common/ConfirmationPopup';
import {
  CheckCircle,
  Star,
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

export default function MyFeedbackPage() {
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
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

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await menteeApi.getDashboard();
      setMeetings(data.meetings || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load meetings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleFeedbackSubmit = async (feedbackData) => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await menteeApi.submitFeedback(feedbackData.meetingId, feedbackData);
      setMessage('Thank you! Your feedback and rating have been recorded.');
      setSelectedMeeting(null);
      await fetchMeetings();
      setConfirmationPopup({
        isOpen: true,
        title: 'Feedback Submitted',
        message: 'Your rating and feedback remarks have been saved and applied to your mentorship session history.',
        type: 'success',
        confirmText: 'Done',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit feedback.';
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

  const completedMeetings = meetings.filter((m) => m.status === 'Completed');

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[#A44D2D]" />
                Meeting Feedback
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Share your thoughts on completed sessions and view mentor ratings
              </p>
            </div>

            <button
              onClick={fetchMeetings}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-[#E6E0D5] hover:bg-[#F4EFE6] rounded-lg transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
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

          {completedMeetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#E6E0D5] p-12 text-center">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-serif font-bold text-stone-700">No Completed Meetings Yet</h3>
              <p className="text-xs text-stone-400 mt-1">
                Once your faculty mentor marks a session as completed, feedback rating options will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedMeetings.map((mt) => {
                const hasFeedback = !!mt.menteerating;
                return (
                  <div
                    key={mt.meetingid}
                    className="bg-white rounded-xl border border-[#E6E0D5] p-5 shadow-xs hover:border-[#C7B59D] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-400">
                            #{mt.meetingid}
                          </span>
                          <span className="font-semibold text-sm text-stone-900">
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
                          <p className="text-xs text-stone-600 mt-2 leading-relaxed max-w-2xl">
                            {mt.discussion}
                          </p>
                        )}
                      </div>

                      <div>
                        {hasFeedback ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F7F4] text-[#435940] border border-[#CCD7C9] text-xs font-semibold">
                            <CheckCircle className="w-4 h-4 text-[#577254]" />
                            <span>Submitted ({mt.menteerating}/5 ★)</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedMeeting(mt)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A44D2D] hover:bg-[#863B20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                          >
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            Submit Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Feedback displays */}
                    <div className="mt-4 pt-3 border-t border-[#E6E0D5] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {mt.mentorrating && (
                        <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E6E0D5]">
                          <div className="flex items-center gap-1 font-semibold text-stone-900 mb-1">
                            <Star className="w-3.5 h-3.5 fill-[#D4922A] text-[#D4922A]" />
                            <span>Mentor's Rating: {mt.mentorrating} / 5</span>
                          </div>
                          <p className="text-stone-700 text-[11px] italic">"{mt.mentorremarks}"</p>
                        </div>
                      )}

                      {mt.menteerating ? (
                        <div className="p-3 bg-[#F5F7F4] rounded-lg border border-[#CCD7C9]">
                          <div className="flex items-center gap-1 font-semibold text-[#435940] mb-1">
                            <Star className="w-3.5 h-3.5 fill-[#D4922A] text-[#D4922A]" />
                            <span>My Rating: {mt.menteerating} / 5</span>
                          </div>
                          <p className="text-[#324330] text-[11px] italic">"{mt.menteeremarks}"</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#FAF8F5] rounded-lg border border-dashed border-[#E6E0D5] text-stone-400 text-center flex items-center justify-center">
                          <span>Awaiting your feedback for this session</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feedback Modal */}
          <Modal
            isOpen={!!selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            title="Submit Mentorship Session Evaluation"
          >
            {selectedMeeting && (
              <FeedbackModal
                meeting={selectedMeeting}
                userRole="Mentee"
                onSubmit={handleFeedbackSubmit}
                onCancel={() => setSelectedMeeting(null)}
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
