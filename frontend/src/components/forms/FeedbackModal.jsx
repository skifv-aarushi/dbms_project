import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function FeedbackModal({ meeting, userRole, onSubmit, onCancel, isSubmitting }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a valid rating (1 to 5).');
      return;
    }
    setError('');
    onSubmit({
      meetingId: meeting.meetingid || meeting.MeetingID,
      rating,
      remarks,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-700">
        Recording session evaluation as{' '}
        <strong className="capitalize text-stone-900">{userRole || 'Participant'}</strong> for meeting on{' '}
        <strong className="text-stone-900">{formatDate(meeting.meetingdate || meeting.MeetingDate)}</strong>.
      </div>

      {error && (
        <div className="p-3 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Star Rating Selector */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-2">
          Rating (1 = Needs Work, 5 = Outstanding)
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = (hoverRating || rating) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 rounded-lg hover:scale-105 transition-transform focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 ${
                    active ? 'fill-[#D4922A] text-[#D4922A]' : 'text-stone-300'
                  } transition-colors`}
                />
              </button>
            );
          })}
          <span className="ml-2 text-sm font-semibold text-stone-700">
            {hoverRating || rating} / 5 Stars
          </span>
        </div>
      </div>

      {/* Qualitative Remarks */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">
          Session Feedback &amp; Reflections
        </label>
        <textarea
          rows={3}
          required
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={
            userRole === 'Mentor'
              ? 'Provide constructive advice on student strengths and areas for further exploration...'
              : 'Share your thoughts on the guidance received and next steps discussed...'
          }
          className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none placeholder:text-stone-400 text-stone-800"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E0D5]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#A44D2D] hover:bg-[#863B20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {isSubmitting ? 'Recording...' : 'Record Feedback'}
        </button>
      </div>
    </form>
  );
}
