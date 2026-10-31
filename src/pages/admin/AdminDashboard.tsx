import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Plus, Download, GraduationCap, Contact } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { adminGetDashboardStats, adminGetAllEvents, adminGetExportLogs } from '../../lib/api';
import type { DbEvent, ExportLogRow } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    totalRegistrations: 0,
    totalStudents: 0,
    unhandledMessages: 0
  });
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [exportLogs, setExportLogs] = useState<ExportLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, evs, logs] = await Promise.all([
        adminGetDashboardStats(),
        adminGetAllEvents(),
        adminGetExportLogs()
      ]);
      setStats(s);
      setEvents(evs);
      setExportLogs(logs);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
            Overview
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Coordinator Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/students" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Students</span>
          </Link>

          <Link to="/admin/team" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono">
            <Contact className="w-3.5 h-3.5" />
            <span>Team</span>
          </Link>

          <Link to="/admin/check-in" className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono">
            <QrCode className="w-3.5 h-3.5" />
            <span>Event Day Check-In</span>
          </Link>

          <Link to="/admin/events" className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono">
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Events</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={String(stats.totalStudents || 0)}
          label="Registered Students"
          unit="Kishkinda Univ"
        />
        <StatCard
          value={String(stats.totalRegistrations)}
          label="Event Bookings"
        />
        <StatCard
          value={String(stats.publishedEvents)}
          label="Live Events"
          unit={stats.totalEvents ? `${stats.totalEvents} total` : undefined}
        />
        <StatCard
          value={String(stats.unhandledMessages)}
          label="Unread Messages"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0">
            Active Event Registrations
          </h2>
          <Link to="/admin/registrations" className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline">
            View all attendees →
          </Link>
        </div>

        {loading ? (
          <AdminTableSkeleton rows={4} />
        ) : events.length === 0 ? (
          <div className="p-8 border border-[var(--border)] rounded-sm bg-[var(--surface)] text-left flex flex-col gap-2">
            <div className="text-sm font-semibold text-[var(--text-strong)]">No events created yet</div>
            <div className="text-xs text-[var(--text-muted)]">Create your first workshop or session to begin accepting registrations.</div>
            <Link to="/admin/events" className="cc-btn cc-btn--secondary cc-btn--sm self-start mt-2">
              Create an event
            </Link>
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-sm bg-[var(--surface)] overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--surface-raised)] border-b border-[var(--border-strong)] text-[var(--text-strong)] font-semibold">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Registrations</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                      <td className="p-3 font-semibold text-[var(--text-strong)] font-body">
                        {ev.title}
                      </td>
                      <td className="p-3 text-[var(--text-muted)]">{ev.type}</td>
                      <td className="p-3">
                        <Badge
                          variant={ev.status === 'published' ? 'open' : ev.status === 'closed' ? 'closed' : 'neutral'}
                          label={ev.status}
                        />
                      </td>
                      <td className="p-3 text-[var(--text-muted)]">
                        {new Date(ev.starts_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3 text-right font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                        {ev.registrations_count || 0}
                        {ev.capacity ? ` / ${ev.capacity}` : ''}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/admin/registrations?eventId=${ev.id}`}
                          className="text-[var(--link)] hover:text-[var(--link-hover)] underline"
                        >
                          View attendees
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-[var(--border)]">
              {events.map((ev) => (
                <div key={ev.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={ev.status === 'published' ? 'open' : ev.status === 'closed' ? 'closed' : 'neutral'}
                      label={ev.status}
                    />
                    <span className="text-xs font-mono font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                      {ev.registrations_count || 0} registrations
                    </span>
                  </div>

                  <div className="text-base font-bold text-[var(--text-strong)] font-body">
                    {ev.title}
                  </div>

                  <div className="text-xs font-mono text-[var(--text-muted)]">
                    {new Date(ev.starts_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })} • {ev.venue}
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                    <Link
                      to={`/admin/registrations?eventId=${ev.id}`}
                      className="text-xs font-mono text-[var(--link)] underline"
                    >
                      View attendees →
                    </Link>
                    <Link
                      to="/admin/check-in"
                      className="cc-btn cc-btn--secondary cc-btn--sm text-xs font-mono"
                    >
                      Check-in
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-lg font-bold font-body text-[var(--text-strong)] m-0">
              Excel Export History
            </h2>
          </div>
          <Link to="/admin/registrations" className="text-xs font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline">
            Generate new export →
          </Link>
        </div>

        {exportLogs.length === 0 ? (
          <div className="p-6 border border-[var(--border)] rounded-sm bg-[var(--surface)] text-xs font-mono text-[var(--text-muted)]">
            No Excel files exported yet. All downloads from the Registrations and Students panels will be logged here for university audit compliance.
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-sm bg-[var(--surface)] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[var(--text-muted)] uppercase text-[11px]">
                <tr>
                  <th className="p-3">Exported At (IST)</th>
                  <th className="p-3">Exported By</th>
                  <th className="p-3">Filters Applied</th>
                  <th className="p-3 text-right">Rows Exported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {exportLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="p-3 text-[var(--text-strong)]">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 text-[var(--text)]">
                      {log.admin_email || 'Authorized Administrator'}
                    </td>
                    <td className="p-3 text-[var(--text-muted)] max-w-xs truncate" title={JSON.stringify(log.filters)}>
                      {Object.keys(log.filters).length > 0
                        ? Object.entries(log.filters).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : 'Full dataset'}
                    </td>
                    <td className="p-3 text-right font-bold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                      {log.row_count} records
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
