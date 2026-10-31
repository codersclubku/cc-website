import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { adminGetAllRegistrationsDetailed, adminGetAllEvents, adminGetAllStudents, adminLogExport } from '../../lib/api';
import type { DbStudentRegistration, DbEvent } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENTS, ACADEMIC_YEARS } from '../../lib/validation';
import { EmptyState } from '../../components/EmptyState';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { Alert } from '../../components/Alert';

export const AdminRegistrations: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [registrations, setRegistrations] = useState<DbStudentRegistration[]>([]);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [regs, evs] = await Promise.all([
        adminGetAllRegistrationsDetailed(selectedEventId || undefined),
        adminGetAllEvents()
      ]);
      setRegistrations(regs);
      setEvents(evs);
      setLoading(false);
    }
    load();
  }, [selectedEventId]);

  const handleEventFilterChange = (id: string) => {
    setSelectedEventId(id);
    if (id) {
      setSearchParams({ eventId: id });
    } else {
      setSearchParams({});
    }
  };

  const filteredRegistrations = registrations
    .filter((r) => {
      if (checkInFilter === 'checked_in') return Boolean(r.checked_in_at);
      if (checkInFilter === 'not_checked_in') return !r.checked_in_at;
      return true;
    })
    .filter((r) => {
      if (!statusFilter) return true;
      return r.status === statusFilter;
    })
    .filter((r) => {
      if (!deptFilter) return true;
      return r.profile?.department === deptFilter;
    })
    .filter((r) => {
      if (!yearFilter) return true;
      return r.profile?.year === yearFilter;
    })
    .filter((r) => {
      if (!startDate) return true;
      return new Date(r.created_at) >= new Date(startDate);
    })
    .filter((r) => {
      if (!endDate) return true;
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return new Date(r.created_at) <= end;
    })
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = r.profile?.full_name?.toLowerCase() || '';
      const email = r.profile?.email?.toLowerCase() || '';
      const usn = r.profile?.usn?.toLowerCase() || '';
      const conf = r.confirmation_id.toLowerCase();
      return name.includes(q) || email.includes(q) || usn.includes(q) || conf.includes(q);
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const handleExportExcel = async () => {
    if (!isAdmin || !user?.id) return;
    setIsExporting(true);
    setExportError(null);
    setExportProgress('Loading dataset...');

    try {
      const [allStudents, { generateCodersClubExcel }] = await Promise.all([
        adminGetAllStudents(),
        import('../../lib/excelExport')
      ]);

      const filters = {
        eventId: selectedEventId || undefined,
        eventTitle: events.find((e) => e.id === selectedEventId)?.title || undefined,
        department: deptFilter || undefined,
        year: yearFilter || undefined,
        status: statusFilter || undefined,
        checkedIn: checkInFilter !== 'all' ? checkInFilter : undefined,
        searchQuery: searchQuery || undefined,
        dateRange: (startDate || endDate) ? { start: startDate, end: endDate } : undefined
      };

      const blob = await generateCodersClubExcel(
        {
          students: allStudents,
          registrations: filteredRegistrations,
          filters
        },
        (step) => setExportProgress(step)
      );

      await adminLogExport(user.id, filters, filteredRegistrations.length);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `coders-club-registrations-${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportProgress(null);
    } catch (err: any) {
      setExportError(err?.message || 'Export failed. Please retry.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Records
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Attendee Registrations
          </h1>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting || filteredRegistrations.length === 0}
          className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? (exportProgress || 'Exporting...') : `Export ${filteredRegistrations.length} Registrations to .xlsx`}</span>
        </button>
      </div>

      <div className="p-3 bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-sm flex items-center gap-2 text-xs font-mono text-[var(--color-warning-strong)] dark:text-[var(--color-warning)]">
        <ShieldAlert className="w-4 h-4 text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] shrink-0" />
        <span>
          Notice: This file contains student personal data protected under DPDP Act 2023. Exports must strictly adhere to university data protection policies.
        </span>
      </div>

      {exportError && (
        <Alert
          type="error"
          title="Export Failed"
          message={exportError}
          action={
            <button
              type="button"
              onClick={handleExportExcel}
              className="underline text-xs font-mono font-bold hover:text-white"
            >
              Retry Export
            </button>
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendee, USN, ID..."
            className="w-full h-10 pl-9 pr-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedEventId}
            onChange={(e) => handleEventFilterChange(e.target.value)}
            className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          >
            <option value="">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          >
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          >
            <option value="">All Statuses</option>
            <option value="registered">Registered</option>
            <option value="cancelled">Cancelled</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>

        <div>
          <select
            value={checkInFilter}
            onChange={(e) => setCheckInFilter(e.target.value as any)}
            className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          >
            <option value="all">All Check-In States</option>
            <option value="checked_in">Checked In Only</option>
            <option value="not_checked_in">Not Checked In</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start registration date"
            className="w-full h-10 px-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          />
          <span className="text-xs font-mono text-[var(--text-muted)]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End registration date"
            className="w-full h-10 px-2 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="w-full h-10 px-3 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)] rounded-sm text-xs font-mono text-[var(--text-strong)] flex items-center justify-between"
          >
            <span>Sort by Date</span>
            <span className="text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">{sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : filteredRegistrations.length === 0 ? (
        <EmptyState
          title="No registrations match filters"
          description="Try adjusting your filters or search query."
        />
      ) : (
        <div className="border border-[var(--border)] rounded-sm bg-[var(--surface)] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] uppercase text-[11px]">
                <th className="p-3">Pass ID</th>
                <th className="p-3">Attendee Name</th>
                <th className="p-3">USN</th>
                <th className="p-3">Event</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Checked In</th>
                <th className="p-3">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRegistrations.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                  <td className="p-3 font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                    {r.confirmation_id}
                  </td>
                  <td className="p-3 text-[var(--text-strong)] font-semibold">
                    {r.profile?.full_name || 'Student'}
                  </td>
                  <td className="p-3 uppercase text-[var(--text)]">
                    {r.profile?.usn || '—'}
                  </td>
                  <td className="p-3 text-[var(--text)] max-w-[180px] truncate" title={r.event_title}>
                    {r.event_title || 'General Event'}
                  </td>
                  <td className="p-3 text-[var(--text-muted)] max-w-[160px] truncate" title={r.profile?.department}>
                    {r.profile?.department || '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] uppercase font-bold border ${
                        r.status === 'registered'
                          ? 'bg-[var(--color-info-soft)] text-[var(--color-info-strong)] dark:text-[var(--color-info)] border-[var(--color-info-border)]'
                          : r.status === 'cancelled'
                          ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] border-[var(--color-danger-border)]'
                          : 'bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)] dark:text-[var(--color-warning)] border-[var(--color-warning-border)]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.checked_in_at ? (
                      <span className="text-[var(--color-success-strong)] dark:text-[var(--color-success)] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Yes</span>
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">No</span>
                    )}
                  </td>
                  <td className="p-3 text-[var(--text-muted)]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
