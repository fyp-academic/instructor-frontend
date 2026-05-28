import React, { useEffect, useState, useCallback } from 'react';
import { instructorAdaptationApi } from '@/app/services/api';
import { SafeMarkdown } from './SafeMarkdown';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { cn } from '@/app/components/ui/utils';
import { Flag, FlagOff, Eye, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface AdaptationRow {
  id: string;
  student_id: string;
  student_name: string;
  topic_name: string;
  created_at: string;
  feedback_label: string | null;
  feedback_rating: string | null;
  feedback_complexity: string | null;
  flagged: boolean;
  original_text: string;
  adapted_text: string;
}

interface AdaptationAuditLogProps {
  courseId: string;
}

export const AdaptationAuditLog: React.FC<AdaptationAuditLogProps> = ({ courseId }) => {
  const [rows, setRows] = useState<AdaptationRow[]>([]);
  const [filters, setFilters] = useState({
    topicId: '',
    studentId: '',
    flaggedOnly: false,
    dateFrom: '',
    dateTo: '',
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [viewingRow, setViewingRow] = useState<AdaptationRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        course_id: courseId,
        page,
        per_page: 15,
      };
      if (filters.topicId) params.topic_id = filters.topicId;
      if (filters.studentId) params.student_id = filters.studentId;
      if (filters.flaggedOnly) params.flagged = true;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const res = await instructorAdaptationApi.auditLog(params);
      const data = res.data;
      setRows(data.data ?? []);
      setCurrentPage(data.current_page ?? 1);
      setLastPage(data.last_page ?? 1);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, filters]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleFlag = async (row: AdaptationRow) => {
    try {
      if (row.flagged) {
        await instructorAdaptationApi.unflag(row.id);
      } else {
        await instructorAdaptationApi.flag(row.id);
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, flagged: !r.flagged } : r
        )
      );
    } catch {
      // ignore
    }
  };

  const openViewModal = (row: AdaptationRow) => {
    setViewingRow(row);
    setModalOpen(true);
  };

  const statusBadge = (flagged: boolean) =>
    flagged ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <AlertCircle className="h-3 w-3" />
        Flagged
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Active
      </span>
    );

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Adaptation Audit Log</h2>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Topic ID</label>
          <Input
            value={filters.topicId}
            onChange={(e) => setFilters((f) => ({ ...f, topicId: e.target.value }))}
            placeholder="Topic ID"
            className="h-8 w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Student ID</label>
          <Input
            value={filters.studentId}
            onChange={(e) => setFilters((f) => ({ ...f, studentId: e.target.value }))}
            placeholder="Student ID"
            className="h-8 w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="h-8 w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Date To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="h-8 w-40"
          />
        </div>
        <label className="inline-flex items-center gap-2">
          <Checkbox
            checked={filters.flaggedOnly}
            onCheckedChange={(v) => setFilters((f) => ({ ...f, flaggedOnly: !!v }))}
          />
          <span className="text-sm text-muted-foreground">Show Flagged Only</span>
        </label>
        <Button size="sm" onClick={() => fetchData(1)}>
          Apply
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Student</th>
              <th className="py-2 pr-4 font-medium">Topic</th>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Feedback</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  No adaptations found.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/30">
                  <td className="py-3 pr-4">{row.student_name}</td>
                  <td className="py-3 pr-4">{row.topic_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">{row.feedback_label ?? '—'}</td>
                  <td className="py-3 pr-4">{statusBadge(row.flagged)}</td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(row)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleFlag(row)}>
                        {row.flagged ? (
                          <FlagOff className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Flag className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => fetchData(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage}
            onClick={() => fetchData(currentPage + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Side-by-side modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Adaptation Detail</DialogTitle>
          </DialogHeader>
          {viewingRow && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Original</h4>
                <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/40 p-3">
                  <SafeMarkdown content={viewingRow.original_text} />
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Adapted</h4>
                <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/40 p-3">
                  <SafeMarkdown content={viewingRow.adapted_text} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
