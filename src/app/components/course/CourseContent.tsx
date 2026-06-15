import React, { useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  HelpCircle, FileText, MessageSquare, Link, File, Package,
  Layers, Users, Hash, Layout, GripVertical, Check, X, BookOpen,
  ClipboardList, Monitor, ListChecks, BarChart3, Award, Database,
  MessageCircle, Folder, BookMarked, Box, GraduationCap, Play, Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Activity, ActivityType, activityTypeInfo } from '../../data/mockData';
import { quizApi, lessonApi, videoApi, fileApi, scormApi, h5pApi } from '../../services/api';
import { AddActivityModal } from '../modals/AddActivityModal';
import { QuizCreator } from '../modals/QuizCreator';
import { AssignmentCreator, ForumCreator, UrlCreator, FileCreator, ScormCreator, WorkshopCreator, H5PCreator, PageCreator, LabelCreator } from '../modals/ActivityCreators';
import {
  AttendanceCreator, BigBlueButtonCreator, BookCreator, ChecklistCreator,
  ChoiceCreator, CertificateCreator, DatabaseCreator, FeedbackCreator,
  FolderCreator, GlossaryCreator, IMSContentPackageCreator, LessonCreator, VideoCreator
} from '../modals/ActivityCreatorsExtra';

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
  attendance: ClipboardList,
  bigbluebutton: Monitor,
  book: BookOpen,
  checklist: ListChecks,
  choice: BarChart3,
  certificate: Award,
  database: Database,
  feedback: MessageCircle,
  folder: Folder,
  glossary: BookMarked,
  ims_content_package: Box,
  lesson: GraduationCap,
  video: Play,
};

interface CourseContentProps {
  courseId: string;
}

