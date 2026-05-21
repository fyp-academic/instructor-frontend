import React, { useState, useEffect } from 'react';
import {
  X, ClipboardList, Monitor, BookOpen, ListChecks, BarChart3,
  Award, Database, MessageCircle, Folder, BookMarked, Box,
  GraduationCap, Play, Plus, Trash2
} from 'lucide-react';
import { RichTextEditor } from '../RichTextEditor';
import { videoApi } from '../../services/api';

interface BaseCreatorProps {
  onClose: () => void;
  onSave: (data: { name: string; description: string; settings: Record<string, unknown>; file?: File | null }) => void;
  initialData?: { name: string; description?: string; settings?: Record<string, unknown> };
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
const btnPrimary = 'px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700';
const btnSecondary = 'px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50';

function FormField({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function ModalShell({ title, icon: Icon, iconColor, iconBg, onClose, children, onSave, saveLabel }: {
  title: string; icon: React.ElementType; iconColor: string; iconBg: string; onClose: () => void; children: React.ReactNode; onSave: () => void; saveLabel?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">{children}</div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} className={btnSecondary}>Cancel</button>
          <button onClick={onSave} className={btnPrimary}>{saveLabel || 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Attendance ───────── */
export function AttendanceCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    sessions: s.sessions ?? '12',
    gradeType: s.gradeType ?? 'none',
    autoMark: s.autoMark ?? false,
    allowSelfMark: s.allowSelfMark ?? false,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Attendance`} icon={ClipboardList} iconColor="text-teal-600" iconBg="bg-teal-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form } });
    }}>
      <FormField label="Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <FormField label="Number of Sessions" hint="How many attendance sessions will there be?"><input type="number" className={inputCls} value={form.sessions} onChange={e => setF('sessions', e.target.value)} /></FormField>
      <FormField label="Grade Type"><select className={selectCls} value={form.gradeType} onChange={e => setF('gradeType', e.target.value)}><option value="none">No grade</option><option value="point">Point</option><option value="percent">Percentage</option></select></FormField>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.autoMark} onChange={e => setF('autoMark', e.target.checked)} /><span className="text-sm text-gray-700">Auto-mark based on session participation</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.allowSelfMark} onChange={e => setF('allowSelfMark', e.target.checked)} /><span className="text-sm text-gray-700">Allow students to self-mark attendance</span></div>
    </ModalShell>
  );
}

/* ───────── BigBlueButton ───────── */
export function BigBlueButtonCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    welcomeMsg: s.welcomeMsg ?? '',
    maxParticipants: s.maxParticipants ?? '50',
    duration: s.duration ?? '60',
    record: s.record ?? true,
    muteOnStart: s.muteOnStart ?? false,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} BigBlueButton Room`} icon={Monitor} iconColor="text-slate-600" iconBg="bg-slate-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form } });
    }}>
      <FormField label="Room Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <FormField label="Welcome Message"><input className={inputCls} value={form.welcomeMsg} onChange={e => setF('welcomeMsg', e.target.value)} placeholder="Welcome message shown when joining..." /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Max Participants"><input type="number" className={inputCls} value={form.maxParticipants} onChange={e => setF('maxParticipants', e.target.value)} /></FormField>
        <FormField label="Duration (minutes)"><input type="number" className={inputCls} value={form.duration} onChange={e => setF('duration', e.target.value)} /></FormField>
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.record} onChange={e => setF('record', e.target.checked)} /><span className="text-sm text-gray-700">Record session</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.muteOnStart} onChange={e => setF('muteOnStart', e.target.checked)} /><span className="text-sm text-gray-700">Mute participants on start</span></div>
    </ModalShell>
  );
}

