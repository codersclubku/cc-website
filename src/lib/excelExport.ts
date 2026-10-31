import { sanitizeExcelValue } from './validation';
import type { StudentProfile, DbStudentRegistration } from './api';

export interface ExportFilters {
  department?: string;
  year?: string;
  semester?: string;
  eventId?: string;
  eventTitle?: string;
  status?: string;
  checkedIn?: string;
  searchQuery?: string;
  dateRange?: { start?: string; end?: string };
}

export interface ExportDataset {
  students: StudentProfile[];
  registrations: DbStudentRegistration[];
  filters: ExportFilters;
  events?: { id: string; title: string; starts_at: string }[];
}

export function formatISTDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export async function generateCodersClubExcel(
  dataset: ExportDataset,
  onProgress?: (step: string) => void
): Promise<Blob> {
  onProgress?.('Initializing workbook engine...');
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Coders Club Kishkinda University';
  workbook.lastModifiedBy = 'Admin Export Portal';
  workbook.created = new Date();
  workbook.modified = new Date();

  onProgress?.('Building Summary sheet...');
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }
  });

  summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

  summarySheet.columns = [
    { header: 'Metric / Section', key: 'metric', width: 32 },
    { header: 'Value / Details', key: 'value', width: 48 },
    { header: 'Additional Notes', key: 'notes', width: 36 }
  ];

  const nowIST = formatISTDate(new Date());
  const filterDesc = Object.entries(dataset.filters)
    .filter(([, val]) => Boolean(val))
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('; ') || 'None (All Records)';

  summarySheet.addRow({
    metric: sanitizeExcelValue('Export Generated At'),
    value: sanitizeExcelValue(nowIST),
    notes: sanitizeExcelValue('Indian Standard Time (IST)')
  });
  summarySheet.addRow({
    metric: sanitizeExcelValue('Applied Filters'),
    value: sanitizeExcelValue(filterDesc),
    notes: sanitizeExcelValue('')
  });
  summarySheet.addRow({
    metric: sanitizeExcelValue('Total Registered Students'),
    value: dataset.students.length,
    notes: sanitizeExcelValue('')
  });
  summarySheet.addRow({
    metric: sanitizeExcelValue('Total Event Registrations'),
    value: dataset.registrations.length,
    notes: sanitizeExcelValue('')
  });

  const checkedInCount = dataset.registrations.filter((r) => Boolean(r.checked_in_at)).length;
  const overallAttendance = dataset.registrations.length > 0
    ? `${((checkedInCount / dataset.registrations.length) * 100).toFixed(1)}%`
    : '0%';
  summarySheet.addRow({
    metric: sanitizeExcelValue('Overall Checked-In Count'),
    value: checkedInCount,
    notes: sanitizeExcelValue(`Attendance rate: ${overallAttendance}`)
  });

  summarySheet.addRow({ metric: '', value: '', notes: '' });
  summarySheet.addRow({
    metric: sanitizeExcelValue('--- DEPARTMENT BREAKDOWN ---'),
    value: sanitizeExcelValue('Student Count'),
    notes: sanitizeExcelValue('Registrations')
  });

  const deptMap = new Map<string, { students: number; registrations: number }>();
  dataset.students.forEach((s) => {
    const dept = s.department || 'Unassigned';
    const curr = deptMap.get(dept) || { students: 0, registrations: 0 };
    curr.students += 1;
    deptMap.set(dept, curr);
  });
  dataset.registrations.forEach((r) => {
    const dept = r.profile?.department || 'Unassigned';
    const curr = deptMap.get(dept) || { students: 0, registrations: 0 };
    curr.registrations += 1;
    deptMap.set(dept, curr);
  });
  deptMap.forEach((stats, dept) => {
    summarySheet.addRow({
      metric: sanitizeExcelValue(dept),
      value: stats.students,
      notes: sanitizeExcelValue(`${stats.registrations} event bookings`)
    });
  });

  summarySheet.addRow({ metric: '', value: '', notes: '' });
  summarySheet.addRow({
    metric: sanitizeExcelValue('--- ACADEMIC YEAR BREAKDOWN ---'),
    value: sanitizeExcelValue('Student Count'),
    notes: sanitizeExcelValue('')
  });
  const yearMap = new Map<string, number>();
  dataset.students.forEach((s) => {
    const yr = s.year || 'Unknown';
    yearMap.set(yr, (yearMap.get(yr) || 0) + 1);
  });
  yearMap.forEach((count, yr) => {
    summarySheet.addRow({
      metric: sanitizeExcelValue(yr),
      value: count,
      notes: sanitizeExcelValue('')
    });
  });

  summarySheet.addRow({ metric: '', value: '', notes: '' });
  summarySheet.addRow({
    metric: sanitizeExcelValue('--- EVENT ATTENDANCE RATES ---'),
    value: sanitizeExcelValue('Total Bookings'),
    notes: sanitizeExcelValue('Checked-In Rate')
  });

  const eventMap = new Map<string, { title: string; total: number; attended: number }>();
  dataset.registrations.forEach((r) => {
    const evTitle = r.event_title || 'General Event';
    const curr = eventMap.get(evTitle) || { title: evTitle, total: 0, attended: 0 };
    curr.total += 1;
    if (r.checked_in_at) curr.attended += 1;
    eventMap.set(evTitle, curr);
  });
  eventMap.forEach((ev) => {
    const rate = ev.total > 0 ? `${((ev.attended / ev.total) * 100).toFixed(1)}%` : '0%';
    summarySheet.addRow({
      metric: sanitizeExcelValue(ev.title),
      value: ev.total,
      notes: sanitizeExcelValue(`${ev.attended} attended (${rate})`)
    });
  });

  applySheetStyles(summarySheet);

  onProgress?.('Building Students sheet...');
  const studentsSheet = workbook.addWorksheet('Students', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }
  });
  studentsSheet.views = [{ state: 'frozen', ySplit: 1 }];

  studentsSheet.columns = [
    { header: 'Full Name', key: 'fullName', width: 24 },
    { header: 'USN', key: 'usn', width: 18 },
    { header: 'Department', key: 'department', width: 30 },
    { header: 'Year', key: 'year', width: 14 },
    { header: 'Semester', key: 'semester', width: 14 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Email Verified', key: 'emailVerified', width: 16 },
    { header: 'Joined On', key: 'joinedOn', width: 22 }
  ];

  dataset.students.forEach((s) => {
    studentsSheet.addRow({
      fullName: sanitizeExcelValue(s.full_name),
      usn: sanitizeExcelValue(s.usn),
      department: sanitizeExcelValue(s.department),
      year: sanitizeExcelValue(s.year),
      semester: sanitizeExcelValue(s.semester),
      email: sanitizeExcelValue(s.email || ''),
      emailVerified: s.email_verified ? 'Yes' : 'No',
      joinedOn: formatISTDate(s.created_at)
    });
  });

  applySheetStyles(studentsSheet);

  onProgress?.('Building Registrations sheet...');
  const regSheet = workbook.addWorksheet('Registrations', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }
  });
  regSheet.views = [{ state: 'frozen', ySplit: 1 }];

  regSheet.columns = [
    { header: 'Event', key: 'event', width: 28 },
    { header: 'Event Date', key: 'eventDate', width: 20 },
    { header: 'Full Name', key: 'fullName', width: 22 },
    { header: 'USN', key: 'usn', width: 16 },
    { header: 'Department', key: 'department', width: 26 },
    { header: 'Year', key: 'year', width: 12 },
    { header: 'Semester', key: 'semester', width: 12 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Confirmation ID', key: 'confirmationId', width: 18 },
    { header: 'Registered On', key: 'registeredOn', width: 22 },
    { header: 'Checked In', key: 'checkedIn', width: 14 },
    { header: 'Checked In At', key: 'checkedInAt', width: 22 }
  ];

  dataset.registrations.forEach((r) => {
    regSheet.addRow({
      event: sanitizeExcelValue(r.event_title || 'General Event'),
      eventDate: formatISTDate(r.starts_at),
      fullName: sanitizeExcelValue(r.profile?.full_name || ''),
      usn: sanitizeExcelValue(r.profile?.usn || ''),
      department: sanitizeExcelValue(r.profile?.department || ''),
      year: sanitizeExcelValue(r.profile?.year || ''),
      semester: sanitizeExcelValue(r.profile?.semester || ''),
      email: sanitizeExcelValue(r.profile?.email || ''),
      status: sanitizeExcelValue(r.status),
      confirmationId: sanitizeExcelValue(r.confirmation_id),
      registeredOn: formatISTDate(r.created_at),
      checkedIn: r.checked_in_at ? 'Yes' : 'No',
      checkedInAt: formatISTDate(r.checked_in_at)
    });
  });

  applySheetStyles(regSheet);

  onProgress?.('Generating binary buffer...');
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function applySheetStyles(worksheet: any) {
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  };

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF10002B' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0AAFF' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
  headerRow.height = 24;

  worksheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber !== 1) {
      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      row.height = 20;
    }
  });
}
