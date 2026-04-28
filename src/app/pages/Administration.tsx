import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FolderOpen, Settings, Shield, Database, Bell, Search, MoreVertical, Edit, Trash2, UserPlus, Plus, X, Loader2, GraduationCap, Building2, Lock, Briefcase, Award, MapPin, Calendar, Phone, CreditCard, User, MessageSquare, AlertTriangle, Unlock, Eye, CheckCircle, XCircle, Flag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { usersApi, dashboardApi, collegesApi, degreeProgrammesApi, authApi, chatModerationApi, instructorsApi } from '../services/api';

type AdminTab = 'users' | 'courses' | 'categories' | 'colleges' | 'degreeProgrammes' | 'chatModeration' | 'system';

type UserRow = Record<string, unknown>;

interface ChatStats {
  reports?: {
    total?: number;
    pending?: number;
    resolved?: number;
  };
  blocked_users?: number;
}

// Available roles based on user type
const getAvailableRoles = (isAdmin: boolean) => isAdmin
  ? ['student', 'instructor', 'admin']
  : ['student']; // Instructors can only add students

// Empty form for student registration
const emptyStudentForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  registration_number: '',
  collegeId: '',
  degree_programme_id: '',
  gender: '',
  phone_number: '',
};

// Empty form for instructor registration
const emptyInstructorForm = {
  name: '',
  email: '',
  password: '',
  role: 'instructor',
  // Personal Information
  gender: '',
  date_of_birth: '',
  nationality: '',
  phone_number: '',
  national_id: '',
  // Employment Information
  staff_id: '',
  employment_type: 'full-time',
  academic_rank: '',
  college_id: '',
  date_of_employment: '',
  // Academic Assignment
  assigned_programme_ids: [] as string[],
  // Qualification Details
  highest_qualification: '',
  field_of_specialization: '',
  awarding_institution: '',
  year_of_graduation: '',
  // Additional
  bio: '',
  office_location: '',
  office_hours: '',
  account_status: 'active',
};