/* ───────── Book ───────── */
export function BookCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
  });
  const [chapters, setChapters] = useState<{ title: string; content: string }[]>(
    (s.chapters ?? [{ title: 'Chapter 1', content: '' }]).map((c: any) => ({ title: c.title ?? '', content: c.content ?? '' }))
  );
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Book`} icon={BookOpen} iconColor="text-amber-600" iconBg="bg-amber-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form, chapters } });
    }}>
      <FormField label="Book Title" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Introduction / Description"><textarea className={inputCls} rows={3} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Chapters</span>
          <button onClick={() => setChapters(p => [...p, { title: `Chapter ${p.length + 1}`, content: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Chapter</button>
        </div>
        {chapters.map((c, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${inputCls} flex-1`} value={c.title} onChange={e => { const next = [...chapters]; next[i] = { ...c, title: e.target.value }; setChapters(next); }} placeholder="Chapter title" />
              <button onClick={() => setChapters(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
            <RichTextEditor
              value={c.content}
              onChange={(v) => { const next = [...chapters]; next[i] = { ...c, content: v }; setChapters(next); }}
              placeholder="Chapter content..."
              minHeight={180}
            />
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

/* ───────── Checklist ───────── */
export function ChecklistCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    autoUpdate: s.autoUpdate ?? false,
    showProgress: s.showProgress ?? true,
  });
  const [items, setItems] = useState<string[]>(
    (s.items ?? [''])
  );
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Checklist`} icon={ListChecks} iconColor="text-lime-600" iconBg="bg-lime-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      const cleanItems = items.filter(i => i.trim() !== '');
      onSave({ name: form.name, description: form.description, settings: { ...form, items: cleanItems } });
    }}>
      <FormField label="Title" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Checklist Items</span>
          <button onClick={() => setItems(p => [...p, ''])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Item</button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={item} onChange={e => { const next = [...items]; next[i] = e.target.value; setItems(next); }} placeholder={`Item ${i + 1}`} />
            <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.autoUpdate} onChange={e => setF('autoUpdate', e.target.checked)} /><span className="text-sm text-gray-700">Auto-update based on activity completion</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.showProgress} onChange={e => setF('showProgress', e.target.checked)} /><span className="text-sm text-gray-700">Show progress bar to students</span></div>
    </ModalShell>
  );
}

/* ───────── Choice (Poll) ───────── */
export function ChoiceCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    allowMultiple: s.allowMultiple ?? false,
    limitAnswers: s.limitAnswers ?? false,
    showResults: s.showResults ?? 'after_answer',
  });
  const [options, setOptions] = useState<string[]>(
    (s.options ?? ['Option 1', 'Option 2'])
  );
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Choice / Poll`} icon={BarChart3} iconColor="text-violet-600" iconBg="bg-violet-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      const cleanOptions = options.filter(o => o.trim() !== '');
      if (cleanOptions.length < 2) { alert('Please add at least 2 options'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form, options: cleanOptions } });
    }}>
      <FormField label="Question / Title" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Options</span>
          <button onClick={() => setOptions(p => [...p, `Option ${p.length + 1}`])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Option</button>
        </div>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={opt} onChange={e => { const next = [...options]; next[i] = e.target.value; setOptions(next); }} placeholder={`Option ${i + 1}`} />
            <button onClick={() => setOptions(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.allowMultiple} onChange={e => setF('allowMultiple', e.target.checked)} /><span className="text-sm text-gray-700">Allow multiple selections</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.limitAnswers} onChange={e => setF('limitAnswers', e.target.checked)} /><span className="text-sm text-gray-700">Limit number of responses</span></div>
      <FormField label="Show Results"><select className={selectCls} value={form.showResults} onChange={e => setF('showResults', e.target.value)}><option value="after_answer">After student answers</option><option value="after_close">After activity closes</option><option value="never">Never</option></select></FormField>
    </ModalShell>
  );
}

