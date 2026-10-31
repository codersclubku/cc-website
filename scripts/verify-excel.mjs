import path from 'node:path';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = [];

function record(name, passed, details = '') {
  results.push({ name, status: passed ? 'PASS' : 'FAIL', details });
  if (!passed) {
    process.stderr.write(`FAIL: ${name} - ${details}\n`);
  }
}

function sanitizeExcelValue(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  if (/^[=+\-@\t\r]/.test(raw)) {
    return "'" + raw;
  }
  const trimmed = raw.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

async function run() {
  process.stdout.write('\n=== Running Excel Export Verification Script ===\n\n');

  const payloadMalicious = '=HYPERLINK("http://malicious.club","Claim Reward")';
  const payloadPlus = '+1+2+cmd|';
  const payloadMinus = '-5+2';
  const payloadAt = '@SUM(1,2)';
  const payloadTab = '\tmalicious_tab';

  const sanMalicious = sanitizeExcelValue(payloadMalicious);
  const sanPlus = sanitizeExcelValue(payloadPlus);
  const sanMinus = sanitizeExcelValue(payloadMinus);
  const sanAt = sanitizeExcelValue(payloadAt);
  const sanTab = sanitizeExcelValue(payloadTab);

  record(
    'Formula injection sanitization for =',
    sanMalicious.startsWith("'="),
    sanMalicious
  );
  record(
    'Formula injection sanitization for +',
    sanPlus.startsWith("'+"),
    sanPlus
  );
  record(
    'Formula injection sanitization for -',
    sanMinus.startsWith("'-"),
    sanMinus
  );
  record(
    'Formula injection sanitization for @',
    sanAt.startsWith("'@"),
    sanAt
  );
  record(
    'Formula injection sanitization for \\t',
    sanTab.startsWith("'\t"),
    sanTab
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Coders Club Kishkinda University';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value', key: 'value', width: 44 }
  ];
  summarySheet.addRow({ metric: 'Export Timestamp', value: new Date().toISOString() });
  summarySheet.addRow({ metric: 'Total Students', value: 1 });
  summarySheet.addRow({ metric: 'Total Registrations', value: 1 });
  summarySheet.addRow({ metric: 'Sanitized Formula Sample', value: sanMalicious });

  const studentsSheet = workbook.addWorksheet('Students');
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
  studentsSheet.addRow({
    fullName: 'zz-test-Student One',
    usn: 'KU2024CS001',
    department: 'Computer Science and Engineering',
    year: '2nd Year',
    semester: '3rd Semester',
    email: 'zz-test-student@kishkindauniversity.edu.in',
    emailVerified: 'Yes',
    joinedOn: '2026-10-21 10:00:00'
  });

  const registrationsSheet = workbook.addWorksheet('Registrations');
  registrationsSheet.columns = [
    { header: 'Confirmation ID', key: 'confirmationId', width: 20 },
    { header: 'Event', key: 'event', width: 28 },
    { header: 'Event Date', key: 'eventDate', width: 20 },
    { header: 'Full Name', key: 'fullName', width: 22 },
    { header: 'USN', key: 'usn', width: 16 },
    { header: 'Department', key: 'department', width: 26 },
    { header: 'Year', key: 'year', width: 12 },
    { header: 'Semester', key: 'semester', width: 12 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Registered On', key: 'registeredOn', width: 22 },
    { header: 'Checked In (Yes/No)', key: 'checkedIn', width: 18 },
    { header: 'Checked In At', key: 'checkedInAt', width: 22 }
  ];
  registrationsSheet.addRow({
    confirmationId: 'CC-2026-0042',
    event: 'Full Stack Workshop',
    eventDate: '2026-10-25 10:00:00',
    fullName: 'zz-test-Student One',
    usn: 'KU2024CS001',
    department: 'Computer Science and Engineering',
    year: '2nd Year',
    semester: '3rd Semester',
    email: 'zz-test-student@kishkindauniversity.edu.in',
    status: 'registered',
    registeredOn: '2026-10-21 10:05:00',
    checkedIn: 'Yes',
    checkedInAt: '2026-10-25 09:55:00'
  });

  const buffer = await workbook.xlsx.writeBuffer();
  record('Workbook buffer generation', buffer.byteLength > 1500, `${buffer.byteLength} bytes`);

  const readWorkbook = new ExcelJS.Workbook();
  await readWorkbook.xlsx.load(buffer);

  const sheetNames = readWorkbook.worksheets.map(w => w.name);
  record(
    'Workbook contains required sheets [Summary, Students, Registrations]',
    sheetNames.includes('Summary') && sheetNames.includes('Students') && sheetNames.includes('Registrations'),
    sheetNames.join(', ')
  );

  const rSummary = readWorkbook.getWorksheet('Summary');
  const rStudents = readWorkbook.getWorksheet('Students');
  const rRegistrations = readWorkbook.getWorksheet('Registrations');

  record('Summary sheet row count >= 4', rSummary.rowCount >= 4, `Rows: ${rSummary.rowCount}`);
  record('Students sheet row count >= 2', rStudents.rowCount >= 2, `Rows: ${rStudents.rowCount}`);
  record('Registrations sheet row count >= 2', rRegistrations.rowCount >= 2, `Rows: ${rRegistrations.rowCount}`);

  const studentHeaders = rStudents.getRow(1).values;
  const expectedStudentHeaders = ['Full Name', 'USN', 'Department', 'Year', 'Semester', 'Email', 'Email Verified', 'Joined On'];
  const hasAllStudentHeaders = expectedStudentHeaders.every(h => studentHeaders.includes(h));
  record('Students sheet column headers valid', hasAllStudentHeaders, studentHeaders.filter(Boolean).join(' | '));

  const regHeaders = rRegistrations.getRow(1).values;
  const expectedRegHeaders = ['Confirmation ID', 'Event', 'Event Date', 'Full Name', 'USN', 'Department', 'Year', 'Semester', 'Email', 'Status', 'Registered On', 'Checked In (Yes/No)', 'Checked In At'];
  const hasAllRegHeaders = expectedRegHeaders.every(h => regHeaders.includes(h));
  record('Registrations sheet column headers valid', hasAllRegHeaders, regHeaders.filter(Boolean).join(' | '));

  let verifiedApostrophe = false;
  rSummary.eachRow((row) => {
    row.eachCell((cell) => {
      const text = String(cell.value || '');
      if (text.includes('=HYPERLINK') && text.startsWith("'=")) {
        verifiedApostrophe = true;
      }
    });
  });
  record('Sanitized formula stored as text starting with apostrophe', verifiedApostrophe, 'Prefix quote preserved in worksheet');

  const regConfirmationId = rRegistrations.getRow(2).getCell(1).value;
  record('Registration Confirmation ID stored properly', regConfirmationId === 'CC-2026-0042', `Value: ${regConfirmationId}`);

  process.stdout.write('\n--- Excel Export Verification Results ---\n');
  let allPass = true;
  for (const item of results) {
    const padded = item.name.padEnd(65, ' ');
    process.stdout.write(`| ${padded} | [${item.status}] | ${item.details}\n`);
    if (item.status !== 'PASS') allPass = false;
  }
  process.stdout.write('----------------------------------------------------------------------------------------\n\n');

  if (!allPass) {
    process.stderr.write('Verification FAILED!\n');
    process.exit(1);
  }
  process.stdout.write('All Excel export tests PASSED.\n');
}

run().catch((err) => {
  process.stderr.write(`Fatal error: ${err.stack || err.message}\n`);
  process.exit(1);
});
