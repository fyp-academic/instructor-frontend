import React, { useState } from 'react';
import { FolderPlus, Edit, Trash2, ChevronRight, ChevronDown, FolderOpen, Folder, Search, Plus, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category } from '../data/mockData';

export default function CategoryManagement() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['cat1', 'cat4']));
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentId: '', idNumber: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rootCategories = categories.filter(c => !c.parentId);
  const filtered = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
    : rootCategories;

  const getChildren = (parentId: string) => categories.filter(c => c.parentId === parentId);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', parentId: '', idNumber: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, description: cat.description, parentId: cat.parentId || '', idNumber: cat.idNumber });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Category name is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: form.name,
        description: form.description,
        parentId: form.parentId || undefined,
        idNumber: form.idNumber,
      });
    } else {
      const newCat: Category = {
        id: `cat_${Date.now()}`,
        name: form.name,
        description: form.description,
        parentId: form.parentId || undefined,
        idNumber: form.idNumber,
        courseCount: 0,
        childCount: 0,
      };
      addCategory(newCat);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
      alert('Cannot delete a category that has subcategories. Please delete or move subcategories first.');
      return;
    }
    if (confirm(`Delete category "${name}"?`)) {
      deleteCategory(id);
    }
  };

  const CategoryRow = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => {
    const children = getChildren(cat.id);
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = children.length > 0;

    return (
      <div>
        <div
          className={`flex items-center gap-3 py-3 px-4 hover:bg-gray-50 border-b border-gray-100 group transition-colors`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {/* Expand button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-5 h-5 flex-shrink-0" />
          )}

          {/* Folder icon */}
          {hasChildren
            ? (isExpanded ? <FolderOpen className="w-5 h-5 text-amber-500 flex-shrink-0" /> : <Folder className="w-5 h-5 text-amber-400 flex-shrink-0" />)
            : <Folder className="w-5 h-5 text-gray-300 flex-shrink-0" />
          }

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
              {cat.idNumber && (
                <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{cat.idNumber}</span>
              )}
              {cat.parentId && (
                <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">sub</span>
              )}
            </div>
            {cat.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.description}</p>}
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
            <span>{cat.courseCount} courses</span>
            {hasChildren && <span>{children.length} subcategories</span>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => { setForm({ name: '', description: '', parentId: cat.id, idNumber: '' }); setEditingCategory(null); setErrors({}); setShowModal(true); }}
              title="Add subcategory"
              className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && children.map(child => (
          <CategoryRow key={child.id} cat={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  // Stats
  const totalCourses = categories.reduce((sum, c) => sum + c.courseCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories · {totalCourses} total courses</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          <FolderPlus className="w-4 h-4" /> New Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Categories', value: categories.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Root Categories', value: rootCategories.length, color: 'bg-amber-50 text-amber-700' },
          { label: 'Total Courses', value: totalCourses, color: 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400"
        />
        {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>}
      </div>

      {/* Category tree */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category Name</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:block">Description</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden sm:block">Actions</span>
          </div>
        </div>

        {search ? (
          <div>
            {filtered.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 border-b border-gray-100 group">
                <Folder className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
                    {cat.parentId && <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">sub</span>}
                  </div>
                  <p className="text-xs text-gray-400">{cat.description}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No categories found</div>}
          </div>
        ) : (
          <div>
            {rootCategories.map(cat => <CategoryRow key={cat.id} cat={cat} />)}
            {categories.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No categories yet</p>
                <button onClick={openCreate} className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">Create your first category →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  className={`w-full border ${errors.name ? 'border-red-400' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category ID Number</label>
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))}
                  placeholder="e.g. CS001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Top-level category (no parent)</option>
                  {categories.filter(c => !editingCategory || c.id !== editingCategory.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe this category..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Check className="w-4 h-4" />
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
