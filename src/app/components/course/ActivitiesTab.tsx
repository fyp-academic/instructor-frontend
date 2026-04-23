import React, { useState, useEffect } from 'react';
import { HelpCircle, FileText, MessageSquare, Link, File, Package, Layers, Users, Hash, Layout, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { ActivityType, activityTypeInfo } from '../../data/mockData';
import { sectionsApi, activitiesApi } from '../../services/api';

const activityIcons: Record<string, React.ElementType> = {
  quiz: HelpCircle, assignment: FileText, forum: MessageSquare,
  url: Link, file: File, scorm: Package, h5p: Layers,
  workshop: Users, label: Hash, page: Layout,
  video: File, resource: File, interactive: Layers, lab: Package,
};

const defaultTypeInfo = { label: 'Activity', color: 'bg-gray-100', iconColor: 'text-gray-600' };

interface ApiActivity {
  id: string;
  name: string;
  type: string;
  description?: string;
  dueDate?: string;
  visible: boolean;
  completionStatus?: 'completed' | 'incomplete' | 'none';
  gradeMax?: number;
  sectionTitle: string;
}

interface ActivitiesTabProps {
  courseId: string;
}

export function ActivitiesTab({ courseId }: ActivitiesTabProps) {
  const [allActivities, setAllActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionCount, setSectionCount] = useState(0);
  const [filter, setFilter] = useState<'all' | ActivityType>('all');

  useEffect(() => {
    setLoading(true);
    sectionsApi.list(courseId)
      .then(async r => {
        const sections: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
        setSectionCount(sections.length);
        const results = await Promise.allSettled(
          sections.map(async sec => {
            const ar = await activitiesApi.list(String(sec.id));
            const acts: Record<string, unknown>[] = ar.data.data ?? ar.data ?? [];
            return acts.map(a => ({
              id:               String(a.id),
              name:             String(a.name ?? a.title ?? ''),
              type:             String(a.type ?? a.activity_type ?? 'resource').toLowerCase(),
              description:      a.description ? String(a.description) : undefined,
              dueDate:          a.due_date ? String(a.due_date).split('T')[0] : undefined,
              visible:          a.visible !== false,
              completionStatus: (a.completion_status ?? a.completionStatus ?? 'none') as ApiActivity['completionStatus'],
              gradeMax:         a.grade_max ? Number(a.grade_max) : undefined,
              sectionTitle:     String(sec.title ?? sec.name ?? ''),
            } as ApiActivity));
          })
        );
        const flat = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
        setAllActivities(flat);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const filtered = filter === 'all' ? allActivities : allActivities.filter(a => a.type === filter);

  const activityTypes: Array<'all' | ActivityType> = ['all', 'quiz', 'assignment', 'forum', 'url', 'file', 'h5p', 'scorm', 'workshop', 'page'];

  const completionStats = {
    completed: allActivities.filter(a => a.completionStatus === 'completed').length,
    incomplete: allActivities.filter(a => a.completionStatus === 'incomplete').length,
    none: allActivities.filter(a => !a.completionStatus || a.completionStatus === 'none').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Activities Overview</h2>
          <p className="text-sm text-gray-500">{allActivities.length} total activities across {sectionCount} sections</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xl font-bold text-green-700">{completionStats.completed}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-xl font-bold text-amber-700">{completionStats.incomplete}</p>
            <p className="text-xs text-amber-600">In Progress</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-xl font-bold text-gray-600">{completionStats.none}</p>
            <p className="text-xs text-gray-500">Not Started</p>
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {activityTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              filter === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {type === 'all' ? 'All Activities' : activityTypeInfo[type].label}
          </button>
        ))}
      </div>

      {/* Activities list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 bg-white border border-gray-200 rounded-xl text-gray-400">
            No activities found
          </div>
        ) : (
          filtered.map(activity => {
            const Icon = activityIcons[activity.type] ?? File;
            const info = activityTypeInfo[activity.type as ActivityType] ?? defaultTypeInfo;
            const compStatus = activity.completionStatus || 'none';
            const compColors = {
              completed: 'border-l-green-400',
              incomplete: 'border-l-amber-400',
              none: 'border-l-gray-200',
            };

            return (
              <div
                key={activity.id}
                className={`bg-white border border-gray-200 border-l-4 ${compColors[compStatus]} rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4`}
              >
                <div className={`w-10 h-10 ${info.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${info.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{activity.name}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${info.color} ${info.iconColor}`}>{info.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activity.sectionTitle}
                    {activity.dueDate && ` · Due: ${activity.dueDate}`}
                    {activity.gradeMax && ` · ${activity.gradeMax} pts`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {compStatus === 'completed' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Done</span>}
                  {compStatus === 'incomplete' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />In Progress</span>}
                  {compStatus === 'none' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Not started</span>}
                  {!activity.visible && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-full">Hidden</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
