import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Loader2, X, Edit2 } from 'lucide-react';
import { groupsApi } from '../../services/api';

interface Group {
  name: string;
  member_count: number;
  members: Array<{
    user_id: string;
    student_name: string;
    email: string;
  }>;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  groups?: string[];
}

interface GroupManagementModalProps {
  courseId: string;
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  onGroupsUpdated?: () => void;
}

export function GroupManagementModal({
  courseId,
  participants,
  isOpen,
  onClose,
  onGroupsUpdated,
}: GroupManagementModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const toggleSelected = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen, courseId]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await groupsApi.list(courseId);
      setGroups(res.data.data ?? []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await groupsApi.create(courseId, { name });
      await loadGroups();        // group now exists in the list
      setSelectedGroup(name);    // → selectedGroupData is defined → add box renders
      setSelectedIds([]);
      setNewGroupName('');
      setIsCreatingGroup(false);
      onGroupsUpdated?.();
    } catch (err) {
      console.error('Failed to create group:', err);
      alert('Failed to create group. It may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddStudents = async () => {
    if (!selectedGroup || selectedIds.length === 0) return;

    setAdding(true);
    try {
      for (const id of selectedIds) {
        await groupsApi.addStudent(courseId, selectedGroup, { user_id: id });
      }
      await loadGroups();
      setSelectedIds([]);
      onGroupsUpdated?.();
    } catch (err) {
      console.error('Failed to add student(s) to group:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (groupName: string, userId: string) => {
    if (!confirm('Remove student from group?')) return;

    try {
      await groupsApi.removeStudent(courseId, groupName, userId);
      await loadGroups();
      onGroupsUpdated?.();
    } catch (err) {
      console.error('Failed to remove student from group:', err);
    }
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (!confirm(`Delete group "${groupName}" and remove all students?`)) return;

    try {
      await groupsApi.delete(courseId, groupName);
      await loadGroups();
      setSelectedGroup(null);
      onGroupsUpdated?.();
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const handleRenameGroup = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setRenamingGroup(null);
      return;
    }

    try {
      await groupsApi.rename(courseId, oldName, { new_name: newName });
      await loadGroups();
      setRenamingGroup(null);
      setNewName('');
      if (selectedGroup === oldName) {
        setSelectedGroup(newName);
      }
      onGroupsUpdated?.();
    } catch (err) {
      console.error('Failed to rename group:', err);
    }
  };

  if (!isOpen) return null;

  const selectedGroupData = groups.find(g => g.name === selectedGroup);
  // A student may belong to only ONE group — exclude anyone already in any group.
  const groupedIds = new Set(groups.flatMap(g => g.members.map(m => m.user_id)));
  const availableStudents = participants.filter(
    p => p.role === 'student' && !groupedIds.has(p.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)" }}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Group Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">Organize students into groups for group-based assignments</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Groups List */}
            <div className="lg:col-span-1 space-y-2">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-medium text-sm text-slate-700">Groups ({groups.length})</h3>
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  title="Create new group"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreatingGroup && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Group name..."
                    className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleCreateGroup();
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || creating}
                    className="px-3 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {creating && <Loader2 className="w-3 h-3 animate-spin" />} Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingGroup(false);
                      setNewGroupName('');
                    }}
                    className="px-3 py-2 text-xs border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="space-y-1 bg-slate-50 rounded-lg p-2">
                {groups.length === 0 ? (
                  <p className="text-xs text-slate-400 px-2 py-1">No groups yet. Add students to create groups.</p>
                ) : (
                  groups.map(group => (
                    <button
                      key={group.name}
                      onClick={() => { setSelectedGroup(group.name); setSelectedIds([]); }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        selectedGroup === group.name
                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>{group.name}</span>
                        </div>
                        <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">{group.member_count}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Group Details & Members */}
            <div className="lg:col-span-2 space-y-3">
              {selectedGroup && selectedGroupData ? (
                <>
                  {/* Group Header with Rename */}
                  <div className="flex items-center justify-between gap-2">
                    {renamingGroup === selectedGroup ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          className="flex-1 text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameGroup(selectedGroup)}
                          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setRenamingGroup(null);
                            setNewName('');
                          }}
                          className="px-3 py-1 text-xs border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-slate-900">{selectedGroup}</h3>
                        <button
                          onClick={() => {
                            setRenamingGroup(selectedGroup);
                            setNewName(selectedGroup);
                          }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(selectedGroup)}
                          className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Add Student to Group */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <label className="text-xs font-medium text-slate-600">Add Students to Group</label>
                    {availableStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">All enrolled students are already in a group.</p>
                    ) : (
                      <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                        {availableStudents.map(s => (
                          <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(s.id)}
                              onChange={() => toggleSelected(s.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="min-w-0 flex-1 truncate text-slate-700">{s.name} <span className="text-slate-400">({s.email})</span></span>
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddStudents}
                        disabled={selectedIds.length === 0 || adding}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
                      </button>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                      <p className="text-xs font-medium text-slate-600">Members ({selectedGroupData.members.length})</p>
                    </div>
                    {selectedGroupData.members.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-400">No members</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {selectedGroupData.members.map(member => (
                          <div key={member.user_id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 group">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{member.student_name}</p>
                              <p className="text-xs text-slate-500 truncate">{member.email}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveStudent(selectedGroup, member.user_id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <p className="text-sm">Select a group to view and manage members</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
