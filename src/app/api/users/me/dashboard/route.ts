import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

// GET /api/users/me/dashboard
// Returns aggregated dashboard stats for the logged-in member
export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User not found or not in company" }, { status: 403 });
        }

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // For weekly performance — last 7 days
        const sevenDaysAgo = new Date(startOfToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        // Fetch all tickets assigned to this member
        const tickets = await prisma.ticket.findMany({
            where: {
                assignedUserId: dbUser.id,
            },
            include: {
                project: { select: { id: true, title: true, status: true, imageUrl: true, startDate: true, completedDate: true } },
                timeLogs: {
                    where: { userId: dbUser.id },
                    select: { duration: true, createdAt: true, startTime: true },
                },
            },
        });

        // Fetch all projects this member is on
        const projects = await prisma.project.findMany({
            where: {
                companyId: dbUser.companyId,
                members: { some: { id: dbUser.id } },
            },
            include: {
                tickets: {
                    where: { assignedUserId: dbUser.id },
                    select: { id: true, status: true, dueDate: true },
                },
            },
        });

        // ── Stats ──
        const totalTickets = tickets.length;
        const completedTickets = tickets.filter((t) => t.status === "completed").length;
        const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
        const inReviewTickets = tickets.filter((t) => t.status === "in_review").length;
        const blockedTickets = tickets.filter((t) => t.status === "blocked").length;
        const reopenTickets = tickets.filter((t) => t.status === "reopen").length;

        // Total hours logged by user
        const allTimeLogs = await prisma.timeLog.findMany({
            where: { userId: dbUser.id },
            select: { duration: true, createdAt: true, startTime: true },
        });

        const totalMinutes = allTimeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

        // Today's hours
        const todayLogs = allTimeLogs.filter((log) => {
            const d = new Date(log.createdAt);
            return d >= startOfToday && d <= endOfToday;
        });
        const todayMinutes = todayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        const todayHours = Math.round((todayMinutes / 60) * 10) / 10;

        // Tickets due today
        const ticketsDueToday = tickets.filter((t) => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due >= startOfToday && due <= endOfToday && t.status !== "completed";
        });

        // Upcoming deadlines (next 7 days, not today, not completed)
        const in7Days = new Date(endOfToday);
        in7Days.setDate(in7Days.getDate() + 7);
        const upcomingDeadlines = tickets.filter((t) => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            return due > endOfToday && due <= in7Days && t.status !== "completed";
        }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

        // ── Weekly Performance (last 7 days) ──
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(startOfToday);
            dayStart.setDate(dayStart.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const dayLogs = allTimeLogs.filter((log) => {
                const d = new Date(log.createdAt);
                return d >= dayStart && d <= dayEnd;
            });
            const dayMinutes = dayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

            const dayCompletedTickets = tickets.filter((t) => {
                const updated = new Date(t.updatedAt);
                return t.status === "completed" && updated >= dayStart && updated <= dayEnd;
            }).length;

            weeklyData.push({
                day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
                date: dayStart.toISOString().split("T")[0],
                hours: Math.round((dayMinutes / 60) * 10) / 10,
                ticketsCompleted: dayCompletedTickets,
            });
        }

        return NextResponse.json({
            stats: {
                totalProjects: projects.length,
                totalTickets,
                completedTickets,
                inProgressTickets,
                inReviewTickets,
                blockedTickets,
                reopenTickets,
                totalHours,
                todayHours,
            },
            ticketsDueToday: ticketsDueToday.map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                status: t.status,
                dueDate: t.dueDate,
                project: t.project,
            })),
            upcomingDeadlines: upcomingDeadlines.slice(0, 5).map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                status: t.status,
                dueDate: t.dueDate,
                project: t.project,
            })),
            projects: projects.map((p) => ({
                id: p.id,
                title: p.title,
                status: p.status,
                imageUrl: p.imageUrl,
                startDate: p.startDate,
                completedDate: p.completedDate,
                totalTickets: p.tickets.length,
                completedTickets: p.tickets.filter((t) => t.status === "completed").length,
                inProgressTickets: p.tickets.filter((t) => t.status === "in_progress").length,
            })),
            weeklyPerformance: weeklyData,
            alerts: {
                dueTodayCount: ticketsDueToday.length,
                awaitingReviewCount: inReviewTickets,
                blockedCount: blockedTickets,
                reopenCount: reopenTickets,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
