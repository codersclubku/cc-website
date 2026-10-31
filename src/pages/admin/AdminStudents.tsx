import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, Eye, ShieldAlert } from 'lucide-react';
import { adminGetAllStudents, adminDeleteStudent, adminGetAllRegistrationsDetailed, adminLogExport } from '../../lib/api';
import type { StudentProfile } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENTS, ACADEMIC_YEARS, SEMESTERS } from '../../lib/validation';
import { AdminTableSkeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { Alert } from '../../components/Alert';

function getExportDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export const AdminStudents: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [sortField, setSortField] = useState<'name' | 'usn' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const [detailStudent, setDetailStudent] = useState<StudentProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await adminGetAllStudents();
      setStudents(list);
      setLoading(false);
    }
    load();
  }, []);

  const filteredStudents = students
    .filter((s) => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (yearFilter && s.year !== yearFilter) return false;
      if (semFilter && s.semester !== semFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.full_name.toLowerCase().includes(q) ||
          s.usn.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        const comp = a.full_name.localeCompare(b.full_name);
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortField === 'usn') {
        const comp = a.usn.localeCompare(b.usn);
        return sortOrder === 'asc' ? comp : -comp;
      }
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const ok = await adminDeleteStudent(deleteTarget.id);
    setIsDeleting(false);
    if (ok) {
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleExportExcel = async () => {
    if (!isAdmin || !user?.id) return;
    setIsExporting(true);
    setExportError(null);
    setExportProgress('Loading dataset...');

    try {
      const [regs, { generateCodersClubExcel }] = await Promise.all([
        adminGetAllRegistrationsDetailed(),
        import('../../lib/excelExport')
      ]);

      const filters = {
        department: deptFilter || undefined,
        year: yearFilter || undefined,
        semester: semFilter || undefined,
        searchQuery: searchQuery || undefined
      };

      const blob = await generateCodersClubExcel(
        {
          students: filteredStudents,
          registrations: regs,
          filters
        },
        (step) => setExportProgress(step)
      );

      await adminLogExport(user.id, filters, filteredStudents.length);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = getExportDateString();
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
            Student Records
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl uppercase tracking-tight text-[var(--text-strong)] m-0">
            Kishkinda University Students
          </h1>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isExporting || filteredStudents.length === 0}
          className="cc-btn cc-btn--primary cc-btn--sm text-xs font-mono font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? (exportProgress || 'Exporting...') : `Export ${filteredStudents.length} Students to .xlsx`}</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, USN, or email..."
            className="w-full h-10 pl-9 pr-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
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
            value={semFilter}
            onChange={(e) => {
              setSemFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border)] rounded-sm text-xs font-mono text-[var(--text-strong)] focus:border-[var(--accent)]"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No student records match filters"
          description="Try resetting your search query or department filters."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="border border-[var(--border)] rounded-sm bg-[var(--surface)] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] uppercase text-[11px]">
                  <th className="p-3 cursor-pointer" onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Student Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => { setSortField('usn'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    USN {sortField === 'usn' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Year / Sem</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 cursor-pointer" onClick={() => { setSortField('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Joined {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="p-3 font-bold text-[var(--text-strong)]">
                      {s.full_name}
                    </td>
                    <td className="p-3 uppercase text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                      {s.usn}
                    </td>
                    <td className="p-3 text-[var(--text)] max-w-[200px] truncate" title={s.department}>
                      {s.department}
                    </td>
                    <td className="p-3 text-[var(--text)]">
                      {s.year} • {s.semester}
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">
                      {s.email || '—'}
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailStudent(s)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                          title="View student details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] hover:opacity-80"
                          title="Delete student on verified request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] px-1">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length} students
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 border border-[var(--border)] rounded-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 border border-[var(--border)] rounded-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {detailStudent && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[var(--surface)] border border-[var(--border)] p-6 rounded-sm flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-[var(--text-strong)] m-0">
                Student Profile Detail
              </h3>
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Full Name</span>
                <span className="text-sm font-bold text-[var(--text-strong)]">{detailStudent.full_name}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">USN</span>
                <span className="text-sm font-bold uppercase text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">{detailStudent.usn}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Department</span>
                <span className="text-[var(--text-strong)]">{detailStudent.department}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Year</span>
                <span>{detailStudent.year}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Semester</span>
                <span>{detailStudent.semester}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Email</span>
                <span className="break-all">{detailStudent.email || '—'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="cc-btn cc-btn--secondary min-h-[40px] text-xs font-mono"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--color-danger-border)] p-6 rounded-sm flex flex-col gap-4 text-left">
            <h3 className="font-display font-extrabold text-xl uppercase tracking-tight text-[var(--color-danger-strong)] dark:text-[var(--color-danger)] m-0">
              Delete Student Profile?
            </h3>
            <p className="text-xs text-[var(--text)] leading-relaxed m-0">
              Confirm deletion of profile for <strong className="text-[var(--text-strong)]">{deleteTarget.full_name}</strong> ({deleteTarget.usn}). This will remove their profile record under DPDP Act verified request procedures.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="cc-btn cc-btn--secondary min-h-[44px] text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirmed}
                className="cc-btn cc-btn--danger min-h-[44px] text-xs font-mono font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
