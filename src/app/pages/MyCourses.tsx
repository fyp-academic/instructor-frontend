import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, BookOpen, Users, Grid, List, MoreVertical, Edit, Trash2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MyCourses() {
  const navigate = useNavigate();
  const { courses, deleteCourse, updateCourse, categories } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const cr = c as unknown as Record<string, unknown>;
      const shortName = String(cr.short_name ?? cr.shortName ?? '');
      const instructor = String(cr.instructor_name ?? cr.instructor ?? '');
      const categoryId = String(cr.category_id ?? cr.categoryId ?? '');
      const matchSearch = (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        shortName.toLowerCase().includes(search.toLowerCase()) ||
        instructor.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || (cr.status as string) === statusFilter;
      const matchCat = categoryFilter === 'all' || categoryId === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [courses, search, statusFilter, categoryFilter]);

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'draft') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-red-100 text-red-600 border-red-200';
  };

  const CourseCard = ({ course }: { course: Record<string, unknown> }) => {
    const shortName    = String(course.short_name   ?? course.shortName   ?? '');
    const instructor   = String(course.instructor_name ?? course.instructor ?? '');
    const categoryName = String(course.category_name ?? course.categoryName ?? '');
    const enrolled     = Number(course.enrolled_students ?? course.enrolledStudents ?? 0);
    const sections     = (course.sections as unknown[]) ?? [];
    const visibility   = String(course.visibility ?? 'shown');
    const status       = String(course.status ?? 'draft');
    return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all group overflow-hidden">
      {/* Color strip */}
      <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div
            onClick={() => navigate(`/courses/${course.id}`)}
            className="flex-1 cursor-pointer min-w-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] border px-2 py-0.5 rounded-full font-medium ${getStatusColor(status)}`}>
                {status}
              </span>
              {visibility === 'hidden' && (
                <EyeOff className="w-3 h-3 text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-indigo-700 line-clamp-2">{String(course.name ?? '')}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{shortName}</p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === String(course.id) ? null : String(course.id)); }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpenId === String(course.id) && (
              <div className="absolute right-0 top-6 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1">
                <button onClick={() => { navigate(`/courses/${String(course.id)}`); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Eye className="w-4 h-4 text-gray-400" /> View
                </button>
                <button onClick={() => { navigate(`/courses/${String(course.id)}?tab=settings`); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Edit className="w-4 h-4 text-gray-400" /> Settings
                </button>
                <button
                  onClick={() => { updateCourse(String(course.id ?? ''), { visibility: visibility === 'shown' ? 'hidden' : 'shown' } as never); setMenuOpenId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {visibility === 'shown' ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  {visibility === 'shown' ? 'Hide' : 'Show'}
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { if (confirm('Delete this course?')) { deleteCourse(String(course.id ?? '')); setMenuOpenId(null); } }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{String(course.description ?? '')}</p>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{enrolled}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{sections.length} sections</span>
          </div>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{categoryName}</span>
        </div>
        <div className="mt-2">
          <p className="text-xs text-gray-400">Instructor: <span className="text-gray-600">{instructor}</span></p>
        </div>
      </div>
    </div>
    );
  };

  const CourseRow = ({ course }: { course: Record<string, unknown> }) => {
    const shortName    = String(course.short_name   ?? course.shortName   ?? '');
    const instructor   = String(course.instructor_name ?? course.instructor ?? '');
    const categoryName = String(course.category_name ?? course.categoryName ?? '');
    const enrolled     = Number(course.enrolled_students ?? course.enrolledStudents ?? 0);
    const sections     = (course.sections as unknown[]) ?? [];
    const status       = String(course.status ?? 'draft');
    const startDate    = String(course.start_date ?? course.startDate ?? '');
    return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4 group">
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 truncate">{String(course.name ?? '')}</h3>
          <span className={`text-[11px] border px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusColor(status)}`}>{status}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{shortName} · {categoryName} · {instructor}</p>
      </div>
      <div className="hidden md:flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{enrolled} students</span>
        <span>{sections.length} sections</span>
        <span className="text-gray-400">{startDate}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => navigate(`/courses/${String(course.id ?? '')}`)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100">Open</button>
        <button onClick={() => deleteCourse(String(course.id ?? ''))} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6" onClick={() => setMenuOpenId(null)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {courses.length} courses</p>
        </div>
        <button
          onClick={() => navigate('/courses/create')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Course grid/list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-medium">No courses found</h3>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          <button
            onClick={() => navigate('/courses/create')}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Create First Course
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => <CourseCard key={String(course.id)} course={course as unknown as Record<string,unknown>} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(course => <CourseRow key={String(course.id)} course={course as unknown as Record<string,unknown>} />)}
        </div>
      )}
    </div>
  );
}