/* ───────── Certificate ───────── */
export function CertificateCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    template: s.template ?? 'standard',
    requiredGrade: s.requiredGrade ?? '',
    dateFormat: s.dateFormat ?? 'F j, Y',
    protect: s.protect ?? false,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Certificate`} icon={Award} iconColor="text-rose-600" iconBg="bg-rose-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form } });
    }}>
      <FormField label="Certificate Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <FormField label="Template"><select className={selectCls} value={form.template} onChange={e => setF('template', e.target.value)}><option value="standard">Standard</option><option value="formal">Formal</option><option value="modern">Modern</option></select></FormField>
      <FormField label="Required Grade (%)" hint="Leave empty if no grade is required"><input type="number" className={inputCls} value={form.requiredGrade} onChange={e => setF('requiredGrade', e.target.value)} placeholder="e.g. 70" /></FormField>
      <FormField label="Date Format"><input className={inputCls} value={form.dateFormat} onChange={e => setF('dateFormat', e.target.value)} /></FormField>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.protect} onChange={e => setF('protect', e.target.checked)} /><span className="text-sm text-gray-700">Require course completion before issuing</span></div>
    </ModalShell>
  );
}

/* ───────── Database ───────── */
export function DatabaseCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    requireApproval: s.requireApproval ?? false,
    allowComments: s.allowComments ?? true,
  });
  const [fields, setFields] = useState<{ name: string; type: string }[]>(
    (s.fields ?? [{ name: 'Title', type: 'text' }, { name: 'Description', type: 'textarea' }]).map((f: any) => ({ name: f.name ?? '', type: f.type ?? 'text' }))
  );
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Database`} icon={Database} iconColor="text-emerald-600" iconBg="bg-emerald-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form, fields } });
    }}>
      <FormField label="Database Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Fields</span>
          <button onClick={() => setFields(p => [...p, { name: '', type: 'text' }])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Field</button>
        </div>
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={f.name} onChange={e => { const next = [...fields]; next[i] = { ...f, name: e.target.value }; setFields(next); }} placeholder="Field name" />
            <select className={selectCls} value={f.type} onChange={e => { const next = [...fields]; next[i] = { ...f, type: e.target.value }; setFields(next); }}>
              <option value="text">Text</option><option value="textarea">Textarea</option><option value="number">Number</option><option value="date">Date</option><option value="url">URL</option><option value="file">File</option>
            </select>
            <button onClick={() => setFields(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.requireApproval} onChange={e => setF('requireApproval', e.target.checked)} /><span className="text-sm text-gray-700">Require approval before entries are visible</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.allowComments} onChange={e => setF('allowComments', e.target.checked)} /><span className="text-sm text-gray-700">Allow comments on entries</span></div>
    </ModalShell>
  );
}

/* ───────── Feedback ───────── */
export function FeedbackCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    anonymous: s.anonymous ?? true,
    allowMultiple: s.allowMultiple ?? false,
  });
  const [questions, setQuestions] = useState<{ text: string; type: string }[]>(
    (s.questions ?? [{ text: '', type: 'textarea' }]).map((q: any) => ({ text: q.text ?? '', type: q.type ?? 'textarea' }))
  );
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Feedback`} icon={MessageCircle} iconColor="text-sky-600" iconBg="bg-sky-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      const cleanQs = questions.filter(q => q.text.trim() !== '');
      onSave({ name: form.name, description: form.description, settings: { ...form, questions: cleanQs } });
    }}>
      <FormField label="Feedback Title" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Questions</span>
          <button onClick={() => setQuestions(p => [...p, { text: '', type: 'textarea' }])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Question</button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={q.text} onChange={e => { const next = [...questions]; next[i] = { ...q, text: e.target.value }; setQuestions(next); }} placeholder={`Question ${i + 1}`} />
            <select className={selectCls} value={q.type} onChange={e => { const next = [...questions]; next[i] = { ...q, type: e.target.value }; setQuestions(next); }}>
              <option value="textarea">Long text</option><option value="text">Short text</option><option value="rating">Rating (1-5)</option><option value="yesno">Yes / No</option>
            </select>
            <button onClick={() => setQuestions(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.anonymous} onChange={e => setF('anonymous', e.target.checked)} /><span className="text-sm text-gray-700">Anonymous responses</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.allowMultiple} onChange={e => setF('allowMultiple', e.target.checked)} /><span className="text-sm text-gray-700">Allow multiple submissions</span></div>
    </ModalShell>
  );
}

/* ───────── Folder ───────── */
export function FolderCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    showExpanded: s.showExpanded ?? false,
    showDownload: s.showDownload ?? true,
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Folder`} icon={Folder} iconColor="text-stone-600" iconBg="bg-stone-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form } });
    }}>
      <FormField label="Folder Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.showExpanded} onChange={e => setF('showExpanded', e.target.checked)} /><span className="text-sm text-gray-700">Show folder contents expanded by default</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.showDownload} onChange={e => setF('showDownload', e.target.checked)} /><span className="text-sm text-gray-700">Allow downloading folder as ZIP</span></div>
    </ModalShell>
  );
}

