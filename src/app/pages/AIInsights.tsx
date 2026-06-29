import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, Lightbulb, BookOpen,
  Zap, RefreshCw, ChevronRight, Star, Target, CheckCircle, Info, Send,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { aiApi, instructorEngagementApi } from '../services/api';
import AiQuestionStudio from '../components/AiQuestionStudio';

// ─── Types (real API shapes) ──────────────────────────────────────────────
interface WeekPoint { week: string; avg: number; completion: number; engagement: number }
interface SkillPoint { subject: string; A: number; fullMark: number }
interface Suggestion { title: string; desc: string; impact?: string }
interface ContentRec { title: string; type: string; relevance: number; source: string }

interface Confidence { measured: string[]; absent: string[]; confidence: number; label: string }
interface Intervention { type: string; title: string; suggestion: string }
interface AtRiskEntry {
  user_id: string; name: string; email: string;
  engagement_score: number; has_data?: boolean;
  risk_level: 'engaged' | 'at_risk' | 'disengaged';
  inactive_days: number | null; last_login: string | null;
  reasons: string[]; interventions: Intervention[]; confidence?: Confidence;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const riskBg = (r: string) =>
  r === 'disengaged' ? 'bg-red-50 border-red-200 text-red-700'
  : r === 'at_risk'  ? 'bg-amber-50 border-amber-200 text-amber-700'
  : 'bg-green-50 border-green-200 text-green-700';
const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 40 ? '#f59e0b' : '#dc2626';
const intColors: Record<string, string> = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning:'bg-amber-50 border-amber-200 text-amber-700',
  info:   'bg-blue-50 border-blue-200 text-blue-700',
  success:'bg-green-50 border-green-200 text-green-700',
};

