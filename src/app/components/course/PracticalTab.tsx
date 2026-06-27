import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Loader2, Code, AlertTriangle, Play } from 'lucide-react';
import { sectionsApi, activitiesApi, practicalApi } from '../../services/api';

interface PracticalFiles { html: string; css: string; js: string; }

interface PracticalSub {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  files: PracticalFiles;
  status: string;
  autoSubmitted: boolean;
  submittedAt: string;
  grade: number | null;
  feedback: string;
}

interface Practical {
  id: string;
  name: string;
  sectionTitle: string;
  gradeMax: number;
  sample: PracticalFiles | null;
  instructions: string;
  submissions: PracticalSub[];
}

interface PracticalTabProps { courseId: string; }

const EMPTY_FILES: PracticalFiles = { html: '', css: '', js: '' };

function normFiles(f: unknown): PracticalFiles {
  const o = (f ?? {}) as Record<string, unknown>;
  return { html: String(o.html ?? ''), css: String(o.css ?? ''), js: String(o.js ?? '') };
}

function buildSrcDoc({ html, css, js }: PracticalFiles): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${css || ''}</style></head><body>${html || ''}<script>${js || ''}<\/script></body></html>`;
}

function mapSub(s: Record<string, unknown>): PracticalSub {
  const student = (s.student ?? {}) as Record<string, unknown>;
  return {
    id: String(s.id),
    studentId: String(s.student_id ?? ''),
    studentName: String(student.name ?? 'Unknown'),
    studentEmail: String(student.email ?? ''),
    files: normFiles(s.files),
    status: String(s.status ?? 'draft'),
    autoSubmitted: s.auto_submitted === true,
    submittedAt: String(s.submitted_at ?? ''),
    grade: s.grade !== null && s.grade !== undefined ? Number(s.grade) : null,
    feedback: String(s.feedback ?? ''),
  };
}

export function PracticalTab({ courseId }: PracticalTabProps) {
  const [practicals, setPracticals] = useState<Practical[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Practical | null>(null);
  const [search, setSearch] = useState('');
  const [grading, setGrading] = useState<PracticalSub | null>(null);
  const [gradingData, setGradingData] = useState({ grade: '', feedback: '' });
  const [gradeLoading, setGradeLoading] = useState(false);
  const [codeTab, setCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { loadPracticals(); }, [courseId]);

  const loadPracticals = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // 1) Enumerate practical activities from sections (so practicals with zero
      //    submissions are still listed, and we keep sample/instructions/grade_max).
      const secRes = await sectionsApi.list(courseId);
      const sections: Record<string, unknown>[] = secRes.data.data ?? secRes.data ?? [];
      const perSection = await Promise.allSettled(sections.map(async (sec) => {
        const ar = await activitiesApi.list(String(sec.id));
        const acts: Record<string, unknown>[] = ar.data.data ?? ar.data ?? [];
        return acts
          .filter(a => String(a.type ?? a.activity_type ?? '').toLowerCase() === 'practical')
          .map(act => {
            const settings = (act.settings ?? {}) as Record<string, unknown>;
            return {
              id: String(act.id),
              name: String(act.name ?? act.title ?? 'Practical'),
              sectionTitle: String(sec.title ?? sec.name ?? ''),
              gradeMax: Number(act.grade_max ?? 100),
              sample: settings.sample ? normFiles(settings.sample) : null,
              instructions: String(settings.instructions ?? act.description ?? ''),
              submissions: [] as PracticalSub[],
            } as Practical;
          });
      }));
      const enumerated = perSection.flatMap(r => r.status === 'fulfilled' ? r.value : []);

      // 2) One course-level fetch of ALL practical submissions (same source as the
      //    student Grade Book) — independent of the per-activity enumeration.
      const subRes = await practicalApi.courseSubmissions(courseId);
      const rawSubs = (subRes.data.data ?? subRes.data ?? []) as Record<string, unknown>[];

      // 3) Group submissions by activity_id.
      const byActivity = new Map<string, PracticalSub[]>();
      const activityMeta = new Map<string, { name: string; gradeMax: number }>();
      for (const s of rawSubs) {
        const aid = String(s.activity_id ?? '');
        if (!byActivity.has(aid)) byActivity.set(aid, []);
        byActivity.get(aid)!.push(mapSub(s));
        const a = (s.activity ?? {}) as Record<string, unknown>;
        if (!activityMeta.has(aid)) {
          activityMeta.set(aid, {
            name: String(a.name ?? 'Practical'),
            gradeMax: Number(a.grade_max ?? 100),
          });
        }
      }

      // 4) Attach submissions to enumerated practicals.
      const byId = new Map(enumerated.map(p => [p.id, p]));
      for (const [aid, subs] of byActivity) {
        const p = byId.get(aid);
        if (p) {
          p.submissions = subs;
        } else {
          // Submission whose activity isn't in the section traversal (stale/moved/
          // deleted) — synthesize an entry so it's never hidden from the instructor.
          const meta = activityMeta.get(aid)!;
          enumerated.push({
            id: aid,
            name: meta.name,
            sectionTitle: '',
            gradeMax: meta.gradeMax,
            sample: null,
            instructions: '',
            submissions: subs,
          });
        }
      }

      setPracticals(enumerated);
      // 5) Land on the first practical that actually has submissions.
      setSelected(enumerated.find(p => p.submissions.length > 0) ?? enumerated[0] ?? null);
    } catch (err) {
      console.error('Failed to load practicals:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const openGrading = (sub: PracticalSub) => {
    setGrading(sub);
    setCodeTab('html');
    setGradingData({ grade: sub.grade?.toString() ?? '', feedback: sub.feedback });
  };

  const handleGrade = async () => {
    if (!grading || !selected) return;
    const value = parseFloat(gradingData.grade);
    if (isNaN(value) || value < 0) { alert('Please enter a valid grade'); return; }

    setGradeLoading(true);
    try {
      await practicalApi.grade(grading.id, { grade: value, feedback: gradingData.feedback });
      const updated = practicals.map(p => {
        if (p.id !== selected.id) return p;
        return {
          ...p,
          submissions: p.submissions.map(s => s.id === grading.id
            ? { ...s, grade: value, feedback: gradingData.feedback, status: 'graded' }
            : s),
        };
      });
      setPracticals(updated);
      setSelected(updated.find(p => p.id === selected.id) ?? null);
      setGrading(null);
      setGradingData({ grade: '', feedback: '' });
    } catch (err) {
      console.error('Failed to grade practical:', err);
      alert('Failed to save grade. Please try again.');
    } finally {
      setGradeLoading(false);
    }
  };

  const visibleSubs = selected
    ? selected.submissions.filter(s => s.studentName.toLowerCase().includes(search.toLowerCase()))
    : [];

  const pendingCount = practicals.reduce((n, p) => n + p.submissions.filter(s => s.grade === null && s.status !== 'draft').length, 0);
  const gradedCount = practicals.reduce((n, p) => n + p.submissions.filter(s => s.grade !== null).length, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;
  }

  if (loadError) {
    return (
      <div className="text-center py-16 text-gray-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50 text-amber-400" />
        <p className="text-sm">Couldn't load practical submissions.</p>
        <button onClick={loadPracticals} className="mt-3 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">Retry</button>
      </div>
    );
  }

  if (practicals.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No practical activities found in this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Practical Submissions</h2>
          <p className="text-sm text-gray-500">{practicals.length} practicals · {pendingCount} pending · {gradedCount} graded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Practical list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-sm text-gray-700">Practicals</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {practicals.map(p => {
              const pending = p.submissions.filter(s => s.grade === null && s.status !== 'draft').length;
              const graded = p.submissions.filter(s => s.grade !== null).length;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setSearch(''); }}
                  className={`w-full text-left px-3 py-3 transition-colors hover:bg-gray-50 ${selected?.id === p.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''}`}
                >
                  <p className="text-xs font-semibold text-gray-600 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{p.sectionTitle}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">{pending} pending</span>
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">{graded} graded</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submissions table */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          {selected && (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Max grade: {selected.gradeMax} · {selected.submissions.length} submissions</p>
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

              <div className="overflow-x-auto flex-1">
                {visibleSubs.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400"><p className="text-sm">No submissions yet</p></div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Student</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Submitted</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Grade</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleSubs.map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{sub.studentName}</p>
                            {sub.studentEmail && <p className="text-xs text-gray-400">{sub.studentEmail}</p>}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {sub.grade !== null
                              ? <span className="font-semibold text-green-600">{sub.grade}/{selected.gradeMax}</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                                sub.grade !== null ? 'bg-green-50 text-green-700'
                                  : sub.status === 'submitted' ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {sub.grade !== null ? <><CheckCircle className="w-3 h-3" />Graded</>
                                  : sub.status === 'submitted' ? <><Clock className="w-3 h-3" />Submitted</>
                                  : 'Draft'}
                              </span>
                              {sub.autoSubmitted && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                                  <AlertTriangle className="w-3 h-3" />Auto-submitted
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openGrading(sub)}
                              className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                            >
                              {sub.grade !== null ? 'Review' : 'View & Grade'}
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

      {/* View & Grade modal */}
      {grading && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => !gradeLoading && setGrading(null)} />
          <div className="relative w-full max-w-5xl bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 25px 60px rgba(15,23,42,0.25)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-indigo-600 mb-1">{selected.name}</p>
                <h2 className="text-lg font-bold text-slate-900">{grading.studentName}'s Submission</h2>
                {grading.autoSubmitted && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                    <AlertTriangle className="w-3 h-3" />Auto-submitted (timeout / violation)
                  </span>
                )}
              </div>
              <button onClick={() => setGrading(null)} disabled={gradeLoading} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-50">✕</button>
            </div>

            {/* Previews: student result (left) + instructor target (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> Student result
                </div>
                <iframe title="student" sandbox="allow-scripts" srcDoc={buildSrcDoc(grading.files)} style={{ width: '100%', height: 260, border: 'none', background: '#fff' }} />
              </div>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Instructor target
                </div>
                {selected.sample
                  ? <iframe title="target" sandbox="allow-scripts" srcDoc={buildSrcDoc(selected.sample)} style={{ width: '100%', height: 260, border: 'none', background: '#fff' }} />
                  : <div className="p-6 text-sm text-slate-400">No sample provided.</div>}
              </div>
            </div>

            {/* Student code */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-100 bg-slate-50">
                {(['html', 'css', 'js'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setCodeTab(t)}
                    className={`px-4 py-2 text-xs font-semibold uppercase transition-colors ${codeTab === t ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <pre className="text-xs p-4 overflow-x-auto max-h-56 bg-slate-900 text-slate-100"><code>{grading.files[codeTab] || `// no ${codeTab}`}</code></pre>
            </div>

            {/* Grading form */}
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block mb-2 text-xs font-semibold text-slate-600">Grade (0-{selected.gradeMax})</label>
                <input
                  type="number" min="0" max={selected.gradeMax}
                  value={gradingData.grade}
                  onChange={e => setGradingData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  placeholder="Enter grade"
                />
              </div>
              <div>
                <label className="block mb-2 text-xs font-semibold text-slate-600">Feedback (optional)</label>
                <textarea
                  value={gradingData.feedback}
                  onChange={e => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  placeholder="Provide constructive feedback..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button onClick={() => setGrading(null)} disabled={gradeLoading} className="px-4 py-2 rounded-xl border text-slate-600 text-sm font-semibold disabled:opacity-50" style={{ borderColor: '#e2e8f0' }}>Cancel</button>
              <button onClick={handleGrade} disabled={gradeLoading || !gradingData.grade} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-60 text-sm font-semibold" style={{ backgroundColor: '#2563eb' }}>
                {gradeLoading ? '⟳ Saving...' : '✓ Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