/* ───────── Glossary ───────── */
export function GlossaryCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    autoLink: s.autoLink ?? true,
    allowDuplicates: s.allowDuplicates ?? false,
    allowComments: s.allowComments ?? false,
  });
  const [entries, setEntries] = useState<{ term: string; definition: string }[]>(
    (s.entries ?? [{ term: '', definition: '' }]).map((e: any) => ({ term: e.term ?? '', definition: e.definition ?? '' }))
  );
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Glossary`} icon={BookMarked} iconColor="text-fuchsia-600" iconBg="bg-fuchsia-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      const cleanEntries = entries.filter(e => e.term.trim() !== '');
      onSave({ name: form.name, description: form.description, settings: { ...form, entries: cleanEntries } });
    }}>
      <FormField label="Glossary Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Entries</span>
          <button onClick={() => setEntries(p => [...p, { term: '', definition: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Entry</button>
        </div>
        {entries.map((e, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${inputCls} flex-1`} value={e.term} onChange={ev => { const next = [...entries]; next[i] = { ...e, term: ev.target.value }; setEntries(next); }} placeholder="Term" />
              <button onClick={() => setEntries(p => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea className={inputCls} rows={2} value={e.definition} onChange={ev => { const next = [...entries]; next[i] = { ...e, definition: ev.target.value }; setEntries(next); }} placeholder="Definition" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.autoLink} onChange={e => setF('autoLink', e.target.checked)} /><span className="text-sm text-gray-700">Auto-link glossary terms in course content</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.allowDuplicates} onChange={e => setF('allowDuplicates', e.target.checked)} /><span className="text-sm text-gray-700">Allow duplicate entries</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.allowComments} onChange={e => setF('allowComments', e.target.checked)} /><span className="text-sm text-gray-700">Allow comments on entries</span></div>
    </ModalShell>
  );
}

