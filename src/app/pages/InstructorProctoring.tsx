import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, ShieldAlert, ShieldCheck, ShieldOff, Eye,
  RefreshCw, ChevronDown, X, Clock, Flag, BookOpen, FileText, Code2,
  Camera, Copy, MousePointer, Keyboard, Monitor, Smartphone,
  Volume2, Bot, Users, CheckCircle, Loader2, Activity, WifiOff,
} from 'lucide-react';
import { instructorProctoringApi, coursesApi } from '../services/api';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Course { id: string; name: string }

interface ProcSession {
  id: string;
  student: { id: string; name: string; email: string; profile_image_url?: string } | null;
  activity_name: string | null;
  activity_type: string | null;
  context_type: 'quiz' | 'assignment' | 'practical';
  status: 'active' | 'ended' | 'force_submitted';
  violation_count: number;
  is_flagged: boolean;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

interface Violation {
  id: string;
  type: string;
  metadata: Record<string, unknown> | null;
  action_taken: 'warn' | 'final_warning' | 'force_submit';
  warning_count_at_time: number;
  occurred_at: string;
  snapshot_url: string | null;
}

interface SessionDetail extends Omit<ProcSession, 'student'> {
  student: { id: string; name: string; email: string; profile_image_url?: string } | null;
  violations: Violation[];
}

interface Summary {
  total: number;
  flagged: number;
  force_submitted: number;
  avg_violations: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtDur = (s: number | null) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

// Label the proctored activity by its real type, preferring the activity's type
// and falling back to the session's context_type (which survives activity edits).
const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  quiz:       { label: 'Quiz',       icon: BookOpen },
  assignment: { label: 'Assignment', icon: FileText },
  practical:  { label: 'Practical',  icon: Code2 },
};
const typeMeta = (activityType: string | null | undefined, contextType: string) =>
  TYPE_META[(activityType || '').toLowerCase()]
    ?? TYPE_META[(contextType || '').toLowerCase()]
    ?? { label: 'Activity', icon: FileText };

const VIOLATION_INFO: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tab_switch:           { label: 'Tab Switch',          icon: Monitor,      color: '#f59e0b' },
  fullscreen_exit:      { label: 'Fullscreen Exit',      icon: Monitor,      color: '#f59e0b' },
  browser_blur:         { label: 'Window Blur',          icon: WifiOff,      color: '#64748b' },
  copy_attempt:         { label: 'Copy Attempt',         icon: Copy,         color: '#dc2626' },
  paste_attempt:        { label: 'Paste Attempt',        icon: Copy,         color: '#dc2626' },
  right_click:          { label: 'Right Click',          icon: MousePointer, color: '#6366f1' },
  keyboard_shortcut:    { label: 'Keyboard Shortcut',   icon: Keyboard,     color: '#6366f1' },
  no_face_detected:     { label: 'No Face',              icon: Camera,       color: '#dc2626' },
  multiple_faces:       { label: 'Multiple Faces',       icon: Users,        color: '#dc2626' },
  looking_away:         { label: 'Looking Away',         icon: Eye,          color: '#f59e0b' },
  phone_detected:       { label: 'Phone Detected',       icon: Smartphone,   color: '#dc2626' },
  ai_content_detected:  { label: 'AI Content',           icon: Bot,          color: '#7c3aed' },
  background_person:    { label: 'Other Person',         icon: Users,        color: '#dc2626' },
  background_voice:     { label: 'Background Voice',     icon: Volume2,      color: '#f59e0b' },
  suspicious_movement:  { label: 'Suspicious Movement',  icon: Activity,     color: '#f59e0b' },
};

