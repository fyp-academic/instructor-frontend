import React, { useState } from 'react';
import { Bell, CheckCheck, Filter, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { notifications, markNotificationRead, markAllRead } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'warning' | 'success' | 'danger'>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
    danger: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">{unreadCount} unread · {notifications.length} total</p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-50"
        >
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'info', label: 'Info' },
          { id: 'warning', label: 'Warnings' },
          { id: 'success', label: 'Success' },
          { id: 'danger', label: 'Alerts' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              filter === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No notifications</p>
            <p className="text-sm text-gray-300 mt-1">You're all caught up!</p>
          </div>
        ) : (
          filtered.map(notif => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            return (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                  !notif.read ? `${config.bg} ${config.border}` : 'bg-white border-gray-200 opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                    {!notif.read && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{notif.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