function EmptyState({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  return (
    <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
      <Icon className="w-9 h-9 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

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

// ─── Response mappers (shared by initial load & manual regenerate) ──────────
const mapSuggestions = (d: Record<string, unknown>[]): Suggestion[] =>
  d.map(s => ({
    title:  String(s.title ?? ''),
    desc:   String(s.description ?? s.desc ?? s.suggestion ?? ''),
    impact: s.impact_level ? String(s.impact_level) : undefined,
  }));

const mapContentRecs = (d: Record<string, unknown>[]): ContentRec[] =>
  d.map(c => ({
    title:     String(c.title ?? ''),
    type:      String(c.content_type ?? c.type ?? ''),
    relevance: Math.round(Number(c.relevance_score ?? c.relevance ?? 0)),
    source:    String(c.source ?? ''),
  }));

// ─── Component ────────────────────────────────────────────────────────────
export default function AIInsights() {
  const { courses } = useApp();
  const activeCourses = courses.filter(c => (c as unknown as Record<string, unknown>).status === 'active');
  const [selectedCourse, setSelectedCourse] = useState(() => {
    const c = activeCourses[0] as unknown as Record<string, unknown>;
    return c ? String(c.id) : '';
  });
  const [activeInsight, setActiveInsight] = useState<'performance' | 'atRisk' | 'recommendations' | 'generate'>('performance');
  const [loading, setLoading] = useState(false);
  const [nudging, setNudging] = useState<string | null>(null);
  const [nudgeDone, setNudgeDone] = useState<Set<string>>(new Set());

  // ── Real API-driven state — starts EMPTY (no fabricated data) ──
  const [performance, setPerformance]   = useState<WeekPoint[]>([]);
  const [skills, setSkills]             = useState<SkillPoint[]>([]);
  const [atRisk, setAtRisk]             = useState<AtRiskEntry[]>([]);
  const [recs, setRecs]                 = useState<Suggestion[]>([]);
  const [contentRecs, setContentRecs]   = useState<ContentRec[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<Record<string, unknown>>({});

  const load = useCallback(() => {
    if (!selectedCourse) return;
    const id = selectedCourse;
    setLoading(true);

    const tasks = [
      aiApi.snapshots(id).then(r => {
        const d: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
        setPerformance(d.map((w, i) => ({
          week:       String(w.period ?? `W${i + 1}`),
          avg:        Number(w.avg_grade ?? 0),
          completion: Number(w.completion_rate ?? 0),
          engagement: Number(w.engagement_score ?? 0),
        })));
        if (d.length) setSnapshotStats(d[d.length - 1] as Record<string, unknown>);
      }).catch(() => {}),

      aiApi.skillMetrics(id).then(r => {
        const d: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
        setSkills(d.map(m => ({ subject: String(m.metric ?? m.skill ?? ''), A: Number(m.score ?? 0), fullMark: 100 })));
      }).catch(() => {}),

      // Real measured at-risk learners (same source as the Engagement page).
      instructorEngagementApi.atRisk(id).then(r => {
        setAtRisk((r.data.data ?? []) as AtRiskEntry[]);
      }).catch(() => {}),

      aiApi.suggestions(id).then(r => {
        setRecs(mapSuggestions(r.data.data ?? r.data ?? []));
      }).catch(() => {}),

      aiApi.contentRecs(id).then(r => {
        setContentRecs(mapContentRecs(r.data.data ?? r.data ?? []));
      }).catch(() => {}),
    ];

    Promise.allSettled(tasks).finally(() => setLoading(false));
  }, [selectedCourse]);

  useEffect(() => { load(); }, [load]);

  // ── Force Gemini to regenerate the cached AI panels (refresh=1) ──
  const [regenSug, setRegenSug] = useState(false);
  const [regenContent, setRegenContent] = useState(false);

  const regenerateSuggestions = () => {
    if (!selectedCourse || regenSug) return;
    setRegenSug(true);
    aiApi.suggestions(selectedCourse, true)
      .then(r => setRecs(mapSuggestions(r.data.data ?? r.data ?? [])))
      .catch(() => {})
      .finally(() => setRegenSug(false));
  };

  const regenerateContent = () => {
    if (!selectedCourse || regenContent) return;
    setRegenContent(true);
    aiApi.contentRecs(selectedCourse, true)
      .then(r => setContentRecs(mapContentRecs(r.data.data ?? r.data ?? [])))
      .catch(() => {})
      .finally(() => setRegenContent(false));
  };

  const handleNudge = async (userId: string) => {
    if (!selectedCourse) return;
    setNudging(userId);
    try {
      await instructorEngagementApi.nudge(selectedCourse, userId);
      setNudgeDone(prev => new Set([...prev, userId]));
    } catch { /* silent */ } finally { setNudging(null); }
  };

  const criticalCount = atRisk.filter(s => s.risk_level === 'disengaged').length;
  const completionPct = snapshotStats.completion_rate != null ? `${Number(snapshotStats.completion_rate).toFixed(0)}%` : '—';
  const avgGrade      = snapshotStats.avg_grade != null ? `${Number(snapshotStats.avg_grade).toFixed(0)}%` : '—';
  const avgEngagement = snapshotStats.engagement_score != null ? `${Number(snapshotStats.engagement_score).toFixed(0)}` : '—';

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-sm text-gray-500">Measured engagement analytics &amp; at-risk detection</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {activeCourses.map(c => {
              const cr = c as unknown as Record<string, unknown>;
              return <option key={String(cr.id)} value={String(cr.id)}>{String(cr.name ?? '')}</option>;
            })}
          </select>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'performance',     label: 'Performance Analysis', icon: TrendingUp   },
          { id: 'atRisk',          label: `Risk Dashboard${criticalCount > 0 ? ` (${criticalCount}!)` : ''}`, icon: AlertTriangle },
          { id: 'recommendations', label: 'AI Suggestions',       icon: Lightbulb    },
          { id: 'generate',        label: 'Generate Questions',   icon: Zap          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveInsight(tab.id as typeof activeInsight)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              activeInsight === tab.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* ══ Performance Analysis ══ */}
      {activeInsight === 'performance' && (
        <div className="space-y-5">
          {/* KPI cards — real snapshot values, em-dash when not yet available */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Grade',       value: avgGrade,      icon: Star         },
              { label: 'Completion Rate',  value: completionPct, icon: Target       },
              { label: 'At-Risk Learners', value: String(atRisk.length), icon: AlertTriangle },
              { label: 'Avg. Engagement',  value: avgEngagement, icon: Zap          },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                  <kpi.icon className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Weekly Trends</h3>
              {performance.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip /><Legend />
                    <Line key="avg"        type="monotone" dataKey="avg"        name="Avg Grade"    stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    <Line key="completion" type="monotone" dataKey="completion" name="Completion %"  stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line key="engagement" type="monotone" dataKey="engagement" name="Engagement %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={TrendingUp} title="No weekly snapshots yet" hint="Trends appear once performance snapshots have been computed." />}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Skill Distribution</h3>
              {skills.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={skills}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <Radar name="Class Average" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={Target} title="No skill metrics yet" />}
            </div>
          </div>

          {/* Content recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Content Recommendations</h3>
                <p className="text-xs text-gray-400 mb-4">Suggested resources based on measured performance patterns</p>
              </div>
              <button
                onClick={regenerateContent}
                disabled={regenContent}
                title="Regenerate from the latest measured data"
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenContent ? 'animate-spin' : ''}`} />
                {regenContent ? 'Generating…' : 'Regenerate'}
              </button>
            </div>
            {contentRecs.length > 0 ? (
              <div className="space-y-3">
                {contentRecs.map((rec, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                      <p className="text-xs text-gray-400">{rec.type}{rec.source ? ` · ${rec.source}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${rec.relevance}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{rec.relevance}%</span>
                      </div>
                      <span className="text-[10px] text-gray-400">relevance</span>
                    </div>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 flex-shrink-0"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={BookOpen} title="No content recommendations yet" />}
          </div>
        </div>
      )}

      {/* ══ Risk Dashboard — REAL measured at-risk learners ══ */}
      {activeInsight === 'atRisk' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Learners flagged at-risk by measured engagement signals.</p>
            <button onClick={load} className="text-gray-400 hover:text-red-500">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {atRisk.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No at-risk learners right now"
              hint="Either everyone is engaged, or no engagement data has been recorded yet for this course." />
          ) : (
            <div className="space-y-4">
              {atRisk.map(student => (
                <div key={student.user_id} className={`bg-white border-2 rounded-2xl overflow-hidden shadow-sm ${student.risk_level === 'disengaged' ? 'border-red-200' : 'border-amber-200'}`}>
                  {/* header */}
                  <div className={`px-5 py-4 ${student.risk_level === 'disengaged' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900">{student.name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${riskBg(student.risk_level)}`}>
                              {student.risk_level.replace('_', ' ')}
                            </span>
                            <ConfidenceChip confidence={student.confidence} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {student.email}
                            {student.inactive_days != null && ` · inactive ${student.inactive_days}d`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black" style={{ color: scoreColor(student.engagement_score) }}>{Math.round(student.engagement_score)}</span>
                          <span className="text-xs text-gray-400">/ 100</span>
                        </div>
                        {student.has_data === false && <span className="text-[10px] text-gray-400">no data yet</span>}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* reasons */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Risk Reasons</p>
                      {student.reasons?.length ? (
                        <ul className="space-y-1">
                          {student.reasons.map((r, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> {r}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-xs text-gray-400">—</p>}
                    </div>
                    {/* interventions */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">AI Interventions</p>
                      <div className="space-y-2">
                        {(student.interventions ?? []).slice(0, 2).map((int, i) => (
                          <div key={i} className={`rounded-xl border px-3 py-2 text-xs ${intColors[int.type] ?? intColors.info}`}>
                            <p className="font-semibold">{int.title}</p>
                            <p className="mt-0.5 leading-relaxed opacity-90">{int.suggestion}</p>
                          </div>
                        ))}
                        {!(student.interventions?.length) && <p className="text-xs text-gray-400">No suggestions</p>}
                      </div>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="px-5 pb-4 flex gap-2 flex-wrap">
                    {nudgeDone.has(student.user_id) ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" /> Nudge Sent
                      </span>
                    ) : (
                      <button onClick={() => handleNudge(student.user_id)} disabled={nudging === student.user_id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {nudging === student.user_id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send AI Nudge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ AI Suggestions ══ */}
      {activeInsight === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Actionable suggestions generated from this course's measured data.</p>
            <button
              onClick={regenerateSuggestions}
              disabled={regenSug}
              title="Regenerate from the latest measured data"
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenSug ? 'animate-spin' : ''}`} />
              {regenSug ? 'Generating…' : recs.length === 0 ? 'Generate' : 'Regenerate'}
            </button>
          </div>
          {recs.length === 0 ? (
            <EmptyState icon={Lightbulb} title="No AI suggestions yet" hint="Suggestions are generated from measured engagement and grade data." />
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <Brain className="w-6 h-6 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{recs.length} actionable suggestion{recs.length > 1 ? 's' : ''} for this course</p>
                  <p className="text-xs text-gray-400">Based on engagement data, grade distributions, and pedagogical best practices</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recs.map((rec, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50">
                        <Lightbulb className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                          {rec.impact && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-600">{rec.impact}</span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ Generate Questions — module/topic picker → AI draft → full settings ══ */}
      {activeInsight === 'generate' && (
        <AiQuestionStudio key={selectedCourse} courseId={selectedCourse} />
      )}
    </div>
  );
}
