import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FolderOpen, Settings, Shield, Database, Bell, Search, MoreVertical, Edit, Trash2, UserPlus, Plus, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { usersApi, dashboardApi } from '../services/api';

type AdminTab = 'users' | 'courses' | 'categories' | 'system';

type UserRow = Record<string, unknown>;

const ROLES = ['student', 'instructor', 'admin'];

const emptyForm = { name: '', email: '', password: '', role: 'student', department: '', institution: '', country: '', language: '' };

export default function Administration() {
  const { courses, deleteCourse, categories } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers]         = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<Record<string, unknown>>({});

  const [showAddUser, setShowAddUser]   = useState(false);
  const [addForm, setAddForm]           = useState(emptyForm);
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState('');

  useEffect(() => {
    dashboardApi.adminOverview().then(r => {
      setAdminStats(r.data ?? {});
    }).catch(() => {});

    // Fetch users list
    usersApi.list().then(r => {
      const data = r.data.data ?? r.data ?? [];
      setUsers(data);
    }).catch(() => {});
  }, []);

  const filteredUsers = users.filter(u => {
    const name  = String(u.name ?? '').toLowerCase();
    const email = String(u.email ?? '').toLowerCase();
    const q     = userSearch.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const filteredCourses = courses.filter(c => {
    const c2 = c as unknown as Record<string, unknown>;
    const n  = String(c2.name ?? c2.title ?? '').toLowerCase();
    const sn = String(c2.shortName ?? c2.short_name ?? '').toLowerCase();
    const q  = courseSearch.toLowerCase();
    return n.includes(q) || sn.includes(q);
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    instructor: 'bg-purple-100 text-purple-700',
    student: 'bg-blue-100 text-blue-700',
  };

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'system', label: 'System', icon: Settings },
  ];

  return (
    <div className="space-y-6" onClick={() => setMenuOpenId(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-500">Manage users, courses, categories, and system settings</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Shield className="w-4 h-4 text-amber-600" />
          Admin Mode
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',       value: Number(adminStats.total_users       ?? users.length),                              icon: Users,    color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Active Courses',    value: Number(adminStats.active_courses    ?? courses.filter(c => c.status === 'active').length), icon: BookOpen, color: 'text-green-600 bg-green-50'  },
          { label: 'Categories',        value: Number(adminStats.total_categories  ?? categories.length),                         icon: FolderOpen, color: 'text-amber-600 bg-amber-50'  },
          { label: 'Total Enrollments', value: Number(adminStats.total_enrollments ?? courses.reduce((s, c) => s + c.enrolledStudents, 0)), icon: UserPlus, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="bg-transparent text-sm outline-none flex-1" />
                </div>
                <button onClick={() => { setAddForm(emptyForm); setAddError(''); setShowAddUser(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4" /> Add User
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Last Access</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No users found. Use "Add User" to create accounts.</td></tr>
                    ) : filteredUsers.slice(0, 10).map((user, ui) => {
                      const uid     = String(user.id ?? ui);
                      const uname   = String(user.name ?? '');
                      const uemail  = String(user.email ?? '');
                      const urole   = String(user.role ?? 'student');
                      const ulast   = String(user.last_login ?? user.lastAccess ?? 'Never');
                      const initials = uname.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <tr key={uid} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                              <span className="font-medium text-gray-900 text-sm">{uname}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">{uemail}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[urole] ?? 'bg-gray-100 text-gray-600'}`}>{urole}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{ulast}</td>
                          <td className="px-4 py-3">
                            <div className="relative" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setMenuOpenId(menuOpenId === uid ? null : uid)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {menuOpenId === uid && (
                                <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit className="w-4 h-4 text-gray-400" />Edit</button>
                                  <button onClick={() => setUsers(prev => prev.filter(u => String(u.id ?? '') !== uid))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search courses..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} className="bg-transparent text-sm outline-none flex-1" />
                </div>
                <button onClick={() => navigate('/courses/create')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> Add Course
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Course</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Instructor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Students</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCourses.map(course => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 cursor-pointer hover:text-indigo-700" onClick={() => navigate(`/courses/${course.id}`)}>{course.name}</p>
                          <p className="text-xs text-gray-400">{course.shortName}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{course.instructor}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${course.status === 'active' ? 'bg-green-100 text-green-700' : course.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>{course.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{course.enrolledStudents}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => navigate(`/courses/${course.id}`)} className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50">View</button>
                            <button onClick={() => { if (confirm('Delete?')) deleteCourse(course.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => navigate('/categories')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  Manage Categories →
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Courses</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Sub-categories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map(cat => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {cat.parentId && <span className="w-4 h-0.5 bg-gray-300 ml-2 flex-shrink-0" />}
                            <span className="font-medium text-gray-900">{cat.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">{cat.idNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{cat.courseCount}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{cat.childCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Notifications', desc: 'Configure system-wide notification settings', icon: Bell, color: 'bg-indigo-50 border-indigo-200' },
                  { title: 'Security', desc: 'Password policies, 2FA, session settings', icon: Shield, color: 'bg-red-50 border-red-200' },
                  { title: 'Backup & Restore', desc: 'Schedule backups and restore from backup', icon: Database, color: 'bg-green-50 border-green-200' },
                  { title: 'General Settings', desc: 'Site name, timezone, language defaults', icon: Settings, color: 'bg-gray-50 border-gray-200' },
                ].map(setting => (
                  <div key={setting.title} className={`${setting.color} border rounded-xl p-5 cursor-pointer hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-3 mb-2">
                      <setting.icon className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-800">{setting.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{setting.desc}</p>
                    <button className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Configure →</button>
                  </div>
                ))}
              </div>

              {/* System info */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">System Information</h3>
                <div className="space-y-2">
                  {[
                    { label: 'LMS Version', value: 'EduAI LMS v2.1.0' },
                    { label: 'AI Engine', value: 'GPT-o4 (Connected)' },
                    { label: 'Database', value: 'PostgreSQL 15.2' },
                    { label: 'PHP/Node Version', value: 'Node.js 20.11 LTS' },
                    { label: 'Last Backup', value: 'April 12, 2026 03:00 AM' },
                    { label: 'Storage Used', value: '45.2 GB / 500 GB' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !addLoading && setShowAddUser(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowAddUser(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            {addError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{addError}</p>}

            <div className="grid grid-cols-2 gap-3">
              {([
                { field: 'name',        label: 'Full Name',    type: 'text',     col: 2 },
                { field: 'email',       label: 'Email',        type: 'email',    col: 2 },
                { field: 'password',    label: 'Password',     type: 'password', col: 2 },
                { field: 'department',  label: 'Department',   type: 'text',     col: 1 },
                { field: 'institution', label: 'Institution',  type: 'text',     col: 1 },
                { field: 'country',     label: 'Country',      type: 'text',     col: 1 },
                { field: 'language',    label: 'Language',     type: 'text',     col: 1 },
              ] as {field: keyof typeof emptyForm; label: string; type: string; col: number}[]).map(({ field, label, type, col }) => (
                <div key={field} className={col === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input
                    type={type}
                    value={addForm[field]}
                    onChange={e => setAddForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder={label}
                    autoComplete="off"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddUser(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button
                disabled={!addForm.name || !addForm.email || !addForm.password || addLoading}
                onClick={async () => {
                  setAddLoading(true); setAddError('');
                  try {
                    const r = await usersApi.create({ ...addForm });
                    const created = r.data.data ?? r.data;
                    setUsers(prev => [created as UserRow, ...prev]);
                    setShowAddUser(false);
                    setAddForm(emptyForm);
                  } catch (e: unknown) {
                    const msg = (e as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Failed to create user.';
                    setAddError(msg);
                  } finally { setAddLoading(false); }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
