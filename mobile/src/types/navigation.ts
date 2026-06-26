export type AuthStackParamList = {
  Login: undefined
}

export type MainTabParamList = {
  DashboardTab: undefined
  AcademicsTab: undefined
  MonitorTab: undefined
  TicketsTab: undefined
  MoreTab: undefined
}

// ─── Admin Navigation ────────────────────────────────────────────────────────

export type AdminTabParamList = {
  AdminDashboardTab: undefined
  AdminStudentsTab: undefined
  AdminFacultyTab: undefined
  AdminFeesTab: undefined
  AdminMoreTab: undefined
}

export type AdminDashboardStackParamList = {
  AdminDashboard: undefined
}

export type AdminStudentsStackParamList = {
  AdminStudents: undefined
}

export type AdminFacultyStackParamList = {
  AdminFaculty: undefined
}

export type AdminFeesStackParamList = {
  AdminFees: undefined
}

export type AdminMoreStackParamList = {
  AdminMoreMenu: undefined
  AdminNotices: undefined
  AdminAlerts: undefined
  Profile: undefined
  Notices: undefined
  Calendar: undefined
}

// ─── Faculty Navigation ──────────────────────────────────────────────────────

export type FacultyTabParamList = {
  FacultyDashboardTab: undefined
  FacultyStudentsTab: undefined
  FacultyAttendanceTab: undefined
  FacultyMarksTab: undefined
  FacultyMoreTab: undefined
}

export type FacultyDashboardStackParamList = {
  FacultyDashboard: undefined
}

export type FacultyStudentsStackParamList = {
  FacultyStudents: undefined
}

export type FacultyAttendanceStackParamList = {
  FacultyAttendance: undefined
}

export type FacultyMarksStackParamList = {
  FacultyMarks: undefined
}

export type FacultyMoreStackParamList = {
  FacultyMoreMenu: undefined
  FacultyLeaves: undefined
  Profile: undefined
  Notices: undefined
  Calendar: undefined
  ChatList: undefined
  ChatDetail: { conversationId: string; facultyName: string }
}

export type DashboardStackParamList = {
  Dashboard: undefined
}

export type AcademicsStackParamList = {
  Academics: undefined
}

export type MonitorStackParamList = {
  Monitor: undefined
  ODTracker: undefined
  Expenses: undefined
  Food: undefined
  GeofenceAlerts: undefined
}

export type TicketsStackParamList = {
  TicketsList: undefined
  TicketDetail: { ticketId: string }
  CreateTicket: undefined
}

export type MoreStackParamList = {
  MoreMenu: undefined
  Fees: undefined
  SOS: undefined
  Controls: undefined
  Insights: undefined
  Report: undefined
  Notifications: undefined
  Notices: undefined
  LeaveRecords: undefined
  Calendar: undefined
  Profile: undefined
  Anomalies: undefined
  ChatList: undefined
  ChatDetail: { conversationId: string; facultyName: string }
  Predictions: undefined
}
