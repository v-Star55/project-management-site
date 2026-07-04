export interface AdminDashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  inReviewTickets: number;
  blockedTickets: number;
  reopenTickets: number;
  estimatedHours: number;
  loggedHours: number;
  adminTotalHours: number;
  adminTodayHours: number;
  adminThisWeekHours: number;
  adminLastWeekHours: number;
  changePercent: number;
  changeType: "up" | "down" | "neutral";
  openFeedbacksCount: number;
}

export interface AdminSprint {
  id: string;
  name: string;
  description: string;
  goal: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
}

export interface AdminUserShort {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  designation: string | null;
  role?: string;
}

export interface AdminProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  phase: string;
  category: string;
  startDate: string | null;
  targetDate: string | null;
  completedDate: string | null;
  totalTickets: number;
  completedTickets: number;
  estimatedHours: number;
  loggedHours: number;
  activeSprint: AdminSprint | null;
  admins: AdminUserShort[];
  members: AdminUserShort[];
}

export interface AdminBlockedTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  reasonBlocked: string | null;
  reasonReopen: string | null;
  dueDate: string | null;
  projectId: string;
  project: { title: string };
  assignedUser: { id: string; name: string; imageUrl: string | null } | null;
}

export interface AdminFeedback {
  id: string;
  subject: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  project: { id: string; title: string } | null;
  user: { id: string; name: string; imageUrl: string | null };
}

export interface AdminTeamWorkload {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  designation: string | null;
  role: string;
  activeTicketsCount: number;
  estimatedHours: number;
}

export interface AdminWeeklyPerformance {
  day: string;
  date: string;
  hours: number;
  ticketsCompleted: number;
}

export interface AdminOverdueTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  project: { title: string };
  assignedUser: { id: string; name: string; imageUrl: string | null } | null;
}

export interface AdminUpcomingDeadline {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  project: { id: string; title: string };
  assignedUser: { id: string; name: string; imageUrl: string | null } | null;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  projects: AdminProject[];
  blockedOrReopenedTickets: AdminBlockedTicket[];
  openFeedbacks: AdminFeedback[];
  overdueTickets: AdminOverdueTicket[];
  upcomingDeadlines: AdminUpcomingDeadline[];
  teamWorkload: AdminTeamWorkload[];
  weeklyPerformance: AdminWeeklyPerformance[];
}
