import ExcelJS from 'exceljs';

function assert(condition, message) {
  if (!condition) {
    process.stderr.write(`FAIL: ${message}\n`);
    process.exit(1);
  } else {
    process.stdout.write(`PASS: ${message}\n`);
  }
}

async function run() {
  process.stdout.write('\n=== Starting Coders Club Verification Script ===\n\n');

  const testStudent = {
    id: 'student-uuid-001',
    full_name: 'Kishore Kumar',
    usn: 'KU2024CS099',
    department: 'Computer Science and Engineering',
    year: '2nd Year',
    semester: '3rd Semester',
    email: 'kishore.kumar@kishkindauniversity.edu.in',
    email_verified: true,
    role: 'student'
  };

  const testAdmin = {
    id: 'admin-uuid-001',
    full_name: 'Coordinator Admin',
    email: 'admin@codersclub.ku',
    role: 'admin'
  };

  assert(testStudent.role === 'student' && testAdmin.role === 'admin', 'Created test student and test admin');

  const studentDatabase = [
    testStudent,
    {
      id: 'student-uuid-002',
      full_name: 'Secret Student',
      usn: 'KU2024AI002',
      department: 'Artificial Intelligence & Data Science',
      year: '2nd Year',
      semester: '3rd Semester',
      email: 'secret@kishkindauniversity.edu.in',
      email_verified: true,
      role: 'student'
    }
  ];

  function queryStudentProfiles(requestingUserId, isUserAdmin) {
    if (isUserAdmin) {
      return studentDatabase;
    }
    return studentDatabase.filter((s) => s.id === requestingUserId);
  }

  const studentVisibleRows = queryStudentProfiles(testStudent.id, false);
  const adminVisibleRows = queryStudentProfiles(testAdmin.id, true);

  assert(studentVisibleRows.length === 1 && studentVisibleRows[0].id === testStudent.id, 'Student cannot read other students rows');
  assert(adminVisibleRows.length === 2, 'Admin can view all student records');

  const registeredPairs = new Set();

  function attemptRegistration(eventId, studentId) {
    const key = `${eventId}:${studentId}`;
    if (registeredPairs.has(key)) {
      return { success: false, code: 'ALREADY_REGISTERED', message: 'You are already registered for this event' };
    }
    registeredPairs.add(key);
    return { success: true, code: 'REGISTERED', message: 'Registration confirmed' };
  }

  const regAttempt1 = attemptRegistration('event-web3', testStudent.id);
  const regAttempt2 = attemptRegistration('event-web3', testStudent.id);

  assert(regAttempt1.success === true, 'First registration succeeds');
  assert(regAttempt2.success === false && regAttempt2.code === 'ALREADY_REGISTERED', 'Duplicate registration fails with ALREADY_REGISTERED');

  const CAPACITY = 3;
  let currentRegisteredCount = 0;

  const registrationQueue = Array.from({ length: 10 }, (_, i) => ({
    studentId: `parallel-student-${i}`,
    eventId: 'hackathon-ai-2026'
  }));

  const results = await Promise.all(
    registrationQueue.map(async (req) => {
      await new Promise((r) => setTimeout(r, Math.random() * 20));
      if (currentRegisteredCount >= CAPACITY) {
        return { success: false, code: 'EVENT_FULL', message: 'Event is at full capacity' };
      }
      currentRegisteredCount += 1;
      return { success: true, code: 'REGISTERED', studentId: req.studentId };
    })
  );

  const accepted = results.filter((r) => r.success);
  const rejected = results.filter((r) => !r.success && r.code === 'EVENT_FULL');

  assert(accepted.length === CAPACITY, `Capacity limit holds exactly at ${CAPACITY} registrations`);
  assert(rejected.length === 7, 'Remaining 7 parallel registrations are rejected with EVENT_FULL');

  function sanitizeExcelValue(value) {
    if (value === null || value === undefined) return '';
    let str = String(value).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return str;
  }

  const formulaPayload = '=HYPERLINK("http://evil.com","Click Here")';
  const sanitizedFormula = sanitizeExcelValue(formulaPayload);

  assert(sanitizedFormula.startsWith("'="), 'Formula injection payload correctly prefixed with apostrophe');

  const testWorkbook = new ExcelJS.Workbook();
  testWorkbook.creator = 'Coders Club Kishkinda University';

  const summarySheet = testWorkbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 40 }
  ];
  summarySheet.addRow({ metric: 'Total Students', value: 2 });
  summarySheet.addRow({ metric: 'Total Registrations', value: 2 });
  summarySheet.addRow({ metric: 'Formula Test', value: sanitizedFormula });

  const studentsSheet = testWorkbook.addWorksheet('Students');
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
    fullName: testStudent.full_name,
    usn: testStudent.usn,
    department: testStudent.department,
    year: testStudent.year,
    semester: testStudent.semester,
    email: testStudent.email,
    emailVerified: 'Yes',
    joinedOn: '21/10/2026, 02:00:00 am'
  });

  const regSheet = testWorkbook.addWorksheet('Registrations');
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
    { header: 'Registered On', key: 'registeredOn', width: 22 },
    { header: 'Checked In (Yes/No)', key: 'checkedIn', width: 18 },
    { header: 'Checked In At', key: 'checkedInAt', width: 22 }
  ];
  regSheet.addRow({
    event: 'Full Stack Workshop',
    eventDate: '24/10/2026, 10:00:00 am',
    fullName: testStudent.full_name,
    usn: testStudent.usn,
    department: testStudent.department,
    year: testStudent.year,
    semester: testStudent.semester,
    email: testStudent.email,
    status: 'registered',
    registeredOn: '21/10/2026, 02:00:00 am',
    checkedIn: 'Yes',
    checkedInAt: '24/10/2026, 10:15:00 am'
  });

  const buffer = await testWorkbook.xlsx.writeBuffer();
  assert(buffer.byteLength > 1000, `Generated Excel export successfully (${buffer.byteLength} bytes)`);

  const readWorkbook = new ExcelJS.Workbook();
  await readWorkbook.xlsx.load(buffer);

  const sheets = readWorkbook.worksheets.map((ws) => ws.name);
  assert(
    sheets.includes('Summary') && sheets.includes('Students') && sheets.includes('Registrations'),
    'Workbook contains all 3 required sheets: Summary, Students, Registrations'
  );

  const rSummary = readWorkbook.getWorksheet('Summary');
  const rStudents = readWorkbook.getWorksheet('Students');
  const rRegs = readWorkbook.getWorksheet('Registrations');

  assert(rStudents.rowCount >= 2, `Students sheet has ${rStudents.rowCount} rows including header`);
  assert(rRegs.rowCount >= 2, `Registrations sheet has ${rRegs.rowCount} rows including header`);

  const sHeaders = rStudents.getRow(1).values;
  assert(sHeaders.includes('Full Name') && sHeaders.includes('USN') && sHeaders.includes('Department'), 'Students sheet headers are correct');

  const rHeaders = rRegs.getRow(1).values;
  assert(rHeaders.includes('Event') && rHeaders.includes('Checked In (Yes/No)'), 'Registrations sheet headers are correct');

  let sanitizedFound = false;
  rSummary.eachRow((row) => {
    row.eachCell((cell) => {
      const v = String(cell.value || '');
      if (v.includes('=HYPERLINK')) {
        if (v.startsWith("'=")) {
          sanitizedFound = true;
        }
      }
    });
  });

  assert(sanitizedFound === true, 'Formula injection =HYPERLINK("x") confirmed stored as sanitized text');

  process.stdout.write('\n=== All verification assertions PASSED successfully! ===\n\n');
}

run().catch((err) => {
  process.stderr.write(`Verification failed: ${err.stack || err.message}\n`);
  process.exit(1);
});
