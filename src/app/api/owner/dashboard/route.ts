import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authUser = await requireRole(["owner"], req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, role: true, companyId: true },
    });

    if (!dbUser || !dbUser.companyId) {
      return NextResponse.json(
        { error: "User not found or not associated with a company" },
        { status: 403 }
      );
    }

    const companyId = dbUser.companyId;
    const now = new Date();

    // --- 1. Fetch All Active & Inactive Projects in Company ---
    const projects = await prisma.project.findMany({
      where: { companyId, isActive: true },
      include: {
        admins: {
          select: { id: true, name: true, email: true, imageUrl: true, designation: true },
        },
        members: {
          select: { id: true, name: true, email: true, imageUrl: true, designation: true, role: true },
        },
        tickets: {
          where: { isDeleted: false },
          select: {
            id: true,
            status: true,
            dueDate: true,
            priority: true,
            type: true,
            estimatedHours: true,
            assignedUserId: true,
            completedAt: true,
            createdAt: true,
            timeLogs: {
              select: {
                duration: true,
              },
            },
          },
        },
        groups: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projectIds = projects.map((p) => p.id);

    // --- 2. Calculate Weekly Digest (This Week vs. Last Week) ---
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - 7);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // 2a. Tickets Completed
    const thisWeekCompletedCount = await prisma.ticket.count({
      where: {
        projectId: { in: projectIds },
        status: "completed",
        isDeleted: false,
        completedAt: { gte: startOfThisWeek },
      },
    });

    const lastWeekCompletedCount = await prisma.ticket.count({
      where: {
        projectId: { in: projectIds },
        status: "completed",
        isDeleted: false,
        completedAt: { gte: startOfLastWeek, lt: startOfThisWeek },
      },
    });

    // 2b. Hours Logged (aggregate timeLogs)
    const thisWeekTimeLogs = await prisma.timeLog.aggregate({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfThisWeek },
      },
      _sum: { duration: true },
    });

    const lastWeekTimeLogs = await prisma.timeLog.aggregate({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfLastWeek, lt: startOfThisWeek },
      },
      _sum: { duration: true },
    });

    const thisWeekHours = Math.round(((thisWeekTimeLogs._sum.duration || 0) / 60) * 10) / 10;
    const lastWeekHours = Math.round(((lastWeekTimeLogs._sum.duration || 0) / 60) * 10) / 10;

    // 2c. Bugs Reported
    const thisWeekBugsCount = await prisma.ticket.count({
      where: {
        projectId: { in: projectIds },
        type: "bug",
        isDeleted: false,
        createdAt: { gte: startOfThisWeek },
      },
    });

    const lastWeekBugsCount = await prisma.ticket.count({
      where: {
        projectId: { in: projectIds },
        type: "bug",
        isDeleted: false,
        createdAt: { gte: startOfLastWeek, lt: startOfThisWeek },
      },
    });

    // 2d. New Clients Onboarded
    const thisWeekClientsCount = await prisma.user.count({
      where: {
        companyId,
        role: "client",
        createdAt: { gte: startOfThisWeek },
      },
    });

    const lastWeekClientsCount = await prisma.user.count({
      where: {
        companyId,
        role: "client",
        createdAt: { gte: startOfLastWeek, lt: startOfThisWeek },
      },
    });

    // Helper for percentage diffs
    const getDiffPercent = (current: number, past: number) => {
      if (past === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - past) / past) * 100);
    };

    const weeklyDigest = {
      ticketsCompleted: {
        current: thisWeekCompletedCount,
        past: lastWeekCompletedCount,
        percent: getDiffPercent(thisWeekCompletedCount, lastWeekCompletedCount),
      },
      hoursLogged: {
        current: thisWeekHours,
        past: lastWeekHours,
        percent: getDiffPercent(thisWeekHours, lastWeekHours),
      },
      bugsReported: {
        current: thisWeekBugsCount,
        past: lastWeekBugsCount,
        percent: getDiffPercent(thisWeekBugsCount, lastWeekBugsCount),
      },
      clientsOnboarded: {
        current: thisWeekClientsCount,
        past: lastWeekClientsCount,
        percent: getDiffPercent(thisWeekClientsCount, lastWeekClientsCount),
      },
    };

    // --- 3. Personal Notes & Reminders ---
    const notes = await prisma.note.findMany({
      where: { userId: dbUser.id, companyId },
      orderBy: { createdAt: "desc" },
    });

    // --- 4. Company Member Roles Breakdown & Users ---
    const companyUsers = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        designation: true,
        isActive: true,
        lastActive: true,
        createdAt: true,
      },
    });

    const roleCounts = {
      total: companyUsers.length,
      owner: companyUsers.filter((u) => u.role === "owner").length,
      admin: companyUsers.filter((u) => u.role === "admin").length,
      member: companyUsers.filter((u) => u.role === "member").length,
      qa: companyUsers.filter((u) => u.role === "qa").length,
      client: companyUsers.filter((u) => u.role === "client").length,
    };

    // --- 5. Project Portfolio Health Calculation ---
    let totalCompanyTickets = 0;
    let completedCompanyTickets = 0;
    let openCompanyTickets = 0;
    let inProgressCompanyTickets = 0;
    let inReviewCompanyTickets = 0;
    let blockedCompanyTickets = 0;
    let overdueCompanyTickets = 0;
    let totalEstimatedHours = 0;
    let totalLoggedHours = 0;

    const mappedProjects = projects.map((p) => {
      let projectEstHours = 0;
      let projectLoggedMin = 0;
      let projectCompleted = 0;
      let projectBlocked = 0;
      let projectOverdue = 0;

      p.tickets.forEach((t) => {
        totalCompanyTickets++;
        projectEstHours += t.estimatedHours || 0;
        totalEstimatedHours += t.estimatedHours || 0;

        const minutes = t.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        projectLoggedMin += minutes;
        totalLoggedHours += minutes / 60;

        if (t.status === "completed") {
          projectCompleted++;
          completedCompanyTickets++;
        } else {
          openCompanyTickets++;
          if (t.status === "in_progress") {
            inProgressCompanyTickets++;
          } else if (t.status === "in_review") {
            inReviewCompanyTickets++;
          } else if (t.status === "blocked") {
            projectBlocked++;
            blockedCompanyTickets++;
          }
          if (t.dueDate && new Date(t.dueDate) < now) {
            projectOverdue++;
            overdueCompanyTickets++;
          }
        }
      });

      // Health heuristics
      let health: "on_track" | "at_risk" | "off_track" = "on_track";
      if (projectOverdue > 0) {
        health = "off_track";
      } else if (projectBlocked >= 3 || (projectBlocked > 0 && p.tickets.length > 0 && (projectBlocked / p.tickets.length) > 0.2)) {
        health = "at_risk";
      }

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        phase: p.phase,
        category: p.category,
        startDate: p.startDate,
        targetDate: p.targetDate,
        totalTickets: p.tickets.length,
        completedTickets: projectCompleted,
        blockedTickets: projectBlocked,
        overdueTickets: projectOverdue,
        estimatedHours: projectEstHours,
        loggedHours: Math.round((projectLoggedMin / 60) * 10) / 10,
        health,
        admins: p.admins,
        members: p.members,
      };
    });

    // --- 6. Resource Workload & Heatmap ---
    // Fetch all logs in last 7 days to calculate utilization
    const timeLogsLastWeek = await prisma.timeLog.findMany({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfThisWeek },
      },
      select: {
        userId: true,
        duration: true,
      },
    });

    const activeTicketsCompany = await prisma.ticket.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: "completed" },
        isDeleted: false,
      },
      select: {
        assignedUserId: true,
        priority: true,
      },
    });

    const resourceWorkload = companyUsers
      .filter((u) => u.role !== "client" && u.role !== "owner")
      .map((user) => {
        const userLogs = timeLogsLastWeek.filter((log) => log.userId === user.id);
        const totalDurationMin = userLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        const hoursLogged = Math.round((totalDurationMin / 60) * 10) / 10;

        const userTickets = activeTicketsCompany.filter((t) => t.assignedUserId === user.id);
        const highPriorityCount = userTickets.filter((t) => t.priority === "high").length;

        // Burnout heuristic: >35 hours logged a week or >6 active tickets, or >3 high priority open tickets
        let burnoutRisk: "low" | "medium" | "high" = "low";
        if (hoursLogged > 45 || userTickets.length > 8 || highPriorityCount > 4) {
          burnoutRisk = "high";
        } else if (hoursLogged > 35 || userTickets.length > 5 || highPriorityCount > 2) {
          burnoutRisk = "medium";
        }

        return {
          id: user.id,
          name: user.name,
          imageUrl: user.imageUrl,
          designation: user.designation,
          role: user.role,
          activeTicketsCount: userTickets.length,
          highPriorityCount,
          weeklyHours: hoursLogged,
          burnoutRisk,
        };
      })
      .sort((a, b) => b.activeTicketsCount - a.activeTicketsCount);

    // --- 7. Estimate vs. Actual Projects Chart Data ---
    const estimateVsActualData = mappedProjects.map((p) => ({
      name: p.title.length > 15 ? p.title.substring(0, 15) + "..." : p.title,
      estimated: p.estimatedHours,
      actual: p.loggedHours,
    })).slice(0, 8); // Limit to top 8 projects for charts

    // --- 8. Company Feedbacks ---
    const openFeedbacks = await prisma.feedback.findMany({
      where: {
        projectId: { in: projectIds },
      },
      select: {
        id: true,
        subject: true,
        description: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
        project: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // --- 9. Global Company Activity Audit Log ---
    const auditLogs = await prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds },
      },
      include: {
        user: {
          select: { id: true, name: true, imageUrl: true, role: true },
        },
        targetUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // --- 10. Compile Stats Response ---
    // Fetch hours logged this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTimeLogs = await prisma.timeLog.aggregate({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfMonth },
      },
      _sum: { duration: true },
    });
    const monthlyLoggedHours = Math.round(((monthTimeLogs._sum.duration || 0) / 60) * 10) / 10;

    return NextResponse.json({
      stats: {
        totalProjects: mappedProjects.length,
        activeProjects: mappedProjects.filter((p) => p.status !== "completed").length,
        completedProjects: mappedProjects.filter((p) => p.status === "completed").length,
        roleCounts,
        monthlyHours: monthlyLoggedHours,
        totalCompanyTickets,
        completedCompanyTickets,
        openCompanyTickets,
        inProgressCompanyTickets,
        inReviewCompanyTickets,
        blockedCompanyTickets,
        overdueCompanyTickets,
        totalEstimatedHours,
        totalLoggedHours: Math.round(totalLoggedHours * 10) / 10,
      },
      projects: mappedProjects,
      weeklyDigest,
      notes,
      resourceWorkload,
      estimateVsActualData,
      feedbacks: openFeedbacks,
      auditLogs,
    });
  } catch (error: any) {
    console.error("Owner dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch owner dashboard summary" },
      { status: 500 }
    );
  }
}
