import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, Users, Settings, BookOpen, BarChart2, Activity,
  ChevronDown, ChevronRight, Edit3, Eye, EyeOff, Star, MoreHorizontal,
  FileText, Award, BarChart, Flag, CheckSquare, Database, Tag, Globe, LayoutGrid, Image, Sparkles, Code
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseContent } from '../components/course/CourseContent';
import { ParticipantsTab } from '../components/course/ParticipantsTab';
import { GroupsTab } from '../components/course/GroupsTab';
import { PracticalTab } from '../components/course/PracticalTab';
import { QuestionBankPanel } from '../components/course/QuestionBankPanel';
import { GradesTab } from '../components/course/GradesTab';
import { ActivitiesTab } from '../components/course/ActivitiesTab';
import { AssignmentsTab } from '../components/course/AssignmentsTab';
import { AdaptationSettingsPanel } from '../components/instructor/AdaptationSettingsPanel';
import { AdaptationAuditLog } from '../components/instructor/AdaptationAuditLog';
import { CourseLogs } from '../components/course/CourseLogs';
import { RichTextEditor } from '../components/RichTextEditor';

type Tab = 'course' | 'settings' | 'participants' | 'groups' | 'practical' | 'grades' | 'assignments' | 'activities' | 'more';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCourse, updateCourse, editMode, toggleEditMode } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('course');
  const [activeSection, setActiveSection] = useState<string>('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreSubTab, setMoreSubTab] = useState<string>('reports');
  const [logsUserId, setLogsUserId] = useState<string>('');

  // Open the course Logs sub-tab, optionally pre-filtered to one learner.
  const openLogsForUser = (userId: string) => {
    setLogsUserId(userId);
    setMoreSubTab('logs');
    setActiveTab('more');
  };

  const course = getCourse(id || '');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['course', 'settings', 'participants', 'groups', 'practical', 'grades', 'assignments', 'activities'].includes(tab)) {
      setActiveTab(tab as Tab);
    }
  }, [searchParams]);

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Course not found.</p>
        <button onClick={() => navigate('/courses')} className="mt-4 text-indigo-600 hover:underline">Back to My Courses</button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'course', label: 'Course', icon: BookOpen },
    { id: 'settings', label: 'Course Settings', icon: Settings },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'groups', label: 'Groups', icon: LayoutGrid },
    { id: 'practical', label: 'Practical', icon: Code },
    { id: 'grades', label: 'Grades', icon: BarChart2 },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'activities', label: 'Activities', icon: Activity },
  ];

  const moreItems = [
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'adaptive', label: 'Adaptive Content', icon: Sparkles },
    { id: 'questionbank', label: 'Question Bank', icon: Database },
    { id: 'competencies', label: 'Competencies', icon: Star },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'completion', label: 'Course Completion', icon: CheckSquare },
    { id: 'logs', label: 'Logs', icon: BarChart },
  ];

  return (
    <div className="space-y-4" onClick={() => setMoreOpen(false)}>
      {/* Breadcrumb + back */}
      {(() => {
        const categoryName = String((course as any).category_name ?? course.categoryName ?? '');
        const shortName    = String((course as any).short_name ?? course.shortName ?? '');
        const courseLabel  = String(course.name || shortName || 'Course');
        return (
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <button onClick={() => navigate('/courses')} className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> My Courses
            </button>
            {categoryName && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-gray-400 truncate max-w-[12rem]">{categoryName}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="text-gray-700 font-medium truncate max-w-[18rem]">{courseLabel}</span>
          </nav>
        );
      })()}

      {/* Course Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.status === 'active' ? 'bg-green-400/20 text-green-200' : 'bg-gray-400/20 text-gray-300'}`}>
                {course.status}
              </span>
              <span className="text-xs text-indigo-300 flex items-center gap-1">
                {course.visibility === 'shown' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {course.visibility === 'shown' ? 'Visible to students' : 'Hidden from students'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <p className="text-indigo-200 text-sm mt-1">{course.shortName} �� {course.categoryName}</p>
            <div className="flex items-center gap-4 mt-3 text-indigo-200 text-sm">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.enrolledStudents ?? 0} students</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{(course.sections ?? []).length} sections</span>
              <span>{typeof course.instructor === 'object' && course.instructor ? (course.instructor as {name: string}).name : course.instructor}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${editMode ? 'bg-amber-400 text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              <Edit3 className="w-4 h-4" />
              {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
            </button>
            <button
              onClick={() => updateCourse(course.id, { visibility: course.visibility === 'shown' ? 'hidden' : 'shown' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/20 text-white hover:bg-white/30"
            >
              {course.visibility === 'shown' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {course.visibility === 'shown' ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 relative z-20">
        <div className="flex items-center border-b border-gray-200 relative">
          {/* Scrollable tabs */}
          <div className="flex items-center overflow-x-auto flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMoreOpen(false); }}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          {/* More dropdown — outside overflow container */}
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'more' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" /> More <ChevronDown className="w-3 h-3" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 w-48 mt-0.5">
                {moreItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab('more'); setMoreSubTab(item.id); setMoreOpen(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${moreSubTab === item.id && activeTab === 'more' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <item.icon className="w-4 h-4 text-gray-400" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'course' && <CourseContent courseId={course.id} />}
          {activeTab === 'participants' && <ParticipantsTab courseId={course.id} onViewLogs={openLogsForUser} />}
          {activeTab === 'groups' && <GroupsTab courseId={course.id} />}
          {activeTab === 'practical' && <PracticalTab courseId={course.id} />}
          {activeTab === 'grades' && <GradesTab courseId={course.id} />}
          {activeTab === 'assignments' && (
            <AssignmentsTab courseId={course.id} sectionId={activeSection || (course.sections?.[0]?.id as string) || ''} />
          )}
          {activeTab === 'activities' && <ActivitiesTab courseId={course.id} />}
          {activeTab === 'settings' && <CourseSettingsInline course={course} updateCourse={updateCourse} />}
          {activeTab === 'more' && <MoreTabContent subTab={moreSubTab} course={course} logsUserId={logsUserId} />}
        </div>
      </div>
    </div>
  );
}

function CourseSettingsInline({ course, updateCourse }: { course: ReturnType<ReturnType<typeof useApp>['getCourse']> & object; updateCourse: (id: string, u: any) => void }) {
  if (!course) return null;
  const { categories } = useApp();
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    description: '',
    summary: '',
    idNumber: '',
    startDate: '',
    endDate: '',
    maxStudents: '',
    visibility: 'shown' as 'shown' | 'hidden',
    format: 'topics' as 'topics' | 'weekly' | 'social',
    language: 'English',
    tags: '',
    categoryId: '',
    groupMode: 'none' as 'none' | 'separate' | 'visible',
    selfEnrollment: false,
    enrollmentKey: '',
    enrollmentStartDate: '',
    enrollmentEndDate: '',
    gradeDisplayType: 'percentage' as 'percentage' | 'letter' | 'points' | 'real',
    gradePassingGrade: '50',
    completionTracking: true,
    maxUploadSize: '128',
    allowedFileTypes: 'jpg,png,pdf,docx',
    showGradebook: true,
    showActivityReports: false,
    forceDownload: false,
    image: '',
  });
  const [saved, setSaved] = useState(false);

  // Sync form with course data when it loads/changes
  useEffect(() => {
    if (!course) return;

    const getValue = (camelKey: string, snakeKey: string) => {
      return (course as Record<string, unknown>)[camelKey] ?? (course as Record<string, unknown>)[snakeKey] ?? '';
    };
    const getBool = (camelKey: string, snakeKey: string) => {
      const v = (course as Record<string, unknown>)[camelKey] ?? (course as Record<string, unknown>)[snakeKey];
      return v === true || v === 'true' || v === 1 || v === '1';
    };
    // <input type="date"> needs YYYY-MM-DD; tolerate ISO datetimes from the API.
    const getDate = (camelKey: string, snakeKey: string) => String(getValue(camelKey, snakeKey)).slice(0, 10);

    let tagsValue = '';
    const tagsData = getValue('tags', 'tags');
    if (Array.isArray(tagsData)) {
      tagsValue = tagsData.join(', ');
    } else if (typeof tagsData === 'string') {
      tagsValue = tagsData;
    }

    setForm({
      name: String(getValue('name', 'name')),
      shortName: String(getValue('shortName', 'short_name')),
      description: String(getValue('description', 'description')),
      summary: String(getValue('summary', 'summary')),
      idNumber: String(getValue('idNumber', 'id_number')),
      startDate: getDate('startDate', 'start_date'),
      endDate: getDate('endDate', 'end_date'),
      maxStudents: String(getValue('maxStudents', 'max_students')),
      visibility: (getValue('visibility', 'visibility') as 'shown' | 'hidden') || 'shown',
      format: (getValue('format', 'format') as 'topics' | 'weekly' | 'social') || 'topics',
      language: String(getValue('language', 'language') || 'English'),
      tags: tagsValue,
      categoryId: String(getValue('categoryId', 'category_id')),
      groupMode: (getValue('groupMode', 'group_mode') as 'none' | 'separate' | 'visible') || 'none',
      selfEnrollment: getBool('selfEnrollment', 'self_enrollment'),
      enrollmentKey: String(getValue('enrollmentKey', 'enrollment_key')),
      enrollmentStartDate: getDate('enrollmentStartDate', 'enrollment_start_date'),
      enrollmentEndDate: getDate('enrollmentEndDate', 'enrollment_end_date'),
      gradeDisplayType: (getValue('gradeDisplayType', 'grade_display_type') as 'percentage' | 'letter' | 'points' | 'real') || 'percentage',
      gradePassingGrade: String(getValue('gradePassingGrade', 'grade_passing_grade') || '50'),
      completionTracking: getBool('completionTracking', 'completion_tracking'),
      maxUploadSize: String(getValue('maxUploadSize', 'max_upload_size') || '128'),
      allowedFileTypes: String(getValue('allowedFileTypes', 'allowed_file_types') || 'jpg,png,pdf,docx'),
      showGradebook: getBool('showGradebook', 'show_gradebook'),
      showActivityReports: getBool('showActivityReports', 'show_activity_reports'),
      forceDownload: getBool('forceDownload', 'force_download'),
      image: String(getValue('image', 'image') || getValue('imageUrl', 'image_url')),
    });
  }, [course]);

  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setF('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Send camelCase keys — updateCourse() is the single translation boundary that
    // maps Partial<Course> (camelCase) to the snake_case API. Emitting snake_case here
    // double-translated and dropped every multi-word field (only single-word names
    // that match in both cases survived).
    const updates: any = {
      name: form.name,
      shortName: form.shortName,
      description: form.description,
      summary: form.summary,
      idNumber: form.idNumber,
      categoryId: form.categoryId || undefined,
      format: form.format,
      visibility: form.visibility,
      language: form.language,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      maxStudents: form.maxStudents ? parseInt(form.maxStudents) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      groupMode: form.groupMode,
      selfEnrollment: form.selfEnrollment,
      enrollmentKey: form.enrollmentKey,
      enrollmentStartDate: form.enrollmentStartDate || undefined,
      enrollmentEndDate: form.enrollmentEndDate || undefined,
      gradeDisplayType: form.gradeDisplayType,
      gradePassingGrade: form.gradePassingGrade ? parseInt(form.gradePassingGrade) : undefined,
      completionTracking: form.completionTracking,
      maxUploadSize: form.maxUploadSize ? parseInt(form.maxUploadSize) : undefined,
      allowedFileTypes: form.allowedFileTypes,
      showGradebook: form.showGradebook,
      showActivityReports: form.showActivityReports,
      forceDownload: form.forceDownload,
      image: form.image,
    };
    updateCourse(course.id, updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-semibold text-gray-900">Course Settings</h2>

      {/* General */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">General</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Image</label>
          {form.image ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
              <img src={form.image} alt="Course preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setF('image', ''); setImageFile(null); }}
                className="absolute top-2 right-2 bg-white/90 text-red-500 p-1 rounded-full text-xs hover:bg-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="w-full h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center mb-2 border border-dashed border-gray-300">
              <Image className="w-8 h-8 text-gray-300 mb-1" />
              <span className="text-xs text-gray-400">No image uploaded</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Full Name</label>
          <input type="text" value={form.name} onChange={e => setF('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
          <input type="text" value={form.shortName} onChange={e => setF('shortName', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course ID Number</label>
          <input type="text" value={form.idNumber} onChange={e => setF('idNumber', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.categoryId} onChange={e => setF('categoryId', e.target.value)} className={inputCls}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
          <select value={form.visibility} onChange={e => setF('visibility', e.target.value)} className={inputCls}>
            <option value="shown">Shown to students</option>
            <option value="hidden">Hidden from students</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select value={form.language} onChange={e => setF('language', e.target.value)} className={inputCls}>
            {['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input type="text" value={form.tags} onChange={e => setF('tags', e.target.value)} placeholder="e.g. programming, beginner, python" className={inputCls} />
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Description</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Summary</label>
          <RichTextEditor value={form.summary} onChange={v => setF('summary', v)} placeholder="Brief summary shown on course listings..." minHeight={120} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
          <RichTextEditor value={form.description} onChange={v => setF('description', v)} placeholder="Full description of the course, objectives, and outcomes..." minHeight={200} />
        </div>
      </div>

      {/* Course Format */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Course Format</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
          <select value={form.format} onChange={e => setF('format', e.target.value)} className={inputCls}>
            <option value="topics">Topics format</option>
            <option value="weekly">Weekly format</option>
            <option value="social">Social format</option>
          </select>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Appearance</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.showGradebook} onChange={e => setF('showGradebook', e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Show Gradebook to Students</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.showActivityReports} onChange={e => setF('showActivityReports', e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Show Activity Reports</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.forceDownload} onChange={e => setF('forceDownload', e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Force Download of Files</span>
        </label>
      </div>

      {/* Files & Uploads */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Files & Uploads</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Upload Size (MB)</label>
          <select value={form.maxUploadSize} onChange={e => setF('maxUploadSize', e.target.value)} className={inputCls}>
            {['16', '32', '64', '128', '256', '512', '1024'].map(s => (
              <option key={s} value={s}>{s} MB</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Allowed File Types</label>
          <input type="text" value={form.allowedFileTypes} onChange={e => setF('allowedFileTypes', e.target.value)} placeholder="e.g. jpg,png,pdf,docx" className={inputCls} />
        </div>
      </div>

      {/* Completion Tracking */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Completion Tracking</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.completionTracking} onChange={e => setF('completionTracking', e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Enable Completion Tracking</span>
        </label>
      </div>

      {/* Groups */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Groups</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Mode</label>
          <select value={form.groupMode} onChange={e => setF('groupMode', e.target.value)} className={inputCls}>
            <option value="none">No Groups</option>
            <option value="separate">Separate Groups</option>
            <option value="visible">Visible Groups</option>
          </select>
        </div>
      </div>

      {/* Enrollment */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Enrollment</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Enrolled Students</label>
          <input type="number" value={form.maxStudents} onChange={e => setF('maxStudents', e.target.value)} placeholder="Leave empty for unlimited" className={inputCls} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.selfEnrollment} onChange={e => setF('selfEnrollment', e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">Allow students to self-enroll</span>
        </label>
        {form.selfEnrollment && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Key</label>
            <input type="text" value={form.enrollmentKey} onChange={e => setF('enrollmentKey', e.target.value)} placeholder="Password for enrollment (optional)" className={inputCls} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Start Date</label>
            <input type="date" value={form.enrollmentStartDate} onChange={e => setF('enrollmentStartDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment End Date</label>
            <input type="date" value={form.enrollmentEndDate} onChange={e => setF('enrollmentEndDate', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Grading */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Grading</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade Display Type</label>
          <select value={form.gradeDisplayType} onChange={e => setF('gradeDisplayType', e.target.value)} className={inputCls}>
            <option value="percentage">Percentage</option>
            <option value="letter">Letter Grade</option>
            <option value="points">Points</option>
            <option value="real">Real (Points/Max)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passing Grade (%)</label>
          <input type="number" min="0" max="100" value={form.gradePassingGrade} onChange={e => setF('gradePassingGrade', e.target.value)} className={inputCls} />
        </div>
      </div>

      <button onClick={handleSave} className={`px-6 py-2 text-sm font-semibold rounded-xl transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

function MoreTabContent({ subTab, course, logsUserId }: { subTab: string; course: any; logsUserId?: string }) {
  const sections: { id: string; title: string }[] =
    course?.sections?.map((s: any) => ({ id: s.id, title: s.title })) ?? [];

  if (subTab === 'logs') return <CourseLogs courseId={course.id} initialUserId={logsUserId} />;

  if (subTab === 'reports') return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Participation Report', desc: 'View student participation across activities', color: 'bg-blue-50 border-blue-200' },
          { title: 'Activity Report', desc: 'Detailed log of all activity in this course', color: 'bg-purple-50 border-purple-200' },
          { title: 'Completion Report', desc: 'Track which students completed the course', color: 'bg-green-50 border-green-200' },
        ].map(r => (
          <div key={r.title} className={`${r.color} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}>
            <h3 className="font-semibold text-gray-800">{r.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
            <button className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium">View Report →</button>
          </div>
        ))}
      </div>
    </div>
  );

  if (subTab === 'questionbank') return <QuestionBankPanel course={course} />;

  if (subTab === 'badges') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Badges</h2>
        <button className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Add Badge</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['First Submission', 'Perfect Score', 'Active Participant', 'Course Completer'].map((badge, i) => (
          <div key={badge} className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:shadow-md transition-all">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-3" style={{ background: ['#fef3c7','#dbeafe','#d1fae5','#ede9fe'][i] }}>
              {['🥇','⭐','💬','🎓'][i]}
            </div>
            <p className="text-sm font-semibold text-gray-800">{badge}</p>
            <p className="text-xs text-gray-400 mt-1">0 awarded</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (subTab === 'completion') return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Course Completion</h2>
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm text-indigo-800 font-medium">Completion criteria not configured</p>
        <p className="text-xs text-indigo-600 mt-1">Configure what students must do to complete this course.</p>
      </div>
      <div className="space-y-3">
        {['Complete all activities', 'Achieve minimum grade of 60%', 'Participate in all forums'].map(crit => (
          <label key={crit} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300">
            <input type="checkbox" className="rounded border-gray-300 text-indigo-600" />
            <span className="text-sm text-gray-700">{crit}</span>
          </label>
        ))}
      </div>
    </div>
  );

  if (subTab === 'adaptive') return (
    <div className="space-y-6">
      <AdaptationSettingsPanel
        courseId={course.id}
        topicId={course.sections?.[0]?.id ?? ''}
      />
      <div className="mt-8">
        <AdaptationAuditLog courseId={course.id} />
      </div>
    </div>
  );

  return (
    <div className="text-center py-8 text-gray-400">
      <p>Content for this section is coming soon.</p>
    </div>
  );
}
