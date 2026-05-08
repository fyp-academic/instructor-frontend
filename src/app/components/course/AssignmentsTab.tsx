import React, { useState, useEffect } from 'react';
import { Download, Search, CheckCircle, Clock, AlertCircle, XCircle, Loader2, MessageSquare, FileText } from 'lucide-react';
import { activitiesApi, assignmentsApi } from '../../services/api';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  submissionText: string;
  fileName: string;
  filePath: string;
  submittedAt: string;
  grade: number | null;
  feedback: string;
  status: 'submitted' | 'graded';
  late: boolean;
}

interface Assignment {
  id: string;
  name: string;
  description: string;
  dueDate?: string;
  gradeMax: number;
  submissions: Submission[];
}

interface AssignmentsTabProps {
  courseId: string;
  sectionId: string;
}

export function AssignmentsTab({ courseId, sectionId }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });
  const [search, setSearch] = useState('');
  const [gradeLoading, setGradeLoading] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [courseId, sectionId]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      // Get activities for this section
      const activitiesRes = await activitiesApi.list(sectionId);
      const activities: Record<string, unknown>[] = activitiesRes.data.data ?? activitiesRes.data ?? [];
      
      // Filter to only assignments and load their submissions
      const assignmentPromises = activities
        .filter(a => String(a.type ?? a.activity_type ?? '').toLowerCase() === 'assignment')
        .map(async (act) => {
          try {
            const submissionsRes = await assignmentsApi.getSubmissions(String(act.id));
            const submissions = (submissionsRes.data.data ?? submissionsRes.data ?? []) as Record<string, unknown>[];
            
            return {
              id: String(act.id),
              name: String(act.name ?? act.title ?? 'Assignment'),
              description: String(act.description ?? ''),
              dueDate: act.due_date ? String(act.due_date).split('T')[0] : undefined,
              gradeMax: Number(act.grade_max ?? 100),
              submissions: submissions.map(s => ({
                id: String(s.id),
                studentId: String(s.student_id ?? s.studentId ?? ''),
                studentName: String(s.student_name ?? s.studentName ?? 'Unknown'),
                submissionText: String(s.submission_text ?? s.submissionText ?? ''),
                fileName: String(s.file_name ?? s.fileName ?? ''),
                filePath: String(s.file_path ?? s.filePath ?? ''),
                submittedAt: String(s.submitted_at ?? s.submittedAt ?? ''),
                grade: s.grade !== null && s.grade !== undefined ? Number(s.grade) : null,
                feedback: String(s.feedback ?? ''),
                status: String(s.status ?? 'submitted') as 'submitted' | 'graded',
                late: s.late === true,
              } as Submission)),
            } as Assignment;
          } catch {
            return null;
          }
        });

      const results = await Promise.allSettled(assignmentPromises);
      const loadedAssignments = results
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter((a): a is Assignment => a !== null);

      setAssignments(loadedAssignments);
      if (loadedAssignments.length > 0) {
        setSelectedAssignment(loadedAssignments[0]);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission || !selectedAssignment) return;
    
    const gradeValue = parseFloat(gradingData.grade);
    if (isNaN(gradeValue) || gradeValue < 0) {
      alert('Please enter a valid grade');
      return;
    }

    setGradeLoading(true);
    try {
      await assignmentsApi.gradeSubmission(gradingSubmission.id, {
        grade: gradeValue,
        feedback: gradingData.feedback,
      });

      // Update local state
      const updatedAssignments = assignments.map(a => {
        if (a.id !== selectedAssignment.id) return a;
        return {
          ...a,
          submissions: a.submissions.map(s => {
            if (s.id !== gradingSubmission.id) return s;
            return {
              ...s,
              grade: gradeValue,
              feedback: gradingData.feedback,
              status: 'graded' as const,
            };
          }),
        };
      });

      setAssignments(updatedAssignments);
      setSelectedAssignment(updatedAssignments.find(a => a.id === selectedAssignment.id) || null);
      setGradingSubmission(null);
      setGradingData({ grade: '', feedback: '' });
    } catch (err) {
      console.error('Failed to grade submission:', err);
      alert('Failed to save grade. Please try again.');
    } finally {
      setGradeLoading(false);
    }
  };

  const openGradingModal = (submission: Submission) => {
    setGradingSubmission(submission);
    setGradingData({ grade: submission.grade?.toString() || '', feedback: submission.feedback });
  };

  const filteredSubmissions = selectedAssignment
    ? selectedAssignment.submissions.filter(s =>
        s.studentName.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const getPendingCount = () => {
    return assignments.reduce((sum, a) => sum + a.submissions.filter(s => s.status === 'submitted').length, 0);
  };

  const getGradedCount = () => {
    return assignments.reduce((sum, a) => sum + a.submissions.filter(s => s.status === 'graded').length, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No assignments found in this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Assignments</h2>
          <p className="text-sm text-gray-500">{assignments.length} assignments · {getPendingCount()} pending · {getGradedCount()} graded</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Assignment selector and submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Assignment list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-sm text-gray-700">Assignments</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {assignments.map(assignment => {
              const pendingCount = assignment.submissions.filter(s => s.status === 'submitted').length;
              const gradedCount = assignment.submissions.filter(s => s.status === 'graded').length;
              return (
                <button
                  key={assignment.id}
                  onClick={() => { setSelectedAssignment(assignment); setSearch(''); }}
                  className={`w-full text-left px-3 py-3 transition-colors hover:bg-gray-50 ${
                    selectedAssignment?.id === assignment.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-600 truncate">{assignment.name}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">{pendingCount} pending</span>
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">{gradedCount} graded</span>
                  </div>
                  {assignment.dueDate && (
                    <p className="text-xs text-gray-500 mt-1">Due: {assignment.dueDate}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submissions table */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          {selectedAssignment && (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedAssignment.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Max grade: {selectedAssignment.gradeMax}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-sm outline-none flex-1"
                  />
                </div>
              </div>

              {/* Submissions list */}
              <div className="overflow-x-auto flex-1">
                {filteredSubmissions.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <p className="text-sm">No submissions found</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Student</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Submission</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Submitted</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Grade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSubmissions.map(submission => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{submission.studentName}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {submission.submissionText && <span title="Has text submission"><MessageSquare className="w-4 h-4 text-blue-500" /></span>}
                              {submission.fileName && <span title="Has file submission"><FileText className="w-4 h-4 text-amber-500" /></span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">
                            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {submission.grade !== null ? (
                              <span className="font-semibold text-green-600">{submission.grade}/{selectedAssignment.gradeMax}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                              submission.status === 'graded'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {submission.status === 'graded' ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Graded
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Submitted
                                </>
                              )}
                              {submission.late && <span className="text-amber-600">late</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openGradingModal(submission)}
                              className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                            >
                              {submission.grade !== null ? 'Edit' : 'Grade'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingSubmission && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => !gradeLoading && setGradingSubmission(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-indigo-600 mb-1">{selectedAssignment.name}</p>
                <h2 className="text-lg font-bold text-slate-900">{gradingSubmission.studentName}'s Submission</h2>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                disabled={gradeLoading}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Submission content */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Text submission */}
              {gradingSubmission.submissionText && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Submission Text</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{gradingSubmission.submissionText}</p>
                </div>
              )}

              {/* File submission */}
              {gradingSubmission.fileName && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Submitted File</p>
                  <a
                    href={`https://api.codagenz.com/storage/${gradingSubmission.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="w-4 h-4" />
                    {gradingSubmission.fileName}
                  </a>
                </div>
              )}
            </div>

            {/* Grading form */}
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block mb-2 text-xs font-semibold text-slate-600">Grade (0-{selectedAssignment.gradeMax})</label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignment.gradeMax}
                  value={gradingData.grade}
                  onChange={(e) => setGradingData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  placeholder="Enter grade"
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-semibold text-slate-600">Feedback (optional)</label>
                <textarea
                  value={gradingData.feedback}
                  onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  placeholder="Provide constructive feedback..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setGradingSubmission(null)}
                disabled={gradeLoading}
                className="px-4 py-2 rounded-xl border text-slate-600 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: "#e2e8f0" }}
              >
                Cancel
              </button>
              <button
                onClick={handleGradeSubmission}
                disabled={gradeLoading || !gradingData.grade}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-60 text-sm font-semibold"
                style={{ backgroundColor: "#2563eb" }}
              >
                {gradeLoading ? '⟳ Saving...' : '✓ Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
