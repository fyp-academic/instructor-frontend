import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, Users, Settings, BookOpen, BarChart2, Activity,
  ChevronDown, Edit3, Eye, EyeOff, Star, MoreHorizontal,
  FileText, Award, BarChart, Flag, CheckSquare, Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseContent } from '../components/course/CourseContent';
import { ParticipantsTab } from '../components/course/ParticipantsTab';
import { GradesTab } from '../components/course/GradesTab';
import { ActivitiesTab } from '../components/course/ActivitiesTab';

type Tab = 'course' | 'settings' | 'participants' | 'grades' | 'activities' | 'more';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCourse, updateCourse, editMode, toggleEditMode } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('course');
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreSubTab, setMoreSubTab] = useState<string>('reports');

  const course = getCourse(id || '');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['course', 'settings', 'participants', 'grades', 'activities'].includes(tab)) {
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
    { id: 'grades', label: 'Grades', icon: BarChart2 },
    { id: 'activities', label: 'Activities', icon: Activity },
  ];

  const moreItems = [
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'questionbank', label: 'Question Bank', icon: Database },
    { id: 'competencies', label: 'Competencies', icon: Star },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'completion', label: 'Course Completion', icon: CheckSquare },
    { id: 'logs', label: 'Logs', icon: BarChart },
  ];

  return (
    <div className="space-y-4" onClick={() => setMoreOpen(false)}>
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/courses')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> My Courses
        </button>
        <span>/</span>
        <span className="text-gray-400">{course.categoryName}</span>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">{course.shortName}</span>
      </div>

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
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.enrolledStudents} students</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.sections.length} sections</span>
              <span>{course.instructor}</span>
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center border-b border-gray-200 overflow-x-auto">
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
          {/* More dropdown */}
          <div className="relative ml-auto" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'more' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" /> More <ChevronDown className="w-3 h-3" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 w-48 mt-0.5">
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
          {activeTab === 'participants' && <ParticipantsTab courseId={course.id} />}
          {activeTab === 'grades' && <GradesTab courseId={course.id} />}
          {activeTab === 'activities' && <ActivitiesTab courseId={course.id} />}
          {activeTab === 'settings' && <CourseSettingsInline course={course} updateCourse={updateCourse} />}
          {activeTab === 'more' && <MoreTabContent subTab={moreSubTab} course={course} />}
        </div>
      </div>
    </div>
  );
}

function CourseSettingsInline({ course, updateCourse }: { course: ReturnType<ReturnType<typeof useApp>['getCourse']> & object; updateCourse: (id: string, u: any) => void }) {
  if (!course) return null;
  const [form, setForm] = useState({ name: course.name, shortName: course.shortName, description: course.description, startDate: course.startDate, endDate: course.endDate, maxStudents: course.maxStudents?.toString() || '', visibility: course.visibility });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateCourse(course.id, { ...form, maxStudents: form.maxStudents ? parseInt(form.maxStudents) : undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h2 className="font-semibold text-gray-900">Course Settings</h2>
      {[
        { label: 'Course Full Name', key: 'name', type: 'text' },
        { label: 'Short Name', key: 'shortName', type: 'text' },
        { label: 'Description', key: 'description', type: 'textarea' },
        { label: 'Start Date', key: 'startDate', type: 'date' },
        { label: 'End Date', key: 'endDate', type: 'date' },
        { label: 'Max Students', key: 'maxStudents', type: 'number' },
      ].map(f => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea value={(form as Record<string, unknown>)[f.key] as string} onChange={e => setF(f.key, e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          ) : (
            <input type={f.type} value={(form as Record<string, unknown>)[f.key] as string} onChange={e => setF(f.key, e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          )}
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select value={form.visibility} onChange={e => setF('visibility', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="shown">Shown to students</option>
          <option value="hidden">Hidden from students</option>
        </select>
      </div>
      <button onClick={handleSave} className={`px-6 py-2 text-sm font-semibold rounded-xl transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

function MoreTabContent({ subTab, course }: { subTab: string; course: any }) {
  const questionBankItems = [
    { category: 'Default', count: 12, difficulty: 'Mixed' },
    { category: 'Week 1', count: 8, difficulty: 'Easy' },
    { category: 'Week 2', count: 15, difficulty: 'Medium' },
    { category: 'Advanced', count: 5, difficulty: 'Hard' },
  ];

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

  if (subTab === 'questionbank') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Question Bank</h2>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700">
          + Add Question
        </button>
      </div>
      <div className="space-y-2">
        {questionBankItems.map(item => (
          <div key={item.category} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all">
            <div>
              <p className="font-medium text-gray-800">{item.category}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.count} questions · {item.difficulty}</p>
            </div>
            <div className="flex gap-2">
              <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">Edit</button>
              <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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

  return (
    <div className="text-center py-8 text-gray-400">
      <p>Content for this section is coming soon.</p>
    </div>
  );
}
