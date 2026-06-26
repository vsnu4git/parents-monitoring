import { apiClient } from './client'
import type {
  LoginResponse,
  Parent,
  Dashboard,
  AttendanceSummary,
  MarkRecord,
  FeeRecord,
  LeaveRecord,
  Notification,
  Notice,
  EmergencyAlert,
  CalendarEvent,
  Ticket,
  CampusStatus,
  ODTrip,
  StudentExpenses,
  FoodLogEntry,
  LocationData,
  SOSAlertEntry,
  ParentControlData,
  InsightsData,
  WeeklyReportData,
  AnomaliesResponse,
  ConversationPreview,
  ChatMessageItem,
  FacultyInfo,
  QRTokenResponse,
  IDCardResponse,
  PredictionsResponse,
  AdminDashboard,
  AdminStudentListResponse,
  AdminStudentEntry,
  AdminFacultyEntry,
  AdminFeeListResponse,
  AdminSubject,
  Department,
  FacultyDashboard,
  FacultyStudentEntry,
  AttendanceStudentRecord,
  MarksStudentRecord,
  FacultyLeaveEntry,
} from '../types/api'

// Auth
export const login = (email: string, password: string) =>
  apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// Parent
export const getProfile = () => apiClient<Parent>('/parent/profile')
export const getDashboard = () => apiClient<Dashboard>('/parent/dashboard')
export const getNotifications = () => apiClient<Notification[]>('/parent/notifications')
export const getParentTickets = () => apiClient<Ticket[]>('/parent/tickets')

// Student
export const getAttendance = (studentId: string) =>
  apiClient<AttendanceSummary>(`/student/${studentId}/attendance`)
export const getMarks = (studentId: string) =>
  apiClient<MarkRecord[]>(`/student/${studentId}/marks`)
export const getFees = (studentId: string) =>
  apiClient<FeeRecord[]>(`/student/${studentId}/fees`)
export const getLeaves = (studentId: string) =>
  apiClient<LeaveRecord[]>(`/student/${studentId}/leaves`)

// Notices & Alerts
export const getNotices = () => apiClient<Notice[]>('/notices')
export const acknowledgeNotice = (id: string) =>
  apiClient('/notices/' + id + '/acknowledge', { method: 'POST' })

export const getAlerts = () => apiClient<EmergencyAlert[]>('/alerts')
export const acknowledgeAlert = (id: string) =>
  apiClient('/alerts/' + id + '/acknowledge', { method: 'POST' })

// Calendar
export const getCalendarEvents = () => apiClient<CalendarEvent[]>('/calendar')

// Tickets
export const getTicket = (id: string) => apiClient<Ticket>(`/tickets/${id}`)
export const createTicket = (data: {
  studentId: string
  category: string
  subject: string
  description: string
  priority: string
}) => apiClient<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) })

