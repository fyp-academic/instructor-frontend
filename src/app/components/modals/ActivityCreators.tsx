import React, { useState, useRef } from 'react';
import { X, FileText, MessageSquare, Link, File, Package, Layers, Users, Hash, Layout } from 'lucide-react';
import { RichTextEditor } from '../RichTextEditor';
import { ActivityType } from '../../data/mockData';

interface BaseCreatorProps {
  type: ActivityType;
  onClose: () => void;
  onSave: (data: { name: string; description: string; settings: Record<string, unknown>; file?: File | null }) => void;
  initialData?: { name: string; description?: string; settings?: Record<string, unknown> };
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

function FormField({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function AssignmentCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const [tab, setTab] = useState('general');
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    instructions: s.instructions ?? '',
    dueDate: s.dueDate ?? '',
    cutoffDate: s.cutoffDate ?? '',
    allowFromDate: s.allowFromDate ?? '',
    submissionTypes: s.submissionTypes ?? ['file'],
    textOnlineEnabled: s.textOnlineEnabled ?? false,
    fileSubmissionEnabled: s.fileSubmissionEnabled ?? true,
    maxFiles: s.maxFiles ?? '1',
    maxFileSize: s.maxFileSize ?? '10',
    feedbackTypes: s.feedbackTypes ?? ['comments'],
    feedbackCommentsEnabled: s.feedbackCommentsEnabled ?? true,
    gradeMax: s.gradeMax ?? '100',
    gradePass: s.gradePass ?? '50',
    gradeMethod: s.gradeMethod ?? 'simple',
    blindMarking: s.blindMarking ?? false,
    attemptsReopened: s.attemptsReopened ?? 'never',
    maxAttempts: s.maxAttempts ?? '1',
    notifyGraders: s.notifyGraders ?? true,
    notifyStudents: s.notifyStudents ?? true,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const tabs = ['General', 'Availability', 'Submission Types', 'Feedback Types', 'Grade', 'Notifications'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
            <h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} Assignment</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex border-b border-gray-200 px-5 overflow-x-auto flex-shrink-0">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t.toLowerCase().replace(/ /g, '_'))}
              className={`px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap ${tab === t.toLowerCase().replace(/ /g, '_') ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500'}`}>{t}</button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {tab === 'general' && <>
            <FormField label="Assignment Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Programming Project 1" className={inputCls} /></FormField>
            <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} placeholder="Describe the assignment..." minHeight={120} /></FormField>
            <FormField label="Activity Instructions"><RichTextEditor value={form.instructions} onChange={v => setF('instructions', v)} placeholder="Specific instructions for submission..." minHeight={100} /></FormField>
          </>}
          {tab === 'availability' && <>
            <FormField label="Allow Submissions From"><input type="datetime-local" value={form.allowFromDate} onChange={e => setF('allowFromDate', e.target.value)} className={inputCls} /></FormField>
            <FormField label="Due Date"><input type="datetime-local" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} className={inputCls} /></FormField>
            <FormField label="Cut-off Date" hint="Submissions after this date will not be accepted"><input type="datetime-local" value={form.cutoffDate} onChange={e => setF('cutoffDate', e.target.value)} className={inputCls} /></FormField>
          </>}
          {tab === 'submission_types' && <>
            <FormField label="Submission Types">
              <div className="space-y-2">
                {[{ k: 'fileSubmissionEnabled', label: 'File Submissions', hint: 'Students upload files' }, { k: 'textOnlineEnabled', label: 'Online Text', hint: 'Students type directly' }].map(item => (
                  <label key={item.k} className="flex items-start gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={(form as Record<string, unknown>)[item.k] as boolean} onChange={e => setF(item.k, e.target.checked)} className="mt-0.5" />
                    <div><p className="text-sm font-medium text-gray-700">{item.label}</p><p className="text-xs text-gray-400">{item.hint}</p></div>
                  </label>
                ))}
              </div>
            </FormField>
            {form.fileSubmissionEnabled && <>
              <FormField label="Maximum Files"><select value={form.maxFiles} onChange={e => setF('maxFiles', e.target.value)} className={inputCls}>
                {['1','2','3','5','10','20'].map(n => <option key={n}>{n}</option>)}</select></FormField>
              <FormField label="Maximum File Size (MB)"><select value={form.maxFileSize} onChange={e => setF('maxFileSize', e.target.value)} className={inputCls}>
                {['5','10','20','50','100','500'].map(n => <option key={n}>{n}</option>)}</select></FormField>
            </>}
          </>}
          {tab === 'feedback_types' && <>
            <FormField label="Feedback Types">
              <div className="space-y-2">
                {[{ k: 'feedbackCommentsEnabled', label: 'Feedback Comments', hint: 'Typed comments from grader' }].map(item => (
                  <label key={item.k} className="flex items-start gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={(form as Record<string, unknown>)[item.k] as boolean} onChange={e => setF(item.k, e.target.checked)} className="mt-0.5" />
                    <div><p className="text-sm font-medium text-gray-700">{item.label}</p><p className="text-xs text-gray-400">{item.hint}</p></div>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="Comment Inline">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" />
                <span className="text-sm text-gray-700">Enable inline PDF annotating</span>
              </label>
            </FormField>
          </>}
          {tab === 'grade' && <>
            <FormField label="Maximum Grade"><input type="number" value={form.gradeMax} onChange={e => setF('gradeMax', e.target.value)} className={inputCls} /></FormField>
            <FormField label="Grade to Pass"><input type="number" value={form.gradePass} onChange={e => setF('gradePass', e.target.value)} className={inputCls} /></FormField>
            <FormField label="Grading Method"><select value={form.gradeMethod} onChange={e => setF('gradeMethod', e.target.value)} className={inputCls}>
              <option value="simple">Simple Direct Grading</option>
              <option value="rubric">Rubric</option>
              <option value="guide">Marking Guide</option>
            </select></FormField>
            <FormField label="Blind Marking">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.blindMarking} onChange={e => setF('blindMarking', e.target.checked)} />
                <span className="text-sm text-gray-700">Hide student names from graders</span>
              </label>
            </FormField>
          </>}
          {tab === 'notifications' && <>
            <FormField label="Notify Graders">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.notifyGraders} onChange={e => setF('notifyGraders', e.target.checked)} />
                <span className="text-sm text-gray-700">Send notification when student submits</span>
              </label>
            </FormField>
            <FormField label="Notify Students">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.notifyStudents} onChange={e => setF('notifyStudents', e.target.checked)} />
                <span className="text-sm text-gray-700">Send notification when graded</span>
              </label>
            </FormField>
          </>}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter assignment name'); return; } onSave({ name: form.name, description: form.description, settings: form }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Assignment</button>
        </div>
      </div>
    </div>
  );
}

