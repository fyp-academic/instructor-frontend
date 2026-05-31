import React, { useState } from 'react';
import { FileText, Loader2, X, AlertCircle } from 'lucide-react';
import { essayGradingApi } from '../../services/api';

interface EssayResponse {
  response_id: string;
  question_id: string;
  question_text: string;
  question_marks: number;
  student_response: string;
  marks_awarded: number | null;
  marks_max: number;
  feedback: string | null;
  is_graded: boolean;
}

interface EssayGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  essayResponse: EssayResponse | null;
  studentName: string;
  onGraded?: () => void;
}

export function EssayGradingModal({
  isOpen,
  onClose,
  essayResponse,
  studentName,
  onGraded,
}: EssayGradingModalProps) {
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (essayResponse && isOpen) {
      setMarks(essayResponse.marks_awarded?.toString() ?? '');
      setFeedback(essayResponse.feedback ?? '');
      setError(null);
    }
  }, [essayResponse, isOpen]);

  const handleSubmit = async () => {
    if (!essayResponse) return;

    const marksValue = parseFloat(marks);
    if (isNaN(marksValue) || marksValue < 0 || marksValue > essayResponse.marks_max) {
      setError(`Marks must be between 0 and ${essayResponse.marks_max}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await essayGradingApi.gradeResponse(essayResponse.response_id, {
        marks_awarded: marksValue,
        feedback: feedback.trim() || null,
      });

      onGraded?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to grade essay:', err);
      setError(err.response?.data?.message ?? 'Failed to save grade');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !essayResponse) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 mb-1">Essay Grading</p>
            <h2 className="text-lg font-bold text-slate-900">{studentName}'s Essay Response</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-2">Question</p>
          <p className="text-sm text-slate-800">{essayResponse.question_text}</p>
          <p className="text-xs text-slate-500 mt-2">Max marks: <span className="font-semibold">{essayResponse.question_marks}</span></p>
        </div>

        {/* Student Response */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Student Response
          </p>
          <div className="bg-slate-50 rounded p-3 max-h-60 overflow-y-auto border border-slate-200">
            <p className="text-sm text-slate-800 whitespace-pre-wrap">
              {essayResponse.student_response || <span className="text-slate-400 italic">No response submitted</span>}
            </p>
          </div>
        </div>

        {/* Previous Feedback (if graded already) */}
        {essayResponse.is_graded && essayResponse.marks_awarded !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Previously Graded
            </p>
            <p className="text-sm text-blue-900">
              <span className="font-medium">Marks:</span> {essayResponse.marks_awarded} / {essayResponse.marks_max}
            </p>
            {essayResponse.feedback && (
              <p className="text-sm text-blue-900">
                <span className="font-medium">Feedback:</span> {essayResponse.feedback}
              </p>
            )}
          </div>
        )}

        {/* Grading Form */}
        <div className="space-y-4 border-t border-slate-200 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Marks (0-{essayResponse.marks_max}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={essayResponse.marks_max}
              step="0.5"
              value={marks}
              onChange={e => setMarks(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm"
              placeholder="Enter marks awarded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              disabled={loading}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm"
              placeholder="Provide constructive feedback for the student..."
            />
            <p className="text-xs text-slate-500 mt-1">Provide specific feedback to help the student improve.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !marks}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              '✓ Save Grade'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
