import React, { useState } from 'react';
import { X, Search, FileText, HelpCircle, MessageSquare, Link, File, Package, Users, Hash, Layout, Layers } from 'lucide-react';
import { ActivityType, activityTypeInfo } from '../../data/mockData';

interface AddActivityModalProps {
  onClose: () => void;
  onSelect: (type: ActivityType | 'subsection') => void;
}

const activityIcons: Record<string, React.ElementType> = {
  quiz: HelpCircle,
  assignment: FileText,
  forum: MessageSquare,
  workshop: Users,
  h5p: Layers,
  scorm: Package,
  url: Link,
  file: File,
  page: Layout,
  label: Hash,
};

export function AddActivityModal({ onClose, onSelect }: AddActivityModalProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'activity' | 'subsection'>('activity');

  const activities: ActivityType[] = ['quiz', 'assignment', 'forum', 'workshop', 'h5p', 'scorm', 'url', 'file', 'page', 'label'];

  const filtered = activities.filter(a =>
    activityTypeInfo[a].label.toLowerCase().includes(search.toLowerCase()) ||
    activityTypeInfo[a].description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add to course</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5">
          <button
            onClick={() => setTab('activity')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'activity' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Activity or Resource
          </button>
          <button
            onClick={() => setTab('subsection')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'subsection' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Subsection
          </button>
        </div>

        {tab === 'activity' ? (
          <>
            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none flex-1 text-gray-700"
                  autoFocus
                />
              </div>
            </div>

            {/* Activities grid */}
            <div className="overflow-y-auto flex-1 p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filtered.map(type => {
                  const info = activityTypeInfo[type];
                  const Icon = activityIcons[type];
                  return (
                    <button
                      key={type}
                      onClick={() => onSelect(type)}
                      className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className={`w-9 h-9 ${info.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${info.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{info.label}</p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5 line-clamp-2">{info.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No activities found for "{search}"</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 p-5">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
              <Layers className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-semibold text-indigo-900">Add Subsection</h3>
              <p className="text-sm text-indigo-600 mt-1">Create a nested subsection within this section to organize related activities together.</p>
              <button
                onClick={() => onSelect('subsection')}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Add Subsection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
