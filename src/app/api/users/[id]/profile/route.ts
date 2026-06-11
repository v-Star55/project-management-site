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

        // Fetch all projects where the target user is a member
        const allProjects = await prisma.project.findMany({
            where: {
                members: {
                    some: { id },
                },
            },
            orderBy: { updatedAt: "desc" },
            include: {
                tickets: {
                    where: { isDeleted: false, assignedUserId: id },
                    include: {
                        assignedUser: {
                            select: { id: true, name: true, email: true, imageUrl: true },
                        },
                        group: true,
                    },
                },
                groups: {
                    where: { isActive: true },
                },
                admins: {
                    select: { id: true, name: true, email: true, imageUrl: true, role: true },
                },
                members: {
                    select: { id: true, name: true, email: true, imageUrl: true, role: true },
                },
            },
        });

        // Identify current project: prioritise active in_progress, fallback to first active project
        const currentProject = allProjects.find(p => p.status === "in_progress" && p.isActive) || allProjects.find(p => p.isActive) || allProjects[0] || null;

        // Fetch previous projects names/statuses (strictly completed or inactive)
        const previousProjects = await prisma.project.findMany({
            where: {
                members: {
                    some: { id },
                },
                OR: [
                    { status: "completed" },
                    { isActive: false },
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
        });

        // Sum up total duration logged in minutes
        const totalLogMinutes = targetUser.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

        // Fetch ticket statistics assigned to this user
        const totalTasksCount = await prisma.ticket.count({
            where: { assignedUserId: id, isDeleted: false }
        });
        const userTickets = await prisma.ticket.findMany({
            where: { assignedUserId: id, isDeleted: false },
            select: { status: true }
        });

        let todoCount = 0;
        let inProgressCount = 0;
        let inReviewCount = 0;
        let completedCount = 0;

        userTickets.forEach(ticket => {
            if (ticket.status === "pending" || ticket.status === "backlog") {
                todoCount++;
            } else if (ticket.status === "in_progress" || ticket.status === "reopen" || ticket.status === "blocked") {
                inProgressCount++;
            } else if (ticket.status === "in_review") {
                inReviewCount++;
            } else if (ticket.status === "completed") {
                completedCount++;
            }
        });

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
                    type: t.type,
                    groupId: t.groupId,
                    groupName: t.group?.name || null,
                })),
                groups: currentProject.groups.map(g => ({
                    id: g.id,
                    name: g.name,
                })),
                admins: currentProject.admins,
                members: currentProject.members,
            } : null,
            projects: allProjects.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                status: p.status,
                startDate: p.startDate,
                completedDate: p.completedDate,
                isActive: p.isActive,
                tickets: p.tickets.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    assignedUser: t.assignedUser,
                    type: t.type,
                    groupId: t.groupId,
                    groupName: t.group?.name || null,
                })),
                groups: p.groups.map(g => ({
                    id: g.id,
                    name: g.name,
                })),
                admins: p.admins,
                members: p.members,
            })),
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
                completed: completedCount,
                pending: totalTasksCount - completedCount,
                todo: todoCount,
                inProgress: inProgressCount,
                inReview: inReviewCount,
            },
        });

    } catch (error) {
        console.error("Error fetching user profile details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