const statusConfig = {
  active:          { label: 'Active',          bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'  },
  ended:           { label: 'Ended',           bg: 'bg-gray-100',  text: 'text-gray-600',   dot: 'bg-gray-400'  },
  force_submitted: { label: 'Force Submitted', bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'   },
};

const actionConfig = {
  warn:           { label: 'Warning',       bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  final_warning:  { label: 'Final Warning', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  force_submit:   { label: 'Force Submit',  bg: 'bg-red-50 text-red-700 border-red-200'          },
};

function formatViolationMeta(type: string, meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return '';
  switch (type) {
    case 'keyboard_shortcut': {
      const key = String(meta.key ?? '');
      const ctrl = meta.ctrl ? 'Ctrl+' : '';
      const shift = meta.shift ? 'Shift+' : '';
      return `Pressed ${ctrl}${shift}${key.toUpperCase()}`;
    }
    case 'browser_blur':
      return 'Window lost focus';
    case 'tab_switch':
      return 'Switched browser tabs';
    case 'copy_attempt':
      return 'Attempted to copy content';
    case 'paste_attempt':
      return 'Attempted to paste content';
    case 'right_click':
      return 'Right-clicked during exam';
    case 'fullscreen_exit':
      return 'Exited fullscreen mode';
    case 'background_voice': {
      const level = meta.audio_level;
      return level !== undefined ? `Audio level detected: ${level}` : 'Background voice detected';
    }
    case 'suspicious_movement': {
      const diff = meta.avg_pixel_diff;
      return diff !== undefined ? `Movement score: ${diff}` : 'Suspicious movement detected';
    }
    default:
      return '';
  }
}

function getSnapshotUrl(v: Violation): string | null {
  if (v.snapshot_url) return v.snapshot_url;
  const raw = v.metadata?.snapshot ?? v.metadata?.snapshot_data ?? null;
  if (typeof raw === 'string' && raw.startsWith('data:image')) return raw;
  if (typeof raw === 'string' && raw.length > 100) return `data:image/jpeg;base64,${raw}`;
  return null;
}

// ── Violation icon row ─────────────────────────────────────────────────────────
function ViolationBadges({ count, violations }: { count: number; violations?: Violation[] }) {
  if (count === 0) return <span className="text-gray-400 text-xs">None</span>;
  const types = violations ? [...new Set(violations.map(v => v.type))] : [];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count >= 5 ? 'bg-red-100 text-red-700' : count >= 3 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {count}
      </span>
      {types.slice(0, 3).map(t => {
        const info = VIOLATION_INFO[t];
        if (!info) return null;
        const Icon = info.icon;
        return <Icon key={t} size={13} style={{ color: info.color }} title={info.label} />;
      })}
    </div>
  );
}

// ── Session Detail Modal ───────────────────────────────────────────────────────
function SessionDetailModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    instructorProctoringApi.sessionDetail(sessionId)
      .then(r => setDetail(r.data as SessionDetail))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const st = detail ? statusConfig[detail.status] ?? statusConfig.ended : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Session Detail</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
            </div>
          ) : !detail ? (
            <p className="text-center text-gray-400 py-12">Session not found.</p>
          ) : (
            <>
              {/* Student + meta */}
              <div className="flex items-start gap-4">
                {detail.student?.profile_image_url ? (
                  <img src={detail.student.profile_image_url} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(detail.student?.name ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{detail.student?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500">{detail.student?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${st?.bg} ${st?.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st?.dot}`} />
                      {st?.label}
                    </span>
                    {detail.is_flagged && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                        <Flag size={10} /> Flagged
                      </span>
                    )}
                    {(() => {
                      const m = typeMeta(detail.activity_type, detail.context_type);
                      const TypeIcon = m.icon;
                      return (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <TypeIcon size={11} /> {m.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Activity + time */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Activity', value: detail.activity_name ?? '—' },
                  { label: 'Started', value: fmtDate(detail.started_at) },
                  { label: 'Duration', value: fmtDur(detail.duration_seconds) },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Violations timeline */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Violations ({detail.violations.length})
                </h3>
                {detail.violations.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-4 py-3">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">No violations recorded</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.violations.map((v, i) => {
                      const info = VIOLATION_INFO[v.type] ?? { label: v.type, icon: AlertTriangle, color: '#94a3b8' };
                      const Icon = info.icon;
                      const ac   = actionConfig[v.action_taken] ?? actionConfig.warn;
                      return (
                        <div key={v.id} className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors overflow-hidden">
                          <div className="flex items-start gap-3 p-3">
                            {/* Number */}
                            <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0 pt-0.5">#{i + 1}</span>
                            {/* Icon */}
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${info.color}18` }}>
                              <Icon size={13} style={{ color: info.color }} />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800">{info.label}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ac.bg}`}>{ac.label}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{fmtDate(String(v.occurred_at))}</p>
                              {(() => {
                                const metaText = formatViolationMeta(v.type, v.metadata);
                                return metaText ? (
                                  <p className="text-xs text-gray-500 mt-0.5">{metaText}</p>
                                ) : null;
                              })()}
                            </div>
                            {/* Warning count */}
                            <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">W{v.warning_count_at_time}</span>
                          </div>
                          {/* Snapshot thumbnail */}
                          {(() => {
                            const snapUrl = getSnapshotUrl(v);
                            return snapUrl ? (
                              <div className="border-t border-gray-100 bg-black">
                                <img
                                  src={snapUrl}
                                  alt={`Snapshot at ${info.label}`}
                                  className="w-full max-h-44 object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InstructorProctoring() {
  const [courses, setCourses]         = useState<Course[]>([]);
  const [courseId, setCourseId]       = useState('');
  const [courseLoading, setCourseLoading] = useState(false);

  const [sessions, setSessions]       = useState<ProcSession[]>([]);
  const [summary, setSummary]         = useState<Summary | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [filter, setFilter]           = useState<'all' | 'flagged' | 'force_submitted'>('all');
  const [search, setSearch]           = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const STORAGE_KEY = 'proctoring_selected_course';

  // Load courses
  useEffect(() => {
    setCourseLoading(true);
    coursesApi.list()
      .then(r => {
        const list = (r.data.data ?? r.data ?? []) as Course[];
        setCourses(list);
        const saved = localStorage.getItem(STORAGE_KEY);
        const valid = list.find(c => c.id === saved);
        setCourseId(valid ? saved! : (list[0]?.id ?? ''));
      })
      .catch(() => {})
      .finally(() => setCourseLoading(false));
  }, []);

  // Persist course selection
  useEffect(() => {
    if (courseId) localStorage.setItem(STORAGE_KEY, courseId);
  }, [courseId]);

  // Load sessions when course changes
  const loadData = useCallback(() => {
    if (!courseId) return;
    setDataLoading(true);
    instructorProctoringApi.sessions(courseId)
      .then(r => {
        const data = r.data as { summary: Summary; sessions: { data: ProcSession[] } };
        setSummary(data.summary);
        setSessions(data.sessions.data ?? []);
      })
      .catch(() => { setSummary(null); setSessions([]); })
      .finally(() => setDataLoading(false));
  }, [courseId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered list
  const filtered = sessions.filter(s => {
    if (filter === 'flagged' && !s.is_flagged) return false;
    if (filter === 'force_submitted' && s.status !== 'force_submitted') return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.student?.name ?? '').toLowerCase().includes(q) ||
             (s.student?.email ?? '').toLowerCase().includes(q) ||
             (s.activity_name ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const FILTER_TABS = [
    { key: 'all',            label: 'All Sessions' },
    { key: 'flagged',        label: 'Flagged' },
    { key: 'force_submitted',label: 'Force Submitted' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proctoring Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review exam integrity sessions and violation logs</p>
        </div>
        <button
          onClick={loadData}
          disabled={dataLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={dataLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Course selector */}
      <div className="relative w-72">
        {courseLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading courses…
          </div>
        ) : (
          <div className="relative">
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Sessions',  value: summary.total,           icon: ShieldCheck, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Flagged',         value: summary.flagged,          icon: Flag,        color: '#dc2626', bg: '#fef2f2' },
            { label: 'Force Submitted', value: summary.force_submitted,  icon: ShieldOff,   color: '#dc2626', bg: '#fef2f2' },
            { label: 'Avg Violations',  value: summary.avg_violations,   icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb' },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.bg }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
              style={{
                backgroundColor: filter === t.key ? '#4f46e5' : 'white',
                color:           filter === t.key ? 'white'   : '#475569',
                borderColor:     filter === t.key ? '#4f46e5' : '#e2e8f0',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student or activity…"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      {/* Sessions table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No sessions found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Student', 'Activity', 'Type', 'Status', 'Violations', 'Duration', 'Started', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => {
                const sc = statusConfig[s.status] ?? statusConfig.ended;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {s.student?.profile_image_url ? (
                          <img src={s.student.profile_image_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(s.student?.name ?? '?').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800 truncate max-w-[140px]">{s.student?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{s.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Activity */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-[160px]">{s.activity_name ?? '—'}</p>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      {(() => {
                        const m = typeMeta(s.activity_type, s.context_type);
                        const TypeIcon = m.icon;
                        return (
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                            <TypeIcon size={12} /> {m.label}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        {s.is_flagged && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                            <Flag size={9} /> Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Violations */}
                    <td className="px-4 py-3">
                      <ViolationBadges count={s.violation_count} />
                    </td>
                    {/* Duration */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} /> {fmtDur(s.duration_seconds)}
                      </span>
                    </td>
                    {/* Started */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(s.started_at)}
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSessionId(s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
