import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, AlertTriangle, BarChart2, Bell, BookOpen, CheckCircle,
  ChevronDown, Clock, Info, Laptop, Monitor, RefreshCw, Search,
  Send, Smartphone, TrendingDown, TrendingUp, Users, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { instructorEngagementApi, coursesApi } from '../services/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface Course { id: string; name: string }
interface ScoreBreakdown {
  login_consistency: number | null; content_completion: number | null;
  assessment_activity: number | null; forum_participation: number | null;
  pacing: number | null; live_session: number | null;
}
// Measured-vs-assumed confidence — which of the 6 signals were actually measured.
interface Confidence {
  measured: string[]; absent: string[]; confidence: number; label: string;
}
interface TimeOnTaskResource { resource_type: string | null; resource_id: string | null; seconds: number }
interface TimeOnTask { total_seconds: number; by_resource: TimeOnTaskResource[] }
interface LearnerRow {
  user_id: string; name: string; email: string; profile_image?: string;
  engagement_score: number; has_data?: boolean; risk_level: 'engaged' | 'at_risk' | 'disengaged';
  streak: number; last_login: string | null; inactive_days: number | null;
  week_number: number | null; score_breakdown: ScoreBreakdown; confidence?: Confidence;
}
interface AtRiskEntry extends LearnerRow {
  interventions: Intervention[]; reasons: string[];
}
interface Intervention {
  type: string; title: string; suggestion: string;
  action: string | null; priority: number;
}
interface LearnerDetail {
  user: { id: string; name: string; email: string; profile_image?: string };
  engagement_score: number; risk_level: string; streak: { current_streak_days: number; longest_streak_days: number } | null;
  inactive_days: number | null; score_history: ScoreHistoryEntry[];
  login_history: LoginSession[]; activity_log: ActivityEvent[];
  device_breakdown: Record<string, number>; interventions: Intervention[];
  score_breakdown?: ScoreBreakdown; confidence?: Confidence; time_on_task?: TimeOnTask;
}
interface ScoreHistoryEntry { week_number: number; engagement_score: number }
interface LoginSession { id: string; started_at: string; ended_at: string | null; device_type: string; duration_seconds: number | null; ip_address: string | null; is_bounce: boolean }
interface ActivityEvent { id: string; event_type: string; occurred_at: string; resource_type: string | null; value: number | null }
interface Summary { total: number; engaged: number; at_risk: number; disengaged: number; avg_score: number }

// ── Helpers ──────────────────────────────────────────────────────────────────
const scoreColor  = (s: number) => s >= 70 ? '#16a34a' : s >= 40 ? '#f59e0b' : '#dc2626';
const scoreLabel  = (s: number) => s >= 70 ? 'Engaged' : s >= 40 ? 'At Risk' : 'Disengaged';
const scoreBg     = (s: number) => s >= 70 ? 'bg-green-50 text-green-700 border-green-200' : s >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';
const riskIcon    = (r: string) => r === 'engaged' ? <CheckCircle className="w-4 h-4 text-green-500" /> : r === 'at_risk' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />;
const fmtDate     = (d: string) => new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDuration = (s: number | null) => { if (!s) return '—'; const m = Math.floor(s / 60); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`; };
const fmtSeconds  = (s: number) => { if (!s) return '0m'; if (s < 60) return `${s}s`; const m = Math.floor(s / 60); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`; };

// Shows "based on N/6 signals" so the instructor knows the score reflects
// measured data, not assumptions. Absent signals are listed on hover.
function ConfidenceChip({ confidence }: { confidence?: Confidence }) {
  if (!confidence || !confidence.label) return null;
  const full = confidence.confidence >= 1;
  return (
    <span
      title={confidence.absent.length ? `Not measured: ${confidence.absent.map(s => s.replace(/_/g, ' ')).join(', ')}` : 'All signals measured'}
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${full ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      <Info className="w-3 h-3" /> based on {confidence.label}
    </span>
  );
}

const intColors: Record<string, string> = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning:'bg-amber-50 border-amber-200 text-amber-700',
  info:   'bg-blue-50 border-blue-200 text-blue-700',
  success:'bg-green-50 border-green-200 text-green-700',
};
const intIcons: Record<string, React.ElementType> = {
  danger: AlertTriangle, warning: AlertTriangle, info: Info, success: CheckCircle,
};

