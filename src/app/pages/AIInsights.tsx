import React, { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, BookOpen,
  Users, Zap, RefreshCw, ChevronRight, Star, Target, MessageSquare, CheckCircle,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { aiApi, dashboardApi } from '../services/api';

// ─── Chart / analytics data ───────────────────────────────────────────────
const performanceData = [
  { week: 'W1', avg: 72, completion: 88, engagement: 91 },
  { week: 'W2', avg: 68, completion: 82, engagement: 85 },
  { week: 'W3', avg: 74, completion: 78, engagement: 79 },
  { week: 'W4', avg: 71, completion: 85, engagement: 88 },
  { week: 'W5', avg: 79, completion: 91, engagement: 93 },
  { week: 'W6', avg: 76, completion: 87, engagement: 86 },
  { week: 'W7', avg: 82, completion: 93, engagement: 95 },
];

const skillsData = [
  { subject: 'Quiz Performance',    A: 78, fullMark: 100 },
  { subject: 'Assignment Quality',  A: 82, fullMark: 100 },
  { subject: 'Forum Participation', A: 65, fullMark: 100 },
  { subject: 'Completion Rate',     A: 89, fullMark: 100 },
  { subject: 'Timeliness',          A: 72, fullMark: 100 },
  { subject: 'Peer Collaboration',  A: 58, fullMark: 100 },
];

const contentRecommendations = [
  { title: 'Python Classes Deep Dive',               type: 'Video',    relevance: 98, source: 'YouTube'     },
  { title: 'Object-Oriented Programming in Python',  type: 'Article',  relevance: 94, source: 'Real Python' },
  { title: 'Practice: OOP Exercises',                type: 'Interactive', relevance: 91, source: 'H5P'     },
  { title: 'Python OOP Quiz Pack',                   type: 'Quiz Bank',relevance: 89, source: 'Internal'   },
];

const recommendations = [
  { title: 'Increase Quiz Frequency',        desc: 'Students with weekly quizzes show 23% better retention. Consider adding 2 more micro-quizzes to Week 3.', icon: Zap,           color: 'bg-purple-50 border-purple-200 text-purple-700', impact: 'High Impact'  },
  { title: 'Add Video Content to Weak Topics', desc: 'Students struggle with OOP concepts. Adding short video explanations could improve understanding by ~30%.', icon: Lightbulb,    color: 'bg-amber-50 border-amber-200 text-amber-700',   impact: 'Medium Impact' },
  { title: 'Enable Peer Review',             desc: 'Workshop activities with peer review improve grades by 18% on average. Consider enabling it for Assignment 2.', icon: Users,      color: 'bg-blue-50 border-blue-200 text-blue-700',      impact: 'High Impact'  },
  { title: 'Send Engagement Reminders',      desc: "4 students haven't accessed the course in 3+ days. Automated reminders can reduce dropout by 40%.", icon: AlertTriangle, color: 'bg-red-50 border-red-200 text-red-700',         impact: 'Urgent'       },
];

const generatedQuestions = [
  { text: 'What is the difference between a class and an object in Python?',                                type: 'Essay',          difficulty: 'Medium' },
  { text: 'Which of the following is a correct way to define a class in Python?',                           type: 'Multiple Choice', difficulty: 'Easy'   },
  { text: 'In Python, the __init__ method is always called automatically when a new class object is created.', type: 'True/False',  difficulty: 'Easy'   },
  { text: 'Write a Python class representing a BankAccount with deposit and withdraw methods.',              type: 'Essay',          difficulty: 'Hard'   },
];

// ─── L0 Learner Profile types ─────────────────────────────────────────────
type ProfileType = 'H' | 'A' | 'T' | 'C';

const profileMeta: Record<ProfileType, { label: string; desc: string; color: string; bg: string; barColor: string; border: string }> = {
  H: { label: 'Self-Directed',  desc: 'Autonomous, reflective, nonlinear exploration',    color: 'text-indigo-700', bg: 'bg-indigo-50',  barColor: 'bg-indigo-500',  border: 'border-indigo-200' },
  A: { label: 'Social Learner', desc: 'Peer-driven, collaborative, forum-active',          color: 'text-green-700',  bg: 'bg-green-50',   barColor: 'bg-green-500',   border: 'border-green-200'  },
  T: { label: 'Task-Oriented',  desc: 'Structured, analytical, assignment-focused',        color: 'text-amber-700',  bg: 'bg-amber-50',   barColor: 'bg-amber-500',   border: 'border-amber-200'  },
  C: { label: 'Structured',     desc: 'Pathway-driven, feedback-seeking, deadline-aware',  color: 'text-purple-700', bg: 'bg-purple-50',  barColor: 'bg-purple-500',  border: 'border-purple-200' },
};

const profileDistribution: { profile: ProfileType; count: number; students: string[] }[] = [
  { profile: 'H', count: 3, students: ['Alice Thompson', 'Bob Martinez', 'Emma Wilson'] },
  { profile: 'A', count: 2, students: ['Grace Chen', 'Henry Adams'] },
  { profile: 'T', count: 2, students: ['Carol White', 'Frank Lee'] },
  { profile: 'C', count: 1, students: ['David Kim'] },
];

// ─── RE Risk Tier system ──────────────────────────────────────────────────
type TierLevel = 0 | 1 | 2 | 3;

const tierMeta: Record<TierLevel, { label: string; bg: string; text: string; border: string; dot: string; action: string }> = {
  0: { label: 'GREEN',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300',  dot: 'bg-green-500',  action: 'On Track'  },
  1: { label: 'AMBER',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500',  action: 'Monitor'   },
  2: { label: 'ORANGE', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500', action: 'Intervene' },
  3: { label: 'RED',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500',    action: 'CRITICAL'  },
};

// ─── Signal colour flag styling ───────────────────────────────────────────
type SigColour = 'green' | 'amber' | 'orange' | 'red';

const sigPill: Record<SigColour, string> = {
  green:  'bg-green-50  text-green-700  border border-green-200',
  amber:  'bg-amber-50  text-amber-700  border border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  red:    'bg-red-50    text-red-700    border border-red-200',
};
const sigDot: Record<SigColour, string> = {
  green: 'bg-green-500', amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500',
};

// ─── At-Risk Students: combined L0 + L1 + L2 + L3 + RE + IE ─────────────
type InterventionOutcome = 'pending' | 'partial' | 'recovered';

interface Signal { key: string; value: string; colour: SigColour; }
interface AtRiskStudent {
  id: string; name: string; profile: ProfileType;
  progress: number; lastAccess: string; missedActivities: number; grade: number;
  // RE
  tier: TierLevel; finalScore: number; previousScore: number; scoreDelta: number; anomalyFlag: boolean;
  // L1/L2/L3 layer contributions
  l1Contribution: number; l2Contribution: number; l3Contribution: number;
  // L1/L2/L3 signal flags
  signals: Signal[];
  // L3 emotional
  pulseComposite: number; moodDriftFlag: boolean; revisitFlag: boolean;
  // IE intervention
  intervention: { tier: number; sentAt: string; channel: string; templateId: string; outcome: InterventionOutcome } | null;
  // AI facilitator note
  facilitatorNote: string;
}

const atRiskStudents: AtRiskStudent[] = [
  {
    id: 'p8', name: 'Henry Adams', profile: 'A',
    progress: 12, lastAccess: '1 week ago', missedActivities: 7, grade: 18,
    tier: 3, finalScore: 78.5, previousScore: 64.1, scoreDelta: 14.4, anomalyFlag: true,
    l1Contribution: 14.2, l2Contribution: 32.1, l3Contribution: 32.2,
    signals: [
      { key: 'Login Freq',   value: '1/wk',  colour: 'red'    },
      { key: 'Time on Task', value: '0.8h',  colour: 'red'    },
      { key: 'Completion',   value: '38%',   colour: 'red'    },
      { key: 'Forum Posts',  value: '0/2',   colour: 'red'    },
      { key: 'Quiz Δ',       value: '0.10',  colour: 'red'    },
      { key: 'Optional Res', value: '0%',    colour: 'red'    },
      { key: 'Pulse',        value: '1.0/5', colour: 'red'    },
      { key: 'Mood Drift',   value: '1.85',  colour: 'red'    },
      { key: 'Help-Seeking', value: '3%',    colour: 'red'    },
    ],
    pulseComposite: 1.0, moodDriftFlag: true, revisitFlag: true,
    intervention: { tier: 3, sentAt: '2026-03-02', channel: 'Video Call + Pastoral Support', templateId: 'A_T3_pastoral', outcome: 'pending' },
    facilitatorNote: 'CRITICAL — A-profile fully disengaged. 7 missed activities, zero forum participation (key A-profile signal), pulse 1.0/5, mood drift 51% below baseline. Pastoral + academic intervention required within 24hrs.',
  },
  {
    id: 'p4', name: 'David Kim', profile: 'C',
    progress: 23, lastAccess: '5 days ago', missedActivities: 4, grade: 32,
    tier: 2, finalScore: 64.1, previousScore: 42.6, scoreDelta: 21.5, anomalyFlag: true,
    l1Contribution: 9.8, l2Contribution: 28.9, l3Contribution: 25.4,
    signals: [
      { key: 'Login Freq',   value: '2/wk',  colour: 'amber'  },
      { key: 'Time on Task', value: '1.8h',  colour: 'orange' },
      { key: 'Completion',   value: '55%',   colour: 'amber'  },
      { key: 'Forum Posts',  value: '0/2',   colour: 'red'    },
      { key: 'Quiz Δ',       value: '0.23',  colour: 'amber'  },
      { key: 'Optional Res', value: '0%',    colour: 'red'    },
      { key: 'Pulse',        value: '1.5/5', colour: 'red'    },
      { key: 'Mood Drift',   value: '2.65',  colour: 'red'    },
      { key: 'Help-Seeking', value: '5%',    colour: 'orange' },
    ],
    pulseComposite: 1.5, moodDriftFlag: true, revisitFlag: true,
    intervention: { tier: 2, sentAt: '2026-03-02', channel: 'LMS Message + Email', templateId: 'C_T2_pedagogical', outcome: 'pending' },
    facilitatorNote: 'TIER 2 — Facilitator outreach within 48hrs. C-profile: mood drift 29% below baseline, optional resources at 0%, revisit flag on 2 topics. T1 auto-nudge sent W5 with no observed recovery.',
  },
  {
    id: 'p6', name: 'Frank Lee', profile: 'T',
    progress: 45, lastAccess: '2 days ago', missedActivities: 2, grade: 58,
    tier: 1, finalScore: 42.6, previousScore: 18.2, scoreDelta: 24.4, anomalyFlag: true,
    l1Contribution: 4.9, l2Contribution: 19.2, l3Contribution: 18.5,
    signals: [
      { key: 'Login Freq',   value: '3/wk',  colour: 'amber'  },
      { key: 'Time on Task', value: '3.2h',  colour: 'green'  },
      { key: 'Completion',   value: '71%',   colour: 'green'  },
      { key: 'Forum Posts',  value: '0/2',   colour: 'amber'  },
      { key: 'Quiz Δ',       value: '0.25',  colour: 'amber'  },
      { key: 'Optional Res', value: '17%',   colour: 'orange' },
      { key: 'Pulse',        value: '2.5/5', colour: 'orange' },
      { key: 'Mood Drift',   value: '3.20',  colour: 'amber'  },
      { key: 'Help-Seeking', value: '12%',   colour: 'amber'  },
    ],
    pulseComposite: 2.5, moodDriftFlag: true, revisitFlag: false,
    intervention: { tier: 1, sentAt: '2026-02-17', channel: 'LMS Message', templateId: 'T_T1_nudge', outcome: 'partial' },
    facilitatorNote: 'TIER 1 — Auto-nudge sent W6. T-profile: quiz scores plateauing after 3 attempts, optional resource access dropped 46% from W3 baseline. Anomaly: +24.4pt score spike flagged.',
  },
  {
    id: 'p2', name: 'Bob Martinez', profile: 'H',
    progress: 62, lastAccess: '1 day ago', missedActivities: 1, grade: 71,
    tier: 0, finalScore: 18.2, previousScore: 12.4, scoreDelta: 5.8, anomalyFlag: false,
    l1Contribution: 3.3, l2Contribution: 7.8, l3Contribution: 7.1,
    signals: [
      { key: 'Login Freq',   value: '4/wk',  colour: 'green'  },
      { key: 'Time on Task', value: '4.5h',  colour: 'green'  },
      { key: 'Completion',   value: '71%',   colour: 'green'  },
      { key: 'Forum Posts',  value: '1/2',   colour: 'amber'  },
      { key: 'Quiz Δ',       value: '0.38',  colour: 'amber'  },
      { key: 'Optional Res', value: '42%',   colour: 'amber'  },
      { key: 'Pulse',        value: '3.5/5', colour: 'green'  },
      { key: 'Mood Drift',   value: '3.60',  colour: 'green'  },
      { key: 'Help-Seeking', value: '28%',   colour: 'green'  },
    ],
    pulseComposite: 3.5, moodDriftFlag: false, revisitFlag: false,
    intervention: null,
    facilitatorNote: 'MONITORING — H-profile. Minor quiz delta below 0.40 threshold, optional access trending down from W3 (0.625→0.42). No intervention warranted. Review W8 for sustained drop.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function AIInsights() {
  const { courses } = useApp();
  const activeCourses = courses.filter(c => (c as unknown as Record<string,unknown>).status === 'active');
  const [selectedCourse, setSelectedCourse] = useState(() => {
    const c = activeCourses[0] as unknown as Record<string,unknown>;
    return c ? String(c.id) : '';
  });
  const [generating, setGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<typeof generatedQuestions>([]);
  const [activeInsight, setActiveInsight] = useState<'performance' | 'atRisk' | 'recommendations' | 'generate'>('performance');

  // ── API-driven state ──
  const [apiPerformance, setApiPerformance]       = useState<typeof performanceData>(performanceData);
  const [apiSkills, setApiSkills]                 = useState<typeof skillsData>(skillsData);
  const [apiAtRisk, setApiAtRisk]                 = useState<typeof atRiskStudents>(atRiskStudents);
  const [apiRecs, setApiRecs]                     = useState<typeof recommendations>(recommendations);
  const [apiContentRecs, setApiContentRecs]       = useState<typeof contentRecommendations>(contentRecommendations);
  const [apiProfiles, setApiProfiles]             = useState<typeof profileDistribution>(profileDistribution);
  const [snapshotStats, setSnapshotStats]         = useState<Record<string,unknown>>({});

  useEffect(() => {
    if (!selectedCourse) return;
    const id = selectedCourse;
    aiApi.snapshots(id).then(r => {
      const d: Record<string,unknown>[] = r.data.data ?? r.data ?? [];
      if (d.length) {
        setApiPerformance(d.map((w, i) => ({
          week:       String(w.period ?? `W${i+1}`),
          avg:        Number(w.avg_grade        ?? 0),
          completion: Number(w.completion_rate  ?? 0),
          engagement: Number(w.engagement_score ?? 0),
        })));
        const last = d[d.length - 1] as Record<string,unknown>;
        setSnapshotStats(last);
      }
    }).catch(() => {});
    aiApi.skillMetrics(id).then(r => {
      const d: Record<string,unknown>[] = r.data.data ?? r.data ?? [];
      if (d.length) setApiSkills(d.map(m => ({ subject: String(m.metric ?? m.skill ?? ''), A: Number(m.score ?? 0), fullMark: 100 })));
    }).catch(() => {});
    aiApi.atRisk(id).then(r => {
      const d: Record<string,unknown>[] = r.data.data ?? r.data ?? [];
      if (d.length) setApiAtRisk(d as unknown as typeof atRiskStudents);
    }).catch(() => {});
    aiApi.suggestions(id).then(r => {
      const d: Record<string,unknown>[] = r.data.data ?? r.data ?? [];
      if (d.length) setApiRecs(d as unknown as typeof recommendations);
    }).catch(() => {});
    aiApi.contentRecs(id).then(r => {
      const d: Record<string,unknown>[] = r.data.data ?? r.data ?? [];
      if (d.length) setApiContentRecs(d as unknown as typeof contentRecommendations);
    }).catch(() => {});
    dashboardApi.instructorSnapshot(id).then(r => {
      const d: Record<string,unknown> = r.data.data ?? r.data ?? {};
      if (d.profile_distribution) setApiProfiles(d.profile_distribution as typeof profileDistribution);
    }).catch(() => {});
  }, [selectedCourse]);

  const handleGenerate = () => {
    if (!selectedCourse) return;
    setGenerating(true);
    aiApi.generatedQuestions(selectedCourse)
      .then(r => setGeneratedItems((r.data.data ?? r.data ?? []) as typeof generatedQuestions))
      .catch(() => setGeneratedItems(generatedQuestions))
      .finally(() => setGenerating(false));
  };

  const totalStudents = apiProfiles.reduce((s, p) => s + p.count, 0);
  const criticalCount = apiAtRisk.filter(s => s.tier >= 2).length;

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
            <p className="text-sm text-gray-500">GPT-o4 · L0 → L1 → L2 → L3 → RE → IE Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {activeCourses.map(c => {
              const cr = c as unknown as Record<string,unknown>;
              return <option key={String(cr.id)} value={String(cr.id)}>{String(cr.name ?? '')}</option>;
            })}
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Pipeline Status Banner ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <div>
              <p className="font-semibold">Analytics Pipeline Active</p>
              <p className="text-indigo-200 text-sm">L0 profiles loaded · L1/L2/L3 signals computed · RE scores updated</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xl font-bold">{snapshotStats.completion_rate ? `${Number(snapshotStats.completion_rate).toFixed(0)}%` : '—'}</p>
            <p className="text-indigo-200 text-xs">Avg. Completion</p>
          </div>
        </div>
        {/* Pipeline step indicators */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { id: 'L0', label: 'Profiles',     desc: `${totalStudents} learners` },
            { id: 'L1', label: 'Behavioural',   desc: 'Logged'   },
            { id: 'L2', label: 'Cognitive',      desc: 'Computed' },
            { id: 'L3', label: 'Emotional',      desc: 'Pulse in' },
            { id: 'RE', label: 'Risk Engine',    desc: 'Scored'   },
            { id: 'IE', label: 'Interventions',  desc: `${criticalCount} sent` },
            { id: 'FL', label: 'Feedback Loop',  desc: 'Active'   },
          ].map(step => (
            <div key={step.id} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
              <span className="text-xs font-bold text-white">{step.id}</span>
              <span className="text-[10px] text-indigo-200">{step.label} · {step.desc}</span>
            </div>
          ))}
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Performance Analysis                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeInsight === 'performance' && (
        <div className="space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Grade',      value: '76%',   change: '+4%',  up: true,  icon: Star         },
              { label: 'Completion Rate', value: '73%',   change: '+8%',  up: true,  icon: Target       },
              { label: 'At-Risk',         value: String(apiAtRisk.filter(s => s.tier > 0).length), change: `T2+T3: ${criticalCount}`, up: false, icon: AlertTriangle },
              { label: 'Avg. Pulse (L3)', value: '3.1/5', change: '-0.4', up: false, icon: Zap          },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                  <kpi.icon className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                <p className={`text-xs font-medium flex items-center gap-1 mt-1 ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change} from last week
                </p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Weekly Trends</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={apiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip /><Legend />
                  <Line key="avg"        type="monotone" dataKey="avg"        name="Avg Grade"    stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  <Line key="completion" type="monotone" dataKey="completion" name="Completion %"  stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line key="engagement" type="monotone" dataKey="engagement" name="Engagement %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Skill Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={apiSkills}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar name="Class Average" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity performance */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Activity Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Quiz 1',       avg: 85 },
                { name: 'Assignment 1', avg: 78 },
                { name: 'Quiz 2',       avg: 71 },
                { name: 'Forum',        avg: 90 },
              ]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="avg" name="Avg Score %" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* L0 Profile Distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Learner Profile Distribution (L0)</h3>
                <p className="text-xs text-gray-400">Declared learning profiles — weights used to calibrate RE signal scoring per student</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-medium">{totalStudents} students</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {apiProfiles.map(p => {
                const pm = profileMeta[p.profile];
                const pct = Math.round((p.count / totalStudents) * 100);
                return (
                  <div key={p.profile} className={`${pm.bg} border ${pm.border} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-2xl font-black ${pm.color}`}>{p.profile}</span>
                      <span className={`text-xl font-bold ${pm.color}`}>{p.count}</span>
                    </div>
                    <p className={`text-xs font-semibold ${pm.color}`}>{pm.label}</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-tight">{pm.desc}</p>
                    <div className="mt-2 bg-white/60 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${pm.barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{pct}% of cohort</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{p.students.join(', ')}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-1">AI Content Recommendations</h3>
            <p className="text-xs text-gray-400 mb-4">Based on student performance patterns, consider adding these resources</p>
            <div className="space-y-3">
              {apiContentRecs.map((rec, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                    <p className="text-xs text-gray-400">{rec.type} · {rec.source}</p>
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
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Risk Dashboard (L0 + L1 + L2 + L3 + RE + IE)                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeInsight === 'atRisk' && (
        <div className="space-y-5">

          {/* Tier summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([3, 2, 1, 0] as TierLevel[]).map(tier => {
              const tm = tierMeta[tier];
              const count = apiAtRisk.filter(s => s.tier === tier).length;
              return (
                <div key={tier} className={`${tm.bg} border ${tm.border} rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-black ${tm.text}`}>{count}</div>
                  <div className={`text-xs font-bold ${tm.text}`}>{tm.label}</div>
                  <div className={`text-[10px] ${tm.text} opacity-80`}>{tm.action}</div>
                  <div className={`w-2 h-2 ${tm.dot} rounded-full mx-auto mt-1.5`} />
                </div>
              );
            })}
          </div>

          {/* Critical alert */}
          {criticalCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {criticalCount} student{criticalCount > 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} immediate intervention
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Multi-layer signal deterioration across L1/L2/L3. RE anomaly flags active. Review facilitator notes and log interventions before next RE computation cycle.
                </p>
              </div>
            </div>
          )}

          {/* Student cards */}
          <div className="space-y-4">
            {apiAtRisk.map(student => {
              const tm = tierMeta[student.tier];
              const pm = profileMeta[student.profile];
              return (
                <div key={student.id} className={`bg-white border-2 ${tm.border} rounded-2xl overflow-hidden shadow-sm`}>

                  {/* ── Card header ── */}
                  <div className={`${tm.bg} px-5 py-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900">{student.name}</p>
                            {/* L0 Profile badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pm.bg} ${pm.color} border ${pm.border}`}>
                              {student.profile} · {pm.label}
                            </span>
                            {/* Anomaly flag */}
                            {student.anomalyFlag && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
                                ⚠ RE Anomaly
                              </span>
                            )}
                            {/* Mood drift flag */}
                            {student.moodDriftFlag && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700">
                                L3 Mood Drift
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Last access: {student.lastAccess} · {student.missedActivities} missed activities</p>
                        </div>
                      </div>
                      {/* RE Score + Tier */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tm.bg} ${tm.text} border ${tm.border}`}>
                          T{student.tier} · {tm.label}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-black ${tm.text}`}>{student.finalScore}</span>
                          <span className="text-xs text-gray-400">/ 100</span>
                        </div>
                        <span className={`text-[10px] flex items-center gap-0.5 ${student.scoreDelta > 15 ? 'text-red-600' : 'text-amber-600'}`}>
                          <TrendingUp className="w-3 h-3" />
                          +{student.scoreDelta} pts this week
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-4">

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className="text-base font-bold text-gray-800">{student.progress}%</p>
                        <p className="text-[10px] text-gray-500">Progress</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className={`text-base font-bold ${student.missedActivities >= 5 ? 'text-red-600' : student.missedActivities >= 3 ? 'text-orange-600' : 'text-amber-600'}`}>
                          {student.missedActivities}
                        </p>
                        <p className="text-[10px] text-gray-500">Missed</p>
                      </div>
                      <div className="text-center bg-gray-50 rounded-lg p-2">
                        <p className={`text-base font-bold ${student.grade >= 70 ? 'text-green-600' : student.grade >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {student.grade}%
                        </p>
                        <p className="text-[10px] text-gray-500">Grade</p>
                      </div>
                    </div>

                    {/* L1/L2/L3 layer contribution bars (RE breakdown) */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Risk Layer Breakdown — Total: {student.finalScore} pts
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { label: 'L1 Behavioural', value: student.l1Contribution, bar: 'bg-blue-400'   },
                          { label: 'L2 Cognitive',   value: student.l2Contribution, bar: 'bg-purple-500' },
                          { label: 'L3 Emotional',   value: student.l3Contribution, bar: 'bg-rose-500'   },
                        ].map(layer => (
                          <div key={layer.label} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-28 flex-shrink-0">{layer.label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${layer.bar} transition-all`} style={{ width: `${layer.value}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600 w-12 text-right">{layer.value} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Signal colour flags (L1 + L2 + L3) */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Signal Flags · L1 · L2 · L3</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.signals.map(sig => (
                          <span key={sig.key} className={`text-[10px] px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${sigPill[sig.colour]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sigDot[sig.colour]}`} />
                            {sig.key}: {sig.value}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* L3 Pulse + Mood Drift + Revisit Flag */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Pulse (L3)</p>
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`flex-1 h-2 rounded-sm ${i <= Math.round(student.pulseComposite) ? tm.dot : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <span className={`text-xs font-bold ${tm.text}`}>{student.pulseComposite}/5</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mood Drift (L3)</p>
                        {student.moodDriftFlag
                          ? <span className="text-[10px] font-semibold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Confirmed</span>
                          : <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Stable</span>
                        }
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Revisit Flag (L2)</p>
                        {student.revisitFlag
                          ? <span className="text-[10px] font-semibold text-orange-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Active</span>
                          : <span className="text-[10px] font-semibold text-green-600">Clear</span>
                        }
                      </div>
                    </div>

                    {/* IE Intervention status */}
                    {student.intervention ? (
                      <div className={`rounded-xl p-3 border ${student.intervention.tier >= 2 ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            IE — Tier {student.intervention.tier} · {student.intervention.channel}
                            <span className="text-[10px] font-mono bg-white/60 px-1 rounded text-gray-500">{student.intervention.templateId}</span>
                          </p>
                          <span className="text-[10px] text-gray-400">{student.intervention.sentAt}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          FL Outcome:{' '}
                          <span className={`font-semibold ${
                            student.intervention.outcome === 'pending'   ? 'text-amber-700' :
                            student.intervention.outcome === 'partial'   ? 'text-blue-700'  : 'text-green-700'
                          }`}>
                            {student.intervention.outcome === 'pending'  ? 'Awaiting response' :
                             student.intervention.outcome === 'partial'  ? 'Partial recovery observed' : 'Recovered'}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" /> Monitoring only — no IE intervention required
                        </p>
                      </div>
                    )}

                    {/* AI Facilitator Note */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">🤖 AI Facilitator Note (RE)</p>
                      <p className="text-xs text-indigo-900 leading-relaxed">{student.facilitatorNote}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Send Message</button>
                      <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">View Profile</button>
                      {student.tier >= 1 && (
                        <button className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200">Log Intervention</button>
                      )}
                      {student.tier >= 2 && (
                        <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Escalate</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* AI Suggestions                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeInsight === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <Brain className="w-6 h-6 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">GPT-o4 has analysed your course and generated {apiRecs.length} actionable suggestions</p>
              <p className="text-xs text-gray-400">Based on engagement data, grade distributions, and pedagogical best practices</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiRecs.map((rec, i) => (
              <div key={i} className={`border rounded-xl p-4 ${rec.color.split(' ').slice(0, 2).join(' ')}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${rec.color.split(' ')[0]}`}>
                    <rec.icon className={`w-5 h-5 ${rec.color.split(' ')[2]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rec.color.split(' ').slice(0, 2).join(' ')}`}>{rec.impact}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.desc}</p>
                    <button className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800">Apply Suggestion →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Generate Questions                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeInsight === 'generate' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">AI Question Generator</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Chapter</label>
                <input type="text" defaultValue="Object-Oriented Programming" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Types</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Mixed</option><option>Multiple Choice</option><option>True/False</option><option>Essay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>4</option><option>8</option><option>15</option><option>20</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${generating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'}`}
            >
              {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Brain className="w-4 h-4" /> Generate with GPT-o4</>}
            </button>
          </div>

          {generatedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Generated Questions</h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-800">Add all to Quiz Bank →</button>
              </div>
              {generatedItems.map((q, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{q.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{q.difficulty}</span>
                      </div>
                      <p className="text-sm text-gray-800">{q.text}</p>
                      <div className="flex gap-2 mt-3">
                        <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">Add to Quiz Bank</button>
                        <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">Edit</button>
                        <button className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
