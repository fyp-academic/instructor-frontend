import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Pencil, UserPlus, X, Users } from 'lucide-react';
import { groupsApi, coursesApi } from '../../services/api';

interface GroupsTabProps {
  courseId: string;
}

interface Member {
  user_id: string;
  student_name: string;
  email: string;
}

interface Group {
  name: string;
  task_mode?: string;
  member_count: number;
  members: Member[];
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function GroupsTab({ courseId }: GroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');

  const loadGroups = useCallback(() => {
    return groupsApi.list(courseId)
      .then(r => setGroups((r.data.data ?? r.data ?? []) as Group[]))
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadGroups(),
      coursesApi.participants(courseId)
        .then(r => {
          const raw = (r.data.data ?? r.data ?? []) as Record<string, unknown>[];
          setStudents(raw
            .map(p => ({ id: String(p.id), name: String(p.name ?? ''), email: String(p.email ?? ''), role: String(p.role ?? 'student') }))
            .filter(p => p.role === 'student'));
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [courseId, loadGroups]);

  const handleCreate = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await groupsApi.create(courseId, { name });
      setNewGroupName('');
      await loadGroups();
    } catch {
      alert('Failed to create group. It may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete group "${name}"? Members will be unassigned.`)) return;
    try { await groupsApi.delete(courseId, name); await loadGroups(); }
    catch { alert('Failed to delete group.'); }
  };

  const handleRename = async (name: string) => {
    const newName = prompt('Rename group', name)?.trim();
    if (!newName || newName === name) return;
    try { await groupsApi.rename(courseId, name, { new_name: newName }); await loadGroups(); }
    catch { alert('Failed to rename group.'); }
  };

  const handleAddStudent = async (groupName: string) => {
    if (!selectedStudent) return;
    try {
      await groupsApi.addStudent(courseId, groupName, { user_id: selectedStudent });
      setAddingTo(null);
      setSelectedStudent('');
      await loadGroups();
    } catch { alert('Failed to add student to group.'); }
  };

  const handleRemoveStudent = async (groupName: string, userId: string) => {
    try { await groupsApi.removeStudent(courseId, groupName, userId); await loadGroups(); }
    catch { alert('Failed to remove student.'); }
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
          <h2 className="font-semibold text-gray-900">Groups</h2>
          <p className="text-sm text-gray-500">{groups.length} groups · {students.length} students enrolled</p>
        </div>
        <div className="flex gap-2">
          <input
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="New group name"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newGroupName.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No groups yet. Create one to start assigning students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => {
            const memberIds = new Set(group.members.map(m => m.user_id));
            const available = students.filter(s => !memberIds.has(s.id));
            return (
              <div key={group.name} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-500">{group.member_count} member{group.member_count === 1 ? '' : 's'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleRename(group.name)} title="Rename" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-50"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(group.name)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {group.members.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No members yet.</p>
                  ) : group.members.map(m => (
                    <div key={m.user_id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                      <span className="text-gray-700">{m.student_name}</span>
                      <button onClick={() => handleRemoveStudent(group.name, m.user_id)} title="Remove" className="text-gray-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>

                {addingTo === group.name ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedStudent}
                      onChange={e => setSelectedStudent(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select a student…</option>
                      {available.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                    </select>
                    <button onClick={() => handleAddStudent(group.name)} disabled={!selectedStudent} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">Add</button>
                    <button onClick={() => { setAddingTo(null); setSelectedStudent(''); }} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => { setAddingTo(group.name); setSelectedStudent(''); }} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    <UserPlus className="w-4 h-4" /> Add student
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
