import React, { useState } from 'react';
import { Percent, Send } from 'lucide-react';

export default function ProgressForm({ mentee, onSubmit, onCancel, isSubmitting }) {
  const [academicProgress, setAcademicProgress] = useState('Satisfactory Progress');
  const [attendancePercentage, setAttendancePercentage] = useState('95.0');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const attendance = parseFloat(attendancePercentage);
    if (isNaN(attendance) || attendance < 0 || attendance > 100) {
      setError('Attendance must be a valid percentage between 0.00% and 100.00%.');
      return;
    }
    if (!academicProgress.trim()) {
      setError('Academic progress status is required.');
      return;
    }

    setError('');
    onSubmit({
      menteeId: mentee.menteeid || mentee.UserID,
      academicProgress: academicProgress.trim(),
      attendancePercentage: attendance,
      remarks: remarks.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg text-xs text-stone-700">
        Recording progress evaluation for <strong className="text-stone-900 font-serif">{mentee.menteename || mentee.Name}</strong>{' '}
        ({mentee.department}, Year {mentee.year})
      </div>

      {error && (
        <div className="p-3 bg-[#FDF7F4] border border-[#F2D3C4] text-[#863B20] text-xs rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">
          Academic Progress / Status
        </label>
        <input
          type="text"
          required
          value={academicProgress}
          onChange={(e) => setAcademicProgress(e.target.value)}
          placeholder="e.g. Good progress on Database Systems project, coursework on track"
          className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#577254] focus:outline-none text-stone-800"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">
          Attendance Percentage (%)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            value={attendancePercentage}
            onChange={(e) => setAttendancePercentage(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#577254] focus:outline-none pr-8 text-stone-800"
          />
          <Percent className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
        </div>
        <p className="text-[11px] text-stone-400 mt-1">Enter a percentage between 0% and 100%</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">
          Mentor Remarks
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add feedback on coursework, project milestones, or areas to improve..."
          className="w-full px-3 py-2 text-sm bg-white border border-[#E6E0D5] rounded-lg focus:border-[#577254] focus:outline-none placeholder:text-stone-400 text-stone-800"
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
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#577254] hover:bg-[#435940] rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {isSubmitting ? 'Saving...' : 'Save Evaluation'}
        </button>
      </div>
    </form>
  );
}
