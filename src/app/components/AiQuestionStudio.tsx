import React, { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, ChevronRight } from 'lucide-react';
import { aiQuizApi, sectionsApi, activitiesApi } from '../services/api';
import { QuizCreator } from './modals/QuizCreator';
import { QuizQuestion } from '../data/mockData';

interface Props {
  courseId: string;
}

interface Section { id: string; title: string }
interface Topic   { id: string; name: string; type: string }

// AI draft → QuizCreator's QuizQuestion shape (so the full editor/settings work).
const toQuizQuestion = (q: Record<string, any>, i: number): QuizQuestion => {
  const type = q.type ?? 'multiple_choice';
  const rawAnswers = Array.isArray(q.answers) ? q.answers : [];
  const answers = rawAnswers.map((a: Record<string, any>, j: number) => ({
    id: `a_${i}_${j}`,
    text: String(a.text ?? ''),
    grade: a.is_correct ? 100 : 0,
    feedback: String(a.feedback ?? ''),
  }));

  let correctAnswer: string | undefined;
  if (type === 'true_false') {
    correctAnswer = rawAnswers.find((a: Record<string, any>) => a.is_correct)?.text ?? 'True';
  } else if (type === 'short_answer') {
    correctAnswer = String(q.correct_answer ?? '');
  }

  // short_answer: QuizCreator validates on the answers array, so seed it with the model answer.
  const seededAnswers =
    type === 'short_answer'
      ? [{ id: `a_${i}_0`, text: String(q.correct_answer ?? ''), grade: 100, feedback: '' }]
      : answers;

  return {
    id: `q_${i}`,
    type,
    questionText: String(q.question_text ?? ''),
    category: String(q.bloom_level ?? 'Default'),
    defaultMark: 1,
    answers: seededAnswers,
    correctAnswer,
    matchingPairs: [],
    shuffleAnswers: true,
    multipleAnswers: false,
    choiceNumbering: 'none',
    hints: [],
    penalty: 0,
  };
};

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').trim();
const PUBLISHABLE = ['multiple_choice', 'true_false', 'short_answer'];

// QuizQuestion (post-edit) → backend publish payload. Only the three AI-supported
// types are sent; anything else the instructor added is skipped (with a warning).
const toPublishQuestion = (q: QuizQuestion) => {
  const question_text = stripHtml(q.questionText);
  const bloom_level = q.category || 'understand';

  if (q.type === 'short_answer') {
    return {
      type: 'short_answer',
      question_text,
      bloom_level,
      correct_answer: q.correctAnswer || q.answers?.[0]?.text || '',
      answers: [],
    };
  }
  if (q.type === 'true_false') {
    const correct = q.correctAnswer || 'True';
    return {
      type: 'true_false',
      question_text,
      bloom_level,
      answers: [
        { text: 'True', is_correct: correct === 'True' },
        { text: 'False', is_correct: correct === 'False' },
      ],
    };
  }
  return {
    type: 'multiple_choice',
    question_text,
    bloom_level,
    answers: (q.answers ?? []).map(a => ({
      text: a.text,
      is_correct: Number(a.grade) > 0,
      feedback: a.feedback ?? '',
    })),
  };
};

