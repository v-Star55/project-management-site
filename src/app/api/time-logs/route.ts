import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

// GET /api/time-logs
// Returns list of time logs filtered and scoped by role permissions
export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);
    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const ticketId = searchParams.get("ticketId");
        const userId = searchParams.get("userId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const andFilters: any[] = [];

        // 1. Company and Role-based restrictions
        if (dbUser.role === "owner") {
            // Owner can see logs across any project in the company
            andFilters.push({
                OR: [
                    { project: { companyId: dbUser.companyId } },
                    { ticket: { project: { companyId: dbUser.companyId } } }
                ]
            });
        } else if (dbUser.role === "admin") {
            // Admin can see logs on projects they are admin of
            andFilters.push({
                OR: [
                    {
                        project: {
                            companyId: dbUser.companyId,
                            admins: { some: { id: dbUser.id } }
                        }
                    },
                    {
                        ticket: {
                            project: {
                                companyId: dbUser.companyId,
                                admins: { some: { id: dbUser.id } }
                            }
                        }
                    }
                ]
            });
        } else {
            // member and qa can only see their own time logs
            andFilters.push({ userId: dbUser.id });
        }

        // 2. Project filter (covers direct relation or through ticket relation)
        if (projectId && projectId !== "all") {
            andFilters.push({
                OR: [
                    { projectId: projectId },
                    { ticket: { projectId: projectId } }
                ]
            });
        }

        // 3. Ticket filter
        if (ticketId && ticketId !== "all") {
            andFilters.push({ ticketId });
        }

        // 4. User filter (only owner and admin can filter by user)
        if (userId && userId !== "all" && (dbUser.role === "owner" || dbUser.role === "admin")) {
            andFilters.push({ userId });
        }

        // 5. Date filters
        if (startDate || endDate) {
            const dateFilter: any = {};
            if (startDate) {
                dateFilter.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.lte = end;
            }
            andFilters.push({ startTime: dateFilter });
        }

        const baseFilter = andFilters.length > 0 ? { AND: andFilters } : {};

        const timeLogs = await prisma.timeLog.findMany({
            where: baseFilter,
            include: {
                user: { select: { id: true, name: true, email: true, imageUrl: true, role: true } },
                project: { select: { id: true, title: true } },
                ticket: {
                    select: {
                        id: true,
                        title: true,
                        estimatedHours: true,
                        timeLogs: {
                            select: {
                                duration: true
                            }
                        }
                    }
                }
            },
            orderBy: { startTime: "desc" }
        });

        return NextResponse.json({ timeLogs });
    } catch (error) {
        console.error("Failed to fetch time logs:", error);
        return NextResponse.json({ error: "Failed to fetch time logs" }, { status: 500 });
    }
}

// POST /api/time-logs
// Logs hours worked on a project and/or ticket
export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);
    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const body = await req.json();
        const { ticketId, startTime, endTime, duration, description } = body;
        let { projectId } = body;

        const parsedDuration = parseInt(duration, 10);
        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            return NextResponse.json({ error: "A valid positive duration is required" }, { status: 400 });
        }

        // If ticketId is provided, resolve/verify the projectId
        let targetTicket = null;
        if (ticketId) {
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: { project: true }
            });

            if (!ticket || ticket.isDeleted) {
                return NextResponse.json({ error: "Ticket not found or deleted" }, { status: 404 });
            }

            if (ticket.project.companyId !== dbUser.companyId) {
                return NextResponse.json({ error: "Unauthorized ticket access" }, { status: 403 });
            }

            projectId = ticket.projectId;
            targetTicket = ticket;
        }

        if (!projectId) {
            return NextResponse.json({ error: "projectId or ticketId is required" }, { status: 400 });
        }

        // Fetch project and verify access
        const project = await prisma.project.findFirst({
            where: { id: projectId, companyId: dbUser.companyId },
            include: {
                members: { select: { id: true } },
                admins: { select: { id: true } }
            }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 403 });
        }

        // Access checks
        const isOwner = dbUser.role === "owner";
        const isAdmin = dbUser.role === "admin" && project.admins.some((a) => a.id === dbUser.id);
        const isMemberOrQa = (dbUser.role === "member" || dbUser.role === "qa") &&
                             (project.members.some((m) => m.id === dbUser.id) || project.admins.some((a) => a.id === dbUser.id));

        if (!isOwner && !isAdmin && !isMemberOrQa) {
            return NextResponse.json({ error: "Forbidden: You are not assigned to this project" }, { status: 403 });
        }

        if (targetTicket) {
            const isProjectAdmin = dbUser.role === "admin" && project.admins.some((a) => a.id === dbUser.id);
            if (!isOwner && !isProjectAdmin) {
                if (targetTicket.assignedUserId !== dbUser.id) {
                    return NextResponse.json({ error: "Forbidden: You can only log time on tickets assigned to you" }, { status: 403 });
                }
            }
        }

        const logStartTime = startTime ? new Date(startTime) : new Date();
        const logEndTime = endTime ? new Date(endTime) : new Date(logStartTime.getTime() + parsedDuration * 60000);

        const timeLog = await prisma.timeLog.create({
            data: {
                userId: dbUser.id,
                projectId,
                ticketId: ticketId || null,
                startTime: logStartTime,
                endTime: logEndTime,
                duration: parsedDuration,
                description: description || null
            },
            include: {
                user: { select: { id: true, name: true, email: true, imageUrl: true } },
                project: { select: { id: true, title: true } },
                ticket: { select: { id: true, title: true } }
            }
        });

        return NextResponse.json({ timeLog }, { status: 201 });
    } catch (error) {
        console.error("Failed to create time log:", error);
        return NextResponse.json({ error: "Failed to create time log" }, { status: 500 });
    }
}

