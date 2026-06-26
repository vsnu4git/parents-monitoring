export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
}

export interface Department {
  id: string
  code: string
  name: string
}

export interface Student {
  id: string
  registerNumber: string
  name: string
  departmentId: string
  year: number
  semester: number
  section: string
  status: string
  dateOfBirth?: string | null
  photo?: string | null
  department: Department
}

export interface Parent {
  id: string
  userId: string
  relation: string
  occupation?: string | null
  user: User
  students: Student[]
}

export interface SubjectStat {
  subject: { id: string; code: string; name: string; credits: number }
  total: number
  present: number
  absent: number
  od: number
  leave: number
  percentage: number
}

export interface AttendanceSummary {
  subjectStats: SubjectStat[]
  overallPercentage: number
  totalRecords: number
  totalPresent: number
}

export interface MarkRecord {
  id: string
  studentId: string
  subjectId: string
  assessmentType: string
  score: number
  maxScore: number
  remarks?: string | null
  publishedAt: string
  subject: { id: string; code: string; name: string }
}

export interface FeeRecord {
  id: string
  studentId: string
  term: string
  description: string
  totalAmount: number
  paidAmount: number
  dueDate: string
  status: string
  paidAt?: string | null
  acknowledgements?: { id: string }[]
}

export interface LeaveRecord {
  id: string
  studentId: string
  type: string
  startDate: string
  endDate: string
  reason: string
  status: string
  remarks?: string | null
  createdAt: string
}

export interface Notification {
  id: string
  targetRole: string
  studentId?: string | null
  type: string
  title: string
  message: string
  priority: string
  isRead: boolean
  createdAt: string
}

export interface Notice {
  id: string
  title: string
  content: string
  category: string
  requiresAcknowledgement: boolean
  isActive: boolean
  publishedAt: string
  expiresAt?: string | null
  acknowledged: boolean
}

export interface EmergencyAlert {
  id: string
  title: string
  message: string
  severity: string
  targetScope: string
  targetDept?: string | null
  isActive: boolean
  publishedAt: string
  expiresAt?: string | null
  acknowledged: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  type: string
  startDate: string
  endDate?: string | null
  department?: string | null
  isPublic: boolean
}

export interface TicketReply {
  id: string
  ticketId: string
  senderId: string
  senderRole: string
  message: string
  createdAt: string
  sender?: { id: string; name: string; role: string }
}

export interface Ticket {
  id: string
  parentId: string
  studentId: string
  category: string
  subject: string
  description: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  student?: Student
  replies?: TicketReply[]
}

export interface AttendanceWarning {
  student: Student
  percentage: number
  isLow: boolean
}

export interface Dashboard {
  parent: Parent
  students: Student[]
  alerts: EmergencyAlert[]
  notices: Notice[]
  recentMarks: (MarkRecord & { student: Student })[]
  pendingFees: (FeeRecord & { student: Student })[]
  notifications: Notification[]
  recentTickets: Ticket[]
  attendanceWarnings: AttendanceWarning[]
}

export interface StudentCheckIn {
  id: string
  studentId: string
  latitude: number
  longitude: number
  label?: string | null
  type: string
  createdAt: string
}

export interface CampusStatus {
  isOnCampus: boolean
  lastCheckIn: StudentCheckIn | null
  todayCheckIns: StudentCheckIn[]
  distanceFromCampus?: number | null
  currentZone?: string | null
  unreadAlerts?: number
  curfewViolation?: boolean
}

export interface ODTrip {
  id: string
  studentId: string
  destinationName: string
  destinationLat: number
  destinationLng: number
  radiusM: number
  status: string
  departedAt?: string | null
  arrivedAt?: string | null
  returnedAt?: string | null
  lastLat?: number | null
  lastLng?: number | null
  lastLocationAt?: string | null
  createdAt: string
  leaveRecord?: LeaveRecord | null
}

export interface CampusTransaction {
  id: string
  category: string
  vendor: string
  description: string
  amount: number
  transactionAt: string
}

export interface StudentExpenses {
  balance: number
  todaySpent: number
  weekSpent: number
  transactions: CampusTransaction[]
}

export interface FoodLogEntry {
  id: string
  studentId: string
  mealType: string
  items: string
  vendor: string
  amount: number
  loggedAt: string
}

export interface LocationData {
  checkIns: StudentCheckIn[]
  alerts: LocationAlertEntry[]
  zones: GeofenceZone[]
}

export interface LocationAlertEntry {
  id: string
  studentId: string
  type: string
  message: string
  latitude?: number | null
  longitude?: number | null
  isRead: boolean
  createdAt: string
}

export interface GeofenceZone {
  id: string
  name: string
  latitude: number
  longitude: number
  radiusM: number
  isActive: boolean
}

export interface SOSAlertEntry {
  id: string
  studentId: string
  parentId: string
  latitude?: number | null
  longitude?: number | null
  message?: string | null
  status: string
  resolvedAt?: string | null
  createdAt: string
  student?: Student
}

export interface ParentControlData {
  id?: string
  spendingLimitDaily?: number | null
  spendingLimitWeekly?: number | null
  attendanceTarget?: number | null
  curfewTime?: string | null
  geofenceAlerts: boolean
  mealAlerts: boolean
  spendingAlerts: boolean
}

export interface InsightEntry {
  type: string
  severity: string
  title: string
  description: string
}

export interface TrustScoreFactor {
  label: string
  score: number
  weight: number
}

