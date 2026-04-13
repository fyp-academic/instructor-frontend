import React, { useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  HelpCircle, FileText, MessageSquare, Link, File, Package,
  Layers, Users, Hash, Layout, GripVertical, Check, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Activity, ActivityType, activityTypeInfo } from '../../data/mockData';
import { AddActivityModal } from '../modals/AddActivityModal';
import { QuizCreator } from '../modals/QuizCreator';
import { AssignmentCreator, ForumCreator, UrlCreator, FileCreator, ScormCreator, WorkshopCreator, H5PCreator, PageCreator } from '../modals/ActivityCreators';

const activityIcons: Record<ActivityType, React.ElementType> = {
  quiz: HelpCircle,
  assignment: FileText,
  forum: MessageSquare,
  url: Link,
  file: File,
  scorm: Package,
  h5p: Layers,
  workshop: Users,
  label: Hash,
  page: Layout,
};

interface CourseContentProps {
  courseId: string;
}

export function CourseContent({ courseId }: CourseContentProps) {
  const { editMode, getCourse, addSection, updateSection, deleteSection, addActivity, updateActivity, deleteActivity } = useApp();
  const course = getCourse(courseId);

  const [addActivityTarget, setAddActivityTarget] = useState<string | null>(null); // sectionId
  const [activityCreator, setActivityCreator] = useState<{ type: ActivityType; sectionId: string } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  if (!course) return <div className="text-gray-400 text-center py-12">Course not found</div>;

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleAddActivity = (type: ActivityType | 'subsection', sectionId: string) => {
    setAddActivityTarget(null);
    if (type === 'subsection') {
      addSection(courseId, 'New Subsection');
      return;
    }
    // Label doesn't need a form - create directly
    if (type === 'label') {
      const newActivity: Activity = {
        id: `act_${Date.now()}`,
        type: 'label',
        name: 'New Label / Text Block',
        visible: true,
        completionStatus: 'none',
      };
      addActivity(courseId, sectionId, newActivity);
      return;
    }
    setActivityCreator({ type, sectionId });
  };

  const handleSaveActivity = (sectionId: string, type: ActivityType, data: { name: string; description: string; settings: Record<string, unknown> }) => {
    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      type,
      name: data.name,
      description: data.description,
      visible: true,
      completionStatus: 'none',
      settings: data.settings,
      gradeMax: (data.settings?.gradeMax as number) || (data.settings?.maxGrade as number) || undefined,
    };
    addActivity(courseId, sectionId, newActivity);
    setActivityCreator(null);
  };

  const completionColors: Record<string, string> = {
    completed: 'border-green-400 bg-green-50',
    incomplete: 'border-amber-400 bg-amber-50',
    none: 'border-gray-200 bg-white',
  };

  const completionDotColors: Record<string, string> = {
    completed: 'bg-green-500',
    incomplete: 'bg-amber-500',
    none: 'bg-gray-200',
  };

  return (
    <div className="space-y-4">
      {course.sections.map((section, si) => {
        const isCollapsed = collapsedSections.has(section.id);
        const isEditingSection = editingSectionId === section.id;

        return (
          <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Section header */}
            <div className={`flex items-center gap-3 px-4 py-3 ${si === 0 ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-gray-50 border-b border-gray-100'}`}>
              {editMode && <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />}

              <button onClick={() => toggleCollapse(section.id)} className="flex-shrink-0">
                {isCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
              </button>

              {isEditingSection ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editSectionTitle}
                    onChange={e => setEditSectionTitle(e.target.value)}
                    className="flex-1 text-sm font-semibold border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') { updateSection(courseId, section.id, { title: editSectionTitle }); setEditingSectionId(null); }
                      if (e.key === 'Escape') setEditingSectionId(null);
                    }}
                  />
                  <button onClick={() => { updateSection(courseId, section.id, { title: editSectionTitle }); setEditingSectionId(null); }} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingSectionId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${si === 0 ? 'text-indigo-900' : 'text-gray-800'}`}>{section.title}</h3>
                  {!isCollapsed && <p className="text-xs text-gray-400">{section.activities.length} activit{section.activities.length === 1 ? 'y' : 'ies'}</p>}
                </div>
              )}

              {editMode && !isEditingSection && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingSectionId(section.id); setEditSectionTitle(section.title); }} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => updateSection(courseId, section.id, { visible: !section.visible })} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                    {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  {si > 0 && (
                    <button onClick={() => { if (confirm('Delete this section?')) deleteSection(courseId, section.id); }} className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Section body */}
            {!isCollapsed && (
              <div className="p-3 space-y-2">
                {section.activities.length === 0 && !editMode && (
                  <p className="text-sm text-gray-400 text-center py-4 italic">No activities in this section yet</p>
                )}

                {section.activities.map(activity => {
                  const Icon = activityIcons[activity.type];
                  const info = activityTypeInfo[activity.type];
                  const compStatus = activity.completionStatus || 'none';

                  return (
                    <div
                      key={activity.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all group ${
                        !activity.visible && editMode ? 'opacity-60 border-dashed' : completionColors[compStatus]
                      } hover:shadow-sm`}
                    >
                      {editMode && <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />}

                      <div className={`w-7 h-7 ${info.color} rounded-md flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${info.iconColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 hover:text-indigo-700 cursor-pointer truncate">
                            {activity.name}
                          </span>
                          {!activity.visible && <EyeOff className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium ${info.iconColor}`}>{info.label}</span>
                          {activity.dueDate && <span className="text-[10px] text-gray-400">Due: {activity.dueDate}</span>}
                          {activity.gradeMax && <span className="text-[10px] text-gray-400">{activity.gradeMax} pts</span>}
                        </div>
                      </div>

                      {/* Completion indicator */}
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        compStatus === 'completed' ? 'border-green-500 bg-green-500' :
                        compStatus === 'incomplete' ? 'border-amber-400' : 'border-gray-300'
                      }`}>
                        {compStatus === 'completed' && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>

                      {editMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateActivity(courseId, section.id, activity.id, { visible: !activity.visible })} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                            {activity.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { if (confirm('Delete this activity?')) deleteActivity(courseId, section.id, activity.id); }} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add activity button */}
                {editMode && (
                  <button
                    onClick={() => setAddActivityTarget(section.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-600 border-2 border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all mt-1"
                  >
                    <Plus className="w-4 h-4" /> Add activity or resource
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add section */}
      {editMode && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4">
          {addingSection ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                placeholder="Section title..."
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (newSectionTitle.trim()) { addSection(courseId, newSectionTitle.trim()); setNewSectionTitle(''); setAddingSection(false); } }
                  if (e.key === 'Escape') { setAddingSection(false); setNewSectionTitle(''); }
                }}
              />
              <button
                onClick={() => { if (newSectionTitle.trim()) { addSection(courseId, newSectionTitle.trim()); setNewSectionTitle(''); setAddingSection(false); } }}
                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >Add</button>
              <button onClick={() => { setAddingSection(false); setNewSectionTitle(''); }} className="px-3 py-2 text-gray-500 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-indigo-600 py-1"
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
          )}
        </div>
      )}

      {/* Activity picker modal */}
      {addActivityTarget && (
        <AddActivityModal
          onClose={() => setAddActivityTarget(null)}
          onSelect={(type) => handleAddActivity(type, addActivityTarget)}
        />
      )}

      {/* Activity creator modals */}
      {activityCreator?.type === 'quiz' && (
        <QuizCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'quiz', data)}
        />
      )}
      {activityCreator?.type === 'assignment' && (
        <AssignmentCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'assignment', data)}
        />
      )}
      {activityCreator?.type === 'forum' && (
        <ForumCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'forum', data)}
        />
      )}
      {activityCreator?.type === 'url' && (
        <UrlCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'url', data)}
        />
      )}
      {activityCreator?.type === 'file' && (
        <FileCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'file', data)}
        />
      )}
      {activityCreator?.type === 'scorm' && (
        <ScormCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'scorm', data)}
        />
      )}
      {activityCreator?.type === 'workshop' && (
        <WorkshopCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'workshop', data)}
        />
      )}
      {activityCreator?.type === 'h5p' && (
        <H5PCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'h5p', data)}
        />
      )}
      {activityCreator?.type === 'page' && (
        <PageCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => handleSaveActivity(activityCreator.sectionId, 'page', data)}
        />
      )}
    </div>
  );
}