// PATCH /api/time-logs
// Updates an existing time log entry
export async function PATCH(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);
    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const body = await req.json();
        const { id, startTime, endTime, duration, description, ticketId } = body;
        let { projectId } = body;

        if (!id) {
            return NextResponse.json({ error: "Time log id is required" }, { status: 400 });
        }

        // Fetch current log to check permissions
        const log = await prisma.timeLog.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        admins: { select: { id: true } }
                    }
                },
                ticket: {
                    include: {
                        project: {
                            include: {
                                admins: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!log) {
            return NextResponse.json({ error: "Time log not found" }, { status: 404 });
        }

        const logCompanyId = log.project?.companyId || log.ticket?.project?.companyId;
        if (logCompanyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Unauthorized time log access" }, { status: 403 });
        }

        // Access checks: creator, project admin, or owner can edit
        const isLogOwner = log.userId === dbUser.id;
        const isOwner = dbUser.role === "owner";
        const projectAdmins = log.project?.admins || log.ticket?.project?.admins || [];
        const isAdminOfProject = dbUser.role === "admin" && projectAdmins.some((a) => a.id === dbUser.id);

        if (!isLogOwner && !isOwner && !isAdminOfProject) {
            return NextResponse.json({ error: "Forbidden: You do not have permission to edit this time log" }, { status: 403 });
        }

        // If target ticket or project is changing, validate those permissions
        let finalTicketId = log.ticketId;
        let finalProjectId = log.projectId;

        if (ticketId !== undefined) {
            finalTicketId = ticketId;
        }

        if (finalTicketId) {
            const ticket = await prisma.ticket.findUnique({
                where: { id: finalTicketId },
                include: {
                    project: {
                        include: {
                            admins: { select: { id: true } }
                        }
                    }
                }
            });

            if (!ticket || ticket.isDeleted) {
                return NextResponse.json({ error: "Target ticket not found or deleted" }, { status: 404 });
            }

            if (ticket.project.companyId !== dbUser.companyId) {
                return NextResponse.json({ error: "Unauthorized ticket access" }, { status: 403 });
            }

            const isProjectAdmin = dbUser.role === "admin" && ticket.project.admins.some((a) => a.id === dbUser.id);
            if (!isOwner && !isProjectAdmin) {
                if (ticket.assignedUserId !== dbUser.id) {
                    return NextResponse.json({ error: "Forbidden: You can only log time on tickets assigned to you" }, { status: 403 });
                }
            }

            finalProjectId = ticket.projectId;
        } else if (projectId !== undefined) {
            finalProjectId = projectId;
        }

        if (finalProjectId && finalProjectId !== log.projectId) {
            // Verify access to new project
            const project = await prisma.project.findFirst({
                where: { id: finalProjectId, companyId: dbUser.companyId },
                include: {
                    members: { select: { id: true } },
                    admins: { select: { id: true } }
                }
            });

            if (!project) {
                return NextResponse.json({ error: "Target project not found or unauthorized" }, { status: 403 });
            }

            const canAccessNewProject = isOwner ||
                (dbUser.role === "admin" && project.admins.some((a) => a.id === dbUser.id)) ||
                (project.members.some((m) => m.id === dbUser.id) || project.admins.some((a) => a.id === dbUser.id));

            if (!canAccessNewProject) {
                return NextResponse.json({ error: "Forbidden: You do not have access to the target project" }, { status: 403 });
            }
        }

        const updateData: any = {};
        if (startTime) updateData.startTime = new Date(startTime);
        if (endTime) updateData.endTime = new Date(endTime);
        if (duration !== undefined) {
            const parsedDuration = parseInt(duration, 10);
            if (isNaN(parsedDuration) || parsedDuration <= 0) {
                return NextResponse.json({ error: "A valid positive duration is required" }, { status: 400 });
            }
            updateData.duration = parsedDuration;
        }
        if (description !== undefined) updateData.description = description || null;
        
        updateData.ticketId = finalTicketId || null;
        updateData.projectId = finalProjectId || null;

        const updatedTimeLog = await prisma.timeLog.update({
            where: { id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true, imageUrl: true } },
                project: { select: { id: true, title: true } },
                ticket: { select: { id: true, title: true } }
            }
        });

        return NextResponse.json({ timeLog: updatedTimeLog });
    } catch (error) {
        console.error("Failed to update time log:", error);
        return NextResponse.json({ error: "Failed to update time log" }, { status: 500 });
    }
}

// DELETE /api/time-logs
// Deletes a specific time log entry
export async function DELETE(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Time log id is required" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const log = await prisma.timeLog.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        admins: { select: { id: true } }
                    }
                },
                ticket: {
                    include: {
                        project: {
                            include: {
                                admins: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!log) {
            return NextResponse.json({ error: "Time log not found" }, { status: 404 });
        }

        const logCompanyId = log.project?.companyId || log.ticket?.project?.companyId;
        if (logCompanyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Unauthorized time log access" }, { status: 403 });
        }

        // Access checks: creator, project admin, or owner can delete
        const isLogOwner = log.userId === dbUser.id;
        const isOwner = dbUser.role === "owner";
        const projectAdmins = log.project?.admins || log.ticket?.project?.admins || [];
        const isAdminOfProject = dbUser.role === "admin" && projectAdmins.some((a) => a.id === dbUser.id);

        if (!isLogOwner && !isOwner && !isAdminOfProject) {
            return NextResponse.json({ error: "Forbidden: You do not have permission to delete this time log" }, { status: 403 });
        }

        await prisma.timeLog.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete time log:", error);
        return NextResponse.json({ error: "Failed to delete time log" }, { status: 500 });
    }
}
