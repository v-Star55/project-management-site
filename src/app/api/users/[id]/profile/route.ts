import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id?: string }> }
) {
    try {
        // Authenticate the caller (only allow owners, admins, members, and clients)
        const authUser = await requireRole(["owner", "admin", "member", "client"], req);
        if (authUser instanceof NextResponse) return authUser;

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Fetch caller details to verify they belong to the same company
        const dbAuthUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { companyId: true, role: true },
        });

        // Fetch target user details including their company and recent time logs
        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: {
                company: true,
                timeLogs: {
                    orderBy: { startTime: "desc" },
                    include: {
                        ticket: {
                            include: {
                                project: true,
                            },
                        },
                    },
                },
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Enforce company boundary security checks
        if (dbAuthUser?.companyId !== targetUser.companyId) {
            return NextResponse.json({ error: "Forbidden: unauthorized access" }, { status: 403 });
        }

        // Restrict members and clients to only view their own profile
        const isRestrictedRole = dbAuthUser?.role === "member" || dbAuthUser?.role === "client";
        if (isRestrictedRole && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden: you can only view your own profile" }, { status: 403 });
        }

        // Fetch all active projects where this target user is a member
        const allActiveProjects = await prisma.project.findMany({
            where: {
                members: {
                    some: { id },
                },
                isActive: true,
            },
            orderBy: { updatedAt: "desc" },
            include: {
                tickets: {
                    where: { isDeleted: false },
                    include: {
                        assignedUser: {
                            select: { id: true, name: true, email: true, imageUrl: true },
                        },
                    },
                },
            },
        });

        // Identify current project: prioritise in_progress, fallback to first active project
        const currentProject = allActiveProjects.find(p => p.status === "in_progress") || allActiveProjects[0] || null;

        // Fetch previous projects names/statuses (completed, inactive, or not the current project)
        const previousProjects = await prisma.project.findMany({
            where: {
                members: {
                    some: { id },
                },
                OR: [
                    { status: "completed" },
                    { isActive: false },
                    { id: { not: currentProject?.id || "" } },
                ],
            },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                completedDate: true,
                isActive: true,
            },
            orderBy: { updatedAt: "desc" },
        }).then(projects => projects.filter(p => p.id !== currentProject?.id));

        // Sum up total duration logged in minutes
        const totalLogMinutes = targetUser.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        // Fetch ticket statistics assigned to this user
        const totalTasksCount = await prisma.ticket.count({
            where: { assignedUserId: id, isDeleted: false }
        });
        const completedTasksCount = await prisma.ticket.count({
            where: { assignedUserId: id, isDeleted: false, status: "completed" }
        });
        const pendingTasksCount = totalTasksCount - completedTasksCount;

        const basicInfo = {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            designation: targetUser.designation,
            imageUrl: targetUser.imageUrl,
            isActive: targetUser.isActive,
            createdAt: targetUser.createdAt,
            lastActive: targetUser.lastActive,
            company: targetUser.company,
        };

        return NextResponse.json({
            basicInfo,
            currentProject: currentProject ? {
                id: currentProject.id,
                title: currentProject.title,
                description: currentProject.description,
                status: currentProject.status,
                startDate: currentProject.startDate,
                completedDate: currentProject.completedDate,
                tickets: currentProject.tickets.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    assignedUser: t.assignedUser,
                })),
            } : null,
            previousProjects,
            timeLogs: targetUser.timeLogs.map(log => ({
                id: log.id,
                startTime: log.startTime,
                endTime: log.endTime,
                duration: log.duration,
                description: log.description,
                ticket: log.ticket ? {
                    id: log.ticket.id,
                    title: log.ticket.title,
                    project: log.ticket.project ? {
                        id: log.ticket.project.id,
                        title: log.ticket.project.title,
                    } : null,
                } : null,
            })),
            totalLog: totalLogMinutes,
            ticketStats: {
                total: totalTasksCount,
                completed: completedTasksCount,
                pending: pendingTasksCount,
            },
        });

    } catch (error) {
        console.error("Error fetching user profile details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
