import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Reusable Confirmation / Operation Feedback Popup Modal.
 * Displays a clean, human-designed popup after operations succeed or fail,
 * and handles interactive confirmation prompts (e.g. terminating mentorship).
 */
export default function ConfirmationPopup({
  isOpen,
  onClose,
  onConfirm = null,
  title = 'Operation Successful',
  message = 'The requested action has been completed successfully.',
  type = 'success', // 'success' | 'error' | 'warning' | 'danger' | 'info'
  confirmText = 'Done',
  secondaryText = null,
  onSecondary = null,
  isSubmitting = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error' || type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E6E0D5] p-6 text-center transform transition-all z-10 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-[#F4EFE6] transition disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          {isSuccess && (
            <div className="w-14 h-14 rounded-full bg-[#F5F7F4] border-2 border-[#CCD7C9] flex items-center justify-center text-[#435940] shadow-xs">
              <CheckCircle className="w-7 h-7" />
            </div>
          )}
          {isError && (
            <div className="w-14 h-14 rounded-full bg-[#FDF7F4] border-2 border-[#F2D3C4] flex items-center justify-center text-[#863B20] shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>
          )}
          {isWarning && (
            <div className="w-14 h-14 rounded-full bg-[#FFF9EB] border-2 border-[#FDE68A] flex items-center justify-center text-[#B45309] shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
          )}
          {!isSuccess && !isError && !isWarning && (
            <div className="w-14 h-14 rounded-full bg-[#FDF9EF] border-2 border-[#F5DEB0] flex items-center justify-center text-[#945C10] shadow-xs">
              <Info className="w-7 h-7" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold font-serif text-stone-900 tracking-tight mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs text-stone-600 leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {secondaryText && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (onSecondary) onSecondary();
                else onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-[#F4EFE6] rounded-xl border border-[#E6E0D5] transition-colors disabled:opacity-50"
            >
              {secondaryText}
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            className={`px-6 py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors disabled:opacity-50 ${
              isError
                ? 'bg-[#863B20] hover:bg-[#6D2F18]'
                : isWarning
                ? 'bg-[#B45309] hover:bg-[#92400E]'
                : 'bg-[#A44D2D] hover:bg-[#863B20]'
            }`}
          >
            {isSubmitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
