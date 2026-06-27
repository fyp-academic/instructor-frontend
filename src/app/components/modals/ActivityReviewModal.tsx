import { useEffect, useState } from 'react';
import { X, ThumbsUp, ThumbsDown, MessageSquare, Code2, Loader2 } from 'lucide-react';
import { Activity } from '../../data/mockData';
import { practicalApi, discussionApi } from '../../services/api';
import CodeWorkspace, { CodeFiles, EMPTY_FILES } from '../CodeWorkspace';

interface Props {
  activity: Activity;
  onClose: () => void;
}

/**
 * Instructor-facing review for the two new activity types:
 *  - discussion → the single topic + every reply with like/dislike counts
 *  - practical  → each student's submission opened read-only + a grade box
 */
export function ActivityReviewModal({ activity, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              {activity.type === 'practical' ? <Code2 className="w-5 h-5 text-emerald-600" /> : <MessageSquare className="w-5 h-5 text-cyan-600" />}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{activity.name}</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {activity.type === 'discussion'
            ? <DiscussionReview activityId={activity.id} />
            : <PracticalReview activityId={activity.id} />}
        </div>
      </div>
    </div>
  );
}

/** Round profile picture with a generated fallback when the user has none. */
function Avatar({ name, src, size = 32 }: { name: string; src: string | null; size?: number }) {
  const url = src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4f46e5&color=fff&size=64`;
  return (
    <img
      src={url}
      alt={name}
      className="rounded-full object-cover flex-shrink-0 border border-gray-200"
      style={{ width: size, height: size }}
    />
  );
}

function DiscussionReview({ activityId }: { activityId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    discussionApi.get(activityId)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activityId]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!data) return <p className="text-sm text-gray-500">Could not load discussion.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
        {data.topic_author && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar name={data.topic_author.name ?? 'Instructor'} src={data.topic_author.avatar ?? null} size={34} />
            <div>
              <div className="text-sm font-semibold text-gray-800">{data.topic_author.name ?? 'Instructor'}</div>
              <div className="text-xs text-gray-400">Topic author</div>
            </div>
          </div>
        )}
        <h3 className="font-semibold text-gray-900 mb-1">{data.title}</h3>
        <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: data.content || '' }} />
        <p className="text-xs text-gray-400 mt-2">{data.reply_count} replies · anonymity: {data.options?.anonymous_mode}</p>
      </div>
      {(data.replies ?? []).length === 0 && <p className="text-sm text-gray-500">No replies yet.</p>}
      {(data.replies ?? []).map((r: any) => (
        <div key={r.id} className="rounded-lg border border-gray-200 p-3 flex gap-3" style={{ marginLeft: Math.min((r.depth_level ?? 1) - 1, 4) * 20 }}>
          <Avatar name={r.author?.name ?? 'Anonymous'} src={r.author?.avatar ?? null} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800">{r.author?.name ?? 'Anonymous'}</span>
              <span className="text-xs text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.content}</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {r.likes_count ?? 0}</span>
              <span className="inline-flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> {r.dislikes_count ?? 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PracticalReview({ activityId }: { activityId: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    practicalApi.submissions(activityId)
      .then(r => setSubs(r.data?.data ?? []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, [activityId]);

  const openSub = (s: any) => {
    setActive(s);
    setGrade(s.grade != null ? String(s.grade) : '');
    setFeedback(s.feedback ?? '');
  };

  const saveGrade = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await practicalApi.grade(active.id, { grade: Number(grade), feedback });
      load();
      setActive(null);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to grade.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  if (active) {
    const files: CodeFiles = { ...EMPTY_FILES, ...(active.files ?? {}) };
    return (
      <div className="space-y-4">
        <button onClick={() => setActive(null)} className="text-sm text-indigo-600 hover:text-indigo-800">← Back to submissions</button>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{active.student?.name ?? 'Student'}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${active.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{active.status}</span>
        </div>
        <CodeWorkspace files={files} readOnly previewHeight={260} editorHeight={240} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border-t border-gray-200 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <input type="number" value={grade} onChange={e => setGrade(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            <input value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end">
          <button disabled={saving || grade === ''} onClick={saveGrade} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Grade'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subs.length === 0 && <p className="text-sm text-gray-500">No submissions yet.</p>}
      {subs.map((s) => (
        <button key={s.id} onClick={() => openSub(s)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
          <div>
            <p className="text-sm font-medium text-gray-800">{s.student?.name ?? 'Student'}</p>
            <p className="text-xs text-gray-400">{s.submitted_at ? `Submitted ${new Date(s.submitted_at).toLocaleString()}` : 'Draft'}</p>
          </div>
          <span className="text-sm text-gray-600">{s.grade != null ? `${s.grade} pts` : (s.status === 'submitted' ? 'Ungraded' : '—')}</span>
        </button>
      ))}
    </div>
  );
}