export const addTicketReply = (ticketId: string, message: string) =>
  apiClient(`/tickets/${ticketId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })

// Fees
export const acknowledgeFee = (id: string) =>
  apiClient('/fees/' + id + '/acknowledge', { method: 'POST' })

// Campus / Monitor
export const getStudentCampusStatus = (studentId: string) =>
  apiClient<CampusStatus>(`/student/${studentId}/campus-status`)
export const getStudentODTrips = (studentId: string) =>
  apiClient<ODTrip[]>(`/student/${studentId}/od-trips`)
export const getStudentExpenses = async (studentId: string): Promise<StudentExpenses> => {
  const account = await apiClient<{ balance: number; transactions: { amount: number; transactionAt: string; id: string; category: string; vendor: string; description: string }[] } | null>(`/student/${studentId}/expenses`)
  if (!account) return { balance: 0, todaySpent: 0, weekSpent: 0, transactions: [] }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const todaySpent = account.transactions
    .filter((t) => new Date(t.transactionAt) >= today)
    .reduce((s, t) => s + t.amount, 0)
  const weekSpent = account.transactions
    .filter((t) => new Date(t.transactionAt) >= weekStart)
    .reduce((s, t) => s + t.amount, 0)
  return { balance: account.balance, todaySpent, weekSpent, transactions: account.transactions.map((t) => ({ ...t, transactionAt: t.transactionAt })) }
}
export const getStudentFoodLog = (studentId: string) =>
  apiClient<FoodLogEntry[]>(`/student/${studentId}/food-log`)
export const getStudentLocation = (studentId: string) =>
  apiClient<LocationData>(`/student/${studentId}/location`)

// SOS
export const getSOSAlerts = () => apiClient<SOSAlertEntry[]>('/parent/sos')
export const triggerSOS = (data: { studentId: string; message?: string; latitude?: number; longitude?: number }) =>
  apiClient<SOSAlertEntry>('/parent/sos', { method: 'POST', body: JSON.stringify(data) })
export const updateSOSAlert = (data: { alertId: string; status: string }) =>
  apiClient<SOSAlertEntry>('/parent/sos', { method: 'PATCH', body: JSON.stringify(data) })

// Controls
export const getParentControls = () => apiClient<ParentControlData>('/parent/controls')
export const updateParentControls = (data: Partial<ParentControlData>) =>
  apiClient<ParentControlData>('/parent/controls', { method: 'POST', body: JSON.stringify(data) })

// Student Check-in (GPS reporting)
export const postStudentCheckIn = (studentId: string, data: { latitude: number; longitude: number; type: string; label?: string }) =>
  apiClient<{ id: string; isInsideCampus: boolean; distanceFromCampus: number; detectedZone: string }>(
    `/student/${studentId}/checkin`,
    { method: 'POST', body: JSON.stringify(data) }
  )

// Location Alerts
export const markLocationAlertsRead = (studentId: string, alertId?: string) =>
  apiClient<{ success: boolean }>(
    `/student/${studentId}/location-alerts/read`,
    { method: 'POST', body: JSON.stringify(alertId ? { alertId } : {}) }
  )

// Insights & Report
export const getInsights = () => apiClient<InsightsData>('/parent/insights')
export const getWeeklyReport = () => apiClient<WeeklyReportData>('/parent/report')

// Anomalies
export const getAnomalies = () => apiClient<AnomaliesResponse>('/parent/anomalies')
export const dismissAnomaly = (id: string) =>
  apiClient('/parent/anomalies/' + id + '/dismiss', { method: 'POST' })
export const markAnomalyRead = (id: string) =>
  apiClient('/parent/anomalies/' + id + '/read', { method: 'POST' })

// Chat
export const getConversations = () => apiClient<ConversationPreview[]>('/chat/conversations')
export const getConversationMessages = (conversationId: string) =>
  apiClient<ChatMessageItem[]>(`/chat/conversations/${conversationId}/messages`)
export const sendChatMessage = (conversationId: string, content: string) =>
  apiClient<ChatMessageItem>(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
export const createConversation = (facultyId: string, studentId: string) =>
  apiClient<ConversationPreview>('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ facultyId, studentId }),
  })
export const getFacultyList = (studentId: string) => apiClient<FacultyInfo[]>(`/chat/faculty/${studentId}`)

// QR / ID Card
export const getQRToken = (studentId: string) =>
  apiClient<QRTokenResponse>(`/student/${studentId}/qr-token`)
export const getIDCard = (studentId: string) =>
  apiClient<IDCardResponse>(`/student/${studentId}/id-card`)

// Predictions
export const getPredictions = () => apiClient<PredictionsResponse>('/parent/predictions')

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

export const getAdminDashboard = () => apiClient<AdminDashboard>('/admin/dashboard')

export const getAdminStudents = (params?: { department?: string; year?: string; status?: string; search?: string; page?: number }) => {
  const sp = new URLSearchParams()
  if (params?.department) sp.set('department', params.department)
  if (params?.year) sp.set('year', params.year)
  if (params?.status) sp.set('status', params.status)
  if (params?.search) sp.set('search', params.search)
  if (params?.page) sp.set('page', String(params.page))
  const qs = sp.toString()
  return apiClient<AdminStudentListResponse>(`/admin/students${qs ? '?' + qs : ''}`)
}

export const createAdminStudent = (data: {
  name: string; registerNumber: string; departmentId: string; year: number; semester: number; section: string;
  dateOfBirth?: string; parentId?: string;
  createParent?: { parentName: string; parentEmail: string; parentPhone?: string; parentPassword: string; relation?: string }
}) => apiClient<AdminStudentEntry>('/admin/students', { method: 'POST', body: JSON.stringify(data) })

export const getAdminFaculty = (params?: { department?: string; search?: string }) => {
  const sp = new URLSearchParams()
  if (params?.department) sp.set('department', params.department)
  if (params?.search) sp.set('search', params.search)
  const qs = sp.toString()
  return apiClient<{ faculty: AdminFacultyEntry[] }>(`/admin/faculty${qs ? '?' + qs : ''}`)
}

export const createAdminFaculty = (data: {
  name: string; email: string; phone?: string; password: string; department: string; designation?: string
}) => apiClient<AdminFacultyEntry>('/admin/faculty', { method: 'POST', body: JSON.stringify(data) })

export const getAdminDepartments = () => apiClient<Department[]>('/admin/departments')
export const getAdminSubjects = () => apiClient<AdminSubject[]>('/admin/subjects')

export const getAdminFees = (params?: { studentId?: string; status?: string; term?: string; page?: number }) => {
  const sp = new URLSearchParams()
  if (params?.studentId) sp.set('studentId', params.studentId)
  if (params?.status) sp.set('status', params.status)
  if (params?.term) sp.set('term', params.term)
  if (params?.page) sp.set('page', String(params.page))
  const qs = sp.toString()
  return apiClient<AdminFeeListResponse>(`/admin/fees${qs ? '?' + qs : ''}`)
}

export const createAdminNotice = (data: {
  title: string; content: string; category: string; requiresAcknowledgement?: boolean; expiresAt?: string
}) => apiClient<Notice>('/admin/notices', { method: 'POST', body: JSON.stringify(data) })

export const createAdminAlert = (data: {
  title: string; message: string; severity?: string; targetScope?: string; targetDept?: string; expiresAt?: string
}) => apiClient<EmergencyAlert>('/admin/alerts', { method: 'POST', body: JSON.stringify(data) })

// ─── Faculty Endpoints ───────────────────────────────────────────────────────

export const getFacultyDashboard = () => apiClient<FacultyDashboard>('/faculty/dashboard')

export const getFacultyStudents = (subjectId?: string) => {
  const qs = subjectId ? `?subjectId=${subjectId}` : ''
  return apiClient<{ students: FacultyStudentEntry[] }>(`/faculty/students${qs}`)
}

export const getFacultyAttendance = (subjectId: string, date: string) =>
  apiClient<{ attendance: AttendanceStudentRecord[] }>(`/faculty/attendance?subjectId=${subjectId}&date=${date}`)

export const markFacultyAttendance = (data: {
  subjectId: string; date: string; records: { studentId: string; status: string }[]
}) => apiClient<{ saved: number }>('/faculty/attendance', { method: 'POST', body: JSON.stringify(data) })

export const getFacultyMarks = (subjectId: string, assessmentType: string) =>
  apiClient<{ marks: MarksStudentRecord[] }>(`/faculty/marks?subjectId=${subjectId}&assessmentType=${assessmentType}`)

export const enterFacultyMarks = (data: {
  subjectId: string; assessmentType: string; maxScore: number; records: { studentId: string; score: number; remarks?: string }[]
}) => apiClient<{ saved: number }>('/faculty/marks', { method: 'POST', body: JSON.stringify(data) })

export const getFacultyLeaves = () => apiClient<{ leaves: FacultyLeaveEntry[] }>('/faculty/leaves')

export const updateFacultyLeave = (data: { leaveId: string; status: string; remarks?: string }) =>
  apiClient<{ leave: FacultyLeaveEntry }>('/faculty/leaves', { method: 'PATCH', body: JSON.stringify(data) })