// ── Mini score gauge ──────────────────────────────────────────────────────────
function MiniGauge({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: scoreColor(score), transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-sm font-bold w-8 text-right" style={{ color: scoreColor(score) }}>{Math.round(score)}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InstructorEngagement() {
  const [tab, setTab] = useState<'overview' | 'atrisk' | 'detail'>('overview');

  // Course selection
  const [courses, setCourses]       = useState<Course[]>([]);
  const [courseId, setCourseId]     = useState('');
  const [courseLoading, setCourseLoading] = useState(false);

  // Overview
  const [learners, setLearners]     = useState<LearnerRow[]>([]);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [ovLoading, setOvLoading]   = useState(false);
  const [search, setSearch]         = useState('');
  const [riskFilter, setRiskFilter] = useState<'' | 'engaged' | 'at_risk' | 'disengaged'>('');
  const [sortBy, setSortBy]         = useState<'score_asc' | 'score_desc' | 'inactive'>('score_desc');

  // At-risk
  const [atRisk, setAtRisk]         = useState<AtRiskEntry[]>([]);
  const [arLoading, setArLoading]   = useState(false);
  const [nudging, setNudging]       = useState<string | null>(null);
  const [nudgeDone, setNudgeDone]   = useState<Set<string>>(new Set());

  // Learner detail
  const [selectedUser, setSelectedUser] = useState('');
  const [detail, setDetail]         = useState<LearnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const STORAGE_KEY = 'engagement_selected_course';

  // Load courses on mount — restore previously selected course if still valid
  useEffect(() => {
    coursesApi.list().then(r => {
      const list: Course[] = r.data.data ?? r.data ?? [];
      setCourses(list);
      if (list.length === 0) return;
      const saved = localStorage.getItem(STORAGE_KEY);
      const valid = saved && list.some(c => c.id === saved);
      setCourseId(valid ? saved : list[0].id);
    }).catch(() => {});
  }, []);

  // Load overview when courseId changes
  const loadOverview = useCallback(() => {
    if (!courseId) return;
    setOvLoading(true);
    instructorEngagementApi.courseOverview(courseId).then(r => {
      setLearners(r.data.data ?? []);
      setSummary(r.data.summary ?? null);
    }).catch(() => {}).finally(() => setOvLoading(false));
  }, [courseId]);

  const loadAtRisk = useCallback(() => {
    if (!courseId) return;
    setArLoading(true);
    instructorEngagementApi.atRisk(courseId).then(r => setAtRisk(r.data.data ?? []))
      .catch(() => {}).finally(() => setArLoading(false));
  }, [courseId]);

  const loadDetail = useCallback(() => {
    if (!courseId || !selectedUser) return;
    setDetailLoading(true);
    instructorEngagementApi.learnerDetail(courseId, selectedUser).then(r => setDetail(r.data))
      .catch(() => {}).finally(() => setDetailLoading(false));
  }, [courseId, selectedUser]);

  useEffect(() => { if (tab === 'overview') loadOverview(); }, [courseId, tab]);
  useEffect(() => { if (tab === 'atrisk')   loadAtRisk(); }, [courseId, tab]);
  useEffect(() => { if (tab === 'detail' && selectedUser) loadDetail(); }, [selectedUser, tab, courseId]);

  // Nudge learner
  const handleNudge = async (userId: string) => {
    if (!courseId) return;
    setNudging(userId);
    try {
      await instructorEngagementApi.nudge(courseId, userId);
      setNudgeDone(prev => new Set([...prev, userId]));
    } catch { /* silent */ } finally { setNudging(null); }
  };

  // Filtered + sorted learners
  const filtered = learners
    .filter(l => {
      const q = search.toLowerCase();
      if (q && !l.name?.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q)) return false;
      if (riskFilter && l.risk_level !== riskFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score_asc')  return a.engagement_score - b.engagement_score;
      if (sortBy === 'score_desc') return b.engagement_score - a.engagement_score;
      return (b.inactive_days ?? 0) - (a.inactive_days ?? 0);
    });

  // Component scores are already on a 0-100 scale. Prefer the API's
  // score_breakdown (which marks absent signals as null) and skip those axes.
  const bd = detail?.score_breakdown;
  const radarData = bd ? ([
    { subject: 'Login',      value: bd.login_consistency },
    { subject: 'Content',    value: bd.content_completion },
    { subject: 'Assessment', value: bd.assessment_activity },
    { subject: 'Forum',      value: bd.forum_participation },
    { subject: 'Pacing',     value: bd.pacing },
    { subject: 'Live',       value: bd.live_session },
  ].filter(d => d.value !== null) as { subject: string; value: number }[]) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-indigo-600" /> Learner Engagement
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor engagement, identify at-risk learners, and send AI-powered nudges.</p>
        </div>
        {/* Course selector */}
        <div className="relative">
          <select value={courseId} onChange={e => { setCourseId(e.target.value); localStorage.setItem(STORAGE_KEY, e.target.value); }}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-48">
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: summary.total, color: 'text-gray-800', bg: 'bg-gray-50' },
            { label: 'Engaged', value: summary.engaged, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'At Risk', value: summary.at_risk, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Disengaged', value: summary.disengaged, color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'Avg Score', value: `${summary.avg_score}`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl ${c.bg} border border-gray-100 px-4 py-3 shadow-sm text-center`}>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'overview', label: 'Class Overview' },
          { key: 'atrisk',   label: `At-Risk ${atRisk.length > 0 ? `(${atRisk.length})` : ''}` },
          { key: 'detail',   label: 'Learner Detail' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-gray-50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as typeof riskFilter)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="">All levels</option>
              <option value="engaged">Engaged</option>
              <option value="at_risk">At Risk</option>
              <option value="disengaged">Disengaged</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="score_desc">Score ↓</option>
              <option value="score_asc">Score ↑</option>
              <option value="inactive">Most Inactive</option>
            </select>
            <button onClick={loadOverview} className="text-gray-400 hover:text-indigo-500 px-2">
              <RefreshCw className={`w-4 h-4 ${ovLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-2.5">Learner</th>
                  <th className="text-left px-5 py-2.5">Engagement</th>
                  <th className="text-left px-5 py-2.5">Status</th>
                  <th className="text-left px-5 py-2.5">Streak</th>
                  <th className="text-left px-5 py-2.5">Last Login</th>
                  <th className="text-left px-5 py-2.5">Inactive</th>
                  <th className="text-left px-5 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ovLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">No learners found</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.user_id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{l.name}</p>
                      <p className="text-xs text-gray-400">{l.email}</p>
                    </td>
                    <td className="px-5 py-3 min-w-36">
                      <MiniGauge score={l.engagement_score} />
                      {l.has_data === false
                        ? <span className="text-[11px] text-gray-400 mt-1 inline-block">No data yet</span>
                        : <div className="mt-1"><ConfidenceChip confidence={l.confidence} /></div>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg(l.engagement_score)}`}>
                        {riskIcon(l.risk_level)} {scoreLabel(l.engagement_score)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Zap className="w-3.5 h-3.5" /> {l.streak}d
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{l.last_login ? fmtDate(l.last_login) : '—'}</td>
                    <td className="px-5 py-3">
                      {l.inactive_days !== null && l.inactive_days > 3
                        ? <span className="text-xs font-medium text-red-500">{l.inactive_days}d ago</span>
                        : <span className="text-xs text-gray-400">{l.inactive_days ?? 0}d ago</span>}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => { setSelectedUser(l.user_id); setTab('detail'); }}
                        className="text-xs text-indigo-600 hover:underline font-medium">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AT-RISK TAB ─────────────────────────────────────────────────────── */}
      {tab === 'atrisk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Learners flagged at-risk or disengaged by measured engagement signals.</p>
            <button onClick={loadAtRisk} className="text-gray-400 hover:text-red-500">
              <RefreshCw className={`w-4 h-4 ${arLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {arLoading ? (
            <div className="flex items-center justify-center h-48"><RefreshCw className="w-6 h-6 text-red-400 animate-spin" /></div>
          ) : atRisk.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">All learners are engaged!</p>
              <p className="text-sm text-gray-400 mt-1">No at-risk students in this course right now.</p>
            </div>
          ) : atRisk.map(l => (
            <div key={l.user_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Learner header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                    {l.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{l.name}</p>
                    <p className="text-xs text-gray-400">{l.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreBg(l.engagement_score)}`}>
                    Score: {l.engagement_score}
                  </span>
                  {nudgeDone.has(l.user_id) ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Nudge Sent
                    </span>
                  ) : (
                    <button onClick={() => handleNudge(l.user_id)} disabled={nudging === l.user_id}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      {nudging === l.user_id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                      Send Nudge
                    </button>
                  )}
                  <button onClick={() => { setSelectedUser(l.user_id); setTab('detail'); }}
                    className="text-xs text-indigo-600 hover:underline font-medium">Detail →</button>
                </div>
              </div>
              {/* Risk reasons + interventions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Reasons</p>
                  <ul className="space-y-1">
                    {l.reasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Interventions</p>
                  <div className="space-y-2">
                    {l.interventions.slice(0, 2).map((int, i) => {
                      const IcComp = intIcons[int.type] ?? Info;
                      return (
                        <div key={i} className={`rounded-xl border px-3 py-2 text-xs ${intColors[int.type] ?? intColors.info}`}>
                          <div className="flex items-start gap-2">
                            <IcComp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold">{int.title}</p>
                              <p className="mt-0.5 leading-relaxed opacity-90">{int.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LEARNER DETAIL TAB ────────────────────────────────────────────── */}
      {tab === 'detail' && (
        <div className="space-y-5">
          {/* Learner selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Select Learner:</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-56">
              <option value="">— choose a learner —</option>
              {learners.map(l => (
                <option key={l.user_id} value={l.user_id}>{l.name} ({Math.round(l.engagement_score)})</option>
              ))}
            </select>
            {selectedUser && (
              <button onClick={loadDetail} className="text-gray-400 hover:text-indigo-500">
                <RefreshCw className={`w-4 h-4 ${detailLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {!selectedUser && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a learner above to view their full engagement profile.</p>
            </div>
          )}

          {detailLoading && (
            <div className="flex items-center justify-center h-48"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
          )}

          {detail && !detailLoading && (
            <>
              {/* Learner info + score + nudge */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                  {detail.user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">{detail.user.name}</p>
                  <p className="text-sm text-gray-400">{detail.user.email}</p>
                  {detail.streak && (
                    <p className="text-xs text-amber-500 mt-0.5">🔥 {detail.streak.current_streak_days}-day streak · longest: {detail.streak.longest_streak_days}d</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-3xl font-black" style={{ color: scoreColor(detail.engagement_score) }}>{Math.round(detail.engagement_score)}</span>
                    <span className="text-gray-400 text-sm">/100</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg(detail.engagement_score)}`}>
                    {scoreLabel(detail.engagement_score)}
                  </span>
                  <ConfidenceChip confidence={detail.confidence} />
                  {nudgeDone.has(detail.user.id) ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Nudge Sent
                    </span>
                  ) : (
                    <button onClick={() => handleNudge(detail.user.id)} disabled={nudging === detail.user.id}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors">
                      <Send className="w-3.5 h-3.5" /> Send AI Nudge
                    </button>
                  )}
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Weekly Score Trend
                  </h3>
                  {detail.score_history.length > 0 ? (
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={detail.score_history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week_number" tick={{ fontSize: 11 }} tickFormatter={w => `W${w}`} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
                        <Line type="monotone" dataKey="engagement_score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-36 text-gray-400 text-sm">No trend data</div>}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-green-500" /> Signal Breakdown
                  </h3>
                  {radarData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={150}>
                      <RadarChart data={radarData} cx="50%" cy="50%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-36 text-gray-400 text-sm">No breakdown data</div>}
                </div>
              </div>

              {/* Real active time-on-task (measured, not estimated) */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Active Time on Task
                  <span className="text-xs text-gray-400">(last 30 days, measured)</span>
                </h3>
                <p className="text-3xl font-black text-indigo-600 mb-3">
                  {fmtSeconds(detail.time_on_task?.total_seconds ?? 0)}
                  <span className="text-sm font-medium text-gray-400 ml-2">total active</span>
                </p>
                {detail.time_on_task && detail.time_on_task.by_resource.length > 0 ? (
                  <div className="space-y-1.5">
                    {[...detail.time_on_task.by_resource]
                      .sort((a, b) => b.seconds - a.seconds)
                      .slice(0, 6)
                      .map((r, i) => {
                        const max = detail.time_on_task!.by_resource.reduce((m, x) => Math.max(m, x.seconds), 1);
                        return (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <span className="w-24 text-gray-500 capitalize truncate">{(r.resource_type ?? 'page').replace(/_/g, ' ')}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.round((r.seconds / max) * 100)}%` }} />
                            </div>
                            <span className="w-14 text-right font-medium text-gray-600">{fmtSeconds(r.seconds)}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No active time recorded yet — the learner hasn't generated tracked activity in this window.</p>
                )}
              </div>

              {/* AI Interventions */}
              {detail.interventions.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" /> AI Suggested Interventions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detail.interventions.map((int, i) => {
                      const IcComp = intIcons[int.type] ?? Info;
                      return (
                        <div key={i} className={`rounded-xl border p-4 text-sm ${intColors[int.type] ?? intColors.info}`}>
                          <div className="flex items-start gap-2">
                            <IcComp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold">{int.title}</p>
                              <p className="mt-1 leading-relaxed opacity-90 text-xs">{int.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Login history */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Recent Login Sessions
                    <span className="text-xs text-gray-400">(last 20)</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <th className="text-left px-5 py-2">Student</th>
                        <th className="text-left px-5 py-2">Date</th>
                        <th className="text-left px-5 py-2">Device</th>
                        <th className="text-left px-5 py-2">IP Address</th>
                        <th className="text-left px-5 py-2">Duration</th>
                        <th className="text-left px-5 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.login_history.length === 0 ? (
                        <tr><td colSpan={6} className="py-6 text-center text-gray-400">No login history</td></tr>
                      ) : detail.login_history.map(s => {
                        const sessionStatus = !s.ended_at ? 'active' : s.is_bounce ? 'bounced' : 'completed';
                        return (
                          <tr key={s.id} className="hover:bg-gray-50/50">
                            <td className="px-5 py-2.5">
                              <p className="font-medium text-gray-800 text-xs">{detail.user.name}</p>
                              <p className="text-xs text-gray-400">{detail.user.email}</p>
                            </td>
                            <td className="px-5 py-2.5 text-gray-700 font-medium text-xs">{fmtDate(s.started_at)}</td>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-1.5 text-gray-500 capitalize text-xs">
                                {s.device_type === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : s.device_type === 'tablet' ? <Laptop className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                                {s.device_type || 'desktop'}
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-gray-500 text-xs font-mono">{s.ip_address ?? '—'}</td>
                            <td className="px-5 py-2.5 text-gray-500 text-xs">{fmtDuration(s.duration_seconds)}</td>
                            <td className="px-5 py-2.5">
                              {sessionStatus === 'active' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">● Active</span>
                              )}
                              {sessionStatus === 'bounced' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">Bounced</span>
                              )}
                              {sessionStatus === 'completed' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-medium">Completed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activity log */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" /> Recent Activity Events
                    <span className="text-xs text-gray-400">(last 30)</span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {detail.activity_log.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">No activity events</div>
                  ) : detail.activity_log.map(ev => (
                    <div key={ev.id} className="flex items-center gap-4 px-5 py-2.5 hover:bg-gray-50/50">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap`}>
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500 capitalize flex-1">{ev.resource_type?.replace(/_/g, ' ') ?? 'action'}</span>
                      {ev.value !== null && <span className="text-xs text-gray-400">{ev.value}%</span>}
                      <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(ev.occurred_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
