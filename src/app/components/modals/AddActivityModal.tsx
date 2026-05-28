import React, { useState } from 'react';
import {
  X, Search, FileText, HelpCircle, MessageSquare, Link, File, Package, Users, Hash, Layout, Layers,
  ClipboardList, Monitor, BookOpen, ListChecks, BarChart3, Award, Database as DatabaseIcon,
  MessageCircle, Folder, BookMarked, Box, GraduationCap, Play, Info, Star
} from 'lucide-react';
import { ActivityType, activityTypeInfo } from '../../data/mockData';

interface AddActivityModalProps {
  onClose: () => void;
  onSelect: (type: ActivityType | 'subsection') => void;
}

const activityIcons: Record<string, React.ElementType> = {
  quiz: HelpCircle, assignment: FileText, forum: MessageSquare, workshop: Users,
  h5p: Layers, scorm: Package, url: Link, file: File, page: Layout, label: Hash,
  attendance: ClipboardList, bigbluebutton: Monitor, book: BookOpen,
  checklist: ListChecks, choice: BarChart3, certificate: Award, database: DatabaseIcon,
  feedback: MessageCircle, folder: Folder, glossary: BookMarked,
  ims_content_package: Box, lesson: GraduationCap, video: Play,
};

const categories: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'administration', label: 'Administration' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'communication', label: 'Communication' },
  { id: 'resources', label: 'Resources' },
  { id: 'interactive', label: 'Interactive content' },
];

const categoryMap: Record<string, string[]> = {
  recommended: ['quiz', 'assignment', 'forum', 'page', 'url'],
  administration: ['attendance', 'certificate', 'label', 'checklist'],
  assessment: ['quiz', 'assignment', 'workshop', 'choice', 'h5p', 'feedback'],
  collaboration: ['forum', 'workshop', 'database', 'glossary'],
  communication: ['forum', 'bigbluebutton', 'feedback', 'announcement'],
  resources: ['file', 'folder', 'url', 'page', 'book', 'video', 'ims_content_package', 'scorm'],
  interactive: ['h5p', 'scorm', 'lesson', 'choice', 'lesson'],
};

export function AddActivityModal({ onClose, onSelect }: AddActivityModalProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'activity' | 'subsection'>('activity');
  const [activeCategory, setActiveCategory] = useState('all');
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const activities: ActivityType[] = Object.keys(activityTypeInfo) as ActivityType[];

  const filtered = activities.filter(a => {
    const info = activityTypeInfo[a];
    const matchesSearch = info.label.toLowerCase().includes(search.toLowerCase()) ||
                          info.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || activeCategory === 'recommended'
      ? matchesSearch
      : (categoryMap[activeCategory]?.includes(a) ?? false) && matchesSearch;
    return matchesCategory;
  });

  const toggleStar = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarred(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add an activity or resource</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5">
          <button onClick={() => setTab('activity')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'activity' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Activity or Resource
          </button>
          <button onClick={() => setTab('subsection')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'subsection' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Subsection
          </button>
        </div>

        {tab === 'activity' ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar categories */}
            <div className="w-48 border-r border-gray-200 overflow-y-auto p-3 space-y-0.5 flex-shrink-0">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search */}
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-sm outline-none flex-1 text-gray-700" autoFocus />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {activeCategory === 'all' ? 'All' : categories.find(c => c.id === activeCategory)?.label}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-4">
                  {filtered.map(type => {
                    const info = activityTypeInfo[type];
                    const Icon = activityIcons[type];
                    const isStarred = starred.has(type);
                    return (
                      <div key={type} onClick={() => setSelectedType(type)}
                        className={`group flex flex-col items-center text-center p-3 rounded-xl cursor-pointer transition-colors relative ${
                          selectedType === type ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50'
                        }`}>
                        <div className="relative mb-2">
                          <div className={`w-10 h-10 ${info.color} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${info.iconColor}`} />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{info.label}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span title={info.description} className="cursor-help">
                            <Info className="w-3.5 h-3.5 text-gray-400" />
                          </span>
                          <button type="button" onClick={(e) => toggleStar(type, e)} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
                            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No activities found</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end bg-gray-50">
                <button
                  type="button"
                  disabled={!selectedType}
                  onClick={() => {
                    console.log('[AddActivityModal] clicked Add, selectedType:', selectedType);
                    if (selectedType) {
                      onSelect(selectedType as ActivityType);
                      onClose();
                    }
                  }}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}>
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-5">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
              <Layers className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-semibold text-indigo-900">Add Subsection</h3>
              <p className="text-sm text-indigo-600 mt-1">Create a nested subsection within this section to organize related activities together.</p>
              <button onClick={() => onSelect('subsection')} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                Add Subsection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