export default function AiQuestionStudio({ courseId }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activityId, setActivityId] = useState(''); // '' = whole module

  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [draft, setDraft] = useState<QuizQuestion[] | null>(null);
  const [draftName, setDraftName] = useState('');
  const [published, setPublished] = useState<string | null>(null);

  // Load modules (sections) when the course changes.
  useEffect(() => {
    setSections([]); setSectionId(''); setTopics([]); setActivityId('');
    if (!courseId) return;
    sectionsApi.list(courseId)
      .then(r => {
        const list: Section[] = (r.data.data ?? r.data ?? []).map((s: Record<string, any>) => ({ id: String(s.id), title: String(s.title ?? 'Untitled') }));
        setSections(list);
        if (list[0]) setSectionId(list[0].id);
      })
      .catch(() => setSections([]));
  }, [courseId]);

  // Load topics (lesson activities) when the module changes.
  useEffect(() => {
    setTopics([]); setActivityId('');
    if (!sectionId) return;
    activitiesApi.list(sectionId)
      .then(r => {
        const list: Topic[] = (r.data.data ?? r.data ?? [])
          .map((a: Record<string, any>) => ({ id: String(a.id), name: String(a.name ?? 'Untitled'), type: String(a.type ?? '') }))
          .filter((a: Topic) => a.type === 'lesson');
        setTopics(list);
      })
      .catch(() => setTopics([]));
  }, [sectionId]);

  const toggleType = (t: string) =>
    setQuestionTypes(prev =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]
    );

  const handleGenerate = useCallback(() => {
    if (!sectionId || generating) return;
    setGenerating(true);
    setError(null);
    const topicName = topics.find(t => t.id === activityId)?.name;
    aiQuizApi.generate(courseId, {
      section_id: sectionId,
      activity_id: activityId || null,
      question_count: questionCount,
      question_types: questionTypes,
      difficulty,
    })
      .then(r => {
        const qs: Record<string, any>[] = r.data.questions ?? [];
        if (!qs.length) { setError('No questions could be generated. Ensure the selected module/topic has lesson content.'); return; }
        setDraft(qs.map(toQuizQuestion));
        const label = topicName ?? r.data.section_title ?? 'Section';
        setDraftName(`AI Quiz — ${label}`);
      })
      .catch(err => setError(err?.response?.data?.message ?? 'Generation failed. Ensure the selected module/topic has lesson content.'))
      .finally(() => setGenerating(false));
  }, [courseId, sectionId, activityId, questionCount, questionTypes, difficulty, topics, generating]);

  const handlePublish = (data: { name: string; description: string; questions: QuizQuestion[]; settings: Record<string, unknown> }) => {
    setPublishError(null);
    const publishable = data.questions.filter(q => PUBLISHABLE.includes(q.type));
    if (publishable.length === 0) {
      setPublishError('Add at least one multiple choice, true/false, or short answer question.');
      return;
    }
    const skipped = data.questions.length - publishable.length;
    const settings = data.settings as Record<string, any>;
    const gradeMax = Number(settings.gradeMax) || publishable.length;

    aiQuizApi.publish(courseId, {
      section_id: sectionId,
      activity_name: data.name,
      description: data.description,
      grade_max: gradeMax,
      due_date: settings.closeDate || null,
      visible: true,
      settings: data.settings,
      questions: publishable.map(toPublishQuestion),
    })
      .then(r => {
        setPublished(r.data.activity_name ?? data.name);
        setDraft(null);
        if (skipped > 0) {
          // Honest note: unsupported question types the instructor added were not published.
          window.alert(`Published. Note: ${skipped} question(s) of unsupported types were skipped.`);
        }
      })
      .catch(err => setPublishError(err?.response?.data?.message ?? 'Publish failed. Please try again.'));
  };

  // ── Review + full settings via the existing QuizCreator ──
  if (draft) {
    return (
      <>
        {publishError && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{publishError}</div>
        )}
        <QuizCreator
          initialQuestions={draft}
          initialData={{ name: draftName, settings: { gradeMax: String(draft.length) } }}
          saveLabel="Publish Quiz"
          onClose={() => { setDraft(null); setPublishError(null); }}
          onSave={handlePublish}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-1">AI Question Generator</h3>
        <p className="text-xs text-gray-400 mb-4">Pick a module and (optionally) a specific topic. After generation you can review every question and configure all quiz settings before publishing.</p>

        {published && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            Quiz "{published}" published — it now appears under Activities and the gradebook.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sections.length === 0 && <option value="">No modules found</option>}
              {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic <span className="text-gray-400">(optional)</span></label>
            <select
              value={activityId}
              onChange={e => setActivityId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Whole module</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
            <input
              type="number" min={1} max={20} value={questionCount}
              onChange={e => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border capitalize flex-1 ${difficulty === d ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Types</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'multiple_choice', label: 'Multiple choice' },
              { key: 'true_false', label: 'True / False' },
              { key: 'short_answer', label: 'Short answer' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${questionTypes.includes(key) ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !sectionId}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${generating || !sectionId ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'}`}
        >
          {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</> : <><Brain className="w-4 h-4" /> Generate &amp; Configure <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
