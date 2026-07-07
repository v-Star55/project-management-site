export interface OwnerDashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  roleCounts: {
    total: number;
    owner: number;
    admin: number;
    member: number;
    qa: number;
    client: number;
  };
  monthlyHours: number;
  totalCompanyTickets: number;
  completedCompanyTickets: number;
  openCompanyTickets: number;
  inProgressCompanyTickets: number;
  inReviewCompanyTickets: number;
  blockedCompanyTickets: number;
  overdueCompanyTickets: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
}

export interface OwnerProject {
  id: string;
  title: string;
  status: string;
  phase: string;
  category: string;
  startDate: string | null;
  targetDate: string | null;
  totalTickets: number;
  completedTickets: number;
  blockedTickets: number;
  overdueTickets: number;
  estimatedHours: number;
  loggedHours: number;
  health: "on_track" | "at_risk" | "off_track";
  admins: { id: string; name: string; email: string; imageUrl: string | null; designation: string | null }[];
  members: { id: string; name: string; email: string; imageUrl: string | null; designation: string | null; role: string }[];
}

export interface DigestItem {
  current: number;
  past: number;
  percent: number;
}

export interface WeeklyDigest {
  ticketsCompleted: DigestItem;
  hoursLogged: DigestItem;
  bugsReported: DigestItem;
  clientsOnboarded: DigestItem;
}

export interface OwnerNote {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  createdAt: string;
}

export interface ResourceWorkload {
  id: string;
  name: string;
  imageUrl: string | null;
  designation: string | null;
  role: string;
  activeTicketsCount: number;
  highPriorityCount: number;
  weeklyHours: number;
  burnoutRisk: "low" | "medium" | "high";
}

export interface EstimateVsActual {
  name: string;
  estimated: number;
  actual: number;
}

export interface OwnerFeedback {
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

export interface AuditLogItem {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    imageUrl: string | null;
    role: string;
  };
  targetUser: {
    id: string;
    name: string;
  } | null;
}

export interface OwnerDashboardData {
  stats: OwnerDashboardStats;
  projects: OwnerProject[];
  weeklyDigest: WeeklyDigest;
  notes: OwnerNote[];
  resourceWorkload: ResourceWorkload[];
  estimateVsActualData: EstimateVsActual[];
  feedbacks: OwnerFeedback[];
  auditLogs: AuditLogItem[];
}