export interface InsightsData {
  insights: InsightEntry[]
  trustScore: { score: number; factors: TrustScoreFactor[] }
  weekComparison: {
    attendance: { thisWeek: number; lastWeek: number }
    meals: { thisWeek: number; lastWeek: number }
    spending: { thisWeek: number; lastWeek: number }
    checkIns: { thisWeek: number; lastWeek: number }
  }
}

export interface DailyBreakdown {
  date: string
  present: boolean
  meals: number
  spending: number
}

export interface WeeklyReportData {
  weekStart: string
  weekEnd: string
  attendance: { percentage: number; total: number; present: number }
  marks: MarkRecord[]
  fees: { pending: number; totalDue: number }
  meals: { count: number; totalSpend: number }
  spending: { total: number; transactions: CampusTransaction[] }
  checkIns: { count: number }
  odTrips: { count: number; trips: ODTrip[] }
  dailyBreakdown: DailyBreakdown[]
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
  details?: unknown
}

// Anomaly
export interface AnomalyItem { id: string; studentId: string; type: string; severity: string; title: string; description: string; metadata?: any; isRead: boolean; isDismissed: boolean; detectedAt: string }
export interface AnomaliesResponse { anomalies: AnomalyItem[]; summary: { critical: number; high: number; medium: number; low: number } }

// Chat
export interface ConversationPreview { id: string; facultyName: string; facultyDepartment: string; studentName: string; lastMessage?: string; lastMessageAt?: string; unreadCount: number }
export interface ChatMessageItem { id: string; conversationId: string; senderId: string; senderRole: string; content: string; isRead: boolean; createdAt: string }
export interface FacultyInfo { id: string; userId: string; name: string; department: string; designation?: string; subjects: { code: string; name: string }[] }

// QR/ID Card
export interface QRTokenResponse { token: string; expiresAt: string }
export interface IDCardResponse { name: string; registerNumber: string; departmentCode: string; departmentName: string; year: number; semester: number; section: string; photo?: string | null; dateOfBirth?: string | null }

// ─── Admin Types ─────────────────────────────────────────────────────────────

export interface AdminDashboard {
  totalStudents: number
  totalFaculty: number
  totalParents: number
  pendingFeesTotal: number
  pendingLeavesCount: number
  openTicketsCount: number
  attendanceSummary: { present: number; absent: number; total: number }
  revenue: { collected: number; totalDue: number }
  recentEmergencyAlerts: number
}

export interface AdminStudentEntry {
  id: string
  registerNumber: string
  name: string
  year: number
  semester: number
  section: string
  status: string
  dateOfBirth?: string | null
  photo?: string | null
  department: Department
  parent?: { id: string; userId: string; relation: string; user: { id: string; name: string; email: string; phone?: string | null } } | null
}

export interface AdminStudentListResponse {
  students: AdminStudentEntry[]
  total: number
  page: number
  limit: number
}

export interface AdminFacultyEntry {
  id: string
  userId: string
  department: string
  designation?: string | null
  user: { id: string; name: string; email: string; phone?: string | null; isActive: boolean }
  subjects: { id: string; subjectId: string; subject: { id: string; code: string; name: string; department: Department } }[]
}

export interface AdminFeeEntry {
  id: string
  studentId: string
  term: string
  description?: string | null
  totalAmount: number
  paidAmount: number
  dueDate: string
  status: string
  paidAt?: string | null
  student: { id: string; name: string; registerNumber: string; department: { code: string; name: string } }
}

export interface AdminFeeListResponse {
  fees: AdminFeeEntry[]
  total: number
  page: number
  limit: number
}

export interface AdminSubject {
  id: string
  code: string
  name: string
  semester: number
  credits: number
  departmentId: string
}

// ─── Faculty Types ───────────────────────────────────────────────────────────

export interface FacultyDashboard {
  faculty: {
    id: string
    department: string
    designation: string
    user: { id: string; name: string; email: string; phone?: string | null }
  }
  subjects: FacultySubjectEntry[]
  todaysClassesMarked: string[]
  pendingLeaves: number
  totalStudents: number
  isAdmin: boolean
}

export interface FacultySubjectEntry {
  id: string
  code: string
  name: string
  semester: number
  credits: number
  department: Department
  studentCount: number
}

export interface FacultyStudentEntry {
  id: string
  registerNumber: string
  name: string
  year: number
  semester: number
  section: string
  department: Department
}

export interface AttendanceStudentRecord {
  studentId: string
  registerNumber: string
  name: string
  section: string
  status: string | null
}

export interface MarksStudentRecord {
  studentId: string
  registerNumber: string
  name: string
  section: string
  marks: { score: number; maxScore: number; remarks?: string | null } | null
}

export interface FacultyLeaveEntry {
  id: string
  type: string
  startDate: string
  endDate: string
  reason: string
  status: string
  remarks?: string | null
  createdAt: string
  student: {
    id: string
    name: string
    registerNumber: string
    semester: number
    section: string
    department: { code: string; name: string }
  }
}

// Predictions
export interface PredictionPoint { label: string; value: number; isForecast: boolean }
export interface PredictionsResponse {
  attendance: { current: number; predicted: number; trend: string; dataPoints: PredictionPoint[] }
  gpa: { current: number; predicted: number; dataPoints: PredictionPoint[] }
  fees: { status: string; nextDueDate?: string; riskLevel: string }
  meals: { currentAvg: number; predictedAvg: number; trend: string; dataPoints: PredictionPoint[] }
}
