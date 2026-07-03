import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import { $Enums } from "@/generated/prisma";

// ─── GET /api/tickets ──────────────────────────────────────────────────────────
// Fetch tickets scoped to the authenticated user's role and company workspace.
export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);

    // Propagate any auth/permission error response directly.
    if (user instanceof NextResponse) return user;

    try {
        // Fetch fresh DB record to get authoritative companyId & role.
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!dbUser.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const scope = searchParams.get("scope");

        let tickets;

        const ticketInclude = {
            project: { select: { id: true, title: true } },
            group: { select: { id: true, name: true, type: true } },
            assignedUser: { select: { id: true, name: true, email: true, imageUrl: true } },
            assignedBy: { select: { id: true, name: true, email: true, imageUrl: true } },
            reasons: {
                include: {
                    user: { select: { id: true, name: true, email: true, imageUrl: true } }
                },
                orderBy: { createdAt: "desc" as const }
            },
            attachments: {
                orderBy: { createdAt: "desc" as const }
            },
            timeLogs: {
                include: {
                    user: { select: { id: true, name: true, email: true, imageUrl: true } }
                },
                orderBy: { createdAt: "desc" as const }
            }
        };

        if (scope === "time-logs") {
            if (dbUser.role === "owner") {
                // Owner can see all tickets across every project in the company.
                tickets = await prisma.ticket.findMany({
                    where: {
                        project: { companyId: dbUser.companyId },
                        isDeleted: false,
                    },
                    include: ticketInclude,
                    orderBy: { createdAt: "desc" },
                });
            } else {
                // non-owner (admin, member, qa) in time-logs scope:
                // - Admin (global admin or project admin): see all tickets in project
                // - Project member: only see assigned tickets in project
                tickets = await prisma.ticket.findMany({
                    where: {
                        project: {
                            companyId: dbUser.companyId,
                            isActive: true,
                        },
                        isDeleted: false,
                        OR: [
                            // Project Admin (or global admin): sees all tickets of the project
                            {
                                project: {
                                    OR: [
                                        ...(dbUser.role === "admin" ? [{ companyId: dbUser.companyId }] : []),
                                        { admins: { some: { id: dbUser.id } } }
                                    ]
                                }
                            },
                            // Project Member: sees only tickets assigned to them in that project
                            {
                                project: {
                                    members: { some: { id: dbUser.id } }
                                },
                                assignedUserId: dbUser.id
                            }
                        ]
                    },
                    include: ticketInclude,
                    orderBy: { createdAt: "desc" },
                });
            }
        } else {
            if (dbUser.role === "owner") {
                // All tickets across every project in the company.
                tickets = await prisma.ticket.findMany({
                    where: {
                        project: { companyId: dbUser.companyId },
                        isDeleted: false,
                    },
                    include: ticketInclude,
                    orderBy: { createdAt: "desc" },
                });
            } else if (dbUser.role === "admin") {
                // admin can only see tickets of projects they are admins of.
                tickets = await prisma.ticket.findMany({
                    where: {
                        project: {
                            companyId: dbUser.companyId,
                            isActive: true,
                            admins: { some: { id: dbUser.id } },
                        },
                        isDeleted: false,
                    },
                    include: ticketInclude,
                    orderBy: { createdAt: "desc" },
                });
            } else {
                // member: only tickets they are assigned to, or tickets of projects they are member or admin of.
                tickets = await prisma.ticket.findMany({
                    where: {
                        project: {
                            companyId: dbUser.companyId,
                            isActive: true,
                        },
                        isDeleted: false,
                        OR: [
                            { assignedUserId: dbUser.id },
                            {
                                project: {
                                    OR: [
                                        { members: { some: { id: dbUser.id } } },
                                        { admins: { some: { id: dbUser.id } } }
                                    ]
                                }
                            }
                        ]
                    },
                    include: ticketInclude,
                    orderBy: { createdAt: "desc" },
                });
            }
        }

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// ─── POST /api/tickets ─────────────────────────────────────────────────────────
// Create a new ticket. Only owner, admin, and project-admin members can create tickets.
export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);

    if (user instanceof NextResponse) return user;

    try {
        const body = await req.json();
        const { title, description, projectId, status, assignedUserId, priority, groupId, dueDate, type, estimatedHours } = body;

        if (!title || !description || !projectId) {
            return NextResponse.json(
                { error: "title, description, and projectId are required" },
                { status: 400 }
            );
        }

        // Ensure the project belongs to the user's company before creating.
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const project = await prisma.project.findFirst({
            where: { id: projectId, companyId: dbUser.companyId },
            include: {
                admins: { select: { id: true } },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or does not belong to your company" },
                { status: 403 }
            );
        }

        // Access Control:
        // owner can create tickets for any project in their company.
        // admin and members can create tickets only if they are a project admin of this project.
        if (dbUser.role !== "owner") {
            const isProjectAdmin = project.admins.some((a) => a.id === dbUser.id);
            if (!isProjectAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: You are not an admin of this project" },
                    { status: 403 }
                );
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                projectId,
                status: (status as $Enums.TicketStatus) ?? "pending",
                priority: (priority as $Enums.Priority) ?? "low",
                type: (type as $Enums.TicketType) ?? "task",
                ...(assignedUserId ? { assignedUserId, assignedById: dbUser.id } : {}),
                ...(groupId && groupId !== "none" ? { groupId } : {}),
                ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
                estimatedHours: estimatedHours !== undefined && estimatedHours !== null && estimatedHours !== "" ? parseFloat(estimatedHours) : null,
            },
        });

        // Create an activity log for ticket creation
        await prisma.activityLog.create({
            data: {
                action: "TICKET_CREATED",
                description: `Created ticket ${ticket.title}`,
                userId: dbUser.id,
                projectId: ticket.projectId,
                ticketId: ticket.id,
                groupId: ticket.groupId || null,
            }
        });

        return NextResponse.json({ ticket }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}

