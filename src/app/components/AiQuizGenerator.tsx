import React, { useState } from 'react';
import { aiQuizApi } from '../services/api';

interface Section {
  id: string;
  title: string;
}

interface Answer {
  text: string;
  is_correct: boolean;
  feedback: string;
}

interface Question {
  type: string;
  question_text: string;
  bloom_level: string;
  difficulty: string;
  explanation: string;
  correct_answer: string | null;
  answers: Answer[];
}

interface Props {
  courseId: string;
  sections: Section[];
  onPublished?: (activityId: string, activityName: string) => void;
  onClose: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const BLOOM_COLORS: Record<string, string> = {
  remember: '#dbeafe',
  understand: '#e0f2fe',
  apply: '#dcfce7',
  analyze: '#fef9c3',
  evaluate: '#ffedd5',
  create: '#fae8ff',
};

export const AiQuizGenerator: React.FC<Props> = ({ courseId, sections, onPublished, onClose }) => {
  // ── Step 1: config ──────────────────────────────────────────────────────────
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // ── Step 2: generated draft ─────────────────────────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sourcePreview, setSourcePreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // ── Step 3: publish ─────────────────────────────────────────────────────────
  const [activityName, setActivityName] = useState('');
  const [gradeMax, setGradeMax] = useState(10);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const step = publishedId ? 3 : questions.length > 0 ? 2 : 1;

  const toggleType = (t: string) =>
    setQuestionTypes(prev =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]
    );

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await aiQuizApi.generate(courseId, {
        section_id: sectionId,
        question_count: questionCount,
        question_types: questionTypes,
        difficulty,
      });
      const data = res.data;
      setQuestions(data.questions ?? []);
      setSectionTitle(data.section_title ?? '');
      setSourcePreview(data.source_preview ?? '');
      setActivityName(`AI Quiz — ${data.section_title ?? 'Section'}`);
    } catch (err: any) {
      setGenerateError(err?.response?.data?.message ?? 'Generation failed. Check that this section has lesson content.');
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (idx: number, field: keyof Question, value: unknown) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));

  const updateAnswer = (qIdx: number, aIdx: number, field: keyof Answer, value: unknown) =>
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const answers = q.answers.map((a, j) => j === aIdx ? { ...a, [field]: value } : a);
      // For MC/TF: if setting is_correct = true, uncheck all others
      if (field === 'is_correct' && value === true && q.type !== 'short_answer') {
        return { ...q, answers: answers.map((a, j) => ({ ...a, is_correct: j === aIdx })) };
      }
      return { ...q, answers };
    }));

  const removeQuestion = (idx: number) =>
    setQuestions(prev => prev.filter((_, i) => i !== idx));

  const handlePublish = async () => {
    if (!activityName.trim()) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await aiQuizApi.publish(courseId, {
        section_id: sectionId,
        activity_name: activityName,
        grade_max: gradeMax,
        questions,
      });
      setPublishedId(res.data.activity_id);
      onPublished?.(res.data.activity_id, res.data.activity_name);
    } catch (err: any) {
      setPublishError(err?.response?.data?.message ?? 'Publish failed. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>AI Quiz Generator</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              {step === 1 && 'Configure the quiz parameters'}
              {step === 2 && `Review & edit ${questions.length} generated question${questions.length !== 1 ? 's' : ''} for "${sectionTitle}"`}
              {step === 3 && 'Quiz published successfully'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

          {/* ── Step 1: Config ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Section</label>
                <select value={sectionId} onChange={e => setSectionId(e.target.value)} style={selectStyle}>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Number of questions <span style={{ color: '#94a3b8' }}>(1–20)</span></label>
                <input
                  type="number" min={1} max={20} value={questionCount}
                  onChange={e => setQuestionCount(Math.min(20, Math.max(1, +e.target.value)))}
                  style={{ ...inputStyle, width: 80 }}
                />
              </div>

              <div>
                <label style={labelStyle}>Question types</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { key: 'multiple_choice', label: 'Multiple choice' },
                    { key: 'true_false', label: 'True / False' },
                    { key: 'short_answer', label: 'Short answer' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleType(key)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        border: questionTypes.includes(key) ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        background: questionTypes.includes(key) ? '#eef2ff' : '#fff',
                        color: questionTypes.includes(key) ? '#4f46e5' : '#64748b',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Difficulty</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      style={{
                        padding: '6px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        border: difficulty === d ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        background: difficulty === d ? '#eef2ff' : '#fff',
                        color: difficulty === d ? '#4f46e5' : '#64748b',
                      }}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>

              {generateError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                  {generateError}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sourcePreview && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#64748b' }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>Source preview: </span>{sourcePreview}
                </div>
              )}

              {questions.map((q, qIdx) => (
                <div key={qIdx} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <span style={{ background: '#6366f1', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{qIdx + 1}</span>
                    <textarea
                      value={q.question_text}
                      onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
                      rows={2}
                      style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                    />
                    <button onClick={() => removeQuestion(qIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 16, flexShrink: 0 }}>🗑</button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#f1f5f9', color: '#475569' }}>{q.type.replace('_', ' ')}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: BLOOM_COLORS[q.bloom_level] ?? '#f1f5f9', color: '#475569' }}>{q.bloom_level}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#f1f5f9', color: '#475569' }}>{q.difficulty}</span>
                  </div>

                  {q.type === 'short_answer' ? (
                    <div>
                      <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Model answer</label>
                      <input
                        value={q.correct_answer ?? ''}
                        onChange={e => updateQuestion(qIdx, 'correct_answer', e.target.value)}
                        style={{ ...inputStyle, width: '100%', marginTop: 4 }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.answers.map((a, aIdx) => (
                        <div key={aIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type={q.type === 'true_false' ? 'radio' : 'radio'}
                            checked={a.is_correct}
                            onChange={() => updateAnswer(qIdx, aIdx, 'is_correct', true)}
                            title="Mark as correct"
                            style={{ accentColor: '#22c55e', width: 16, height: 16, flexShrink: 0 }}
                          />
                          <input
                            value={a.text}
                            onChange={e => updateAnswer(qIdx, aIdx, 'text', e.target.value)}
                            style={{ flex: 1, border: `1px solid ${a.is_correct ? '#86efac' : '#e2e8f0'}`, borderRadius: 6, padding: '5px 10px', fontSize: 13, background: a.is_correct ? '#f0fdf4' : '#fff' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <p style={{ margin: '10px 0 0', fontSize: 12, color: '#64748b', background: '#f8fafc', borderRadius: 6, padding: '6px 10px', borderLeft: '3px solid #6366f1' }}>
                      <span style={{ fontWeight: 600 }}>Explanation: </span>{q.explanation}
                    </p>
                  )}
                </div>
              ))}

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#fff' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>Publish settings</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 200 }}>
                    <label style={labelStyle}>Quiz activity name</label>
                    <input value={activityName} onChange={e => setActivityName(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Total marks</label>
                    <input type="number" min={1} value={gradeMax} onChange={e => setGradeMax(+e.target.value)} style={{ ...inputStyle, width: 80 }} />
                  </div>
                </div>
                {publishError && (
                  <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>
                    {publishError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Quiz published!</h3>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
                The quiz is now live and visible to students in this section. You can edit or hide it anytime from Activities.
              </p>
              <button onClick={onClose} style={{ ...btnPrimary }}>Close</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            {step === 2 && (
              <button onClick={() => setQuestions([])} style={btnSecondary} disabled={generating || publishing}>
                ← Back
              </button>
            )}
            {step === 1 && (
              <button onClick={handleGenerate} style={btnPrimary} disabled={generating || !sectionId}>
                {generating ? 'Generating…' : '✨ Generate questions'}
              </button>
            )}
            {step === 2 && (
              <button onClick={handlePublish} style={btnPrimary} disabled={publishing || !activityName.trim() || questions.length === 0}>
                {publishing ? 'Publishing…' : `Publish ${questions.length} question${questions.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Shared mini-styles ────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, width: '100%' };
const btnPrimary: React.CSSProperties = { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
