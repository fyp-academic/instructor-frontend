import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen, Users, Activity, TrendingUp, Plus, FolderPlus,
  ChevronRight, Clock, Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dashboardApi } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FALLBACK_ENGAGEMENT = [
  { day: 'Mon', active: 0, submissions: 0 },
  { day: 'Tue', active: 0, submissions: 0 },
  { day: 'Wed', active: 0, submissions: 0 },
  { day: 'Thu', active: 0, submissions: 0 },
  { day: 'Fri', active: 0, submissions: 0 },
  { day: 'Sat', active: 0, submissions: 0 },
  { day: 'Sun', active: 0, submissions: 0 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { courses, notifications, currentUser } = useApp();
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    dashboardApi.instructorSnapshot()
      .then(r => setSnapshot(r.data.data ?? r.data))
      .catch(() => {});
  }, []);

  const engagementData: { day: string; active: number; submissions: number }[] =
    (snapshot?.weekly_engagement as typeof FALLBACK_ENGAGEMENT | undefined) ?? FALLBACK_ENGAGEMENT;

  const totalStudents = (snapshot?.total_students as number | undefined) ??
    courses.reduce((s, c) => s + ((c as unknown as Record<string, number>).enrolled_students ?? (c as unknown as Record<string, number>).enrolledStudents ?? 0), 0);
  const activeCourses = (snapshot?.active_courses as number | undefined) ??
    courses.filter(c => (c as unknown as Record<string, string>).status === 'active').length;
  const totalActivities = (snapshot?.total_activities as number | undefined) ?? 0;
  const completionRate  = (snapshot?.completion_rate as string | undefined) ?? '—';

  const recentCourses = courses.slice(0, 4);
  const recentNotifs  = notifications.slice(0, 4);

  const quickStats = [
    { label: 'Upcoming Deadlines', value: (snapshot?.upcoming_deadlines as number | undefined) ?? '—', color: 'text-red-600 bg-red-50'       },
    { label: 'Pending Grading',    value: (snapshot?.pending_grading    as number | undefined) ?? '—', color: 'text-amber-600 bg-amber-50'   },
    { label: 'New Enrollments',    value: (snapshot?.new_enrollments    as number | undefined) ?? '—', color: 'text-green-600 bg-green-50'   },
    { label: 'Forum Posts',        value: (snapshot?.forum_posts        as number | undefined) ?? '—', color: 'text-indigo-600 bg-indigo-50' },
  ];

  const stats = [
    { label: 'Total Courses',      value: courses?.length ?? 0,            sub: `${activeCourses} active`,          icon: BookOpen,  color: 'bg-indigo-500' },
    { label: 'Enrolled Students',  value: totalStudents,                 sub: 'Across all courses',               icon: Users,     color: 'bg-emerald-500' },
    { label: 'Total Activities',   value: totalActivities,               sub: 'Quizzes, assignments & more',       icon: Activity,  color: 'bg-purple-500' },
    { label: 'Completion Rate',    value: completionRate,                sub: 'Average across all courses',        icon: TrendingUp,color: 'bg-amber-500' },
  ];

  const activityFeed = notifications.slice(0, 5).map(n => ({
    text:  (n as unknown as Record<string, string>).title   ?? '',
    time:  (n as unknown as Record<string, string>).timestamp ?? '',
    color: 'text-indigo-500',
    icon:  Bell,
  }));

  const getStatusBadge = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'draft') return 'bg-gray-100 text-gray-600';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {String(currentUser.name ?? 'there').split(' ')[0]}! 👋</h1>
          <p className="text-indigo-200 mt-1">Here's what's happening with your courses today.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/courses/create')}
            className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center gap-2 bg-indigo-700 text-white border border-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Weekly Engagement</h2>
              <p className="text-sm text-gray-500">Active students & submissions this week</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area key="active" type="monotone" dataKey="active" name="Active Students" stroke="#6366f1" fill="url(#colorActive)" strokeWidth={2} />
              <Area key="submissions" type="monotone" dataKey="submissions" name="Submissions" stroke="#10b981" fill="url(#colorSub)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <item.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Courses & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Courses</h2>
            <button onClick={() => navigate('/courses')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentCourses.map(course => (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">{course.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusBadge((course as unknown as Record<string,string>).status ?? '')}`}>{(course as unknown as Record<string,string>).status}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{(course as unknown as Record<string,number>).enrolled_students ?? (course as unknown as Record<string,number>).enrolledStudents ?? 0}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <button onClick={() => navigate('/notifications')} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
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
                <div key={n.id} className={`p-3 rounded-lg border ${typeColors[n.type]} ${!n.read ? 'opacity-100' : 'opacity-70'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[n.type]}`} />
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
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map(item => (
          <div key={item.label} className={`${item.color} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs font-medium mt-1 opacity-80">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}