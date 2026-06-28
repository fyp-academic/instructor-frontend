import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Monitor, Smartphone, Tablet, Clock, ChevronLeft, ChevronRight,
  Loader2, ScrollText, RefreshCw, Download, X, Radio,
} from 'lucide-react';
import { courseLogsApi, coursesApi } from '../../services/api';

interface LogRow {
  id: string;
  time: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  role?: string;
  component: string;
  event_name: string;
  event_type: string;
  context: string;
  description: string;
  origin: string;
  ip_address?: string | null;
  device_type?: string;
  browser?: string | null;
  os?: string | null;
  value?: number | null;
  metadata?: Record<string, unknown> | null;
}
interface Meta { current_page: number; last_page: number; per_page: number; total: number }
interface ParticipantOpt { id: string; name: string }

const componentColor: Record<string, string> = {
  Quiz: 'bg-purple-100 text-purple-700',
  Forum: 'bg-green-100 text-green-700',
  Media: 'bg-pink-100 text-pink-700',
  File: 'bg-amber-100 text-amber-700',
  Activity: 'bg-indigo-100 text-indigo-700',
  Completion: 'bg-teal-100 text-teal-700',
  Logins: 'bg-blue-100 text-blue-700',
  System: 'bg-gray-100 text-gray-600',
  Search: 'bg-cyan-100 text-cyan-700',
};

const DeviceIcon = ({ type }: { type?: string }) => {
  if (type === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-gray-400" />;
  if (type === 'tablet') return <Tablet className="w-3.5 h-3.5 text-gray-400" />;
  return <Monitor className="w-3.5 h-3.5 text-gray-400" />;
};

const formatWhen = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export function CourseLogs({ courseId, initialUserId }: { courseId: string; initialUserId?: string }) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
  const [components, setComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [userId, setUserId] = useState(initialUserId ?? '');
  const [component, setComponent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [live, setLive] = useState(false);
  const [detail, setDetail] = useState<LogRow | null>(null);
  const [participants, setParticipants] = useState<ParticipantOpt[]>([]);

  useEffect(() => { setUserId(initialUserId ?? ''); }, [initialUserId]);

  // participant list for the user filter
  useEffect(() => {
    coursesApi.participants(courseId).then(r => {
      const raw: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
      setParticipants(raw.map(p => ({ id: String(p.id), name: String(p.name ?? p.email ?? p.id) })));
    }).catch(() => {});
  }, [courseId]);

  const buildParams = useCallback((withPage: boolean) => {
    const p: Record<string, unknown> = {};
    if (withPage) { p.page = page; p.per_page = 50; }
    if (userId) p.user_id = userId;
    if (component) p.component = component;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    if (search.trim()) p.search = search.trim();
    return p;
  }, [page, userId, component, dateFrom, dateTo, search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await courseLogsApi.list(courseId, buildParams(true));
      setRows((r.data.data ?? []) as LogRow[]);
      if (r.data.meta) setMeta(r.data.meta as Meta);
      if (r.data.components) setComponents(r.data.components as string[]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, buildParams]);

  useEffect(() => { load(); }, [load]);

  // reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [userId, component, dateFrom, dateTo, search]);

  // live auto-refresh
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (live) {
      liveRef.current = setInterval(() => { load(); }, 30000);
    }
    return () => { if (liveRef.current) clearInterval(liveRef.current); };
  }, [live, load]);

  const handleExport = async () => {
    try {
      const r = await courseLogsApi.export(courseId, buildParams(false));
      const url = window.URL.createObjectURL(new Blob([r.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-logs-${courseId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-600" /> Activity Logs
          </h2>
          <p className="text-sm text-gray-500">Student activity in this course — who did what, when, where, and how.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive(l => !l)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${live ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Radio className={`w-4 h-4 ${live ? 'animate-pulse' : ''}`} /> Live
          </button>
          <button onClick={() => load()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 bg-white hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-44">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user..."
            className="bg-transparent text-sm outline-none flex-1 placeholder-gray-400" />
        </div>
        <select value={userId} onChange={e => setUserId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All users</option>
          {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={component} onChange={e => setComponent(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All components</option>
          {components.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Event context</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Component</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Event name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Origin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No activity logged for these filters yet.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(r)}>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> {formatWhen(r.time)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {(r.user_name ?? '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 truncate">{r.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{r.context}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${componentColor[r.component] ?? 'bg-gray-100 text-gray-600'}`}>{r.component}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">{r.event_name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden xl:table-cell max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-gray-600 capitalize"><DeviceIcon type={r.device_type} /> {r.origin}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden xl:table-cell">{r.ip_address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm">
            <span className="text-gray-500">Page {meta.current_page} of {meta.last_page} · {meta.total} events</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page >= meta.last_page}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${componentColor[detail.component] ?? 'bg-gray-100 text-gray-600'}`}>{detail.component}</span>
                {detail.event_name}
              </h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <p className="text-gray-700">{detail.description}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  ['User', `${detail.user_name}${detail.user_email ? ` (${detail.user_email})` : ''}`],
                  ['Time', new Date(detail.time).toUTCString()],
                  ['Event context', detail.context],
                  ['Event name', detail.event_name],
                  ['Origin', detail.origin],
                  ['IP address', detail.ip_address ?? '—'],
                  ['Device', detail.device_type ?? '—'],
                  ['Browser / OS', [detail.browser, detail.os].filter(Boolean).join(' · ') || '—'],
                  ['Value', detail.value != null ? String(detail.value) : '—'],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">{k}</p>
                    <p className="text-gray-700 break-words">{v as string}</p>
                  </div>
                ))}
              </div>
              {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Metadata</p>
                  <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">{JSON.stringify(detail.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