/* ───────── IMS Content Package ───────── */
export function IMSContentPackageCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    fileName: s.fileName ?? '',
    display: s.display ?? 'current',
    width: s.width ?? '100%',
    height: s.height ?? '600',
  });
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} IMS Content Package`} icon={Box} iconColor="text-neutral-600" iconBg="bg-neutral-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form } });
    }}>
      <FormField label="Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <FormField label="Package File Name" hint="Name of the uploaded IMS CP file"><input className={inputCls} value={form.fileName} onChange={e => setF('fileName', e.target.value)} /></FormField>
      <FormField label="Display Mode"><select className={selectCls} value={form.display} onChange={e => setF('display', e.target.value)}><option value="current">In current window</option><option value="new">New window</option><option value="embed">Embedded</option></select></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Width"><input className={inputCls} value={form.width} onChange={e => setF('width', e.target.value)} /></FormField>
        <FormField label="Height (px)"><input type="number" className={inputCls} value={form.height} onChange={e => setF('height', e.target.value)} /></FormField>
      </div>
    </ModalShell>
  );
}

/* ───────── Lesson ───────── */
export function LessonCreator({ onClose, onSave, initialData }: BaseCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    practice: s.practice ?? true,
    customScoring: s.customScoring ?? false,
    maxAttempts: s.maxAttempts ?? '5',
  });
  const [pages, setPages] = useState<{ title: string; content: string }[]>(
    (s.pages ?? [{ title: 'Page 1', content: '' }]).map((p: any) => ({ title: p.title ?? '', content: p.content ?? '' }))
  );
  const [pagesLoading, setPagesLoading] = useState(false);
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  // Fetch actual lesson pages from API when editing
  useEffect(() => {
    if (initialData?.id) {
      setPagesLoading(true);
      import('../../services/api').then(({ lessonApi }) => {
        lessonApi.listPages(String(initialData.id))
          .then((res: any) => {
            const apiPages = res.data?.data ?? [];
            if (apiPages.length > 0) {
              setPages(apiPages.map((p: any) => ({
                title: p.title ?? 'Page',
                content: p.content ?? '',
              })));
            }
          })
          .catch(() => {})
          .finally(() => setPagesLoading(false));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);
  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Lesson`} icon={GraduationCap} iconColor="text-cyan-700" iconBg="bg-cyan-100" onClose={onClose} onSave={() => {
      if (!form.name) { alert('Name is required'); return; }
      onSave({ name: form.name, description: form.description, settings: { ...form, pages } });
    }}>
      <FormField label="Lesson Name" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <div className="space-y-3">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Pages</span>
          <button onClick={() => setPages(p => [...p, { title: `Page ${p.length + 1}`, content: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><Plus className="w-3 h-3" /> Add Page</button>
        </div>
        {pagesLoading && <div className="text-xs text-gray-500">Loading pages...</div>}
        {pages.map((p, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input className={`${inputCls} flex-1`} value={p.title} onChange={e => { const next = [...pages]; next[i] = { ...p, title: e.target.value }; setPages(next); }} placeholder="Page title" />
              <button onClick={() => setPages(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
            <RichTextEditor
              value={p.content}
              onChange={(v) => { const next = [...pages]; next[i] = { ...p, content: v }; setPages(next); }}
              placeholder="Page content..."
              minHeight={180}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Max Attempts"><input type="number" className={inputCls} value={form.maxAttempts} onChange={e => setF('maxAttempts', e.target.value)} /></FormField>
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.practice} onChange={e => setF('practice', e.target.checked)} /><span className="text-sm text-gray-700">Allow practice mode</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.customScoring} onChange={e => setF('customScoring', e.target.checked)} /><span className="text-sm text-gray-700">Custom scoring per page</span></div>
    </ModalShell>
  );
}

/* ───────── Video ───────── */
interface VideoCreatorProps extends BaseCreatorProps {
  activityId?: string;
}

export function VideoCreator({ onClose, onSave, initialData, activityId }: VideoCreatorProps) {
  const s = (initialData?.settings ?? {}) as Record<string, any>;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    sourceType: s.sourceType ?? 'upload',
    url: s.url ?? '',
    fileName: s.fileName ?? '',
    width: s.width ?? '640',
    height: s.height ?? '360',
    autoplay: s.autoplay ?? false,
    controls: s.controls ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { alert('Name is required'); return; }
    if (form.sourceType === 'url' && !form.url) { alert('URL is required for external video'); return; }
    if (form.sourceType === 'upload' && !file && !form.fileName && !initialData) { alert('Please select a video file or enter a file name'); return; }

    const settings: Record<string, unknown> = { ...form };

    // If editing and a new file is selected, upload it immediately
    if (activityId && file && form.sourceType === 'upload') {
      setUploading(true);
      try {
        const res = await videoApi.upload(activityId, file);
        const data = res.data?.data ?? {};
        settings.fileName = data.file_name ?? file.name;
        settings.videoUrl = data.url ?? '';
        settings.videoPath = data.path ?? '';
        settings.mimeType = data.mime_type ?? file.type;
        settings.fileSize = data.size ?? file.size;
      } catch (e) {
        alert('Video upload failed. Saving settings without file.');
      } finally {
        setUploading(false);
      }
    }

    onSave({ name: form.name, description: form.description, settings, file });
  };

  return (
    <ModalShell title={`${initialData ? 'Edit' : 'Create'} Video${uploading ? ' (uploading...)' : ''}`} icon={Play} iconColor="text-red-700" iconBg="bg-red-50" onClose={onClose} onSave={handleSave}>
      <FormField label="Video Title" required><input className={inputCls} value={form.name} onChange={e => setF('name', e.target.value)} /></FormField>
      <FormField label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
      <FormField label="Source"><select className={selectCls} value={form.sourceType} onChange={e => setF('sourceType', e.target.value)}><option value="upload">Uploaded File</option><option value="url">External URL (YouTube, Vimeo, etc.)</option></select></FormField>
      {form.sourceType === 'url' && <FormField label="Video URL" required><input className={inputCls} value={form.url} onChange={e => setF('url', e.target.value)} placeholder="https://..." /></FormField>}
      {form.sourceType === 'upload' && (
        <FormField label="Video File" hint={activityId ? 'Select a new file to replace the current one' : 'Select a video file from your device'}>
          <input
            type="file"
            accept="video/*"
            className={inputCls}
            onChange={e => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) setF('fileName', f.name);
            }}
          />
          {form.fileName && <p className="text-xs text-gray-500 mt-1">Current: {form.fileName}</p>}
        </FormField>
      )}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Width (px)"><input type="number" className={inputCls} value={form.width} onChange={e => setF('width', e.target.value)} /></FormField>
        <FormField label="Height (px)"><input type="number" className={inputCls} value={form.height} onChange={e => setF('height', e.target.value)} /></FormField>
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.autoplay} onChange={e => setF('autoplay', e.target.checked)} /><span className="text-sm text-gray-700">Autoplay</span></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.controls} onChange={e => setF('controls', e.target.checked)} /><span className="text-sm text-gray-700">Show player controls</span></div>
    </ModalShell>
  );
}
