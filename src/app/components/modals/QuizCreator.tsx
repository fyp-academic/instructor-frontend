import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, HelpCircle } from 'lucide-react';
import { RichTextEditor } from '../RichTextEditor';
import { QuizQuestion, QuizAnswer } from '../../data/mockData';

interface QuizCreatorProps {
  onClose: () => void;
  onSave: (quizData: { name: string; description: string; questions: QuizQuestion[]; settings: Record<string, unknown> }) => void;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True/False',
  matching: 'Matching',
  short_answer: 'Short Answer',
  numerical: 'Numerical',
  essay: 'Essay',
  calculated: 'Calculated',
  drag_drop: 'Drag & Drop',
};

export function QuizCreator({ onClose, onSave }: QuizCreatorProps) {
  const [step, setStep] = useState<'settings' | 'questions'>('settings');
  const [activeTab, setActiveTab] = useState('general');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQType, setNewQType] = useState<QuizQuestion['type']>('multiple_choice');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    name: '',
    description: '',
    openDate: '',
    closeDate: '',
    timeLimit: '',
    gradeMax: '100',
    gradePass: '50',
    attemptsAllowed: '1',
    gradeMethod: 'highest',
    questionsPerPage: '1',
    shuffleQuestions: false,
    shuffleAnswers: true,
    questionBehaviour: 'deferredfeedback',
    showFeedback: 'after_attempt',
    showCorrectAnswer: 'after_attempt',
    requirePassword: false,
    password: '',
    requireSafeBrowser: false,
    completionGrade: '',
  });

  const setS = (k: string, v: unknown) => setSettings(p => ({ ...p, [k]: v }));

  const addQuestion = () => {
    const q: QuizQuestion = {
      id: `q_${Date.now()}`,
      type: newQType,
      questionText: '',
      category: 'Default',
      defaultMark: 1,
      answers: newQType === 'multiple_choice' ? [
        { id: 'a1', text: '', grade: 100, feedback: '' },
        { id: 'a2', text: '', grade: 0, feedback: '' },
        { id: 'a3', text: '', grade: 0, feedback: '' },
      ] : newQType === 'true_false' ? [
        { id: 'true', text: 'True', grade: 100, feedback: '' },
        { id: 'false', text: 'False', grade: 0, feedback: '' },
      ] : [],
      matchingPairs: newQType === 'matching' ? [{ question: '', answer: '' }, { question: '', answer: '' }] : [],
      shuffleAnswers: true,
      multipleAnswers: false,
      hints: [],
      penalty: 0,
      correctAnswer: newQType === 'true_false' ? 'True' : undefined,
    };
    setQuestions(p => [...p, q]);
    setExpandedQ(q.id);
    setAddingQuestion(false);
  };

  const updateQ = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(p => p.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQ = (id: string) => setQuestions(p => p.filter(q => q.id !== id));

  const updateAnswer = (qId: string, aId: string, updates: Partial<QuizAnswer>) => {
    setQuestions(p => p.map(q => {
      if (q.id !== qId) return q;
      return { ...q, answers: q.answers?.map(a => a.id === aId ? { ...a, ...updates } : a) };
    }));
  };

  const addAnswer = (qId: string) => {
    const newA: QuizAnswer = { id: `a_${Date.now()}`, text: '', grade: 0, feedback: '' };
    setQuestions(p => p.map(q => q.id !== qId ? q : { ...q, answers: [...(q.answers || []), newA] }));
  };

  const removeAnswer = (qId: string, aId: string) => {
    setQuestions(p => p.map(q => q.id !== qId ? q : { ...q, answers: q.answers?.filter(a => a.id !== aId) }));
  };

  const addMatchingPair = (qId: string) => {
    setQuestions(p => p.map(q => q.id !== qId ? q : { ...q, matchingPairs: [...(q.matchingPairs || []), { question: '', answer: '' }] }));
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'timing', label: 'Timing' },
    { id: 'grade', label: 'Grade' },
    { id: 'layout', label: 'Layout' },
    { id: 'behaviour', label: 'Question Behaviour' },
    { id: 'review', label: 'Review Options' },
    { id: 'security', label: 'Security' },
    { id: 'completion', label: 'Completion' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create Quiz</h2>
              <p className="text-xs text-gray-500">{step === 'settings' ? 'Configure quiz settings' : `${questions.length} question(s) added`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {step === 'settings' ? (
          <>
            {/* Settings tabs */}
            <div className="flex border-b border-gray-200 px-5 overflow-x-auto flex-shrink-0">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Name <span className="text-red-500">*</span></label>
                    <input value={settings.name} onChange={e => setS('name', e.target.value)} placeholder="e.g. Midterm Quiz" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <RichTextEditor value={settings.description} onChange={v => setS('description', v)} placeholder="Instructions for students..." minHeight={120} />
                  </div>
                </div>
              )}

              {activeTab === 'timing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Open Date</label>
                      <input type="datetime-local" value={settings.openDate} onChange={e => setS('openDate', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
                      <input type="datetime-local" value={settings.closeDate} onChange={e => setS('closeDate', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                    <input type="number" value={settings.timeLimit} onChange={e => setS('timeLimit', e.target.value)} placeholder="Leave empty for no limit" className={inputCls} />
                  </div>
                </div>
              )}

              {activeTab === 'grade' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Grade</label>
                      <input type="number" value={settings.gradeMax} onChange={e => setS('gradeMax', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade to Pass</label>
                      <input type="number" value={settings.gradePass} onChange={e => setS('gradePass', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attempts Allowed</label>
                    <select value={settings.attemptsAllowed} onChange={e => setS('attemptsAllowed', e.target.value)} className={inputCls}>
                      {['1','2','3','5','Unlimited'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Method (multiple attempts)</label>
                    <select value={settings.gradeMethod} onChange={e => setS('gradeMethod', e.target.value)} className={inputCls}>
                      <option value="highest">Highest Grade</option>
                      <option value="average">Average Grade</option>
                      <option value="first">First Attempt</option>
                      <option value="last">Last Attempt</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Page Every (questions)</label>
                    <select value={settings.questionsPerPage} onChange={e => setS('questionsPerPage', e.target.value)} className={inputCls}>
                      <option value="1">1 question per page</option>
                      <option value="2">2 questions per page</option>
                      <option value="5">5 questions per page</option>
                      <option value="all">All questions on one page</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.shuffleQuestions} onChange={e => setS('shuffleQuestions', e.target.checked)} />
                      <span className="text-sm text-gray-700">Shuffle questions</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.shuffleAnswers} onChange={e => setS('shuffleAnswers', e.target.checked)} />
                      <span className="text-sm text-gray-700">Shuffle answers within questions</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'behaviour' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Behaviour</label>
                    <select value={settings.questionBehaviour} onChange={e => setS('questionBehaviour', e.target.value)} className={inputCls}>
                      <option value="deferredfeedback">Deferred Feedback</option>
                      <option value="immediatefeedback">Immediate Feedback</option>
                      <option value="immediatecbm">Immediate feedback with CBM</option>
                      <option value="adaptive">Adaptive Mode</option>
                      <option value="interactive">Interactive with Multiple Tries</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'review' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Show Feedback</label>
                    <select value={settings.showFeedback} onChange={e => setS('showFeedback', e.target.value)} className={inputCls}>
                      <option value="after_attempt">After each attempt</option>
                      <option value="after_close">After quiz closes</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Show Correct Answers</label>
                    <select value={settings.showCorrectAnswer} onChange={e => setS('showCorrectAnswer', e.target.value)} className={inputCls}>
                      <option value="after_attempt">After each attempt</option>
                      <option value="after_close">After quiz closes</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.requirePassword} onChange={e => setS('requirePassword', e.target.checked)} />
                      <span className="text-sm text-gray-700">Require password to access quiz</span>
                    </label>
                  </div>
                  {settings.requirePassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Password</label>
                      <input type="password" value={settings.password} onChange={e => setS('password', e.target.value)} className={inputCls} />
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.requireSafeBrowser} onChange={e => setS('requireSafeBrowser', e.target.checked)} />
                      <span className="text-sm text-gray-700">Require Safe Exam Browser</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'completion' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Completion Grade Required (%)</label>
                    <input type="number" min="0" max="100" value={settings.completionGrade} onChange={e => setS('completionGrade', e.target.value)} placeholder="Leave empty for any completion" className={inputCls} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 flex-shrink-0">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => { if (!settings.name) { alert('Please enter a quiz name'); return; } setStep('questions'); }}
                className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next: Add Questions →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Questions step */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {questions.length === 0 && !addingQuestion ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No questions added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Question" to start building your quiz</p>
                </div>
              ) : (
                questions.map((q, qi) => (
                  <div key={q.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                    >
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">{qi + 1}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-indigo-600 font-medium">{questionTypeLabels[q.type]}</span>
                        <p className="text-sm text-gray-700 truncate">{q.questionText || '(No question text yet)'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{q.defaultMark} pt</span>
                        <button onClick={e => { e.stopPropagation(); deleteQ(q.id); }} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedQ === q.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    {expandedQ === q.id && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                            <input value={q.category} onChange={e => updateQ(q.id, { category: e.target.value })} className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Default Mark</label>
                            <input type="number" value={q.defaultMark} onChange={e => updateQ(q.id, { defaultMark: parseFloat(e.target.value) })} className={inputCls} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Question Text *</label>
                          <RichTextEditor value={q.questionText} onChange={v => updateQ(q.id, { questionText: v })} placeholder="Enter your question here..." minHeight={100} />
                        </div>

                        {q.type === 'multiple_choice' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-600">Answers</label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={q.multipleAnswers} onChange={e => updateQ(q.id, { multipleAnswers: e.target.checked })} />
                                <span className="text-xs text-gray-600">Multiple correct answers</span>
                              </label>
                            </div>
                            {q.answers?.map((a, ai) => (
                              <div key={a.id} className="flex items-start gap-2">
                                <span className="text-xs text-gray-400 mt-2.5 w-16 flex-shrink-0">Choice {ai + 1}</span>
                                <div className="flex-1 space-y-1">
                                  <input value={a.text} onChange={e => updateAnswer(q.id, a.id, { text: e.target.value })} placeholder="Answer text" className={inputCls} />
                                  <div className="flex gap-2">
                                    <select value={a.grade} onChange={e => updateAnswer(q.id, a.id, { grade: parseFloat(e.target.value) })} className="text-xs border border-gray-200 rounded px-2 py-1 flex-1">
                                      <option value={100}>100% (correct)</option>
                                      <option value={50}>50% (partial)</option>
                                      <option value={0}>0% (incorrect)</option>
                                      <option value={-100}>-100% (penalty)</option>
                                    </select>
                                    <input value={a.feedback || ''} onChange={e => updateAnswer(q.id, a.id, { feedback: e.target.value })} placeholder="Feedback..." className="text-xs border border-gray-200 rounded px-2 py-1 flex-1" />
                                  </div>
                                </div>
                                {(q.answers?.length || 0) > 2 && (
                                  <button onClick={() => removeAnswer(q.id, a.id)} className="p-1 text-red-400 hover:text-red-600 mt-2"><Trash2 className="w-3 h-3" /></button>
                                )}
                              </div>
                            ))}
                            <button onClick={() => addAnswer(q.id)} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Add Choice
                            </button>
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Correct Answer</label>
                            <div className="flex gap-3">
                              {['True', 'False'].map(v => (
                                <label key={v} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer ${q.correctAnswer === v ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                                  <input type="radio" name={`tf_${q.id}`} checked={q.correctAnswer === v} onChange={() => updateQ(q.id, { correctAnswer: v })} className="hidden" />
                                  <span className="text-sm font-medium text-gray-700">{v}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.type === 'matching' && (
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">Matching Pairs</label>
                            {q.matchingPairs?.map((pair, pi) => (
                              <div key={pi} className="flex gap-2 items-center">
                                <input value={pair.question} onChange={e => { const pairs = [...(q.matchingPairs || [])]; pairs[pi].question = e.target.value; updateQ(q.id, { matchingPairs: pairs }); }} placeholder="Question" className={`${inputCls} flex-1`} />
                                <span className="text-gray-400">→</span>
                                <input value={pair.answer} onChange={e => { const pairs = [...(q.matchingPairs || [])]; pairs[pi].answer = e.target.value; updateQ(q.id, { matchingPairs: pairs }); }} placeholder="Answer" className={`${inputCls} flex-1`} />
                              </div>
                            ))}
                            <button onClick={() => addMatchingPair(q.id)} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Pair</button>
                          </div>
                        )}

                        {(q.type === 'short_answer' || q.type === 'numerical' || q.type === 'essay') && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Model Answer / Notes</label>
                            <textarea rows={3} className={inputCls} placeholder={q.type === 'essay' ? 'Rubric or grading notes...' : 'Accepted answer...'} />
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={q.shuffleAnswers} onChange={e => updateQ(q.id, { shuffleAnswers: e.target.checked })} />
                            <span className="text-xs text-gray-600">Shuffle answers</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Penalty:</span>
                            <input type="number" value={q.penalty} onChange={e => updateQ(q.id, { penalty: parseFloat(e.target.value) })} className="w-16 text-xs border border-gray-200 rounded px-2 py-1" />
                            <span className="text-xs text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Add question form */}
              {addingQuestion ? (
                <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50">
                  <p className="text-sm font-semibold text-indigo-900 mb-3">Select Question Type</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {Object.entries(questionTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => setNewQType(type as QuizQuestion['type'])}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${newQType === type ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addQuestion} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                      <Plus className="w-4 h-4" /> Add {questionTypeLabels[newQType]}
                    </button>
                    <button onClick={() => setAddingQuestion(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingQuestion(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-5 border-t border-gray-200 flex-shrink-0">
              <button onClick={() => setStep('settings')} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">← Back to Settings</button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => onSave({ name: settings.name, description: settings.description, questions, settings })}
                  className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Quiz ({questions.length} questions)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
