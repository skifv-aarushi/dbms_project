import React, { useState } from 'react';
import { Video, MapPin, Send } from 'lucide-react';

export default function MeetingForm({ mentorshipId, menteeName, onSubmit, onCancel, isSubmitting }) {
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [mode, setMode] = useState('Online');
  const [discussion, setDiscussion] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime) {
      setError('Please select both date and time.');
      return;
    }
    setError('');
    onSubmit({
      mentorshipId,
      meetingDate,
      meetingTime,
      mode,
      discussion,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {menteeName && (
        <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-700">
          Scheduling session with <strong className="text-stone-900 font-serif">{menteeName}</strong>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Meeting Date</label>
          <input
            type="date"
            required
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Meeting Time</label>
          <input
            type="time"
            required
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#A44D2D] focus:outline-none text-stone-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">Session Format</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('Online')}
            className={`flex items-center justify-center gap-2 p-2.5 text-xs font-semibold rounded-lg border transition-colors ${
              mode === 'Online'
                ? 'bg-[#FDF7F4] border-[#A44D2D] text-[#A44D2D]'
                : 'bg-white border-[#E6E0D5] text-stone-600 hover:bg-[#FAF8F5]'
            }`}
          >
            <Video className="w-4 h-4" /> Online (Virtual)
          </button>
          <button
            type="button"
            onClick={() => setMode('Offline')}
            className={`flex items-center justify-center gap-2 p-2.5 text-xs font-semibold rounded-lg border transition-colors ${
              mode === 'Offline'
                ? 'bg-[#FDF7F4] border-[#A44D2D] text-[#A44D2D]'
                : 'bg-white border-[#E6E0D5] text-stone-600 hover:bg-[#FAF8F5]'
            }`}
          >
            <MapPin className="w-4 h-4" /> In-Person (Campus)
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">
          Discussion Agenda &amp; Focus
        </label>
        <textarea
          rows={3}
          value={discussion}
          onChange={(e) => setDiscussion(e.target.value)}
          placeholder="e.g. Review coursework milestones, semester project review..."
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
          {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
        </button>
      </div>
    </form>
  );
}
