import React, { useState } from 'react';
import { Search, UserPlus, Filter, Trash2, Shield, Mail, MoreVertical, ChevronDown } from 'lucide-react';
import { mockParticipants, Participant } from '../../data/mockData';

interface ParticipantsTabProps {
  courseId: string;
}

export function ParticipantsTab({ courseId }: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');

  const filtered = participants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleLabels: Record<string, string> = {
    student: 'Student',
    instructor: 'Instructor',
    teaching_assistant: 'Teaching Assistant',
    observer: 'Observer',
  };

  const roleColors: Record<string, string> = {
    student: 'bg-blue-100 text-blue-700',
    instructor: 'bg-purple-100 text-purple-700',
    teaching_assistant: 'bg-green-100 text-green-700',
    observer: 'bg-gray-100 text-gray-600',
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-red-400';
  };

  const handleEnroll = () => {
    if (!newEmail) return;
    const newP: Participant = {
      id: `p_${Date.now()}`,
      name: newEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email: newEmail,
      role: newRole as Participant['role'],
      enrolledDate: new Date().toISOString().split('T')[0],
      lastAccess: 'Never',
      progress: 0,
      groups: [],
    };
    setParticipants(prev => [...prev, newP]);
    setNewEmail('');
    setShowEnrollModal(false);
  };

  return (
    <div className="space-y-4" onClick={() => setMenuOpenId(null)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Participants</h2>
          <p className="text-sm text-gray-500">{participants.length} enrolled users</p>
        </div>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          <UserPlus className="w-4 h-4" /> Enroll User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="teaching_assistant">Teaching Assistants</option>
          <option value="observer">Observers</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Progress</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last Access</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Groups</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[p.role]}`}>
                      {roleLabels[p.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-20">
                        <div className={`h-1.5 rounded-full ${getProgressColor(p.progress)}`} style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{p.lastAccess}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {p.groups.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {p.groups.map(g => <span key={g} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{g}</span>)}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === p.id && (
                        <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Mail className="w-4 h-4 text-gray-400" /> Message</button>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Shield className="w-4 h-4 text-gray-400" /> Change Role</button>
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button onClick={() => setParticipants(prev => prev.filter(x => x.id !== p.id))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" /> Unenroll
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No participants found
            </div>
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Enroll User</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="student">Student</option>
                  <option value="teaching_assistant">Teaching Assistant</option>
                  <option value="observer">Observer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleEnroll} className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
