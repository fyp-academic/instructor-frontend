import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, GraduationCap, BookOpen, Building2, FolderOpen, Layers,
  UserCog, Activity, ChevronRight, Clock, Bell, Shield, Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dashboardApi } from '../services/api';

interface RecentUser { id: string; name?: string; email?: string; role?: string; created_at?: string }
interface RecentCourse { id: string; name?: string; status?: string; instructor?: { name?: string } | string; instructor_name?: string }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { notifications, currentUser } = useApp();
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(r => setSnapshot(r.data.data ?? r.data))
      .catch(() => {});
  }, []);

  const s = (snapshot?.stats ?? {}) as Record<string, number>;
  const recentUsers   = (snapshot?.recent_users   as RecentUser[]   | undefined) ?? [];
  const recentCourses = (snapshot?.recent_courses as RecentCourse[] | undefined) ?? [];
  const recentNotifs  = notifications.slice(0, 5);

  const stats = [
    { label: 'Total Users',       value: s.total_users             ?? '—', icon: Users,        color: 'bg-indigo-500' },
    { label: 'Students',          value: s.total_students          ?? '—', icon: GraduationCap, color: 'bg-emerald-500' },
    { label: 'Instructors',       value: s.total_instructors       ?? '—', icon: UserCog,      color: 'bg-blue-500' },
    { label: 'Active Courses',    value: s.active_courses          ?? '—', icon: BookOpen,     color: 'bg-purple-500' },
    { label: 'Colleges',          value: s.total_colleges          ?? '—', icon: Building2,    color: 'bg-amber-500' },
    { label: 'Degree Programmes', value: s.total_degree_programmes ?? '—', icon: Layers,       color: 'bg-pink-500' },
    { label: 'Categories',        value: s.total_categories        ?? '—', icon: FolderOpen,   color: 'bg-teal-500' },
    { label: 'Total Enrollments', value: s.total_enrollments       ?? '—', icon: Activity,     color: 'bg-rose-500' },
  ];

  const roleBadge = (role?: string) => {
    if (role === 'admin') return 'bg-amber-100 text-amber-700';
    if (role === 'instructor') return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'draft') return 'bg-gray-100 text-gray-600';
    return 'bg-red-100 text-red-700';
  };

  const instructorName = (c: RecentCourse) =>
    typeof c.instructor === 'object' && c.instructor ? c.instructor.name : (c.instructor || c.instructor_name || 'Unassigned');

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div data-tour="dashboard-hero" className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Welcome back, {String(currentUser.name ?? 'Admin').split(' ')[0]}! 👋</h1>
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/15 px-2 py-0.5 rounded-full font-medium"><Shield className="w-3 h-3" /> Admin</span>
          </div>
          <p className="text-indigo-200 mt-1">Here's an overview of your platform today.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/administration')}
            className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Users className="w-4 h-4" /> Manage Users
          </button>
          <button
            onClick={() => navigate('/administration')}
            className="flex items-center gap-2 bg-indigo-700 text-white border border-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            <Settings className="w-4 h-4" /> Manage Courses
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-2 bg-indigo-700 text-white border border-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            <Bell className="w-4 h-4" /> View Logs
          </button>
        </div>
      </div>

      {/* Platform stats */}
      <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => navigate('/administration')}
            className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Users & Recent Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <button onClick={() => navigate('/administration')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.slice(0, 6).map(u => (
              <div
                key={u.id}
                onClick={() => navigate('/administration')}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(u.name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(u.created_at)}</span>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No recent users.</p>
            )}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Courses</h2>
            <button onClick={() => navigate('/administration')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentCourses.slice(0, 6).map(c => (
              <div
                key={c.id}
                onClick={() => navigate('/administration')}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{instructorName(c)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusBadge(c.status)}`}>{c.status}</span>
              </div>
            ))}
            {recentCourses.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No recent courses.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Logs / Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Logs & Notifications</h2>
          <button onClick={() => navigate('/notifications')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {recentNotifs.map(n => {
            const typeColors: Record<string, string> = {
              info: 'bg-blue-50 border-blue-200',
              warning: 'bg-amber-50 border-amber-200',
              success: 'bg-green-50 border-green-200',
              danger: 'bg-red-50 border-red-200',
            };
            const dotColors: Record<string, string> = {
              info: 'bg-blue-400', warning: 'bg-amber-400', success: 'bg-green-400', danger: 'bg-red-400',
            };
            return (
              <div key={n.id} className={`p-3 rounded-lg border ${typeColors[n.type] ?? 'bg-gray-50 border-gray-200'} ${!n.read ? 'opacity-100' : 'opacity-70'}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[n.type] ?? 'bg-gray-400'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.message}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{n.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {recentNotifs.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6 md:col-span-2">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
