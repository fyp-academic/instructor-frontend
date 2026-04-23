import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, BookOpen, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Course } from '../data/mockData';
import { RichTextEditor } from '../components/RichTextEditor';

const inputClass = (hasError?: string) =>
  `w-full border ${hasError ? 'border-red-400' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`;

const FormField = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default function CreateCourse() {
  const navigate = useNavigate();
  const { addCourse, categories, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    shortName: '',
    categoryId: '',
    visibility: 'shown' as 'shown' | 'hidden',
    startDate: '',
    endDate: '',
    format: 'topics' as 'topics' | 'weekly' | 'social',
    language: 'English',
    maxStudents: '',
    description: '',
    tags: '',
    summary: '',
    idNumber: '',
    groupMode: 'none',
    selfEnrollment: false,
    enrollmentKey: '',
    enrollmentStartDate: '',
    enrollmentEndDate: '',
    gradeDisplayType: 'percentage',
    gradePassingGrade: '50',
    completionTracking: true,
    image: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      setForm(f => ({ ...f, categoryId: categories[0].id }));
    }
  }, [categories]);

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Course name is required';
    if (!form.shortName.trim()) e.shortName = 'Short name is required';
    if (!form.categoryId) e.categoryId = 'Category is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    try {
      // Build course data - status depends on visibility
      const isVisible = form.visibility === 'shown';
      const courseData: Course = {
        id: 'temp', // will be replaced by API response
        name: form.name,
        shortName: form.shortName.toUpperCase(),
        description: form.description || 'No description provided',
        categoryId: form.categoryId,
        categoryName: categories.find(c => c.id === form.categoryId)?.name || '',
        instructor: currentUser.name,
        instructorId: currentUser.id,
        enrolledStudents: 0,
        status: isVisible ? 'active' : 'draft',
        visibility: form.visibility,
        format: form.format,
        startDate: form.startDate,
        endDate: form.endDate,
        language: form.language,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        image: form.image,
        sections: [
          { id: 'sec0', title: 'General', visible: true, activities: [] },
          { id: 'sec1', title: 'Topic 1', visible: true, activities: [] },
        ],
      };

      // If image file selected, upload separately or include as base64
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result as string;
          const courseWithImage = { ...courseData, image: base64Image };
          const created = await addCourse(courseWithImage);
          setSaved(true);
          setTimeout(() => navigate(`/courses/${created.id}`), 600);
        };
        reader.readAsDataURL(imageFile);
      } else {
        const created = await addCourse(courseData);
        setSaved(true);
        setTimeout(() => navigate(`/courses/${created.id}`), 600);
      }
    } catch (err) {
      alert('Failed to create course. Please try again.');
    }
  };

  const sections = [
    { id: 'general', label: 'General' },
    { id: 'description', label: 'Description' },
    { id: 'format', label: 'Course Format' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'files', label: 'Files & Uploads' },
    { id: 'completion', label: 'Completion Tracking' },
    { id: 'groups', label: 'Groups' },
    { id: 'enrollment', label: 'Enrollment' },
    { id: 'grading', label: 'Grading' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/courses')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-sm text-gray-500">Fill in the details below to create your course</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-20">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                  activeSection === s.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 space-y-6">
          {activeSection === 'general' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">General Settings</h2>
              <FormField label="Course Full Name" required error={errors.name}>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Introduction to Computer Science" className={inputClass(errors.name)} />
              </FormField>
              <FormField label="Course Short Name" required error={errors.shortName}>
                <input type="text" value={form.shortName} onChange={e => set('shortName', e.target.value)} placeholder="e.g. CS101" className={inputClass(errors.shortName)} />
                <p className="text-xs text-gray-400">Used in navigation and menus</p>
              </FormField>
              <FormField label="Course ID Number">
                <input type="text" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} placeholder="e.g. 2026-CS-001" className={inputClass()} />
              </FormField>
              <FormField label="Category" required error={errors.categoryId}>
                <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={inputClass(errors.categoryId)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date">
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass()} />
                </FormField>
                <FormField label="End Date">
                  <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputClass()} />
                </FormField>
              </div>
              <FormField label="Visibility">
                <select value={form.visibility} onChange={e => set('visibility', e.target.value)} className={inputClass()}>
                  <option value="shown">Show (students can see this course)</option>
                  <option value="hidden">Hide (students cannot see this course)</option>
                </select>
              </FormField>
              <FormField label="Language">
                <select value={form.language} onChange={e => set('language', e.target.value)} className={inputClass()}>
                  {['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Tags (comma separated)">
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. python, programming, beginner" className={inputClass()} />
              </FormField>
              <FormField label="Course Image">
                <div className="flex items-center gap-4">
                  {form.image && (
                    <img src={form.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => set('image', reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="course-image"
                    />
                    <label
                      htmlFor="course-image"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      {form.image ? 'Change Image' : 'Upload Image'}
                    </label>
                    {form.image && (
                      <button
                        onClick={() => { setImageFile(null); set('image', ''); }}
                        className="ml-2 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Recommended: 1200x400px, JPG or PNG</p>
                  </div>
                </div>
              </FormField>
            </div>
          )}

          {activeSection === 'description' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Description</h2>
              <FormField label="Course Summary">
                <RichTextEditor value={form.summary} onChange={v => set('summary', v)} placeholder="Brief summary shown on course listings..." minHeight={120} />
              </FormField>
              <FormField label="Course Description">
                <RichTextEditor value={form.description} onChange={v => set('description', v)} placeholder="Full description of the course, objectives, and outcomes..." minHeight={200} />
              </FormField>
            </div>
          )}

          {activeSection === 'format' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Course Format</h2>
              <FormField label="Course Format">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'topics', label: 'Topics', desc: 'Organized by topics' },
                    { value: 'weekly', label: 'Weekly', desc: 'Organized by weeks' },
                    { value: 'social', label: 'Social', desc: 'Forum-based format' },
                  ].map(f => (
                    <div
                      key={f.value}
                      onClick={() => set('format', f.value)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${form.format === f.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {activeSection === 'enrollment' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Enrollment Settings</h2>
              <FormField label="Maximum Enrolled Students">
                <input type="number" value={form.maxStudents} onChange={e => set('maxStudents', e.target.value)} placeholder="Leave empty for unlimited" className={inputClass()} />
              </FormField>
              <FormField label="Self-Enrollment">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.selfEnrollment} onChange={e => set('selfEnrollment', e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Allow students to self-enroll</span>
                </label>
              </FormField>
              {form.selfEnrollment && (
                <FormField label="Enrollment Key">
                  <input type="text" value={form.enrollmentKey} onChange={e => set('enrollmentKey', e.target.value)} placeholder="Password for enrollment (optional)" className={inputClass()} />
                </FormField>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Enrollment Start Date">
                  <input type="date" value={form.enrollmentStartDate} onChange={e => set('enrollmentStartDate', e.target.value)} className={inputClass()} />
                </FormField>
                <FormField label="Enrollment End Date">
                  <input type="date" value={form.enrollmentEndDate} onChange={e => set('enrollmentEndDate', e.target.value)} className={inputClass()} />
                </FormField>
              </div>
            </div>
          )}

          {activeSection === 'grading' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Grading Settings</h2>
              <FormField label="Grade Display Type">
                <select value={form.gradeDisplayType} onChange={e => set('gradeDisplayType', e.target.value)} className={inputClass()}>
                  <option value="percentage">Percentage</option>
                  <option value="letter">Letter Grade</option>
                  <option value="points">Points</option>
                  <option value="real">Real (Points/Max)</option>
                </select>
              </FormField>
              <FormField label="Passing Grade (%)">
                <input type="number" min="0" max="100" value={form.gradePassingGrade} onChange={e => set('gradePassingGrade', e.target.value)} className={inputClass()} />
              </FormField>
            </div>
          )}

          {activeSection === 'completion' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Completion Tracking</h2>
              <FormField label="Enable Completion Tracking">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.completionTracking} onChange={e => set('completionTracking', e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Track student progress through this course</span>
                </label>
              </FormField>
              {form.completionTracking && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">Completion tracking allows you to set conditions that students must meet to complete this course, such as viewing all activities or achieving a minimum grade.</p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'groups' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Groups</h2>
              <FormField label="Group Mode">
                <select value={form.groupMode} onChange={e => set('groupMode', e.target.value)} className={inputClass()}>
                  <option value="none">No Groups</option>
                  <option value="separate">Separate Groups</option>
                  <option value="visible">Visible Groups</option>
                </select>
              </FormField>
            </div>
          )}

          {['appearance', 'files'].includes(activeSection) && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">{sections.find(s => s.id === activeSection)?.label}</h2>
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                Settings for this section will be available after course creation.
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <button onClick={() => navigate('/courses')} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <div className="flex gap-3">
              <button onClick={() => { set('visibility', 'hidden'); handleSubmit(); }} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Save as Draft
              </button>
              <button
                onClick={() => { set('visibility', 'shown'); handleSubmit(); }}
                disabled={saved}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                <Save className="w-4 h-4" />
                {saved ? 'Course Created!' : 'Save & Open Course'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