export function ForumCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    type: s.type ?? 'general',
    maxAttachments: s.maxAttachments ?? '0',
    ratingScale: s.ratingScale ?? 'none',
    subscriptionMode: s.subscriptionMode ?? 'auto',
    trackingMode: s.trackingMode ?? 'optional',
    allowPostRatings: s.allowPostRatings ?? false,
    blockAfterPeriod: s.blockAfterPeriod ?? false,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5 text-green-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} Forum</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Forum Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. General Discussion" className={inputCls} /></FormField>
          <FormField label="Forum Type">
            <select value={form.type} onChange={e => setF('type', e.target.value)} className={inputCls}>
              <option value="general">Standard forum for general use</option>
              <option value="qanda">Each person posts one discussion</option>
              <option value="single">A single simple discussion</option>
              <option value="blog">Standard forum displayed in blog-like format</option>
              <option value="news">News forum (announcements)</option>
            </select>
          </FormField>
          <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} placeholder="Describe the purpose of this forum..." minHeight={120} /></FormField>
          <FormField label="Subscription Mode">
            <select value={form.subscriptionMode} onChange={e => setF('subscriptionMode', e.target.value)} className={inputCls}>
              <option value="auto">Auto subscription</option>
              <option value="optional">Optional subscription</option>
              <option value="forced">Forced subscription</option>
              <option value="disabled">Subscriptions disabled</option>
            </select>
          </FormField>
          <FormField label="Ratings">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allowPostRatings} onChange={e => setF('allowPostRatings', e.target.checked)} />
              <span className="text-sm text-gray-700">Allow students to rate posts</span>
            </label>
          </FormField>
          <FormField label="Maximum Attachments">
            <select value={form.maxAttachments} onChange={e => setF('maxAttachments', e.target.value)} className={inputCls}>
              {['0','1','2','5','10'].map(n => <option key={n} value={n}>{n === '0' ? 'No attachments' : n}</option>)}
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter forum name'); return; } onSave({ name: form.name, description: form.description, settings: form }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Forum</button>
        </div>
      </div>
    </div>
  );
}

