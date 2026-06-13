import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Monitor, Smartphone, Tablet, MapPin, Globe, Clock, LogIn,
  ChevronLeft, ChevronRight, Loader2, Shield, RefreshCw
} from 'lucide-react';
import { logsApi } from '../services/api';

interface LogRow {
  id: string;
  user_name?: string;
  user_email?: string;
  role?: string;
  action?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  city?: string;
  country?: string;
  started_at?: string;
  duration_seconds?: number;
}

interface Meta { current_page: number; last_page: number; per_page: number; total: number }

const roleBadge = (role?: string) => {
  if (role === 'admin') return 'bg-amber-100 text-amber-700';
  if (role === 'instructor') return 'bg-indigo-100 text-indigo-700';
  return 'bg-gray-100 text-gray-600';
};

const DeviceIcon = ({ type }: { type?: string }) => {
  if (type === 'mobile') return <Smartphone className="w-4 h-4 text-gray-500" />;
  if (type === 'tablet') return <Tablet className="w-4 h-4 text-gray-500" />;
  return <Monitor className="w-4 h-4 text-gray-500" />;
};

const formatWhen = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminLogs() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: 25, total: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 25 };
      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;
      const r = await logsApi.list(params);
      setRows((r.data.data ?? []) as LogRow[]);
      if (r.data.meta) setMeta(r.data.meta as Meta);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, role]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" /> Activity Logs
          </h1>
          <p className="text-sm text-gray-500">Sign-in audit — who accessed the platform, on what device, when, and from where.</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 self-start bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400"
          />
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All roles</option>
          <option value="admin">Admins</option>
          <option value="instructor">Instructors</option>
          <option value="student">Students</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Device</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Browser / OS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No sign-in activity found.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {(r.user_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900 truncate">{r.user_name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${roleBadge(r.role)}`}>{r.role}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{r.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      <LogIn className="w-3.5 h-3.5 text-green-500" /> {r.action ?? 'Signed in'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-gray-700 capitalize">
                      <DeviceIcon type={r.device_type} /> {r.device_type ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                    {(r.browser || r.os) ? `${r.browser ?? '—'} · ${r.os ?? '—'}` : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                    {(r.city || r.country) ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {[r.city, r.country].filter(Boolean).join(', ')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-gray-400"><Globe className="w-3.5 h-3.5" /> Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 font-mono text-xs">{r.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" /> {formatWhen(r.started_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm">
            <span className="text-gray-500">
              Page {meta.current_page} of {meta.last_page} · {meta.total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