// ─── PATCH /api/tickets ────────────────────────────────────────────────────────
// Update ticket status, priority, or other metadata fields.
export async function PATCH(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);

    if (user instanceof NextResponse) return user;

    try {
        const body = await req.json();
        const {
            id,
            status,
            priority,
            reasonBlocked,
            reasonReopen,
            title,
            description,
            assignedUserId,
            groupId,
            dueDate,
            type,
            estimatedHours
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        const isEditingMetadata = (
            title !== undefined ||
            description !== undefined ||
            assignedUserId !== undefined ||
            groupId !== undefined ||
            dueDate !== undefined ||
            type !== undefined ||
            estimatedHours !== undefined
        );

        if (
            status === undefined &&
            priority === undefined &&
            !isEditingMetadata
        ) {
            return NextResponse.json(
                { error: "No fields to update provided" },
                { status: 400 }
            );
        }

        // Fetch user's company info to check permissions.
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, companyId: true, role: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        // Verify ticket belongs to user's company and include project details.
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        admins: { select: { id: true } },
                        members: { select: { id: true } },
                    }
                }
            },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json(
                { error: "Ticket not found or unauthorized" },
                { status: 403 }
            );
        }

        // Access Control for update:
        // owner can update any ticket.
        if (dbUser.role !== "owner") {
            const isProjectAdmin = ticket.project.admins.some((a) => a.id === dbUser.id);
            if (dbUser.role === "admin") {
                if (!isProjectAdmin) {
                    return NextResponse.json(
                        { error: "Forbidden: Only project admins or owners can update tickets" },
                        { status: 403 }
                    );
                }
            } else {
                // member
                if (isEditingMetadata) {
                    // Only project admins or owners can edit ticket details (metadata)
                    if (!isProjectAdmin) {
                        return NextResponse.json(
                            { error: "Forbidden: Only project admins or owners can edit ticket details" },
                            { status: 403 }
                        );
                    }
                } else {
                    // Changing only status or priority
                    const isProjectMember = ticket.project.members.some((m) => m.id === dbUser.id);
                    const isAssignee = ticket.assignedUserId === dbUser.id;
                    if (!isProjectAdmin && !isProjectMember && !isAssignee) {
                        return NextResponse.json(
                            { error: "Forbidden: You do not have permission to update this ticket" },
                            { status: 403 }
                        );
                    }
                }
            }
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (assignedUserId !== undefined) {
            updateData.assignedUserId = assignedUserId === "unassigned" ? null : assignedUserId;
            updateData.assignedById = assignedUserId === "unassigned" ? null : dbUser.id;
        }
        if (groupId !== undefined) {
            updateData.groupId = groupId === "none" ? null : groupId;
        }
        if (dueDate !== undefined) {
            updateData.dueDate = dueDate ? new Date(dueDate) : null;
        }
        if (type !== undefined) {
            updateData.type = type as $Enums.TicketType;
        }
        if (estimatedHours !== undefined) {
            updateData.estimatedHours = estimatedHours !== null && estimatedHours !== "" ? parseFloat(estimatedHours) : null;
        }

        if (status !== undefined) {
            updateData.status = status as $Enums.TicketStatus;
            if (status === "blocked") {
                updateData.reasonBlocked = reasonBlocked || null;
            } else if (status === "reopen") {
                updateData.reasonReopen = reasonReopen || null;
            } else {
                updateData.reasonBlocked = null;
                updateData.reasonReopen = null;
            }
        }
        if (priority !== undefined) {
            updateData.priority = priority as $Enums.Priority;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: updateData,
        });

        // Create TicketReason history entry if blocked/reopened
        if (status === "blocked" && reasonBlocked) {
            await prisma.ticketReason.create({
                data: {
                    ticketId: id,
                    type: "BLOCKED",
                    reason: reasonBlocked,
                    userId: dbUser.id
                }
            });
        } else if (status === "reopen" && reasonReopen) {
            await prisma.ticketReason.create({
                data: {
                    ticketId: id,
                    type: "REOPENED",
                    reason: reasonReopen,
                    userId: dbUser.id
                }
            });
        }

        // Log activity if status, priority, or assignee changed
        const formatStatus = (s: string) => {
            if (s === "in_progress") return "In Progress";
            if (s === "in_review") return "In Review";
            if (s === "completed") return "Completed";
            if (s === "reopen") return "Reopen";
            if (s === "blocked") return "Blocked";
            if (s === "pending") return "Pending";
            if (s === "backlog") return "Backlog";
            return s;
        };

        const formatPriority = (p: string) => {
            if (p === "low") return "Low";
            if (p === "medium") return "Medium";
            if (p === "high") return "High";
            if (p === "urgent") return "Urgent";
            return p;
        };

        if (status !== undefined && status !== ticket.status) {
            await prisma.activityLog.create({
                data: {
                    action: "TICKET_STATUS_CHANGED",
                    description: `Moved ${ticket.title} to ${formatStatus(status)}`,
                    userId: dbUser.id,
                    projectId: ticket.projectId,
                    ticketId: ticket.id,
                    groupId: updatedTicket.groupId || null,
                    metadata: { from: ticket.status, to: status }
                }
            });
        }

        if (priority !== undefined && priority !== ticket.priority) {
            await prisma.activityLog.create({
                data: {
                    action: "TICKET_PRIORITY_CHANGED",
                    description: `Updated ${ticket.title} priority to ${formatPriority(priority)}`,
                    userId: dbUser.id,
                    projectId: ticket.projectId,
                    ticketId: ticket.id,
                    groupId: updatedTicket.groupId || null,
                    metadata: { from: ticket.priority, to: priority }
                }
            });
        }

        if (assignedUserId !== undefined && assignedUserId !== ticket.assignedUserId) {
            if (updatedTicket.assignedUserId) {
                const assignedUser = await prisma.user.findUnique({
                    where: { id: updatedTicket.assignedUserId },
                    select: { name: true }
                });
                await prisma.activityLog.create({
                    data: {
                        action: "TICKET_ASSIGNED",
                        description: `Assigned ${ticket.title} to ${assignedUser?.name || "someone"}`,
                        userId: dbUser.id,
                        targetUserId: updatedTicket.assignedUserId,
                        projectId: ticket.projectId,
                        ticketId: ticket.id,
                        groupId: updatedTicket.groupId || null,
                    }
                });
            } else {
                await prisma.activityLog.create({
                    data: {
                        action: "TICKET_UNASSIGNED",
                        description: `Unassigned ${ticket.title}`,
                        userId: dbUser.id,
                        projectId: ticket.projectId,
                        ticketId: ticket.id,
                        groupId: updatedTicket.groupId || null,
                    }
                });
            }
        }

        if (groupId !== undefined && groupId !== ticket.groupId) {
            let desc = "";
            if (updatedTicket.groupId) {
                const group = await prisma.projectGroup.findUnique({
                    where: { id: updatedTicket.groupId },
                    select: { name: true }
                });
                desc = `Moved ${ticket.title} to ${group?.name || "sprint"}`;
            } else {
                desc = `Removed ${ticket.title} from sprint`;
            }
            await prisma.activityLog.create({
                data: {
                    action: "TICKET_MOVED",
                    description: desc,
                    userId: dbUser.id,
                    projectId: ticket.projectId,
                    ticketId: ticket.id,
                    groupId: updatedTicket.groupId || ticket.groupId || null,
                }
            });
        }

        return NextResponse.json({ ticket: updatedTicket });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}

// ─── DELETE /api/tickets ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        admins: { select: { id: true } },
                    },
                },
            },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json(
                { error: "Ticket not found or unauthorized" },
                { status: 404 }
            );
        }

        // Access Control:
        // owner can delete any ticket.
        // admin and members can delete only if they are a project admin of this project.
        if (dbUser.role !== "owner") {
            const isProjectAdmin = ticket.project.admins.some((a) => a.id === dbUser.id);
            if (!isProjectAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: You are not an admin of this project" },
                    { status: 403 }
                );
            }
        }

        // Soft delete the ticket
        const deletedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        // Create an activity log for ticket deletion
        await prisma.activityLog.create({
            data: {
                action: "TICKET_DELETED",
                description: `Deleted ticket ${ticket.title}`,
                userId: dbUser.id,
                projectId: ticket.projectId,
                ticketId: ticket.id,
                groupId: ticket.groupId || null,
            }
        });

        return NextResponse.json({ success: true, ticket: deletedTicket });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
    }
}
