import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(req: NextRequest) {
  const authUser = await requireRole(["owner", "admin"], req);
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

    // 1. Fetch only projects where the admin is explicitly assigned
    const projects = await prisma.project.findMany({
      where: {
        companyId: dbUser.companyId,
        isActive: true,
        OR: [
          { members: { some: { id: dbUser.id } } },
          { admins: { some: { id: dbUser.id } } },
        ],
      },
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
            estimatedHours: true,
            assignedUserId: true,
            completedAt: true,
            updatedAt: true,
            timeLogs: {
              select: {
                duration: true,
              },
            },
          },
        },
        groups: {
          where: {
            isActive: true,
            type: "sprint",
            status: "in_progress",
          },
          select: {
            id: true,
            name: true,
            description: true,
            goal: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projectIds = projects.map((p) => p.id);

    // 2. Blocked & Reopened Tickets in these projects
    const blockedOrReopenedTickets = await prisma.ticket.findMany({
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
        status: { in: ["blocked", "reopen"] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        reasonBlocked: true,
        reasonReopen: true,
        dueDate: true,
        projectId: true,
        project: {
          select: { title: true },
        },
        assignedUser: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Open client/team feedbacks for these projects
    const openFeedbacks = await prisma.feedback.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ["pending", "in_progress"] },
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

    // 3b. Overdue tickets (past due date, not completed)
    const now = new Date();
    const overdueTickets = await prisma.ticket.findMany({
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
        status: { notIn: ["completed"] },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        project: {
          select: { title: true },
        },
        assignedUser: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 15,
    });

    // 3c. Upcoming deadlines (due within next 7 days, not completed, not overdue)
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const startOfTodayForDeadlines = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingDeadlines = await prisma.ticket.findMany({
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
        status: { notIn: ["completed"] },
        dueDate: { gte: startOfTodayForDeadlines, lte: sevenDaysLater },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        project: {
          select: { id: true, title: true },
        },
        assignedUser: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 15,
    });

    // 4. Aggregate stats for dashboard cards
    let totalTickets = 0;
    let completedTickets = 0;
    let inProgressTickets = 0;
    let inReviewTickets = 0;
    let blockedTickets = 0;
    let reopenTickets = 0;
    let estimatedHours = 0;
    let loggedMinutes = 0;

    const mappedProjects = projects.map((p) => {
      let pEstHours = 0;
      let pLoggedMin = 0;
      let pCompleted = 0;

      p.tickets.forEach((t) => {
        totalTickets++;
        if (t.status === "completed") {
          completedTickets++;
          pCompleted++;
        } else if (t.status === "in_progress") inProgressTickets++;
        else if (t.status === "in_review") inReviewTickets++;
        else if (t.status === "blocked") blockedTickets++;
        else if (t.status === "reopen") reopenTickets++;

        pEstHours += t.estimatedHours || 0;
        estimatedHours += t.estimatedHours || 0;

        const ticketLogsMin = t.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        pLoggedMin += ticketLogsMin;
        loggedMinutes += ticketLogsMin;
      });

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        phase: p.phase,
        category: p.category,
        startDate: p.startDate,
        targetDate: p.targetDate,
        completedDate: p.completedDate,
        totalTickets: p.tickets.length,
        completedTickets: pCompleted,
        estimatedHours: pEstHours,
        loggedHours: Math.round((pLoggedMin / 60) * 10) / 10,
        activeSprint: p.groups[0] || null,
        admins: p.admins,
        members: p.members,
      };
    });

    // 5. Team workload breakdown
    const memberMap: Record<
      string,
      {
        id: string;
        name: string;
        email: string;
        imageUrl: string | null;
        designation: string | null;
        role: string;
        activeTicketsCount: number;
        estimatedHours: number;
      }
    > = {};

    projects.forEach((proj) => {
      const allPeople = [
        ...proj.admins.map((a) => ({ ...a, role: "admin" })),
        ...proj.members.map((m) => ({ ...m })),
      ];

      allPeople.forEach((person) => {
        if (!memberMap[person.id]) {
          memberMap[person.id] = {
            id: person.id,
            name: person.name,
            email: person.email,
            imageUrl: person.imageUrl,
            designation: person.designation,
            role: person.role,
            activeTicketsCount: 0,
            estimatedHours: 0,
          };
        }
      });

      proj.tickets.forEach((ticket) => {
        if (ticket.assignedUserId && memberMap[ticket.assignedUserId]) {
          if (ticket.status !== "completed") {
            memberMap[ticket.assignedUserId].activeTicketsCount++;
            memberMap[ticket.assignedUserId].estimatedHours += ticket.estimatedHours || 0;
          }
        }
      });
    });

    const teamWorkload = Object.values(memberMap).sort(
      (a, b) => b.activeTicketsCount - a.activeTicketsCount
    );

    // 6. Admin logged time & team ticket completions weekly (last 7 days)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const adminTimeLogs = await prisma.timeLog.findMany({
      where: { userId: dbUser.id },
      select: { duration: true, createdAt: true },
    });

    const totalAdminMinutes = adminTimeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalAdminHours = Math.round((totalAdminMinutes / 60) * 10) / 10;

    // Logged today (admin)
    const todayEnd = new Date(startOfToday);
    todayEnd.setHours(23, 59, 59, 999);
    const loggedTodayMin = adminTimeLogs
      .filter((log) => {
        const d = new Date(log.createdAt);
        return d >= startOfToday && d <= todayEnd;
      })
      .reduce((sum, log) => sum + (log.duration || 0), 0);

    // Filter logs for this week vs last week to show percentage trends
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - 6);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekMinutes = adminTimeLogs
      .filter((log) => new Date(log.createdAt) >= startOfThisWeek)
      .reduce((sum, log) => sum + (log.duration || 0), 0);

    const lastWeekMinutes = adminTimeLogs
      .filter((log) => {
        const d = new Date(log.createdAt);
        return d >= startOfLastWeek && d < startOfThisWeek;
      })
      .reduce((sum, log) => sum + (log.duration || 0), 0);

    let changePercent = 0;
    let changeType: "up" | "down" | "neutral" = "neutral";
    if (lastWeekMinutes > 0) {
      changePercent = Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100);
      changeType = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
    } else if (thisWeekMinutes > 0) {
      changePercent = 100;
      changeType = "up";
    }

    const weeklyPerformance = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(startOfToday);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = adminTimeLogs.filter((log) => {
        const d = new Date(log.createdAt);
        return d >= dayStart && d <= dayEnd;
      });
      const dayMinutes = dayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

      const dayCompletedTickets = projects.reduce((sum, proj) => {
        return (
          sum +
          proj.tickets.filter((t) => {
            if (t.status !== "completed") return false;
            const compDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
            return compDate >= dayStart && compDate <= dayEnd;
          }).length
        );
      }, 0);

      weeklyPerformance.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        date: dayStart.toISOString().split("T")[0],
        hours: Math.round((dayMinutes / 60) * 10) / 10,
        ticketsCompleted: dayCompletedTickets,
      });
    }

    return NextResponse.json({
      stats: {
        totalProjects: mappedProjects.length,
        activeProjects: mappedProjects.filter((p) => p.status !== "completed").length,
        completedProjects: mappedProjects.filter((p) => p.status === "completed").length,
        totalTickets,
        completedTickets,
        inProgressTickets,
        inReviewTickets,
        blockedTickets,
        reopenTickets,
        estimatedHours,
        loggedHours: Math.round((loggedMinutes / 60) * 10) / 10,
        adminTotalHours: totalAdminHours,
        adminTodayHours: Math.round((loggedTodayMin / 60) * 10) / 10,
        adminThisWeekHours: Math.round((thisWeekMinutes / 60) * 10) / 10,
        adminLastWeekHours: Math.round((lastWeekMinutes / 60) * 10) / 10,
        changePercent: Math.abs(changePercent),
        changeType,
        openFeedbacksCount: openFeedbacks.length,
      },
      projects: mappedProjects,
      blockedOrReopenedTickets,
      openFeedbacks,
      overdueTickets,
      upcomingDeadlines,
      teamWorkload,
      weeklyPerformance,
    });
  } catch (error: any) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard summary" },
      { status: 500 }
    );
  }
}