export function UrlCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    url: s.url ?? '',
    description: initialData?.description ?? '',
    displayType: s.displayType ?? 'auto',
    popupWidth: s.popupWidth ?? '620',
    popupHeight: s.popupHeight ?? '450',
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center"><Link className="w-5 h-5 text-cyan-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Add'} URL</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Python Documentation" className={inputCls} /></FormField>
          <FormField label="External URL" required><input type="url" value={form.url} onChange={e => setF('url', e.target.value)} placeholder="https://..." className={inputCls} /></FormField>
          <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} placeholder="Describe this resource..." minHeight={100} /></FormField>
          <FormField label="Display">
            <select value={form.displayType} onChange={e => setF('displayType', e.target.value)} className={inputCls}>
              <option value="auto">Automatic</option>
              <option value="embed">Embed</option>
              <option value="frame">In frame</option>
              <option value="new">Open in new window</option>
              <option value="popup">Open in popup</option>
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name || !form.url) { alert('Name and URL are required'); return; } onSave({ name: form.name, description: form.description, settings: form }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save URL</button>
        </div>
      </div>
    </div>
  );
}

export function FileCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    displayType: s.displayType ?? 'auto',
    showSize: s.showSize ?? true,
    showDate: s.showDate ?? true,
    showType: s.showType ?? false,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!form.name) setF('name', files[0].name);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center"><File className="w-5 h-5 text-gray-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Upload'} File</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Display name for this file" className={inputCls} /></FormField>
          <FormField label="File Upload">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <File className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              {selectedFile ? (
                <>
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">Any file type supported</p>
                </>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
          </FormField>
          <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} placeholder="Describe this file..." minHeight={80} /></FormField>
          <FormField label="Display">
            <select value={form.displayType} onChange={e => setF('displayType', e.target.value)} className={inputCls}>
              <option value="auto">Automatic</option>
              <option value="embed">Embed</option>
              <option value="download">Force download</option>
              <option value="new">Open in new tab</option>
            </select>
          </FormField>
          <FormField label="Show File Details">
            <div className="space-y-2">
              {[{ k: 'showSize', l: 'Show file size' }, { k: 'showDate', l: 'Show upload date' }, { k: 'showType', l: 'Show file type' }].map(item => (
                <label key={item.k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form as Record<string, unknown>)[item.k] as boolean} onChange={e => setF(item.k, e.target.checked)} />
                  <span className="text-sm text-gray-700">{item.l}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter a name'); return; } onSave({ name: form.name, description: form.description, settings: form, file: selectedFile }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save File</button>
        </div>
      </div>
    </div>
  );
}

export function ScormCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    gradeMethod: s.gradeMethod ?? 'highest',
    maxGrade: s.maxGrade ?? '100',
    attempts: s.attempts ?? '1',
    displayType: s.displayType ?? 'new',
    displayWidth: s.displayWidth ?? '100',
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!form.name) setF('name', files[0].name.replace(/\.zip$/i, ''));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-yellow-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} SCORM Package</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="SCORM activity name" className={inputCls} /></FormField>
          <FormField label="SCORM Package Upload">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              {selectedFile ? (
                <>
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Upload SCORM 1.2 or SCORM 2004 package (.zip)</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
          </FormField>
          <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} minHeight={80} /></FormField>
          <FormField label="Grade Method">
            <select value={form.gradeMethod} onChange={e => setF('gradeMethod', e.target.value)} className={inputCls}>
              <option value="highest">Highest attempt</option>
              <option value="average">Average</option>
              <option value="first">First attempt</option>
              <option value="last">Last attempt</option>
            </select>
          </FormField>
          <FormField label="Maximum Grade"><input type="number" value={form.maxGrade} onChange={e => setF('maxGrade', e.target.value)} className={inputCls} /></FormField>
          <FormField label="Attempts Allowed">
            <select value={form.attempts} onChange={e => setF('attempts', e.target.value)} className={inputCls}>
              {['1','2','3','5','Unlimited'].map(n => <option key={n}>{n}</option>)}
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter a name'); return; } onSave({ name: form.name, description: form.description, settings: form, file: selectedFile }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save SCORM</button>
        </div>
      </div>
    </div>
  );
}

