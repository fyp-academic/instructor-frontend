import React, { useState } from 'react';
import { Download, Search, ChevronDown, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { mockGrades, GradeItem, StudentGrade } from '../../data/mockData';

interface GradesTabProps {
  courseId: string;
}

export function GradesTab({ courseId }: GradesTabProps) {
  const [grades] = useState<GradeItem[]>(mockGrades);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'gradebook' | 'single'>('gradebook');
  const [selectedItem, setSelectedItem] = useState<GradeItem | null>(null);
  const [editingGrade, setEditingGrade] = useState<{itemId: string; studentId: string; value: string} | null>(null);

  const statusColors: Record<string, string> = {
    graded: 'text-green-600 bg-green-50',
    submitted: 'text-blue-600 bg-blue-50',
    not_submitted: 'text-gray-400 bg-gray-50',
    late: 'text-amber-600 bg-amber-50',
  };
  const statusIcons: Record<string, React.ElementType> = {
    graded: CheckCircle,
    submitted: Clock,
    not_submitted: XCircle,
    late: AlertCircle,
  };

  // Get all unique student names from grades
  const allStudents = Array.from(new Set(grades.flatMap(g => g.students.map(s => ({ id: s.studentId, name: s.studentName })))
    .map(s => JSON.stringify(s)))).map(s => JSON.parse(s) as { id: string; name: string });

  const filteredStudents = allStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const getGradeForStudent = (gradeItem: GradeItem, studentId: string): StudentGrade | undefined => {
    return gradeItem.students.find(s => s.studentId === studentId);
  };

  const getGradeDisplay = (sg: StudentGrade | undefined, max: number) => {
    if (!sg || sg.grade === null) return '—';
    return `${sg.grade}/${max}`;
  };

  const getPercentageDisplay = (sg: StudentGrade | undefined) => {
    if (!sg || sg.percentage === null) return null;
    return sg.percentage;
  };

  const calculateAverage = (gradeItem: GradeItem) => {
    const graded = gradeItem.students.filter(s => s.grade !== null && s.grade !== undefined);
    if (graded.length === 0) return null;
    const avg = graded.reduce((sum, s) => sum + (s.grade || 0), 0) / graded.length;
    return Math.round((avg / gradeItem.gradeMax) * 100);
  };

  const getGradeColor = (percentage: number | null) => {
    if (percentage === null) return 'text-gray-400';
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getCellBg = (percentage: number | null) => {
    if (percentage === null) return '';
    if (percentage >= 90) return 'bg-green-50';
    if (percentage >= 70) return 'bg-blue-50';
    if (percentage >= 50) return 'bg-amber-50';
    return 'bg-red-50';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Gradebook</h2>
          <p className="text-sm text-gray-500">{grades.length} graded items · {allStudents.length} students</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setView('gradebook'); setSelectedItem(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'gradebook' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Gradebook
            </button>
            <button
              onClick={() => setView('single')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'single' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Single Item
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Grade summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {grades.map(item => {
          const avg = calculateAverage(item);
          const gradedCount = item.students.filter(s => s.grade !== null).length;
          return (
            <div
              key={item.id}
              onClick={() => { setSelectedItem(item); setView('single'); }}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all"
            >
              <p className="text-xs text-gray-500 font-medium truncate">{item.activityName}</p>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className={`text-xl font-bold ${getGradeColor(avg)}`}>{avg !== null ? `${avg}%` : '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">avg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{gradedCount}/{item.students.length}</p>
                  <p className="text-xs text-gray-400">graded</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {view === 'gradebook' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 min-w-40">Student</th>
                  {grades.map(g => (
                    <th key={g.id} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 min-w-32">
                      <div className="truncate max-w-28" title={g.activityName}>{g.activityName}</div>
                      <div className="text-gray-400 font-normal">/{g.gradeMax}</div>
                    </th>
                  ))}
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 min-w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map(student => {
                  const totalGrade = grades.reduce((sum, gi) => {
                    const sg = getGradeForStudent(gi, student.id);
                    return sum + (sg?.grade || 0);
                  }, 0);
                  const totalMax = grades.reduce((sum, gi) => sum + gi.gradeMax, 0);
                  const totalPct = totalMax > 0 ? Math.round((totalGrade / totalMax) * 100) : null;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                      {grades.map(gi => {
                        const sg = getGradeForStudent(gi, student.id);
                        const pct = getPercentageDisplay(sg);
                        return (
                          <td key={gi.id} className={`px-3 py-3 text-center ${getCellBg(pct)}`}>
                            <div className={`font-medium ${getGradeColor(pct)}`}>{getGradeDisplay(sg, gi.gradeMax)}</div>
                            {sg && (
                              <div className="mt-0.5">
                                {(() => {
                                  const Icon = statusIcons[sg.status];
                                  return <Icon className={`w-3 h-3 mx-auto ${sg.status === 'graded' ? 'text-green-500' : sg.status === 'late' ? 'text-amber-500' : 'text-gray-300'}`} />;
                                })()}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center">
                        <span className={`font-bold ${getGradeColor(totalPct)}`}>{totalPct !== null ? `${totalPct}%` : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Single item view */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Activity</label>
            <select
              value={selectedItem?.id || ''}
              onChange={e => setSelectedItem(grades.find(g => g.id === e.target.value) || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose an activity...</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.activityName}</option>)}
            </select>
          </div>

          {selectedItem && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedItem.activityName}</h3>
                  <p className="text-xs text-gray-500">Maximum grade: {selectedItem.gradeMax}</p>
                </div>
                <span className="text-sm text-gray-500">{selectedItem.students.filter(s => s.grade !== null).length} graded</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Student</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Submitted</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Grade</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedItem.students.map(sg => {
                    const Icon = statusIcons[sg.status];
                    return (
                      <tr key={sg.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{sg.studentName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusColors[sg.status]}`}>
                            <Icon className="w-3 h-3" />
                            {sg.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{sg.submittedDate || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {editingGrade?.itemId === selectedItem.id && editingGrade?.studentId === sg.studentId ? (
                            <input
                              type="number"
                              value={editingGrade.value}
                              onChange={e => setEditingGrade(prev => prev ? { ...prev, value: e.target.value } : null)}
                              onBlur={() => setEditingGrade(null)}
                              className="w-16 text-center border border-indigo-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                              max={selectedItem.gradeMax}
                              min={0}
                            />
                          ) : (
                            <span
                              onClick={() => setEditingGrade({ itemId: selectedItem.id, studentId: sg.studentId, value: sg.grade?.toString() || '' })}
                              className={`font-semibold cursor-pointer hover:bg-indigo-50 px-2 py-0.5 rounded ${getGradeColor(sg.percentage)}`}
                              title="Click to edit grade"
                            >
                              {sg.grade !== null ? `${sg.grade}/${selectedItem.gradeMax}` : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{sg.feedback || <span className="text-gray-300 italic">No feedback</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
