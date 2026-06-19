import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, ChevronDown, ChevronRight, Sparkles, Database } from 'lucide-react';
import { quizApi } from '../../services/api';
import { AiQuizGenerator } from '../AiQuizGenerator';

interface QuestionBankPanelProps {
  course: any;
}

interface BankQuestion {
  id: string;
  type: string;
  question_text: string;
  default_mark?: number;
}

interface Category {
  category: string;
  count: number;
  questions: BankQuestion[];
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple choice', true_false: 'True/False', matching: 'Matching',
  short_answer: 'Short answer', numerical: 'Numerical', essay: 'Essay',
};

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').trim();

export function QuestionBankPanel({ course }: QuestionBankPanelProps) {
  const courseId = course?.id ?? '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAiQuiz, setShowAiQuiz] = useState(false);

  const sections: { id: string; title: string }[] =
    course?.sections?.map((s: any) => ({ id: s.id, title: s.title })) ?? [];

  // Quiz activities in this course, for the "add to quiz" reuse action.
  const quizActivities: { id: string; name: string }[] = (course?.sections ?? [])
    .flatMap((s: any) => (s.activities ?? []))
    .filter((a: any) => String(a.type ?? a.activity_type ?? '').toLowerCase().includes('quiz'))
    .map((a: any) => ({ id: String(a.id), name: String(a.name ?? a.title ?? 'Quiz') }));

  const load = useCallback(() => {
    if (!courseId) return;
    setLoading(true);
    quizApi.questionBank(courseId)
      .then(r => {
        setCategories((r.data.data ?? []) as Category[]);
        setTotal(Number(r.data.total ?? 0));
      })
      .catch(() => { setCategories([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (q: BankQuestion) => {
    if (!confirm('Delete this question from the bank?')) return;
    try { await quizApi.deleteQuestion(q.id); load(); }
    catch { alert('Failed to delete question.'); }
  };

  const handleAddToQuiz = async (q: BankQuestion, activityId: string) => {
    if (!activityId) return;
    try { await quizApi.addFromBank(activityId, q.id); alert('Question added to the selected quiz.'); load(); }
    catch { alert('Failed to add question to quiz.'); }
  };

  return (
    <div className="space-y-4">
      {showAiQuiz && (
        <AiQuizGenerator
          courseId={courseId}
          sections={sections}
          onClose={() => setShowAiQuiz(false)}
          onPublished={(_activityId, name) => {
            setShowAiQuiz(false);
            alert(`Quiz "${name}" published (hidden). Open it in Activities to make it visible.`);
            load();
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Question Bank</h2>
          <p className="text-sm text-gray-500">{total} question{total === 1 ? '' : 's'} across {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button onClick={() => setShowAiQuiz(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700">
          <Sparkles size={14} /> Generate with AI
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No questions yet. Questions you create in quizzes appear here, grouped by category.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => {
            const isOpen = expanded === cat.category;
            return (
              <div key={cat.category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isOpen ? null : cat.category)}>
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <div>
                      <p className="font-medium text-gray-800">{cat.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.count} question{cat.count === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {cat.questions.map(q => (
                      <div key={q.id} className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs text-indigo-600 font-medium">{typeLabels[q.type] ?? q.type}</span>
                          <p className="text-sm text-gray-700 truncate">{stripHtml(q.question_text) || '(No question text)'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {quizActivities.length > 0 && (
                            <select
                              defaultValue=""
                              onChange={e => { handleAddToQuiz(q, e.target.value); e.target.value = ''; }}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              title="Add this question to a quiz"
                            >
                              <option value="">Add to quiz…</option>
                              {quizActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          )}
                          <button onClick={() => handleDelete(q)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