export function WorkshopCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    gradingStrategy: s.gradingStrategy ?? 'accumulative',
    maxGrade: s.maxGrade ?? '80',
    maxGradeForAssessment: s.maxGradeForAssessment ?? '20',
    submissionStart: s.submissionStart ?? '',
    submissionEnd: s.submissionEnd ?? '',
    assessmentStart: s.assessmentStart ?? '',
    assessmentEnd: s.assessmentEnd ?? '',
    allowSelfAssessment: s.allowSelfAssessment ?? false,
    requireExamples: s.requireExamples ?? false,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-orange-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} Workshop</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Workshop name" className={inputCls} /></FormField>
          <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} minHeight={100} /></FormField>
          <FormField label="Grading Strategy">
            <select value={form.gradingStrategy} onChange={e => setF('gradingStrategy', e.target.value)} className={inputCls}>
              <option value="accumulative">Accumulative grading</option>
              <option value="comments">Comments only</option>
              <option value="numerror">Number of errors</option>
              <option value="rubric">Rubric</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Grade for Submission"><input type="number" value={form.maxGrade} onChange={e => setF('maxGrade', e.target.value)} className={inputCls} /></FormField>
            <FormField label="Max Grade for Assessment"><input type="number" value={form.maxGradeForAssessment} onChange={e => setF('maxGradeForAssessment', e.target.value)} className={inputCls} /></FormField>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-blue-50">
            <p className="text-xs font-semibold text-gray-600">Submission Phase</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Open"><input type="datetime-local" value={form.submissionStart} onChange={e => setF('submissionStart', e.target.value)} className={inputCls} /></FormField>
              <FormField label="Close"><input type="datetime-local" value={form.submissionEnd} onChange={e => setF('submissionEnd', e.target.value)} className={inputCls} /></FormField>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-purple-50">
            <p className="text-xs font-semibold text-gray-600">Assessment Phase</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Open"><input type="datetime-local" value={form.assessmentStart} onChange={e => setF('assessmentStart', e.target.value)} className={inputCls} /></FormField>
              <FormField label="Close"><input type="datetime-local" value={form.assessmentEnd} onChange={e => setF('assessmentEnd', e.target.value)} className={inputCls} /></FormField>
            </div>
          </div>
          <div className="space-y-2">
            {[{ k: 'allowSelfAssessment', l: 'Allow self-assessment' }, { k: 'requireExamples', l: 'Require students to assess example submissions' }].map(item => (
              <label key={item.k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(form as Record<string, unknown>)[item.k] as boolean} onChange={e => setF(item.k, e.target.checked)} />
                <span className="text-sm text-gray-700">{item.l}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter a name'); return; } onSave({ name: form.name, description: form.description, settings: form }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Workshop</button>
        </div>
      </div>
    </div>
  );
}

export function H5PCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    displayType: s.displayType ?? 'iframe',
    gradeMethod: s.gradeMethod ?? 'highest',
    maxGrade: s.maxGrade ?? '100',
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (!form.name) setF('name', files[0].name.replace(/\.h5p$/i, ''));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center"><Layers className="w-5 h-5 text-pink-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} H5P Interactive Content</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Interactive Video: Python Loops" className={inputCls} /></FormField>
          <FormField label="H5P File Upload">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors cursor-pointer"
            >
              <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              {selectedFile ? (
                <>
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Upload .h5p file</p>
                  <p className="text-xs text-gray-400 mt-1">Supported content types: Interactive Video, Quiz, Drag & Drop, and more</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".h5p" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
          </FormField>
          <FormField label="Description"><RichTextEditor value={form.description} onChange={v => setF('description', v)} minHeight={80} /></FormField>
          <FormField label="Grade Method">
            <select value={form.gradeMethod} onChange={e => setF('gradeMethod', e.target.value)} className={inputCls}>
              <option value="highest">Highest score</option>
              <option value="average">Average</option>
              <option value="first">First attempt</option>
              <option value="last">Last attempt</option>
            </select>
          </FormField>
          <FormField label="Maximum Grade"><input type="number" value={form.maxGrade} onChange={e => setF('maxGrade', e.target.value)} className={inputCls} /></FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter a name'); return; } onSave({ name: form.name, description: form.description, settings: form, file: selectedFile }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save H5P</button>
        </div>
      </div>
    </div>
  );
}

export function PageCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    content: s.content ?? initialData?.description ?? '',
    displayInline: s.displayInline ?? false,
    showDate: s.showDate ?? true,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center"><Layout className="w-5 h-5 text-indigo-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} Page</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Page Name" required><input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Week 1 Lecture Notes" className={inputCls} /></FormField>
          <FormField label="Page Content"><RichTextEditor value={form.content} onChange={v => setF('content', v)} placeholder="Write your page content here using the rich text editor..." minHeight={250} /></FormField>
          <FormField label="Options">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.showDate} onChange={e => setF('showDate', e.target.checked)} />
              <span className="text-sm text-gray-700">Show last modified date</span>
            </label>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!form.name) { alert('Please enter page name'); return; } onSave({ name: form.name, description: form.content, settings: form }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Page</button>
        </div>
      </div>
    </div>
  );
}

export function LabelCreator({ onClose, onSave, initialData }: Omit<BaseCreatorProps, 'type'>) {
  const [content, setContent] = useState(initialData?.name ?? '');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center"><Hash className="w-5 h-5 text-red-600" /></div><h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit' : 'Create'} Label</h2></div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <FormField label="Label Content" required>
            <RichTextEditor value={content} onChange={v => setContent(v)} placeholder="Enter text or media content to display between activities..." minHeight={150} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (!content) { alert('Please enter label content'); return; } onSave({ name: content, description: content, settings: { content } }); }} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Label</button>
        </div>
      </div>
    </div>
  );
}
