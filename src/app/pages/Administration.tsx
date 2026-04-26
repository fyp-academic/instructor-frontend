import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FolderOpen, Settings, Shield, Database, Bell, Search, MoreVertical, Edit, Trash2, UserPlus, Plus, X, Loader2, GraduationCap, Building2, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { usersApi, dashboardApi, collegesApi, degreeProgrammesApi } from '../services/api';

type AdminTab = 'users' | 'courses' | 'categories' | 'colleges' | 'degreeProgrammes' | 'system';

type UserRow = Record<string, unknown>;

const ROLES = ['student', 'instructor', 'admin'];

const emptyForm = { name: '', email: '', password: '', role: 'student', registration_number: '', department: '', institution: '', country: '', language: '' };

export default function Administration() {
  const { courses, deleteCourse, categories } = useApp();
  const { user, permissions, isAdmin, isInstructor, assignedProgrammes } = useAuth();
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

  // Colleges & degree programmes state
  const [colleges, setColleges] = useState<Array<{id: string; name: string; code: string; description?: string}>>([]);
  const [programmes, setProgrammes] = useState<Array<{id: string; name: string; code: string; college_id: string; college?: {name: string}}>>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeForm, setCollegeForm] = useState({ name: '', code: '', description: '' });
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [collegeError, setCollegeError] = useState('');

  const [showProgrammeModal, setShowProgrammeModal] = useState(false);
  const [programmeForm, setProgrammeForm] = useState({ name: '', code: '', college_id: '', description: '' });
  const [programmeLoading, setProgrammeLoading] = useState(false);
  const [programmeError, setProgrammeError] = useState('');

  // Degree programme action modals
  const [modalProgId, setModalProgId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'students' | 'courses' | 'instructors' | null>(null);
  const [modalData, setModalData] = useState<Array<Record<string, unknown>>>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [instructorIds, setInstructorIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Redirect if not admin or instructor
  useEffect(() => {
    if (!user || (!isAdmin && !isInstructor)) {
      navigate('/dashboard');
      return;
    }
  }, [user, isAdmin, isInstructor, navigate]);

  useEffect(() => {
    // Use unified dashboard for all roles
    dashboardApi.getDashboard().then(r => {
      const data = r.data ?? {};
      setAdminStats(data.stats ?? {});
    }).catch(() => {});

    // Fetch users list (role-based filtering happens on backend)
    if (permissions?.can_view_students) {
      usersApi.list().then(r => {
        const data = r.data.data ?? r.data ?? [];
        setUsers(data);
      }).catch(() => {});
    }

    // Only load colleges if admin
    if (isAdmin) {
      loadCollegesAndProgrammes();
    }
  }, [permissions, isAdmin]);

  const loadCollegesAndProgrammes = async () => {
    setLoadingData(true);
    try {
      const [cRes, pRes] = await Promise.all([
        collegesApi.list(),
        degreeProgrammesApi.list(),
      ]);
      setColleges(cRes.data.data ?? []);
      setProgrammes(pRes.data.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

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

  // Filter tabs based on role permissions
  type PermissionKey = 'can_manage_colleges' | 'can_manage_degree_programmes' | 'can_manage_courses' | 'can_manage_categories' | 'can_manage_instructors' | 'can_manage_students' | 'can_view_students';

  const allTabs: { id: AdminTab; label: string; icon: React.ElementType; requiredPermission?: PermissionKey }[] = [
    { id: 'users', label: isAdmin ? 'All Users' : 'My Students', icon: Users, requiredPermission: 'can_view_students' },
    { id: 'courses', label: isAdmin ? 'All Courses' : 'My Courses', icon: BookOpen },
    { id: 'categories', label: 'Categories', icon: FolderOpen, requiredPermission: 'can_manage_categories' },
    { id: 'colleges', label: 'Colleges', icon: Building2, requiredPermission: 'can_manage_colleges' },
    { id: 'degreeProgrammes', label: 'Degree Programmes', icon: GraduationCap, requiredPermission: 'can_manage_degree_programmes' },
    { id: 'system', label: 'System', icon: Settings, requiredPermission: 'can_manage_colleges' },
  ];

  const tabs = allTabs.filter(tab => {
    if (!tab.requiredPermission) return true;
    return permissions?.[tab.requiredPermission] ?? false;
  });

  return (
    <div className="space-y-6" onClick={() => setMenuOpenId(null)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Administration' : 'Programme Management'}
          </h1>
          <p className="text-sm text-gray-500">
            {isAdmin
              ? 'Manage users, courses, categories, and system settings'
              : `Manage students and courses for your assigned programme${assignedProgrammes.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${isAdmin ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-indigo-50 border border-indigo-200 text-indigo-700'}`}>
          {isAdmin ? <Shield className="w-4 h-4 text-amber-600" /> : <GraduationCap className="w-4 h-4 text-indigo-600" />}
          {isAdmin ? 'Admin Mode' : 'Instructor Mode'}
        </div>
      </div>

      {/* Overview stats - role-based */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(isAdmin ? (
          // Admin sees all stats
          [
            { label: 'Total Users',       value: Number(adminStats.total_users       ?? users.length),                              icon: Users,    color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Active Courses',    value: Number(adminStats.active_courses    ?? courses.filter(c => c.status === 'active').length), icon: BookOpen, color: 'text-green-600 bg-green-50'  },
            { label: 'Colleges',          value: Number(adminStats.total_colleges    ?? colleges.length),                             icon: Building2, color: 'text-amber-600 bg-amber-50'  },
            { label: 'Degree Programmes', value: Number(adminStats.total_degree_programmes ?? programmes.length),                      icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
          ]
        ) : (
          // Instructor sees programme-specific stats
          [
            { label: 'My Students',       value: Number(adminStats.total_students ?? users.length),                                 icon: Users,    color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Active Courses',    value: Number(adminStats.active_courses ?? courses.filter(c => c.status === 'active').length), icon: BookOpen, color: 'text-green-600 bg-green-50'  },
            { label: 'Assigned Programmes', value: Number(adminStats.assigned_programmes ?? assignedProgrammes.length),               icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
            { label: 'Total Enrollments', value: Number(adminStats.total_enrollments ?? 0),                                         icon: Users,    color: 'text-blue-600 bg-blue-50' },
          ]
        )).map(stat => (
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Reg. No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Programme</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No users found. Use "Add User" to create accounts.</td></tr>
                    ) : filteredUsers.slice(0, 10).map((user, ui) => {
                      const uid     = String(user.id ?? ui);
                      const uname   = String(user.name ?? '');
                      const uemail  = String(user.email ?? '');
                      const urole   = String(user.role ?? 'student');
                      const ureg    = String(user.registration_number ?? '');
                      const uprog   = String((user.degree_programme as {name?: string})?.name ?? user.degree_programme_id ?? '—');
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
                          <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{ureg || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{uprog}</td>
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

          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setCollegeForm({ name: '', code: '', description: '' }); setCollegeError(''); setShowCollegeModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> Add College
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Description</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {colleges.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No colleges found. Use "Add College" to create one.</td></tr>
                    ) : colleges.map(college => (
                      <tr key={college.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{college.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{college.code}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{college.description || '—'}</td>
                        <td className="px-4 py-3">
                          <button onClick={async () => {
                            if (confirm(`Delete college "${college.name}"?`)) {
                              try { await collegesApi.delete(college.id); setColleges(prev => prev.filter(c => c.id !== college.id)); } catch {}
                            }
                          }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Degree Programmes Tab */}
          {activeTab === 'degreeProgrammes' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setProgrammeForm({ name: '', code: '', college_id: colleges[0]?.id ?? '', description: '' }); setProgrammeError(''); setShowProgrammeModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> Add Degree Programme
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">College</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {programmes.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No degree programmes found. Use "Add Degree Programme" to create one.</td></tr>
                    ) : programmes.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.code}</td>
                        <td className="px-4 py-3 text-gray-500">{p.college?.name ?? colleges.find(c => c.id === p.college_id)?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                setModalProgId(p.id);
                                setModalType('students');
                                setModalLoading(true);
                                try {
                                  const r = await degreeProgrammesApi.students(p.id);
                                  setModalData(r.data.data ?? []);
                                } catch { setModalData([]); }
                                finally { setModalLoading(false); }
                              }}
                              className="text-[11px] px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium"
                            >
                              Students
                            </button>
                            <button
                              onClick={async () => {
                                setModalProgId(p.id);
                                setModalType('courses');
                                setModalLoading(true);
                                try {
                                  const r = await degreeProgrammesApi.courses(p.id);
                                  setModalData(r.data.data ?? []);
                                } catch { setModalData([]); }
                                finally { setModalLoading(false); }
                              }}
                              className="text-[11px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                            >
                              Courses
                            </button>
                            <button
                              onClick={async () => {
                                setModalProgId(p.id);
                                setModalType('instructors');
                                setInstructorIds([]);
                                setModalLoading(true);
                                try {
                                  const res = await degreeProgrammesApi.show(p.id);
                                  const instructors = res.data.data?.instructors ?? res.data.instructors ?? [];
                                  setInstructorIds(instructors.map((inst: any) => String(inst.id ?? inst)));
                                } catch { /* ignore */ }
                                finally { setModalLoading(false); }
                              }}
                              className="text-[11px] px-2 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
                            >
                              Instructors
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={async () => {
                            if (confirm(`Delete degree programme "${p.name}"?`)) {
                              try { await degreeProgrammesApi.delete(p.id); setProgrammes(prev => prev.filter(x => x.id !== p.id)); } catch {}
                            }
                          }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
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

      {/* Add College Modal */}
      {showCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !collegeLoading && setShowCollegeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add New College</h2>
              <button onClick={() => setShowCollegeModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            {collegeError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{collegeError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                <input type="text" value={collegeForm.name} onChange={e => setCollegeForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g., College of Informatics and Virtual Education" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Code</label>
                <input type="text" value={collegeForm.code} onChange={e => setCollegeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g., CIVE" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <input type="text" value={collegeForm.description} onChange={e => setCollegeForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Optional description" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCollegeModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button
                disabled={!collegeForm.name || !collegeForm.code || collegeLoading}
                onClick={async () => {
                  setCollegeLoading(true); setCollegeError('');
                  try {
                    const r = await collegesApi.create(collegeForm);
                    const created = r.data.data ?? r.data;
                    setColleges(prev => [created, ...prev]);
                    setShowCollegeModal(false);
                    setCollegeForm({ name: '', code: '', description: '' });
                  } catch (e: unknown) {
                    const msg = (e as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Failed to create college.';
                    setCollegeError(msg);
                  } finally { setCollegeLoading(false); }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {collegeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create College
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Degree Programme Action Modal */}
      {modalType && modalProgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setModalType(null); setModalProgId(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {modalType === 'students' && 'Students'}
                {modalType === 'courses' && 'Courses'}
                {modalType === 'instructors' && 'Assign Instructors'}
                {' — '}
                {programmes.find(p => p.id === modalProgId)?.name}
              </h2>
              <button onClick={() => { setModalType(null); setModalProgId(null); }} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            {modalLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : (
              <>
                {modalType === 'instructors' ? (
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                      {users.filter(u => String(u.role) === 'instructor').length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">No instructors found.</p>
                      ) : (
                        users.filter(u => String(u.role) === 'instructor').map(inst => (
                          <label key={String(inst.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                            <input
                              type="checkbox"
                              checked={instructorIds.includes(String(inst.id))}
                              onChange={e => {
                                const id = String(inst.id);
                                setInstructorIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                              }}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{String(inst.name)}</span>
                            <span className="text-xs text-gray-400">{String(inst.email)}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setModalType(null); setModalProgId(null); }}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={assignLoading}
                        onClick={async () => {
                          setAssignLoading(true);
                          try {
                            await degreeProgrammesApi.assignInstructors(modalProgId, instructorIds);
                            setModalType(null); setModalProgId(null);
                          } catch {
                            alert('Failed to assign instructors.');
                          } finally { setAssignLoading(false); }
                        }}
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                      >
                        {assignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Assign Selected
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                            {modalType === 'students' ? 'Name' : 'Course'}
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                            {modalType === 'students' ? 'Email' : 'Instructor'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {modalData.length === 0 ? (
                          <tr><td colSpan={2} className="px-4 py-6 text-center text-sm text-gray-400">No {modalType} found.</td></tr>
                        ) : modalData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {modalType === 'students' ? String(item.name ?? '') : String(item.name ?? item.title ?? '')}
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                              {modalType === 'students' ? String(item.email ?? '') : String(item.instructor_name ?? item.instructor ?? '')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Degree Programme Modal */}
      {showProgrammeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !programmeLoading && setShowProgrammeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add Degree Programme</h2>
              <button onClick={() => setShowProgrammeModal(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            {programmeError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{programmeError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                <input type="text" value={programmeForm.name} onChange={e => setProgrammeForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g., Bachelor of Science in Computer Science" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Code</label>
                <input type="text" value={programmeForm.code} onChange={e => setProgrammeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g., CS" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">College</label>
                <select
                  value={programmeForm.college_id}
                  onChange={e => setProgrammeForm(p => ({ ...p, college_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">Select a college</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <input type="text" value={programmeForm.description} onChange={e => setProgrammeForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Optional description" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowProgrammeModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button
                disabled={!programmeForm.name || !programmeForm.code || !programmeForm.college_id || programmeLoading}
                onClick={async () => {
                  setProgrammeLoading(true); setProgrammeError('');
                  try {
                    const r = await degreeProgrammesApi.create(programmeForm);
                    const created = r.data.data ?? r.data;
                    setProgrammes(prev => [created, ...prev]);
                    setShowProgrammeModal(false);
                    setProgrammeForm({ name: '', code: '', college_id: colleges[0]?.id ?? '', description: '' });
                  } catch (e: unknown) {
                    const msg = (e as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Failed to create degree programme.';
                    setProgrammeError(msg);
                  } finally { setProgrammeLoading(false); }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {programmeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Programme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