export function CourseContent({ courseId }: CourseContentProps) {
  const { editMode, getCourse, addSection, updateSection, deleteSection, addActivity, updateActivity, deleteActivity } = useApp();
  const course = getCourse(courseId);

  const [addActivityTarget, setAddActivityTarget] = useState<string | null>(null); // sectionId
  const [activityCreator, setActivityCreator] = useState<{ type: ActivityType; sectionId: string; activity?: Activity } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, delay = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), delay);
  };

  if (!course) return <div className="text-gray-400 text-center py-12">Course not found</div>;

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleAddActivity = async (type: ActivityType | 'subsection', sectionId: string) => {
    setAddActivityTarget(null);
    if (type === 'subsection') {
      await addSection(courseId, 'New Subsection');
      return;
    }
    // Label opens a simple modal
    if (type === 'label') {
      setActivityCreator({ type: 'label', sectionId });
      return;
    }
    setActivityCreator({ type, sectionId });
  };

  const handleSaveActivity = async (sectionId: string, type: ActivityType, data: { name: string; description: string; settings: Record<string, unknown>; questions?: any[]; file?: File | null }) => {
    setIsSaving(true);
    const dueDateRaw = data.settings?.dueDate || data.settings?.due_date;
    const dueDate = dueDateRaw ? String(dueDateRaw) : undefined;
    const newActivity: Activity = {
      id: `act_${Date.now()}`,
      type,
      name: data.name,
      description: data.description,
      visible: true,
      completionStatus: 'none',
      settings: data.settings,
      gradeMax: (data.settings?.gradeMax as number) || (data.settings?.maxGrade as number) || undefined,
      dueDate,
    };
    let savedActivity: Activity;
    try {
      savedActivity = await addActivity(courseId, sectionId, newActivity);
    } catch (err: any) {
      setIsSaving(false);
      alert('Failed to save activity: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
      return;
    }
    const actId = savedActivity?.id ?? newActivity.id;

    // If video with file, upload after creation
    if (type === 'video' && data.file && actId) {
      try {
        const uploadRes = await videoApi.upload(actId, data.file);
        const uploadData = uploadRes.data?.data ?? {};
        await updateActivity(courseId, sectionId, actId, {
          settings: {
            ...data.settings,
            fileName: uploadData.file_name ?? data.file.name,
            videoUrl: uploadData.url ?? '',
            videoPath: uploadData.path ?? '',
            mimeType: uploadData.mime_type ?? data.file.type,
            fileSize: uploadData.size ?? data.file.size,
          },
        });
      } catch (e) { console.error('Video upload failed:', e); }
    }

    // If file with file, upload after creation
    if (type === 'file' && data.file && actId) {
      try {
        const uploadRes = await fileApi.upload(actId, data.file);
        const uploadData = uploadRes.data?.data ?? {};
        await updateActivity(courseId, sectionId, actId, {
          settings: {
            ...data.settings,
            fileName: uploadData.file_name ?? data.file.name,
            fileUrl: uploadData.url ?? '',
            filePath: uploadData.path ?? '',
            mimeType: uploadData.mime_type ?? data.file.type,
            fileSize: uploadData.size ?? data.file.size,
          },
        });
      } catch (e) { console.error('File upload failed:', e); }
    }

    // If SCORM with a package, upload + extract after creation
    if (type === 'scorm' && data.file && actId) {
      try {
        const uploadRes = await scormApi.upload(actId, data.file);
        const uploadData = uploadRes.data?.data ?? {};
        await updateActivity(courseId, sectionId, actId, {
          settings: {
            ...data.settings,
            fileName: data.file.name,
            scormVersion: uploadData.scorm_version ?? '',
            scormPath: uploadData.scorm_path ?? '',
            launchHref: uploadData.launch_href ?? '',
          },
        });
      } catch (e: any) {
        alert('SCORM upload failed: ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
      }
    }

    // If H5P: upload a .h5p package OR persist content authored in the editor
    if (type === 'h5p' && actId) {
      const authoredLibrary = data.settings?.h5pLibrary as string | undefined;
      const authoredParams = data.settings?.h5pParams as string | undefined;
      // Do not persist the (potentially large) editor payload in activity settings.
      const { h5pLibrary: _l, h5pParams: _p, ...cleanSettings } = (data.settings ?? {}) as Record<string, unknown>;
      try {
        if (data.file) {
          const res = await h5pApi.upload(actId, data.file);
          await updateActivity(courseId, sectionId, actId, {
            settings: { ...cleanSettings, h5pContentId: res.data?.data?.h5p_content_id, fileName: data.file.name },
          });
        } else if (authoredLibrary && authoredParams) {
          const res = await h5pApi.saveContent(actId, { library: authoredLibrary, params: authoredParams });
          await updateActivity(courseId, sectionId, actId, {
            settings: { ...cleanSettings, h5pContentId: res.data?.data?.h5p_content_id },
          });
        }
      } catch (e: any) {
        alert('H5P save failed: ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
      }
    }

    // If quiz with questions, save them to backend
    let createdQuestionCount = 0;
    let failedQuestionCount = 0;
    if (type === 'quiz' && data.questions && data.questions.length > 0 && actId) {
      for (const q of data.questions) {
        try {
          const qRes = await quizApi.createQuestion(actId, {
            type: q.type ?? 'multiple_choice',
            question_text: q.questionText ?? '',
            category: q.category ?? 'Default',
            default_mark: q.defaultMark ?? 1,
            shuffle_answers: q.shuffleAnswers ?? true,
            choice_numbering: q.choiceNumbering ?? 'none',
            penalty: q.penalty ?? 0,
            matching_pairs: q.matchingPairs ?? undefined,
            correct_answer: q.correctAnswer ?? undefined,
          });
          const savedQ = qRes.data.data ?? qRes.data;
          const qid = savedQ?.id;
          if (qid) {
            createdQuestionCount++;
            if (q.answers && q.answers.length > 0) {
              for (const a of q.answers) {
                try {
                  await quizApi.createAnswer(qid, {
                    answer_text: a.text ?? '',
                    grade_fraction: (a.grade ?? 0) / 100,
                    feedback: a.feedback ?? '',
                  });
                } catch (e: any) {
                  console.error('Failed to create answer:', e);
                  alert('Failed to save answer for question "' + (q.questionText?.slice(0, 30) ?? '') + '": ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
                }
              }
            }
          }
        } catch (e: any) {
          failedQuestionCount++;
          console.error('Failed to create question:', e);
          const data = e?.response?.data ?? {};
          const errors = data.errors ?? {};
          const errorMessages = Object.values(errors).flat().filter(Boolean);
          const mainMessage = data.message || e?.message || 'Unknown error';
          const displayMsg = errorMessages.length > 0
            ? `${mainMessage}\n\n${errorMessages.join('\n')}`
            : mainMessage;
          alert('Failed to save question "' + (q.questionText?.slice(0, 30) ?? '') + '": ' + displayMsg);
        }
      }
    }
    if (type === 'quiz' && failedQuestionCount > 0) {
      alert(`Quiz saved but ${failedQuestionCount} of ${data.questions?.length ?? 0} questions failed to save. Check console for details.`);
    }

    // If page/lesson with content, save as lesson page
    if ((type === 'page' || type === 'lesson') && actId) {
      const pages = (data.settings?.pages ?? []) as Array<{ title: string; content: string }>;
      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          try {
            await lessonApi.createPage(actId, {
              title: pages[i].title || `Page ${i + 1}`,
              content: pages[i].content || '',
              page_type: 'content',
              sort_order: i,
            });
          } catch (e) { /* ignore page creation failure */ }
        }
      } else if (type === 'page') {
        const content = String(data.settings?.content || data.description || '');
        if (content) {
          try {
            await lessonApi.createPage(actId, {
              title: data.name,
              content: content,
              page_type: 'content',
            });
          } catch (e) { /* ignore page creation failure */ }
        }
      }
    }

    // If URL activity, ensure URL is in settings
    if (type === 'url' && actId) {
      const url = String(data.settings?.url || '');
      if (url) {
        // URL is already stored in settings, no separate API needed
      }
    }

    setIsSaving(false);
    const label = activityTypeInfo[type]?.label || type;
    showToast(`${label} created successfully`);
    setActivityCreator(null);
  };

  const handleEditActivitySave = async (sectionId: string, activityId: string, data: { name: string; description: string; settings: Record<string, unknown>; file?: File | null }, type: ActivityType) => {
    setIsSaving(true);
    const dueDateRaw = data.settings?.dueDate || data.settings?.due_date;
    try {
      await updateActivity(courseId, sectionId, activityId, {
        name: data.name,
        description: data.description,
        settings: data.settings,
        gradeMax: (data.settings?.gradeMax as number) || (data.settings?.maxGrade as number) || undefined,
        dueDate: dueDateRaw ? String(dueDateRaw) : undefined,
      });
    } catch (err: any) {
      setIsSaving(false);
      alert('Failed to update activity: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
      return;
    }
    // If file with new file, upload after update
    if (type === 'file' && data.file && activityId) {
      try {
        const uploadRes = await fileApi.upload(activityId, data.file);
        const uploadData = uploadRes.data?.data ?? {};
        await updateActivity(courseId, sectionId, activityId, {
          settings: {
            ...data.settings,
            fileName: uploadData.file_name ?? data.file.name,
            fileUrl: uploadData.url ?? '',
            filePath: uploadData.path ?? '',
            mimeType: uploadData.mime_type ?? data.file.type,
            fileSize: uploadData.size ?? data.file.size,
          },
        });
      } catch (e) { console.error('File upload failed:', e); }
    }
    // If SCORM with a new package, re-upload
    if (type === 'scorm' && data.file && activityId) {
      try {
        const uploadRes = await scormApi.upload(activityId, data.file);
        const uploadData = uploadRes.data?.data ?? {};
        await updateActivity(courseId, sectionId, activityId, {
          settings: {
            ...data.settings,
            fileName: data.file.name,
            scormVersion: uploadData.scorm_version ?? '',
            scormPath: uploadData.scorm_path ?? '',
            launchHref: uploadData.launch_href ?? '',
          },
        });
      } catch (e: any) {
        alert('SCORM upload failed: ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
      }
    }
    // If H5P: re-upload a .h5p package OR save re-authored content
    if (type === 'h5p' && activityId) {
      const authoredLibrary = data.settings?.h5pLibrary as string | undefined;
      const authoredParams = data.settings?.h5pParams as string | undefined;
      const { h5pLibrary: _l, h5pParams: _p, ...cleanSettings } = (data.settings ?? {}) as Record<string, unknown>;
      try {
        if (data.file) {
          const res = await h5pApi.upload(activityId, data.file);
          await updateActivity(courseId, sectionId, activityId, {
            settings: { ...cleanSettings, h5pContentId: res.data?.data?.h5p_content_id, fileName: data.file.name },
          });
        } else if (authoredLibrary && authoredParams) {
          const res = await h5pApi.saveContent(activityId, { library: authoredLibrary, params: authoredParams });
          await updateActivity(courseId, sectionId, activityId, {
            settings: { ...cleanSettings, h5pContentId: res.data?.data?.h5p_content_id },
          });
        }
      } catch (e: any) {
        alert('H5P save failed: ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
      }
    }
    // If lesson type, sync pages: delete existing and recreate
    if (type === 'lesson' && activityId) {
      const pages = (data.settings?.pages ?? []) as Array<{ title: string; content: string }>;
      try {
        // Get existing pages and delete them
        const existing = await lessonApi.listPages(activityId);
        const existingPages = existing.data?.data ?? [];
        for (const page of existingPages) {
          try { await lessonApi.deletePage(page.id); } catch { /* ignore */ }
        }
        // Recreate pages
        for (let i = 0; i < pages.length; i++) {
          try {
            await lessonApi.createPage(activityId, {
              title: pages[i].title || `Page ${i + 1}`,
              content: pages[i].content || '',
              page_type: 'content',
              sort_order: i,
            });
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }

    setIsSaving(false);
    const label = activityTypeInfo[type]?.label || type;
    showToast(`${label} updated successfully`);
    setActivityCreator(null);
  };

  const handleEditQuizSave = async (sectionId: string, activityId: string, data: { name: string; description: string; questions: any[]; settings: Record<string, unknown> }) => {
    setIsSaving(true);
    const dueDateRaw = data.settings?.dueDate || data.settings?.due_date;
    try {
      await updateActivity(courseId, sectionId, activityId, {
        name: data.name,
        description: data.description,
        settings: data.settings,
        gradeMax: (data.settings?.gradeMax as number) || (data.settings?.maxGrade as number) || undefined,
        dueDate: dueDateRaw ? String(dueDateRaw) : undefined,
      });
    } catch (err: any) {
      setIsSaving(false);
      alert('Failed to update activity: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
      return;
    }

    // Replace all questions when editing a quiz
    try {
      const existing = await quizApi.listQuestions(activityId);
      const existingQs = existing.data.data ?? existing.data ?? [];
      for (const q of existingQs) {
        try { await quizApi.deleteQuestion(q.id); } catch (e: any) { console.error('Failed to delete question:', e); }
      }
    } catch (e: any) { console.error('Failed to list existing questions:', e); }

    let editCreatedCount = 0;
    let editFailedCount = 0;
    if (data.questions && data.questions.length > 0) {
      for (const q of data.questions) {
        try {
          const qRes = await quizApi.createQuestion(activityId, {
            type: q.type ?? 'multiple_choice',
            question_text: q.questionText ?? '',
            category: q.category ?? 'Default',
            default_mark: q.defaultMark ?? 1,
            shuffle_answers: q.shuffleAnswers ?? true,
            choice_numbering: q.choiceNumbering ?? 'none',
            penalty: q.penalty ?? 0,
            matching_pairs: q.matchingPairs ?? undefined,
            correct_answer: q.correctAnswer ?? undefined,
          });
          const savedQ = qRes.data.data ?? qRes.data;
          const qid = savedQ?.id;
          if (qid) {
            editCreatedCount++;
            if (q.answers && q.answers.length > 0) {
              for (const a of q.answers) {
                try {
                  await quizApi.createAnswer(qid, {
                    answer_text: a.text ?? '',
                    grade_fraction: (a.grade ?? 0) / 100,
                    feedback: a.feedback ?? '',
                  });
                } catch (e: any) {
                  console.error('Failed to create answer:', e);
                  alert('Failed to save answer for question "' + (q.questionText?.slice(0, 30) ?? '') + '": ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
                }
              }
            }
          }
        } catch (e: any) {
          editFailedCount++;
          console.error('Failed to create question:', e);
          const data = e?.response?.data ?? {};
          const errors = data.errors ?? {};
          const errorMessages = Object.values(errors).flat().filter(Boolean);
          const mainMessage = data.message || e?.message || 'Unknown error';
          const displayMsg = errorMessages.length > 0
            ? `${mainMessage}\n\n${errorMessages.join('\n')}`
            : mainMessage;
          alert('Failed to save question "' + (q.questionText?.slice(0, 30) ?? '') + '": ' + displayMsg);
        }
      }
    }

    setIsSaving(false);
    if (editFailedCount > 0) {
      alert(`Quiz updated but ${editFailedCount} of ${data.questions?.length ?? 0} questions failed to save.`);
    } else {
      showToast('Quiz updated successfully');
    }
    setActivityCreator(null);
  };


  const sections = course.sections ?? [];

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium transition-all">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
      {/* Saving overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">Saving...</span>
          </div>
        </div>
      )}

      {sections.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No sections yet</p>
          <p className="text-sm mt-1">Click "Add Section" to start building your course content.</p>
        </div>
      )}
      {sections.map((section, si) => {
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
                    onKeyDown={async e => {
                      if (e.key === 'Enter') { await updateSection(courseId, section.id, { title: editSectionTitle }); setEditingSectionId(null); }
                      if (e.key === 'Escape') setEditingSectionId(null);
                    }}
                  />
                  <button onClick={async () => { await updateSection(courseId, section.id, { title: editSectionTitle }); setEditingSectionId(null); }} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button>
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
                  <button onClick={async () => await updateSection(courseId, section.id, { visible: !section.visible })} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                    {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  {si > 0 && (
                    <button onClick={async () => {
                      if (!confirm('Delete this section?')) return;
                      try { await deleteSection(courseId, section.id); }
                      catch (err: any) {
                        const msg = err?.response?.data?.message || err?.message || 'Failed to delete section.';
                        alert(msg);
                      }
                    }} className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
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
                  const Icon = activityIcons[activity.type] || FileText;
                  const info = activityTypeInfo[activity.type] || { color: 'bg-gray-100', iconColor: 'text-gray-500', label: activity.type || 'Activity' };
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                        !activity.visible && editMode ? 'opacity-60' : ''
                      } hover:bg-gray-50`}
                    >
                      {editMode && <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />}

                      <div className={`w-8 h-8 ${info.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
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
                          <span className={`text-[11px] font-medium ${info.iconColor}`}>{info.label}</span>
                          {activity.dueDate && <span className="text-[11px] text-gray-400">Due: {activity.dueDate}</span>}
                          {activity.gradeMax && <span className="text-[11px] text-gray-400">{activity.gradeMax} pts</span>}
                        </div>
                      </div>

                      {editMode && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setActivityCreator({ type: activity.type, sectionId: section.id, activity }); }} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={async () => await updateActivity(courseId, section.id, activity.id, { visible: !activity.visible })} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700">
                            {activity.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={async () => {
                            if (!confirm('Delete this activity?')) return;
                            try { await deleteActivity(courseId, section.id, activity.id); }
                            catch (err: any) {
                              const msg = err?.response?.data?.message || err?.message || 'Failed to delete activity.';
                              alert(msg);
                            }
                          }} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
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
                onKeyDown={async e => {
                  if (e.key === 'Enter') { if (newSectionTitle.trim()) { await addSection(courseId, newSectionTitle.trim()); setNewSectionTitle(''); setAddingSection(false); } }
                  if (e.key === 'Escape') { setAddingSection(false); setNewSectionTitle(''); }
                }}
              />
              <button
                onClick={async () => { if (newSectionTitle.trim()) { await addSection(courseId, newSectionTitle.trim()); setNewSectionTitle(''); setAddingSection(false); } }}
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
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditQuizSave(activityCreator.sectionId, activityCreator.activity.id, data);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'quiz', data);
            }
          }}
          initialData={activityCreator.activity}
          activityId={activityCreator.activity?.id}
        />
      )}
      {activityCreator?.type === 'assignment' && (
        <AssignmentCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'assignment', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'forum' && (
        <ForumCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'forum', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'url' && (
        <UrlCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'url', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'file' && (
        <FileCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'file', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'scorm' && (
        <ScormCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'scorm', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'workshop' && (
        <WorkshopCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'workshop', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'h5p' && (
        <H5PCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'h5p', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'page' && (
        <PageCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'page', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'label' && (
        <LabelCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'label', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'attendance' && (
        <AttendanceCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'attendance', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'bigbluebutton' && (
        <BigBlueButtonCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'bigbluebutton', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'book' && (
        <BookCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'book', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'checklist' && (
        <ChecklistCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'checklist', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'choice' && (
        <ChoiceCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'choice', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'certificate' && (
        <CertificateCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'certificate', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'database' && (
        <DatabaseCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'database', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'feedback' && (
        <FeedbackCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'feedback', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'folder' && (
        <FolderCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'folder', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'glossary' && (
        <GlossaryCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'glossary', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'ims_content_package' && (
        <IMSContentPackageCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'ims_content_package', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'lesson' && (
        <LessonCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'lesson', data);
            }
          }}
          initialData={activityCreator.activity}
        />
      )}
      {activityCreator?.type === 'video' && (
        <VideoCreator
          onClose={() => setActivityCreator(null)}
          onSave={(data) => {
            if (activityCreator.activity) {
              handleEditActivitySave(activityCreator.sectionId, activityCreator.activity.id, data, activityCreator.type);
            } else {
              handleSaveActivity(activityCreator.sectionId, 'video', data);
            }
          }}
          initialData={activityCreator.activity}
          activityId={activityCreator.activity?.id}
        />
      )}
    </div>
  );
}