export default function Administration() {
  const { courses, deleteCourse, categories: rawCategories } = useApp();
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const { user, permissions, isAdmin, isInstructor, assignedProgrammes } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers]         = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<Record<string, unknown>>({});

  const [showAddUser, setShowAddUser]   = useState(false);
  const [addFormRole, setAddFormRole]   = useState<'student' | 'instructor' | 'admin'>('student');
  const [addForm, setAddForm]           = useState<typeof emptyStudentForm | typeof emptyInstructorForm>(emptyStudentForm);
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState('');
  const [parsedReg, setParsedReg]       = useState<{
    nationality?: string;
    flag?: string;
    region?: string;
    registration_year?: number;
    education_level?: string;
    year_of_study?: number;
  } | null>(null);
  const [parsingReg, setParsingReg]     = useState(false);

  // Edit user modal state
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Colleges & degree programmes state
  const [colleges, setColleges] = useState<Array<{id: string; name: string; code: string; description?: string}>>([]);
  const [programmes, setProgrammes] = useState<Array<{id: string; name: string; code: string; college_id: string; college?: {name: string}}>>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeForm, setCollegeForm] = useState({ name: '', code: '', description: '' });
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [collegeError, setCollegeError] = useState('');

  // Pagination state
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 20;
  const [collegePage, setCollegePage] = useState(1);
  const collegesPerPage = 20;
  const [programmePage, setProgrammePage] = useState(1);
  const programmesPerPage = 20;

  const [showProgrammeModal, setShowProgrammeModal] = useState(false);
  const [programmeForm, setProgrammeForm] = useState({ name: '', code: '', college_id: '', description: '', duration_years: 4 });
  const [programmeLoading, setProgrammeLoading] = useState(false);
  const [programmeError, setProgrammeError] = useState('');

  // Degree programme action modals
  const [modalProgId, setModalProgId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'students' | 'courses' | 'instructors' | null>(null);
  const [modalData, setModalData] = useState<Array<Record<string, unknown>>>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [instructorIds, setInstructorIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Chat moderation state
  const [chatStats, setChatStats] = useState<ChatStats>({});
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
  const [conversations, setConversations] = useState<Array<Record<string, unknown>>>([]);
  const [blockedUsers, setBlockedUsers] = useState<Array<Record<string, unknown>>>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Record<string, unknown> | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState('none');

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

    // Load colleges if admin or instructor (needed for Add User)
    if (isAdmin || isInstructor) {
      loadCollegesAndProgrammes();
    }
  }, [permissions, isAdmin]);

  // Load chat moderation data when tab is active
  useEffect(() => {
    if (activeTab !== 'chatModeration') return;

    const loadChatModerationData = async () => {
      setReportsLoading(true);
      try {
        // Load statistics
        const statsRes = await chatModerationApi.statistics();
        setChatStats((statsRes.data?.statistics ?? {}) as ChatStats);

        // Load reports
        const reportsRes = await chatModerationApi.reports({ status: reportFilter });
        setReports(reportsRes.data?.data ?? []);

        // Load conversations
        const convRes = await chatModerationApi.conversations();
        setConversations(convRes.data?.data ?? []);

        // Load blocked users
        const blockedRes = await chatModerationApi.blockedUsers();
        setBlockedUsers(blockedRes.data?.data ?? []);
      } catch (err) {
        console.error('Failed to load chat moderation data:', err);
      } finally {
        setReportsLoading(false);
      }
    };

    loadChatModerationData();
  }, [activeTab, reportFilter]);

  const loadCollegesAndProgrammes = async () => {
    setLoadingData(true);
    try {
      const [cRes, pRes] = await Promise.all([
        collegesApi.list(),
        degreeProgrammesApi.list(),
      ]);
      const cData = cRes.data.data;
      const pData = pRes.data.data;
      setColleges(Array.isArray(cData) ? cData : []);
      setProgrammes(Array.isArray(pData) ? pData : []);
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  };

  // Delete user with confirmation
  const deleteUser = async (user: UserRow) => {
    const userId = String(user.id ?? '');
    const userRole = String(user.role ?? '');
    const userName = String(user.name ?? 'this user');

    if (!confirm(`Are you sure you want to delete "${userName}"?\n\nThis action cannot be undone.`)) {
      setMenuOpenId(null);
      return;
    }

    try {
      if (userRole === 'instructor') {
        await instructorsApi.delete(userId);
      } else {
        await usersApi.delete(userId);
      }
      // Remove from local state
      setUsers(prev => prev.filter(u => String(u.id ?? '') !== userId));
      setMenuOpenId(null);
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Failed to delete user.';
      alert(msg);
    }
  };

  // Open edit modal with user data
  const openEditModal = async (user: UserRow) => {
    const userId = String(user.id ?? '');
    const userRole = String(user.role ?? 'student') as 'student' | 'instructor' | 'admin';

    setEditUserId(userId);
    setEditUserRole(userRole);
    setEditError('');
    setMenuOpenId(null);

    // Load full user data based on role
    try {
      if (userRole === 'instructor') {
        // For instructors, we need to fetch their instructor profile
        const res = await instructorsApi.get(userId);
        const instructorData = res.data.data ?? {};
        const userData = instructorData.user ?? {};

        setEditForm({
          name: userData.name ?? '',
          email: userData.email ?? '',
          gender: userData.gender ?? '',
          phone_number: userData.phone_number ?? '',
          staff_id: instructorData.staff_id ?? '',
          college_id: instructorData.college_id ?? '',
          national_id: instructorData.national_id ?? '',
          employment_type: instructorData.employment_type ?? 'full-time',
          academic_rank: instructorData.academic_rank ?? '',
          date_of_employment: instructorData.date_of_employment ?? '',
          highest_qualification: instructorData.highest_qualification ?? '',
          field_of_specialization: instructorData.field_of_specialization ?? '',
          awarding_institution: instructorData.awarding_institution ?? '',
          year_of_graduation: instructorData.year_of_graduation ?? '',
          bio: instructorData.bio ?? '',
          office_location: instructorData.office_location ?? '',
          office_hours: instructorData.office_hours ?? '',
          assigned_programme_ids: (instructorData.degree_programmes ?? []).map((p: {id: string}) => p.id),
        });
      } else {
        // For students and admins, use user data directly
        setEditForm({
          name: user.name ?? '',
          email: user.email ?? '',
          registration_number: user.registration_number ?? '',
          degree_programme_id: user.degree_programme_id ?? '',
          gender: user.gender ?? '',
          phone_number: user.phone_number ?? '',
          year_of_study: user.year_of_study ?? '',
          education_level: user.education_level ?? '',
          nationality: user.nationality ?? '',
        });
      }
      setShowEditUser(true);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setEditError('Failed to load user details for editing.');
    }
  };

  const filteredUsers = users.filter(u => {
    const name  = String(u.name ?? '').toLowerCase();
    const email = String(u.email ?? '').toLowerCase();
    const q     = userSearch.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  // Pagination calculations
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  const courseList = Array.isArray(courses) ? courses : [];
  const filteredCourses = courseList.filter(c => {
    const c2 = c as unknown as Record<string, unknown>;
    const n  = String(c2.name ?? c2.title ?? '').toLowerCase();
    const sn = String(c2.shortName ?? c2.short_name ?? '').toLowerCase();
    const q  = courseSearch.toLowerCase();
    return n.includes(q) || sn.includes(q);
  });

  // Colleges and Programmes pagination
  const totalCollegePages = Math.ceil(colleges.length / collegesPerPage);
  const paginatedColleges = colleges.slice((collegePage - 1) * collegesPerPage, collegePage * collegesPerPage);

  const totalProgrammePages = Math.ceil(programmes.length / programmesPerPage);
  const paginatedProgrammes = programmes.slice((programmePage - 1) * programmesPerPage, programmePage * programmesPerPage);

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
    { id: 'chatModeration', label: 'Chat Moderation', icon: MessageSquare },
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
            { label: 'Active Courses',    value: Number(adminStats.active_courses    ?? courseList.filter(c => c.status === 'active').length), icon: BookOpen, color: 'text-green-600 bg-green-50'  },
            { label: 'Colleges',          value: Number(adminStats.total_colleges    ?? colleges.length),                             icon: Building2, color: 'text-amber-600 bg-amber-50'  },
            { label: 'Degree Programmes', value: Number(adminStats.total_degree_programmes ?? programmes.length),                      icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
          ]
        ) : (
          // Instructor sees programme-specific stats
          [
            { label: 'My Students',       value: Number(adminStats.total_students ?? users.length),                                 icon: Users,    color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Active Courses',    value: Number(adminStats.active_courses ?? courseList.filter(c => c.status === 'active').length), icon: BookOpen, color: 'text-green-600 bg-green-50'  },
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
                  <input type="text" placeholder="Search users..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} className="bg-transparent text-sm outline-none flex-1" />
                </div>
                <button onClick={() => {
                  const defaultRole = isAdmin ? 'instructor' : 'student'; // Admins default to instructor, instructors can only add students
                  setAddFormRole(defaultRole);
                  setAddForm(defaultRole === 'instructor' ? emptyInstructorForm : emptyStudentForm);
                  setAddError('');
                  setParsedReg(null);
                  setShowAddUser(true);
                }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4" /> Add User
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Reg. No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Programme</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No users found. Use "Add User" to create accounts.</td></tr>
                      ) : paginatedUsers.map((user, ui) => {
                        const uid     = String(user.id ?? ui);
                        const uname   = String(user.name ?? '');
                        const uemail  = String(user.email ?? '');
                        const urole   = String(user.role ?? 'student');
                        const ureg    = String(user.registration_number ?? '');
                        const progId = user.degree_programme_id ?? '';
                        const progName = Array.isArray(programmes) ? programmes.find(p => p.id === progId)?.name : undefined;
                        const uprog   = progName ?? (progId ? progId.slice(0, 8) + '...' : '—');
                        const initials = uname.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <tr key={uid} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
                                <span className="font-medium text-gray-900 text-sm">{uname}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">{uemail}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[urole] ?? 'bg-gray-100 text-gray-600'}`}>{urole}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{ureg || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{uprog}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setMenuOpenId(menuOpenId === uid ? null : uid)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {menuOpenId === uid && (
                                  <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1">
                                    <button onClick={() => openEditModal(user)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Edit className="w-4 h-4 text-gray-400" />Edit</button>
                                    <button onClick={() => deleteUser(user)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
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

                {/* Pagination Controls */}
                {totalUserPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Showing {((userPage - 1) * usersPerPage) + 1} to {Math.min(userPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUserPage(p => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalUserPages <= 5) {
                            pageNum = i + 1;
                          } else if (userPage <= 3) {
                            pageNum = i + 1;
                          } else if (userPage >= totalUserPages - 2) {
                            pageNum = totalUserPages - 4 + i;
                          } else {
                            pageNum = userPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setUserPage(pageNum)}
                              className={`w-7 h-7 text-xs rounded ${
                                userPage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'border border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                        disabled={userPage === totalUserPages}
                        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Code</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Description</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {colleges.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No colleges found. Use "Add College" to create one.</td></tr>
                      ) : paginatedColleges.map(college => (
                        <tr key={college.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{college.name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{college.code}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{college.description || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
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

                {/* Pagination Controls */}
                {totalCollegePages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Showing {((collegePage - 1) * collegesPerPage) + 1} to {Math.min(collegePage * collegesPerPage, colleges.length)} of {colleges.length} colleges
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCollegePage(p => Math.max(1, p - 1))}
                        disabled={collegePage === 1}
                        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(5, totalCollegePages) }, (_, i) => {
                          let pageNum: number;
                          if (totalCollegePages <= 5) {
                            pageNum = i + 1;
                          } else if (collegePage <= 3) {
                            pageNum = i + 1;
                          } else if (collegePage >= totalCollegePages - 2) {
                            pageNum = totalCollegePages - 4 + i;
                          } else {
                            pageNum = collegePage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCollegePage(pageNum)}
                              className={`w-7 h-7 text-xs rounded ${
                                collegePage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'border border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCollegePage(p => Math.min(totalCollegePages, p + 1))}
                        disabled={collegePage === totalCollegePages}
                        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Degree Programmes Tab */}
          {activeTab === 'degreeProgrammes' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setProgrammeForm({ name: '', code: '', college_id: colleges[0]?.id ?? '', description: '', duration_years: 4 }); setProgrammeError(''); setShowProgrammeModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> Add Degree Programme
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Code</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">College</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Actions</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {programmes.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No degree programmes found. Use "Add Degree Programme" to create one.</td></tr>
                      ) : paginatedProgrammes.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">{p.code}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.college?.name ?? (Array.isArray(colleges) ? colleges.find(c => c.id === p.college_id)?.name : undefined) ?? '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  setModalProgId(p.id);
                                  setModalType('students');
                                  setModalLoading(true);
                                  try {
                                    const r = await degreeProgrammesApi.students(p.id);
                                    console.log('Students API response:', r.data);
                                    setModalData(r.data.data ?? []);
                                  } catch (e) {
                                    console.error('Students API error:', e);
                                    setModalData([]);
                                  }
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
                                    console.log('Courses API response:', r.data);
                                    setModalData(r.data.data ?? []);
                                  } catch (e) {
                                    console.error('Courses API error:', e);
                                    setModalData([]);
                                  }
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
                          <td className="px-4 py-3 whitespace-nowrap">
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

                {/* Pagination Controls */}
                {totalProgrammePages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Showing {((programmePage - 1) * programmesPerPage) + 1} to {Math.min(programmePage * programmesPerPage, programmes.length)} of {programmes.length} programmes
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setProgrammePage(p => Math.max(1, p - 1))}
                        disabled={programmePage === 1}
                        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(5, totalProgrammePages) }, (_, i) => {
                          let pageNum: number;
                          if (totalProgrammePages <= 5) {
                            pageNum = i + 1;
                          } else if (programmePage <= 3) {
                            pageNum = i + 1;
                          } else if (programmePage >= totalProgrammePages - 2) {
                            pageNum = totalProgrammePages - 4 + i;
                          } else {
                            pageNum = programmePage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setProgrammePage(pageNum)}
                              className={`w-7 h-7 text-xs rounded ${
                                programmePage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'border border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setProgrammePage(p => Math.min(totalProgrammePages, p + 1))}
                        disabled={programmePage === totalProgrammePages}
                        className="px-2 py-1 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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

          {/* Chat Moderation Tab */}
          {activeTab === 'chatModeration' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Reports', value: (chatStats.reports?.total as number) ?? 0, icon: Flag, color: 'bg-red-50 border-red-200 text-red-600' },
                  { label: 'Pending', value: (chatStats.reports?.pending as number) ?? 0, icon: AlertTriangle, color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
                  { label: 'Resolved', value: (chatStats.reports?.resolved as number) ?? 0, icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-600' },
                  { label: 'Blocked Users', value: (chatStats.blocked_users as number) ?? 0, icon: Lock, color: 'bg-gray-50 border-gray-200 text-gray-600' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.color} border rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <stat.icon className="w-5 h-5" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm mt-1 opacity-80">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Reports Section */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Reports
                  </h3>
                  <div className="flex gap-2">
                    {['pending', 'resolved', 'dismissed', 'all'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setReportFilter(filter)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                          reportFilter === filter
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {reportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Flag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No {reportFilter === 'all' ? '' : reportFilter} reports found</p>
                    </div>
                  ) : (
                    reports.map((report: Record<string, unknown>) => (
                      <div key={String(report.id)} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }}`}>
                                {String(report.status)}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(report.created_at as string).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 truncate">{String(report.reason)}</p>
                            <p className="text-sm text-gray-500 truncate">
                              Reporter: {String((report.reporter as Record<string, unknown>)?.name ?? 'Unknown')} ·
                              Reported: {String((report.reported_user as Record<string, unknown>)?.name ?? 'Unknown')}
                            </p>
                          </div>
                          <button
                            onClick={() => { setSelectedReport(report); setShowReportModal(true); }}
                            className="ml-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Blocked Users Section */}
              {blockedUsers.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Blocked Users ({blockedUsers.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {blockedUsers.map((blocked: Record<string, unknown>) => (
                      <div key={`${blocked.user_id}-${blocked.conversation_id}`} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {String((blocked.user as Record<string, unknown>)?.name ?? 'Unknown')}
                          </p>
                          <p className="text-sm text-gray-500">
                            in {String((blocked.conversation as Record<string, unknown>)?.title ?? 'Unknown chat')}
                          </p>
                        </div>
                        <button
                          onClick={() => chatModerationApi.unblockUser({
                            user_id: blocked.user_id as string,
                            conversation_id: blocked.conversation_id as string
                          }).then(() => {
                            chatModerationApi.blockedUsers().then(res => setBlockedUsers(res.data?.data ?? []));
                          })}
                          className="p-2 rounded-lg hover:bg-gray-100 text-green-600"
                          title="Unblock user"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations Section */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    All Conversations ({conversations.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {reportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No conversations found</p>
                    </div>
                  ) : (
                    conversations.map((conv: Record<string, unknown>) => (
                      <div key={String(conv.id)} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                conv.type === 'course' ? 'bg-blue-100 text-blue-700' :
                                conv.type === 'group' ? 'bg-green-100 text-green-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {String(conv.type || 'direct')}
                              </span>
                              <span className="text-xs text-gray-400">
                                {conv.created_at ? new Date(conv.created_at as string).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 truncate">{String(conv.title || 'Untitled Conversation')}</p>
                            <p className="text-sm text-gray-500">
                              {(conv.participants as Array<Record<string, unknown>>)?.length || 0} participants ·
                              {(conv.messages_count as number) || 0} messages
                            </p>
                            {conv.last_message && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                Last: {(conv.last_message as Record<string, { content?: string }>)?.content ?? 'No content'}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/chat/${conv.id}`)}
                            className="ml-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                            title="View conversation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Add User Modal - Role-Based Forms */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !addLoading && setShowAddUser(false)} />
          <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${addFormRole === 'instructor' ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-md'} p-6 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Add New {addFormRole === 'student' ? 'Student' : addFormRole === 'instructor' ? 'Instructor' : 'Admin'}
              </h2>
              <button onClick={() => setShowAddUser(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            {addError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{addError}</p>}

            {/* Role Selection - Only for Admins */}
            {isAdmin && (
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Role:</span>
                <div className="flex gap-2">
                  {getAvailableRoles(isAdmin).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setAddFormRole(role as typeof addFormRole);
                        setAddForm(role === 'instructor' ? emptyInstructorForm : emptyStudentForm);
                        setParsedReg(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        addFormRole === role
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STUDENT REGISTRATION FORM */}
            {addFormRole === 'student' && (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="student@example.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                    <select
                      value={(addForm as typeof emptyStudentForm).gender}
                      onChange={e => setAddForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={(addForm as typeof emptyStudentForm).phone_number}
                      onChange={e => setAddForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="e.g. +255 712 345 678"
                    />
                  </div>
                </div>

                {/* Registration Number with Parsing */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Registration Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={(addForm as typeof emptyStudentForm).registration_number}
                      onChange={async e => {
                        const val = e.target.value.toUpperCase();
                        setAddForm(prev => ({ ...prev, registration_number: val }));
                        if (/^[TKBRUZ]\d{2}-\d{2}-\d{5}$/.test(val)) {
                          setParsingReg(true);
                          try {
                            const r = await authApi.parseRegistration(val);
                            setParsedReg(r.data.data);
                            // Auto-set college/degree if needed
                          } catch {
                            setParsedReg(null);
                          } finally {
                            setParsingReg(false);
                          }
                        }
                      }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="T23-03-09759"
                    />
                    {parsingReg && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Format: XYY-LL-NNNNN (e.g., T23-03-09759)</p>

                  {/* Parsed Info Display */}
                  {parsedReg && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{parsedReg.flag}</span>
                        <span className="font-medium">{parsedReg.nationality}</span>
                        {parsedReg.region && <span className="text-gray-500">({parsedReg.region})</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <span>Year: {parsedReg.registration_year}</span>
                        <span>Level: {parsedReg.education_level}</span>
                        <span>Study Year: {parsedReg.year_of_study}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* College & Programme Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">College</label>
                    <select
                      value={(addForm as typeof emptyStudentForm).collegeId}
                      onChange={e => {
                        setAddForm(prev => ({ ...prev, collegeId: e.target.value, degree_programme_id: '' }));
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">Select College</option>
                      {colleges.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Degree Programme</label>
                    <select
                      value={(addForm as typeof emptyStudentForm).degree_programme_id}
                      onChange={e => setAddForm(prev => ({ ...prev, degree_programme_id: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      disabled={!(addForm as typeof emptyStudentForm).collegeId}
                    >
                      <option value="">Select Programme</option>
                      {programmes
                        .filter(p => p.college_id === (addForm as typeof emptyStudentForm).collegeId)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* INSTRUCTOR REGISTRATION FORM */}
            {addFormRole === 'instructor' && (
              <div className="space-y-6">
                {/* Section: System Access */}
                <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> System Access
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={addForm.email}
                        onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        placeholder="instructor@university.ac.tz"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        value={addForm.password}
                        onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        placeholder="Min 8 characters"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Personal Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={addForm.name}
                        onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={(addForm as typeof emptyInstructorForm).gender}
                        onChange={e => setAddForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={(addForm as typeof emptyInstructorForm).date_of_birth}
                        onChange={e => setAddForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).nationality}
                        onChange={e => setAddForm(prev => ({ ...prev, nationality: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Tanzanian"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={(addForm as typeof emptyInstructorForm).phone_number}
                        onChange={e => setAddForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="+255 XXX XXX XXX"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">National ID / Passport</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).national_id}
                        onChange={e => setAddForm(prev => ({ ...prev, national_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="ID Number"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Employment Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" /> Employment Information
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Staff ID *</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).staff_id}
                        onChange={e => setAddForm(prev => ({ ...prev, staff_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="e.g., STF-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Employment Type</label>
                      <select
                        value={(addForm as typeof emptyInstructorForm).employment_type}
                        onChange={e => setAddForm(prev => ({ ...prev, employment_type: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="visiting">Visiting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Academic Rank</label>
                      <select
                        value={(addForm as typeof emptyInstructorForm).academic_rank}
                        onChange={e => setAddForm(prev => ({ ...prev, academic_rank: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      >
                        <option value="">Select Rank</option>
                        <option value="tutorial_assistant">Tutorial Assistant</option>
                        <option value="graduate_assistant">Graduate Assistant</option>
                        <option value="assistant_lecturer">Assistant Lecturer</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="senior_lecturer">Senior Lecturer</option>
                        <option value="associate_professor">Associate Professor</option>
                        <option value="professor">Professor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">College *</label>
                      <select
                        value={(addForm as typeof emptyInstructorForm).college_id}
                        onChange={e => setAddForm(prev => ({ ...prev, college_id: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      >
                        <option value="">Select College</option>
                        {colleges.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date of Employment</label>
                      <input
                        type="date"
                        value={(addForm as typeof emptyInstructorForm).date_of_employment}
                        onChange={e => setAddForm(prev => ({ ...prev, date_of_employment: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Academic Assignment */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Academic Assignment
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Degree Programme(s)</label>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                      {programmes.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={(addForm as typeof emptyInstructorForm).assigned_programme_ids.includes(p.id)}
                            onChange={e => {
                              const current = (addForm as typeof emptyInstructorForm).assigned_programme_ids;
                              const updated = e.target.checked
                                ? [...current, p.id]
                                : current.filter(id => id !== p.id);
                              setAddForm(prev => ({ ...prev, assigned_programme_ids: updated }));
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{p.name}</span>
                          <span className="text-xs text-gray-400">({p.college?.name || 'No College'})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Qualification Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" /> Qualification Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Highest Qualification</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).highest_qualification}
                        onChange={e => setAddForm(prev => ({ ...prev, highest_qualification: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="e.g., PhD, MSc"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Field of Specialization</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).field_of_specialization}
                        onChange={e => setAddForm(prev => ({ ...prev, field_of_specialization: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Awarding Institution</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).awarding_institution}
                        onChange={e => setAddForm(prev => ({ ...prev, awarding_institution: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Year of Graduation</label>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={(addForm as typeof emptyInstructorForm).year_of_graduation}
                        onChange={e => setAddForm(prev => ({ ...prev, year_of_graduation: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Additional Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" /> Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bio / Short Description</label>
                      <textarea
                        value={(addForm as typeof emptyInstructorForm).bio}
                        onChange={e => setAddForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        rows={2}
                        placeholder="Brief description of expertise and experience"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Office Location</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).office_location}
                        onChange={e => setAddForm(prev => ({ ...prev, office_location: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Building, Room Number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Office Hours</label>
                      <input
                        type="text"
                        value={(addForm as typeof emptyInstructorForm).office_hours}
                        onChange={e => setAddForm(prev => ({ ...prev, office_hours: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="Mon-Fri 9:00-17:00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN REGISTRATION FORM */}
            {addFormRole === 'admin' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Admin Name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="admin@university.ac.tz"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Min 8 characters"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!addForm.name || !addForm.email || !addForm.password || addLoading}
                onClick={async () => {
                  setAddLoading(true); setAddError('');
                  try {
                    const payload = addFormRole === 'instructor'
                      ? { ...addForm, password_confirmation: addForm.password, assigned_programme_ids: (addForm as typeof emptyInstructorForm).assigned_programme_ids, auto_verify: true }
                      : { ...addForm, password_confirmation: addForm.password, degree_programme_id: (addForm as typeof emptyStudentForm).degree_programme_id, auto_verify: true };
                    const r = await authApi.register(payload);
                    const created = r.data.user ?? r.data;
                    setUsers(prev => [created as UserRow, ...prev]);
                    setShowAddUser(false);
                    setAddForm(addFormRole === 'instructor' ? emptyInstructorForm : emptyStudentForm);
                    setAddFormRole('student');
                    setParsedReg(null);
                  } catch (e: unknown) {
                    const msg = (e as {response?: {data?: {errors?: Record<string, string[]>; message?: string}}})?.response?.data?.errors
                      ? Object.values((e as {response?: {data?: {errors?: Record<string, string[]>}}}).response!.data!.errors!).flat().join(', ')
                      : (e as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Failed to create user.';
                    setAddError(msg);
                  } finally { setAddLoading(false); }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create {addFormRole.charAt(0).toUpperCase() + addFormRole.slice(1)}
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
                {(Array.isArray(programmes) ? programmes.find(p => p.id === modalProgId)?.name : undefined) ?? 'Unknown'}
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
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Duration (Years)</label>
                <input type="number" min={1} max={7} value={programmeForm.duration_years} onChange={e => setProgrammeForm(p => ({ ...p, duration_years: parseInt(e.target.value) || 4 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
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
                    setProgrammeForm({ name: '', code: '', college_id: colleges[0]?.id ?? '', description: '', duration_years: 4 });
                  } catch (e: unknown) {
                    const data = (e as {response?: {data?: Record<string, unknown>}})?.response?.data;
                    let msg = 'Failed to create degree programme.';
                    if (data?.errors && typeof data.errors === 'object') {
                      const errors = Object.entries(data.errors as Record<string, string[]>).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join('; ');
                      if (errors) msg = `Validation errors: ${errors}`;
                    } else if (data?.message) {
                      msg = String(data.message);
                    }
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

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Report Details</h2>
              <button onClick={() => setShowReportModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedReport.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {String(selectedReport.status)}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(selectedReport.created_at as string).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Reporter</p>
                  <p className="font-medium">{String((selectedReport.reporter as Record<string, unknown>)?.name ?? 'Unknown')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reported User</p>
                  <p className="font-medium">{String((selectedReport.reported_user as Record<string, unknown>)?.name ?? 'Unknown')}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Reason</p>
                <p className="font-medium">{String(selectedReport.reason)}</p>
              </div>

              {Boolean(selectedReport.description) && (
                <div>
                  <p className="text-gray-500 text-sm">Description</p>
                  <p className="text-sm">{String(selectedReport.description)}</p>
                </div>
              )}

                {Boolean((selectedReport.conversation as Record<string, unknown>)?.title) && (
                <div>
                  <p className="text-gray-500 text-sm">Conversation</p>
                  <p className="text-sm">{String((selectedReport.conversation as Record<string, unknown>)?.title)}</p>
                </div>
              )}

              {selectedReport.status === 'pending' && (
                <>
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Action
                    </label>
                    <select
                      value={resolutionAction}
                      onChange={(e) => setResolutionAction(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="none">No action</option>
                      <option value="warn">Send warning</option>
                      <option value="block_user">Block user from conversation</option>
                      <option value="lock_conversation">Lock conversation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add notes about this resolution..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        chatModerationApi.resolveReport(selectedReport.id as string, {
                          status: 'resolved',
                          action_taken: resolutionAction,
                          resolution_notes: resolutionNotes
                        }).then(() => {
                          setShowReportModal(false);
                          setResolutionNotes('');
                          setResolutionAction('none');
                          // Reload reports
                          chatModerationApi.reports({ status: reportFilter }).then(res => {
                            setReports(res.data?.data ?? []);
                          });
                          // Reload stats
                          chatModerationApi.statistics().then(res => {
                            setChatStats((res.data?.statistics ?? {}) as ChatStats);
                          });
                        });
                      }}
                      className="flex-1 py-2 px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Resolve
                    </button>
                    <button
                      onClick={() => {
                        chatModerationApi.resolveReport(selectedReport.id as string, {
                          status: 'dismissed',
                          resolution_notes: resolutionNotes
                        }).then(() => {
                          setShowReportModal(false);
                          setResolutionNotes('');
                          chatModerationApi.reports({ status: reportFilter }).then(res => {
                            setReports(res.data?.data ?? []);
                          });
                        });
                      }}
                      className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Dismiss
                    </button>
                  </div>
                </>
              )}

              {(selectedReport.status as string) !== 'pending' && (selectedReport.resolution_notes as string) && (
                <div className="border-t pt-4">
                  <p className="text-gray-500 text-sm">Resolution Notes</p>
                  <p className="text-sm">{String(selectedReport.resolution_notes)}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Resolved by {(selectedReport.resolver as {name?: string} | null)?.name ?? 'Unknown'} on {new Date(selectedReport.resolved_at as string).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !editLoading && setShowEditUser(false)} />
          <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${editUserRole === 'instructor' ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-md'} p-6 space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Edit {editUserRole === 'student' ? 'Student' : editUserRole === 'instructor' ? 'Instructor' : 'Admin'}
              </h2>
              <button onClick={() => setShowEditUser(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>}

            {/* STUDENT EDIT FORM */}
            {editUserRole === 'student' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                    <input type="text" value={String(editForm.name ?? '')} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input type="email" value={String(editForm.email ?? '')} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                    <select value={String(editForm.gender ?? '')} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                    <input type="tel" value={String(editForm.phone_number ?? '')} onChange={e => setEditForm(p => ({ ...p, phone_number: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="+255 712 345 678" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Registration Number</label>
                    <input type="text" value={String(editForm.registration_number ?? '')} onChange={e => setEditForm(p => ({ ...p, registration_number: e.target.value.toUpperCase() }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono" placeholder="T25-01-00001" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Year of Study</label>
                    <input type="number" min={1} max={7} value={Number(editForm.year_of_study ?? 1)} onChange={e => setEditForm(p => ({ ...p, year_of_study: parseInt(e.target.value) || 1 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Degree Programme</label>
                    <select value={String(editForm.degree_programme_id ?? '')} onChange={e => setEditForm(p => ({ ...p, degree_programme_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                      <option value="">Select Programme</option>
                      {Array.isArray(programmes) && programmes.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nationality</label>
                    <input type="text" value={String(editForm.nationality ?? '')} onChange={e => setEditForm(p => ({ ...p, nationality: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="e.g. Tanzania" />
                  </div>
                </div>
              </div>
            )}

            {/* INSTRUCTOR EDIT FORM */}
            {editUserRole === 'instructor' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-indigo-900 text-sm">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                      <input type="text" value={String(editForm.name ?? '')} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                      <input type="email" value={String(editForm.email ?? '')} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="email@udom.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Gender</label>
                      <select value={String(editForm.gender ?? '')} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                      <input type="tel" value={String(editForm.phone_number ?? '')} onChange={e => setEditForm(p => ({ ...p, phone_number: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="+255 712 345 678" />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-amber-900 text-sm">Employment Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Staff ID</label>
                      <input type="text" value={String(editForm.staff_id ?? '')} onChange={e => setEditForm(p => ({ ...p, staff_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono" placeholder="e.g. INS-001" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">College</label>
                      <select value={String(editForm.college_id ?? '')} onChange={e => setEditForm(p => ({ ...p, college_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">Select College</option>
                        {Array.isArray(colleges) && colleges.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Employment Type</label>
                      <select value={String(editForm.employment_type ?? 'full-time')} onChange={e => setEditForm(p => ({ ...p, employment_type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="visiting">Visiting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Academic Rank</label>
                      <select value={String(editForm.academic_rank ?? '')} onChange={e => setEditForm(p => ({ ...p, academic_rank: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">Select Rank</option>
                        <option value="tutorial_assistant">Tutorial Assistant</option>
                        <option value="graduate_assistant">Graduate Assistant</option>
                        <option value="assistant_lecturer">Assistant Lecturer</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="senior_lecturer">Senior Lecturer</option>
                        <option value="associate_professor">Associate Professor</option>
                        <option value="professor">Professor</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Employment</label>
                      <input type="date" value={String(editForm.date_of_employment ?? '')} onChange={e => setEditForm(p => ({ ...p, date_of_employment: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">National ID</label>
                      <input type="text" value={String(editForm.national_id ?? '')} onChange={e => setEditForm(p => ({ ...p, national_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. 123456789012" />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-green-900 text-sm">Qualifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Highest Qualification</label>
                      <input type="text" value={String(editForm.highest_qualification ?? '')} onChange={e => setEditForm(p => ({ ...p, highest_qualification: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. PhD in Computer Science" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Field of Specialization</label>
                      <input type="text" value={String(editForm.field_of_specialization ?? '')} onChange={e => setEditForm(p => ({ ...p, field_of_specialization: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. Artificial Intelligence" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Awarding Institution</label>
                      <input type="text" value={String(editForm.awarding_institution ?? '')} onChange={e => setEditForm(p => ({ ...p, awarding_institution: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. University of Dar es Salaam" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Year of Graduation</label>
                      <input type="number" min={1900} max={2100} value={Number(editForm.year_of_graduation ?? '') || ''} onChange={e => setEditForm(p => ({ ...p, year_of_graduation: parseInt(e.target.value) || '' }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 2020" />
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-purple-900 text-sm">Office & Contact</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Office Location</label>
                      <input type="text" value={String(editForm.office_location ?? '')} onChange={e => setEditForm(p => ({ ...p, office_location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="e.g. Block A, Room 101" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Office Hours</label>
                      <input type="text" value={String(editForm.office_hours ?? '')} onChange={e => setEditForm(p => ({ ...p, office_hours: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="e.g. Mon-Fri 9:00-12:00" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Bio & Programmes</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Bio</label>
                    <textarea value={String(editForm.bio ?? '')} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" placeholder="Brief professional biography..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Assigned Programmes</label>
                    <div className="border border-gray-200 rounded-lg p-3 bg-white max-h-40 overflow-y-auto">
                      {Array.isArray(programmes) && programmes.map(p => (
                        <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                          <input
                            type="checkbox"
                            checked={((editForm.assigned_programme_ids as string[]) || []).includes(p.id)}
                            onChange={e => {
                              const currentIds = (editForm.assigned_programme_ids as string[]) || [];
                              if (e.target.checked) {
                                setEditForm(prev => ({ ...prev, assigned_programme_ids: [...currentIds, p.id] }));
                              } else {
                                setEditForm(prev => ({ ...prev, assigned_programme_ids: currentIds.filter(id => id !== p.id) }));
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN EDIT FORM */}
            {editUserRole === 'admin' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  <input type="text" value={String(editForm.name ?? '')} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <input type="email" value={String(editForm.email ?? '')} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="admin@udom.com" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditUser(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={editLoading}
                onClick={async () => {
                  setEditLoading(true); setEditError('');
                  try {
                    if (editUserRole === 'instructor') {
                      // For instructors, use the instructor update endpoint
                      await instructorsApi.update(editUserId!, editForm);
                    } else {
                      // For students and admins, use the regular user update
                      await usersApi.update(editUserId!, editForm);
                    }
                    // Refresh users list
                    const res = await usersApi.list();
                    setUsers(res.data.data ?? []);
                    setShowEditUser(false);
                  } catch (e: unknown) {
                    const msg = (e as {response?: {data?: {message?: string}}})?.response?.data?.message ?? 'Failed to update user.';
                    setEditError(msg);
                  } finally { setEditLoading(false); }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
