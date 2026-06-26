import 'dotenv/config'
import { PrismaClient, Role, AttendanceStatus, AssessmentType, FeeStatus, LeaveType, LeaveStatus, NotificationType, NotificationPriority, TicketCategory, TicketPriority, TicketStatus, AlertSeverity, AlertScope, ConsentStatus, ODTripStatus, TransactionCategory, MealType, CheckInType, LocationAlertType, SOSStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clear existing data (order matters: children before parents)
  await prisma.chatMessage.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.anomaly.deleteMany()
  await prisma.parentControl.deleteMany()
  await prisma.sOSAlert.deleteMany()
  await prisma.foodLog.deleteMany()
  await prisma.campusTransaction.deleteMany()
  await prisma.campusOneAccount.deleteMany()
  await prisma.oDTrip.deleteMany()
  await prisma.locationAlert.deleteMany()
  await prisma.studentCheckIn.deleteMany()
  await prisma.geofenceZone.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.ticketReply.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.alertAcknowledgement.deleteMany()
  await prisma.noticeAcknowledgement.deleteMany()
  await prisma.feeAcknowledgement.deleteMany()
  await prisma.emergencyAlert.deleteMany()
  await prisma.notice.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.leaveRecord.deleteMany()
  await prisma.feeRecord.deleteMany()
  await prisma.markRecord.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.facultySubject.deleteMany()
  await prisma.student.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.department.deleteMany()
  await prisma.faculty.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.calendarEvent.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 12)

  // Create Departments
  const csDept = await prisma.department.create({ data: { code: 'CS', name: 'Computer Science & Engineering' } })
  const eceDept = await prisma.department.create({ data: { code: 'ECE', name: 'Electronics & Communication Engineering' } })
  const mechDept = await prisma.department.create({ data: { code: 'MECH', name: 'Mechanical Engineering' } })

  // ============================================
  // USERS: Admin, Faculty, Parents
  // ============================================

  // Super Admin
  const superAdminUser = await prisma.user.create({
    data: {
      role: Role.SUPER_ADMIN,
      name: 'Dr. Venkatesh Iyer',
      email: 'superadmin@college.edu',
      phone: '9876543200',
      passwordHash,
      isActive: true,
    }
  })
  await prisma.admin.create({ data: { userId: superAdminUser.id, department: 'Administration' } })

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      role: Role.ADMIN,
      name: 'Dr. Ramesh Kumar',
      email: 'admin@college.edu',
      phone: '9876543210',
      passwordHash,
      isActive: true,
    }
  })
  await prisma.admin.create({ data: { userId: adminUser.id, department: 'Administration' } })

  // Faculty Users
  const faculty1User = await prisma.user.create({
    data: { role: Role.FACULTY, name: 'Prof. Priya Sharma', email: 'priya@college.edu', phone: '9876543211', passwordHash, isActive: true }
  })
  const faculty2User = await prisma.user.create({
    data: { role: Role.FACULTY, name: 'Prof. Suresh Babu', email: 'suresh@college.edu', phone: '9876543212', passwordHash, isActive: true }
  })
  const faculty3User = await prisma.user.create({
    data: { role: Role.FACULTY, name: 'Prof. Lakshmi Narayanan', email: 'lakshmi@college.edu', phone: '9876543213', passwordHash, isActive: true }
  })
  const faculty4User = await prisma.user.create({
    data: { role: Role.FACULTY, name: 'Prof. Anand Krishnan', email: 'anand@college.edu', phone: '9876543214', passwordHash, isActive: true }
  })

  const faculty1 = await prisma.faculty.create({ data: { userId: faculty1User.id, department: 'CS', designation: 'Assistant Professor' } })
  const faculty2 = await prisma.faculty.create({ data: { userId: faculty2User.id, department: 'CS', designation: 'Associate Professor' } })
  const faculty3 = await prisma.faculty.create({ data: { userId: faculty3User.id, department: 'ECE', designation: 'Assistant Professor' } })
  const faculty4 = await prisma.faculty.create({ data: { userId: faculty4User.id, department: 'MECH', designation: 'Professor & HOD' } })

  // Parent Users
  const parent1User = await prisma.user.create({
    data: { role: Role.PARENT, name: 'Mohan Raj', email: 'mohan@gmail.com', phone: '9876543220', passwordHash, isActive: true }
  })
  const parent2User = await prisma.user.create({
    data: { role: Role.PARENT, name: 'Kavitha Devi', email: 'kavitha@gmail.com', phone: '9876543221', passwordHash, isActive: true }
  })
  const parent3User = await prisma.user.create({
    data: { role: Role.PARENT, name: 'Senthil Kumar', email: 'senthil@gmail.com', phone: '9876543222', passwordHash, isActive: true }
  })

  const parent1 = await prisma.parent.create({ data: { userId: parent1User.id, relation: 'Father', occupation: 'Business' } })
  const parent2 = await prisma.parent.create({ data: { userId: parent2User.id, relation: 'Mother', occupation: 'Teacher' } })
  const parent3 = await prisma.parent.create({ data: { userId: parent3User.id, relation: 'Father', occupation: 'Engineer' } })

  // ============================================
  // SUBJECTS
  // ============================================

  const csSubjects = await Promise.all([
    prisma.subject.create({ data: { code: 'CS301', name: 'Data Structures & Algorithms', semester: 3, departmentId: csDept.id, credits: 4 } }),
    prisma.subject.create({ data: { code: 'CS302', name: 'Object Oriented Programming', semester: 3, departmentId: csDept.id, credits: 3 } }),
    prisma.subject.create({ data: { code: 'CS303', name: 'Database Management Systems', semester: 3, departmentId: csDept.id, credits: 4 } }),
    prisma.subject.create({ data: { code: 'CS304', name: 'Computer Networks', semester: 3, departmentId: csDept.id, credits: 3 } }),
    prisma.subject.create({ data: { code: 'CS305', name: 'Operating Systems', semester: 3, departmentId: csDept.id, credits: 3 } }),
  ])

  const eceSubjects = await Promise.all([
    prisma.subject.create({ data: { code: 'EC301', name: 'Signals & Systems', semester: 3, departmentId: eceDept.id, credits: 4 } }),
    prisma.subject.create({ data: { code: 'EC302', name: 'Digital Electronics', semester: 3, departmentId: eceDept.id, credits: 3 } }),
    prisma.subject.create({ data: { code: 'EC303', name: 'Analog Communication', semester: 3, departmentId: eceDept.id, credits: 4 } }),
  ])

  const mechSubjects = await Promise.all([
    prisma.subject.create({ data: { code: 'ME301', name: 'Thermodynamics', semester: 3, departmentId: mechDept.id, credits: 4 } }),
    prisma.subject.create({ data: { code: 'ME302', name: 'Fluid Mechanics', semester: 3, departmentId: mechDept.id, credits: 3 } }),
    prisma.subject.create({ data: { code: 'ME303', name: 'Manufacturing Technology', semester: 3, departmentId: mechDept.id, credits: 4 } }),
  ])

  // Assign subjects to faculty
  await prisma.facultySubject.createMany({
    data: [
      { facultyId: faculty1.id, subjectId: csSubjects[0].id },
      { facultyId: faculty1.id, subjectId: csSubjects[1].id },
      { facultyId: faculty2.id, subjectId: csSubjects[2].id },
      { facultyId: faculty2.id, subjectId: csSubjects[3].id },
      { facultyId: faculty2.id, subjectId: csSubjects[4].id },
      { facultyId: faculty3.id, subjectId: eceSubjects[0].id },
      { facultyId: faculty3.id, subjectId: eceSubjects[1].id },
      { facultyId: faculty3.id, subjectId: eceSubjects[2].id },
      { facultyId: faculty4.id, subjectId: mechSubjects[0].id },
      { facultyId: faculty4.id, subjectId: mechSubjects[1].id },
      { facultyId: faculty4.id, subjectId: mechSubjects[2].id },
    ]
  })

  // ============================================
  // STUDENTS (CS, ECE, MECH)
  // ============================================

  const student1 = await prisma.student.create({
    data: {
      registerNumber: 'CS21001', name: 'Arjun Raj',
      departmentId: csDept.id, year: 2, semester: 3, section: 'A',
      parentId: parent1.id, consentStatus: ConsentStatus.GIVEN,
    }
  })
  const student2 = await prisma.student.create({
    data: {
      registerNumber: 'CS21002', name: 'Preethi K',
      departmentId: csDept.id, year: 2, semester: 3, section: 'A',
      parentId: parent2.id, consentStatus: ConsentStatus.GIVEN,
    }
  })
  const student3 = await prisma.student.create({
    data: {
      registerNumber: 'CS21003', name: 'Vikram S',
      departmentId: csDept.id, year: 2, semester: 3, section: 'B',
      parentId: parent3.id, consentStatus: ConsentStatus.GIVEN,
    }
  })

  // Additional students for ECE and MECH departments
  const student4 = await prisma.student.create({
    data: {
      registerNumber: 'EC21001', name: 'Deepa M',
      departmentId: eceDept.id, year: 2, semester: 3, section: 'A',
      parentId: parent1.id, consentStatus: ConsentStatus.GIVEN,
    }
  })
  const student5 = await prisma.student.create({
    data: {
      registerNumber: 'ME21001', name: 'Karthik R',
      departmentId: mechDept.id, year: 2, semester: 3, section: 'A',
      parentId: parent2.id, consentStatus: ConsentStatus.GIVEN,
    }
  })

  const allStudents = [student1, student2, student3, student4, student5]

  // ============================================
  // ATTENDANCE RECORDS (last 60 days)
  // ============================================

  const today = new Date()
  const attendanceRates = [0.72, 0.88, 0.95, 0.80, 0.85]
  const subjectSets = [csSubjects, csSubjects, csSubjects, eceSubjects, mechSubjects]

  for (let i = 60; i >= 1; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    for (let si = 0; si < allStudents.length; si++) {
      const studentSubjects = subjectSets[si]
      const rate = attendanceRates[si]
      for (const subject of studentSubjects) {
        const status = Math.random() < rate ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT
        await prisma.attendanceRecord.create({
          data: { studentId: allStudents[si].id, subjectId: subject.id, date, status }
        })
      }
    }
  }

  // ============================================
  // MARK RECORDS
  // ============================================

  const assessments: AssessmentType[] = [AssessmentType.INTERNAL_1, AssessmentType.INTERNAL_2, AssessmentType.ASSIGNMENT, AssessmentType.QUIZ]
  const markRanges = [
    { base: 58, range: 20 },  // student1
    { base: 72, range: 20 },  // student2
    { base: 82, range: 15 },  // student3
    { base: 65, range: 20 },  // student4
    { base: 70, range: 20 },  // student5
  ]

  for (let si = 0; si < allStudents.length; si++) {
    const studentSubjects = subjectSets[si]
    const { base, range } = markRanges[si]
    for (const subject of studentSubjects) {
      for (const assessment of assessments) {
        await prisma.markRecord.create({
          data: {
            studentId: allStudents[si].id, subjectId: subject.id,
            assessmentType: assessment,
            score: base + Math.floor(Math.random() * range),
            maxScore: 100, publishedAt: new Date()
          }
        })
      }
    }
  }

  // ============================================
  // FEE RECORDS (all students)
  // ============================================

  await Promise.all([
    // Student 1 - Arjun
    prisma.feeRecord.create({ data: { studentId: student1.id, term: 'Semester 3 - 2024', description: 'Tuition Fee', totalAmount: 45000, paidAmount: 45000, dueDate: new Date('2024-08-01'), status: FeeStatus.PAID, paidAt: new Date('2024-07-28') } }),
    prisma.feeRecord.create({ data: { studentId: student1.id, term: 'Semester 4 - 2025', description: 'Tuition Fee', totalAmount: 45000, paidAmount: 22000, dueDate: new Date('2025-02-01'), status: FeeStatus.PARTIAL } }),
    // Student 2 - Preethi
    prisma.feeRecord.create({ data: { studentId: student2.id, term: 'Semester 3 - 2024', description: 'Tuition Fee', totalAmount: 45000, paidAmount: 45000, dueDate: new Date('2024-08-01'), status: FeeStatus.PAID, paidAt: new Date('2024-07-25') } }),
    prisma.feeRecord.create({ data: { studentId: student2.id, term: 'Semester 4 - 2025', description: 'Tuition Fee', totalAmount: 45000, paidAmount: 45000, dueDate: new Date('2025-02-01'), status: FeeStatus.PAID, paidAt: new Date('2025-01-20') } }),
    prisma.feeRecord.create({ data: { studentId: student2.id, term: 'Hostel Fee - 2025', description: 'Hostel Accommodation', totalAmount: 30000, paidAmount: 15000, dueDate: new Date('2025-03-01'), status: FeeStatus.PARTIAL } }),
    // Student 3 - Vikram
    prisma.feeRecord.create({ data: { studentId: student3.id, term: 'Semester 3 - 2024', description: 'Tuition Fee', totalAmount: 45000, paidAmount: 45000, dueDate: new Date('2024-08-01'), status: FeeStatus.PAID, paidAt: new Date('2024-07-30') } }),
    prisma.feeRecord.create({ data: { studentId: student3.id, term: 'Semester 4 - 2025', description: 'Tuition Fee', totalAmount: 45000, paidAmount: 0, dueDate: new Date('2025-03-15'), status: FeeStatus.OVERDUE } }),
    // Student 4 - Deepa (ECE)
    prisma.feeRecord.create({ data: { studentId: student4.id, term: 'Semester 3 - 2024', description: 'Tuition Fee', totalAmount: 42000, paidAmount: 42000, dueDate: new Date('2024-08-01'), status: FeeStatus.PAID, paidAt: new Date('2024-07-29') } }),
    prisma.feeRecord.create({ data: { studentId: student4.id, term: 'Semester 4 - 2025', description: 'Tuition Fee', totalAmount: 42000, paidAmount: 42000, dueDate: new Date('2025-02-01'), status: FeeStatus.PAID, paidAt: new Date('2025-01-15') } }),
    // Student 5 - Karthik (MECH)
    prisma.feeRecord.create({ data: { studentId: student5.id, term: 'Semester 3 - 2024', description: 'Tuition Fee', totalAmount: 40000, paidAmount: 40000, dueDate: new Date('2024-08-01'), status: FeeStatus.PAID, paidAt: new Date('2024-07-31') } }),
    prisma.feeRecord.create({ data: { studentId: student5.id, term: 'Semester 4 - 2025', description: 'Tuition Fee', totalAmount: 40000, paidAmount: 20000, dueDate: new Date('2025-02-15'), status: FeeStatus.PARTIAL } }),
    prisma.feeRecord.create({ data: { studentId: student5.id, term: 'Lab Fee - 2025', description: 'Workshop & Lab', totalAmount: 15000, paidAmount: 0, dueDate: new Date('2025-03-10'), status: FeeStatus.PENDING } }),
  ])

  // ============================================
  // LEAVE RECORDS
  // ============================================

  await prisma.leaveRecord.createMany({
    data: [
      { studentId: student1.id, type: LeaveType.MEDICAL, startDate: new Date('2025-01-10'), endDate: new Date('2025-01-12'), reason: 'Fever and cold', status: LeaveStatus.APPROVED, remarks: 'Medical certificate verified' },
      { studentId: student1.id, type: LeaveType.PERSONAL, startDate: new Date('2025-02-15'), endDate: new Date('2025-02-15'), reason: 'Family function', status: LeaveStatus.APPROVED },
      { studentId: student2.id, type: LeaveType.OD, startDate: new Date('2025-01-20'), endDate: new Date('2025-01-21'), reason: 'Hackathon participation at IIT Madras', status: LeaveStatus.APPROVED, remarks: 'Won 2nd place' },
      { studentId: student2.id, type: LeaveType.MEDICAL, startDate: new Date('2025-03-05'), endDate: new Date('2025-03-06'), reason: 'Dental appointment', status: LeaveStatus.APPROVED },
      { studentId: student3.id, type: LeaveType.MEDICAL, startDate: new Date('2025-03-01'), endDate: new Date('2025-03-03'), reason: 'Surgery recovery', status: LeaveStatus.PENDING },
      { studentId: student4.id, type: LeaveType.OD, startDate: new Date('2025-02-10'), endDate: new Date('2025-02-10'), reason: 'Paper presentation at NIT Trichy', status: LeaveStatus.APPROVED },
      { studentId: student5.id, type: LeaveType.PERSONAL, startDate: new Date('2025-02-20'), endDate: new Date('2025-02-20'), reason: 'Family emergency', status: LeaveStatus.APPROVED },
    ]
  })

  // ============================================
  // NOTIFICATIONS
  // ============================================

  await prisma.notification.createMany({
    data: [
      { targetRole: Role.PARENT, studentId: student1.id, type: NotificationType.LOW_ATTENDANCE, title: 'Low Attendance Alert', message: 'Arjun Raj\'s attendance has dropped to 72%. Minimum required is 75%.', priority: NotificationPriority.HIGH, isRead: false },
      { targetRole: Role.PARENT, studentId: student1.id, type: NotificationType.FEE_DUE, title: 'Fee Payment Reminder', message: 'Semester 4 fee of ₹23,000 is pending. Due date: 01 Feb 2025.', priority: NotificationPriority.HIGH, isRead: false },
      { targetRole: Role.PARENT, studentId: student2.id, type: NotificationType.MARKS_PUBLISHED, title: 'Internal Assessment Results', message: 'Internal Assessment 2 results for Preethi K are now available.', priority: NotificationPriority.MEDIUM, isRead: true },
      { targetRole: Role.PARENT, studentId: student2.id, type: NotificationType.LOW_ATTENDANCE, title: 'Attendance Update', message: 'Preethi K attendance is 88%. Keep it up!', priority: NotificationPriority.LOW, isRead: false },
      { targetRole: Role.PARENT, studentId: student3.id, type: NotificationType.FEE_DUE, title: 'Fee Overdue Notice', message: 'Semester 4 fee of ₹45,000 for Vikram S is overdue. Please pay immediately.', priority: NotificationPriority.CRITICAL, isRead: false },
      { targetRole: Role.PARENT, studentId: student3.id, type: NotificationType.LEAVE_UPDATE, title: 'Leave Application Update', message: 'Leave application for Vikram S (Mar 1-3) is pending approval.', priority: NotificationPriority.MEDIUM, isRead: false },
      { targetRole: Role.PARENT, studentId: student4.id, type: NotificationType.MARKS_PUBLISHED, title: 'Marks Published', message: 'Internal Assessment 2 results for Deepa M are now available.', priority: NotificationPriority.MEDIUM, isRead: false },
      { targetRole: Role.PARENT, studentId: student5.id, type: NotificationType.FEE_DUE, title: 'Fee Reminder', message: 'Lab fee of ₹15,000 for Karthik R is pending.', priority: NotificationPriority.HIGH, isRead: false },
    ]
  })

  // ============================================
  // NOTICES
  // ============================================

  const notice1 = await prisma.notice.create({
    data: {
      title: 'Annual Sports Day - Participation Announcement',
      content: 'The Annual Sports Day will be held on March 25, 2025. All students are encouraged to participate.',
      category: 'Event', requiresAcknowledgement: false, isActive: true, publishedAt: new Date('2025-03-10'),
    }
  })

  const notice2 = await prisma.notice.create({
    data: {
      title: 'Semester Examination Schedule - April 2025',
      content: 'The semester examinations for all departments will commence from April 14, 2025.',
      category: 'Examination', requiresAcknowledgement: true, isActive: true, publishedAt: new Date('2025-03-12'),
    }
  })

  await prisma.notice.create({
    data: {
      title: 'Fee Payment - Last Date Extended',
      content: 'The last date for Semester 4 fee payment has been extended to March 31, 2025.',
      category: 'Fee', requiresAcknowledgement: true, isActive: true, publishedAt: new Date('2025-03-15'),
    }
  })

  await prisma.noticeAcknowledgement.create({ data: { noticeId: notice2.id, parentId: parent2.id } })

  // ============================================
  // EMERGENCY ALERT
  // ============================================

  await prisma.emergencyAlert.create({
    data: {
      title: 'College Closed - Heavy Rain Warning',
      message: 'Due to the Red Alert weather warning, the college will remain closed on March 19, 2025. All classes and examinations scheduled for this date are postponed.',
      severity: AlertSeverity.CRITICAL, targetScope: AlertScope.INSTITUTION, isActive: true, publishedAt: new Date(),
    }
  })

  // ============================================
  // TICKETS
  // ============================================

  const ticket1 = await prisma.ticket.create({
    data: {
      parentId: parent1.id, studentId: student1.id,
      category: TicketCategory.ATTENDANCE, subject: 'Attendance discrepancy in CS301',
      description: 'My son Arjun was present on January 15 but it shows as absent. Please review.',
      priority: TicketPriority.MEDIUM, status: TicketStatus.IN_PROGRESS,
    }
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      parentId: parent3.id, studentId: student3.id,
      category: TicketCategory.FEE, subject: 'Fee payment receipt not received',
      description: 'We paid the semester 3 fee but have not received the official receipt.',
      priority: TicketPriority.HIGH, status: TicketStatus.RESOLVED,
    }
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      parentId: parent2.id, studentId: student2.id,
      category: TicketCategory.MARKS, subject: 'Request for re-evaluation of CS302 internal',
      description: 'Preethi feels her CS302 paper was not evaluated fairly. Requesting re-evaluation.',
      priority: TicketPriority.MEDIUM, status: TicketStatus.OPEN,
    }
  })

  await prisma.ticketReply.createMany({
    data: [
      { ticketId: ticket1.id, senderId: adminUser.id, senderRole: Role.ADMIN, message: 'Thank you for bringing this to our attention. We have forwarded this to Prof. Priya Sharma for verification.' },
      { ticketId: ticket2.id, senderId: adminUser.id, senderRole: Role.ADMIN, message: 'The fee receipt has been sent to your registered email address.' },
      { ticketId: ticket3.id, senderId: faculty1User.id, senderRole: Role.FACULTY, message: 'We will re-evaluate the paper. Please allow 3 working days.' },
    ]
  })

  // ============================================
  // CALENDAR EVENTS
  // ============================================

  await prisma.calendarEvent.createMany({
    data: [
      { title: 'Internal Assessment 3', description: 'Third internal assessment for all 3rd semester students', type: 'Examination', startDate: new Date('2025-03-24'), endDate: new Date('2025-03-28'), isPublic: true },
      { title: 'Annual Sports Day', description: 'Annual sports day celebration', type: 'Event', startDate: new Date('2025-03-25'), isPublic: true },
      { title: 'Semester Examination Begins', description: 'Semester exams for all departments', type: 'Examination', startDate: new Date('2025-04-14'), endDate: new Date('2025-04-30'), isPublic: true },
      { title: 'College Foundation Day', description: 'College Foundation Day Celebration', type: 'Holiday', startDate: new Date('2025-04-05'), isPublic: true },
      { title: 'Technical Symposium', description: 'Inter-college technical symposium', type: 'Event', startDate: new Date('2025-04-10'), endDate: new Date('2025-04-11'), isPublic: true },
    ]
  })

  // ============================================
  // SYSTEM CONFIG
  // ============================================

  await prisma.systemConfig.createMany({
    data: [
      { key: 'attendance_minimum_threshold', value: '75', description: 'Minimum attendance percentage required' },
      { key: 'attendance_warning_threshold', value: '80', description: 'Attendance warning threshold' },
      { key: 'consecutive_absence_alert', value: '3', description: 'Consecutive absences to trigger alert' },
      { key: 'college_name', value: 'Madras Engineering College', description: 'College name' },
      { key: 'college_short_name', value: 'MEC', description: 'College short name' },
      { key: 'academic_year', value: '2024-2025', description: 'Current academic year' },
    ]
  })

  // ============================================
  // GEOFENCE ZONES (shared by all students)
  // ============================================

  await prisma.geofenceZone.create({ data: { name: 'MEC Main Campus', latitude: 12.928394, longitude: 79.992942, radiusM: 350, isActive: true } })
  await prisma.geofenceZone.create({ data: { name: 'MEC Girls Hostel', latitude: 12.927634, longitude: 79.993125, radiusM: 20, isActive: true } })
  await prisma.geofenceZone.create({ data: { name: 'MEC Boys Hostel', latitude: 12.927772, longitude: 79.993125, radiusM: 20, isActive: true } })
  await prisma.geofenceZone.create({ data: { name: 'MEC Power House', latitude: 12.927601, longitude: 79.992970, radiusM: 15, isActive: true } })

  // ============================================
  // MONITORING DATA - Student 1 (Arjun Raj)
  // ============================================

  const odLeave1 = await prisma.leaveRecord.create({
    data: {
      studentId: student1.id, type: LeaveType.OD,
      startDate: new Date('2026-03-18'), endDate: new Date('2026-03-18'),
      reason: 'Anna University project review', status: LeaveStatus.APPROVED, remarks: 'Faculty approved',
    }
  })

  await prisma.oDTrip.create({
    data: {
      leaveRecordId: odLeave1.id, studentId: student1.id,
      destinationName: 'Anna University, Chennai', destinationLat: 13.0107, destinationLng: 80.2354,
      radiusM: 500, status: ODTripStatus.ARRIVED,
      departedAt: new Date('2026-03-18T08:30:00'), arrivedAt: new Date('2026-03-18T10:15:00'),
      returnedAt: new Date('2026-03-18T16:45:00'),
      lastLat: 13.0107, lastLng: 80.2354, lastLocationAt: new Date('2026-03-18T10:15:00'),
    }
  })
  await prisma.oDTrip.create({
    data: {
      studentId: student1.id,
      destinationName: 'TCS Office, Siruseri', destinationLat: 12.8277, destinationLng: 80.2205,
      radiusM: 500, status: ODTripStatus.IN_TRANSIT,
      departedAt: new Date('2026-03-20T09:00:00'),
      lastLat: 12.8850, lastLng: 80.1500, lastLocationAt: new Date('2026-03-20T09:45:00'),
    }
  })

  // Campus Account - Student 1
  const campusAccount1 = await prisma.campusOneAccount.create({
    data: { studentId: student1.id, campusOneId: 'C1-MEC-21001', balance: 2500, isConnected: true }
  })

  // Campus Account - Student 2
  const campusAccount2 = await prisma.campusOneAccount.create({
    data: { studentId: student2.id, campusOneId: 'C1-MEC-21002', balance: 3200, isConnected: true }
  })

  // Campus Account - Student 3
  const campusAccount3 = await prisma.campusOneAccount.create({
    data: { studentId: student3.id, campusOneId: 'C1-MEC-21003', balance: 1800, isConnected: true }
  })

  // ============================================
  // TRANSACTIONS for all 3 students
  // ============================================

  const txnDataAll: { accountId: string; data: { category: TransactionCategory; vendor: string; description: string; amount: number; daysAgo: number; hour: number }[] }[] = [
    {
      accountId: campusAccount1.id,
      data: [
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Lunch - Meals', amount: 60, daysAgo: 0, hour: 12 },
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Tea & Biscuit', amount: 30, daysAgo: 0, hour: 10 },
        { category: TransactionCategory.STATIONERY, vendor: 'Campus Store', description: 'A4 Sheets & Pen', amount: 45, daysAgo: 1, hour: 11 },
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Biryani', amount: 90, daysAgo: 1, hour: 13 },
        { category: TransactionCategory.PRINTING, vendor: 'Xerox Centre', description: 'Assignment printout', amount: 30, daysAgo: 1, hour: 15 },
        { category: TransactionCategory.FOOD, vendor: 'Juice Corner', description: 'Fresh juice & sandwich', amount: 75, daysAgo: 2, hour: 11 },
        { category: TransactionCategory.TRANSPORT, vendor: 'Auto Stand', description: 'Auto to bus stand', amount: 80, daysAgo: 2, hour: 17 },
      ]
    },
    {
      accountId: campusAccount2.id,
      data: [
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Breakfast - Dosa', amount: 40, daysAgo: 0, hour: 8 },
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Lunch - Meals', amount: 60, daysAgo: 0, hour: 12 },
        { category: TransactionCategory.FOOD, vendor: 'Tea Stall', description: 'Coffee', amount: 25, daysAgo: 0, hour: 15 },
        { category: TransactionCategory.STATIONERY, vendor: 'Campus Store', description: 'Notebook', amount: 50, daysAgo: 1, hour: 10 },
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Chicken biryani', amount: 90, daysAgo: 1, hour: 13 },
        { category: TransactionCategory.PRINTING, vendor: 'Xerox Centre', description: 'Notes photocopy', amount: 20, daysAgo: 2, hour: 11 },
      ]
    },
    {
      accountId: campusAccount3.id,
      data: [
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Idli & Sambar', amount: 35, daysAgo: 0, hour: 8 },
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Meals', amount: 55, daysAgo: 0, hour: 12 },
        { category: TransactionCategory.TRANSPORT, vendor: 'Bus', description: 'Bus ticket', amount: 50, daysAgo: 1, hour: 16 },
        { category: TransactionCategory.FOOD, vendor: 'College Canteen', description: 'Parotta & Curry', amount: 70, daysAgo: 1, hour: 13 },
        { category: TransactionCategory.STATIONERY, vendor: 'Campus Store', description: 'Lab record', amount: 80, daysAgo: 2, hour: 14 },
      ]
    }
  ]

  for (const group of txnDataAll) {
    for (const txn of group.data) {
      const txnDate = new Date()
      txnDate.setDate(txnDate.getDate() - txn.daysAgo)
      txnDate.setHours(txn.hour, Math.floor(Math.random() * 60), 0, 0)
      await prisma.campusTransaction.create({
        data: {
          accountId: group.accountId, category: txn.category, vendor: txn.vendor,
          description: txn.description, amount: txn.amount, transactionAt: txnDate,
        }
      })
    }
  }

  // ============================================
  // FOOD LOGS for all 3 students
  // ============================================

  const foodLogsAll: { studentId: string; logs: { mealType: MealType; items: string; vendor: string; amount: number; daysAgo: number; hour: number }[] }[] = [
    {
      studentId: student1.id,
      logs: [
        { mealType: MealType.BREAKFAST, items: 'Idli (3) with chutney & sambar', vendor: 'College Canteen', amount: 35, daysAgo: 0, hour: 8 },
        { mealType: MealType.LUNCH, items: 'Rice, sambar, rasam, poriyal, curd', vendor: 'College Canteen', amount: 60, daysAgo: 0, hour: 12 },
        { mealType: MealType.SNACKS, items: 'Tea & biscuit', vendor: 'Tea Stall', amount: 30, daysAgo: 0, hour: 16 },
        { mealType: MealType.BREAKFAST, items: 'Dosa (2) with coconut chutney', vendor: 'College Canteen', amount: 40, daysAgo: 1, hour: 8 },
        { mealType: MealType.LUNCH, items: 'Chicken biryani with raita', vendor: 'College Canteen', amount: 90, daysAgo: 1, hour: 13 },
        { mealType: MealType.DINNER, items: 'Chapati with paneer butter masala', vendor: 'Hostel Mess', amount: 50, daysAgo: 1, hour: 20 },
      ]
    },
    {
      studentId: student2.id,
      logs: [
        { mealType: MealType.BREAKFAST, items: 'Pongal with vada', vendor: 'College Canteen', amount: 45, daysAgo: 0, hour: 8 },
        { mealType: MealType.LUNCH, items: 'Veg meals - full', vendor: 'College Canteen', amount: 60, daysAgo: 0, hour: 12 },
        { mealType: MealType.SNACKS, items: 'Coffee & samosa', vendor: 'Tea Stall', amount: 35, daysAgo: 0, hour: 16 },
        { mealType: MealType.DINNER, items: 'Chapati with dal', vendor: 'Hostel Mess', amount: 45, daysAgo: 0, hour: 20 },
        { mealType: MealType.BREAKFAST, items: 'Upma with chutney', vendor: 'College Canteen', amount: 30, daysAgo: 1, hour: 8 },
        { mealType: MealType.LUNCH, items: 'Rice, sambar, rasam', vendor: 'College Canteen', amount: 55, daysAgo: 1, hour: 12 },
        { mealType: MealType.DINNER, items: 'Fried rice with manchurian', vendor: 'Hostel Mess', amount: 55, daysAgo: 1, hour: 20 },
      ]
    },
    {
      studentId: student3.id,
      logs: [
        { mealType: MealType.BREAKFAST, items: 'Poori (3) with potato masala', vendor: 'College Canteen', amount: 40, daysAgo: 0, hour: 8 },
        { mealType: MealType.LUNCH, items: 'Egg biryani', vendor: 'College Canteen', amount: 75, daysAgo: 0, hour: 13 },
        { mealType: MealType.BREAKFAST, items: 'Idli (4) with tomato chutney', vendor: 'College Canteen', amount: 35, daysAgo: 1, hour: 8 },
        { mealType: MealType.LUNCH, items: 'Chapati with dal & poriyal', vendor: 'College Canteen', amount: 55, daysAgo: 1, hour: 12 },
        { mealType: MealType.DINNER, items: 'Parotta with chicken curry', vendor: 'Hostel Mess', amount: 70, daysAgo: 1, hour: 20 },
      ]
    }
  ]

  for (const group of foodLogsAll) {
    for (const fl of group.logs) {
      const logDate = new Date()
      logDate.setDate(logDate.getDate() - fl.daysAgo)
      logDate.setHours(fl.hour, Math.floor(Math.random() * 30), 0, 0)
      await prisma.foodLog.create({
        data: {
          studentId: group.studentId, mealType: fl.mealType,
          items: fl.items, vendor: fl.vendor, amount: fl.amount, loggedAt: logDate,
        }
      })
    }
  }

  // ============================================
  // CHECK-INS for all 3 CS students
  // ============================================

  const checkInDataAll: { studentId: string; entries: { type: CheckInType; label: string; daysAgo: number; hour: number; min: number; lat: number; lng: number }[] }[] = [
    {
      studentId: student1.id,
      entries: [
        { type: CheckInType.CAMPUS_ENTRY, label: 'Main Gate', daysAgo: 0, hour: 8, min: 15, lat: 12.928900, lng: 79.992400 },
        { type: CheckInType.AUTO, label: 'Admin Block', daysAgo: 0, hour: 9, min: 0, lat: 12.928500, lng: 79.992700 },
        { type: CheckInType.AUTO, label: 'Library', daysAgo: 0, hour: 9, min: 45, lat: 12.928200, lng: 79.993100 },
        { type: CheckInType.AUTO, label: 'Main Block', daysAgo: 0, hour: 11, min: 0, lat: 12.928394, lng: 79.992942 },
        { type: CheckInType.AUTO, label: 'Canteen', daysAgo: 0, hour: 12, min: 30, lat: 12.928100, lng: 79.992600 },
        { type: CheckInType.AUTO, label: 'Lab Block', daysAgo: 0, hour: 14, min: 0, lat: 12.928600, lng: 79.993200 },
        { type: CheckInType.CAMPUS_ENTRY, label: 'Main Gate', daysAgo: 1, hour: 8, min: 5, lat: 12.928900, lng: 79.992400 },
        { type: CheckInType.AUTO, label: 'Main Block', daysAgo: 1, hour: 9, min: 15, lat: 12.928394, lng: 79.992942 },
        { type: CheckInType.CAMPUS_EXIT, label: 'Main Gate', daysAgo: 1, hour: 17, min: 30, lat: 12.928900, lng: 79.992400 },
      ]
    },
    {
      studentId: student2.id,
      entries: [
        { type: CheckInType.CAMPUS_ENTRY, label: 'Main Gate', daysAgo: 0, hour: 7, min: 50, lat: 12.928900, lng: 79.992400 },
        { type: CheckInType.AUTO, label: 'Girls Hostel', daysAgo: 0, hour: 8, min: 10, lat: 12.927634, lng: 79.993125 },
        { type: CheckInType.AUTO, label: 'Main Block', daysAgo: 0, hour: 9, min: 0, lat: 12.928394, lng: 79.992942 },
        { type: CheckInType.AUTO, label: 'Library', daysAgo: 0, hour: 11, min: 30, lat: 12.928200, lng: 79.993100 },
        { type: CheckInType.AUTO, label: 'Canteen', daysAgo: 0, hour: 12, min: 45, lat: 12.928100, lng: 79.992600 },
        { type: CheckInType.AUTO, label: 'Lab Block', daysAgo: 0, hour: 14, min: 15, lat: 12.928600, lng: 79.993200 },
        { type: CheckInType.CAMPUS_ENTRY, label: 'Main Gate', daysAgo: 1, hour: 8, min: 0, lat: 12.928900, lng: 79.992400 },
        { type: CheckInType.AUTO, label: 'Main Block', daysAgo: 1, hour: 9, min: 10, lat: 12.928394, lng: 79.992942 },
        { type: CheckInType.AUTO, label: 'Library', daysAgo: 1, hour: 14, min: 0, lat: 12.928200, lng: 79.993100 },
        { type: CheckInType.CAMPUS_EXIT, label: 'Main Gate', daysAgo: 1, hour: 16, min: 45, lat: 12.928900, lng: 79.992400 },
      ]
    },
    {
      studentId: student3.id,
      entries: [
        { type: CheckInType.CAMPUS_ENTRY, label: 'Main Gate', daysAgo: 0, hour: 8, min: 30, lat: 12.928900, lng: 79.992400 },
        { type: CheckInType.AUTO, label: 'Main Block', daysAgo: 0, hour: 9, min: 0, lat: 12.928394, lng: 79.992942 },
        { type: CheckInType.AUTO, label: 'Boys Hostel', daysAgo: 0, hour: 12, min: 15, lat: 12.927772, lng: 79.993125 },
        { type: CheckInType.AUTO, label: 'Canteen', daysAgo: 0, hour: 12, min: 45, lat: 12.928100, lng: 79.992600 },
        { type: CheckInType.AUTO, label: 'Lab Block', daysAgo: 0, hour: 14, min: 0, lat: 12.928600, lng: 79.993200 },
        { type: CheckInType.CAMPUS_ENTRY, label: 'Main Gate', daysAgo: 1, hour: 8, min: 20, lat: 12.928900, lng: 79.992400 },
        { type: CheckInType.CAMPUS_EXIT, label: 'Main Gate', daysAgo: 1, hour: 16, min: 30, lat: 12.928900, lng: 79.992400 },
      ]
    }
  ]

  for (const group of checkInDataAll) {
    for (const ci of group.entries) {
      const ciDate = new Date()
      ciDate.setDate(ciDate.getDate() - ci.daysAgo)
      ciDate.setHours(ci.hour, ci.min, 0, 0)
      await prisma.studentCheckIn.create({
        data: {
          studentId: group.studentId, latitude: ci.lat, longitude: ci.lng,
          label: ci.label, type: ci.type, createdAt: ciDate,
        }
      })
    }
  }

  // ============================================
  // LOCATION ALERTS for all students
  // ============================================

  const alertDate1 = new Date(); alertDate1.setDate(alertDate1.getDate() - 1); alertDate1.setHours(8, 10, 0, 0)
  const alertDate2 = new Date(); alertDate2.setDate(alertDate2.getDate() - 1); alertDate2.setHours(17, 35, 0, 0)
  const alertDate3 = new Date(); alertDate3.setDate(alertDate3.getDate() - 3); alertDate3.setHours(9, 0, 0, 0)
  const alertDate4 = new Date(); alertDate4.setDate(alertDate4.getDate() - 1); alertDate4.setHours(7, 55, 0, 0)
  const alertDate5 = new Date(); alertDate5.setDate(alertDate5.getDate() - 1); alertDate5.setHours(16, 50, 0, 0)
  const alertDate6 = new Date(); alertDate6.setDate(alertDate6.getDate() - 1); alertDate6.setHours(8, 35, 0, 0)

  await prisma.locationAlert.createMany({
    data: [
      { studentId: student1.id, type: LocationAlertType.ARRIVED_CAMPUS, message: 'Arjun Raj arrived at campus', latitude: 12.928900, longitude: 79.992400, isRead: true, createdAt: alertDate1 },
      { studentId: student1.id, type: LocationAlertType.LEFT_CAMPUS, message: 'Arjun Raj left campus area', latitude: 12.929200, longitude: 79.992200, isRead: true, createdAt: alertDate2 },
      { studentId: student1.id, type: LocationAlertType.MISSED_CHECKIN, message: 'Arjun Raj missed morning check-in', isRead: false, createdAt: alertDate3 },
      { studentId: student2.id, type: LocationAlertType.ARRIVED_CAMPUS, message: 'Preethi K arrived at campus', latitude: 12.928900, longitude: 79.992400, isRead: true, createdAt: alertDate4 },
      { studentId: student2.id, type: LocationAlertType.LEFT_CAMPUS, message: 'Preethi K left campus area', latitude: 12.928900, longitude: 79.992400, isRead: false, createdAt: alertDate5 },
      { studentId: student3.id, type: LocationAlertType.ARRIVED_CAMPUS, message: 'Vikram S arrived at campus', latitude: 12.928900, longitude: 79.992400, isRead: true, createdAt: alertDate6 },
    ]
  })

  // ============================================
  // SOS, PARENT CONTROLS for all parents
  // ============================================

  await prisma.sOSAlert.create({
    data: {
      studentId: student1.id, parentId: parent1.id,
      latitude: 12.9516, longitude: 79.9799,
      message: 'Feeling unwell, need to go home',
      status: SOSStatus.RESOLVED,
      resolvedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    }
  })

  // Parent Controls for all parents
  await prisma.parentControl.create({
    data: {
      parentId: parent1.id, studentId: student1.id,
      spendingLimitDaily: 300, spendingLimitWeekly: 1500,
      attendanceTarget: 80, curfewTime: '21:00',
      geofenceAlerts: true, mealAlerts: true, spendingAlerts: true,
    }
  })
  await prisma.parentControl.create({
    data: {
      parentId: parent2.id, studentId: student2.id,
      spendingLimitDaily: 250, spendingLimitWeekly: 1200,
      attendanceTarget: 85, curfewTime: '20:30',
      geofenceAlerts: true, mealAlerts: true, spendingAlerts: true,
    }
  })
  await prisma.parentControl.create({
    data: {
      parentId: parent3.id, studentId: student3.id,
      spendingLimitDaily: 350, spendingLimitWeekly: 2000,
      attendanceTarget: 90, curfewTime: '21:30',
      geofenceAlerts: true, mealAlerts: false, spendingAlerts: true,
    }
  })

  // ============================================
  // OD Trips for Student 2
  // ============================================

  const odLeave2 = await prisma.leaveRecord.create({
    data: {
      studentId: student2.id, type: LeaveType.OD,
      startDate: new Date('2026-03-19'), endDate: new Date('2026-03-19'),
      reason: 'IEEE conference at SRM University', status: LeaveStatus.APPROVED,
    }
  })

  await prisma.oDTrip.create({
    data: {
      leaveRecordId: odLeave2.id, studentId: student2.id,
      destinationName: 'SRM University, Kattankulathur', destinationLat: 12.8231, destinationLng: 80.0441,
      radiusM: 600, status: ODTripStatus.RETURNED,
      departedAt: new Date('2026-03-19T07:30:00'), arrivedAt: new Date('2026-03-19T09:00:00'),
      returnedAt: new Date('2026-03-19T17:00:00'),
      lastLat: 12.8231, lastLng: 80.0441, lastLocationAt: new Date('2026-03-19T09:00:00'),
    }
  })

  // ============================================
  // AUDIT LOGS
  // ============================================

  await prisma.auditLog.createMany({
    data: [
      { actorId: adminUser.id, actorRole: Role.ADMIN, action: 'STUDENT_CREATE', entityType: 'Student', entityId: student1.id, ipAddress: '192.168.1.100' },
      { actorId: adminUser.id, actorRole: Role.ADMIN, action: 'NOTICE_PUBLISH', entityType: 'Notice', ipAddress: '192.168.1.100' },
      { actorId: faculty1User.id, actorRole: Role.FACULTY, action: 'ATTENDANCE_MARK', entityType: 'AttendanceRecord', ipAddress: '192.168.1.105' },
      { actorId: adminUser.id, actorRole: Role.ADMIN, action: 'ALERT_CREATE', entityType: 'EmergencyAlert', ipAddress: '192.168.1.100' },
      { actorId: faculty2User.id, actorRole: Role.FACULTY, action: 'MARKS_PUBLISH', entityType: 'MarkRecord', ipAddress: '192.168.1.106' },
    ]
  })

  console.log('Seeding complete!')
  console.log('')
  console.log('Login credentials:')
  console.log('═══════════════════════════════════════')
  console.log('Super Admin: superadmin@college.edu / password123')
  console.log('Admin:       admin@college.edu / password123')
  console.log('Faculty 1:   priya@college.edu / password123')
  console.log('Faculty 2:   suresh@college.edu / password123')
  console.log('Faculty 3:   lakshmi@college.edu / password123')
  console.log('Faculty 4:   anand@college.edu / password123')
  console.log('Parent 1:    mohan@gmail.com / password123')
  console.log('Parent 2:    kavitha@gmail.com / password123')
  console.log('Parent 3:    senthil@gmail.com / password123')
  console.log('Student 1:   CS21001 / student123')
  console.log('Student 2:   CS21002 / student123')
  console.log('Student 3:   CS21003 / student123')
  console.log('Student 4:   EC21001 / student123')
  console.log('Student 5:   ME21001 / student123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
