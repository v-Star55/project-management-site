import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import { $Enums } from "@/generated/prisma";

// ─── GET /api/tickets ──────────────────────────────────────────────────────────
// Fetch tickets scoped to the authenticated user's role and company workspace.
export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);

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

        let tickets;

        const ticketInclude = {
            project: { select: { id: true, title: true } },
            assignedUser: { select: { id: true, name: true, email: true, imageUrl: true } },
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

        if (dbUser.role === "owner" || dbUser.role === "admin") {
            // All tickets across every project in the company.
            tickets = await prisma.ticket.findMany({
                where: {
                    project: { companyId: dbUser.companyId },
                },
                include: ticketInclude,
                orderBy: { createdAt: "desc" },
            });
        } else if (dbUser.role === "member") {
            // Tickets assigned directly to the member.
            tickets = await prisma.ticket.findMany({
                where: {
                    assignedUserId: dbUser.id,
                },
                include: ticketInclude,
                orderBy: { createdAt: "desc" },
            });
        } else {
            // client: read-only view of all company project tickets.
            tickets = await prisma.ticket.findMany({
                where: {
                    project: { companyId: dbUser.companyId },
                },
                include: ticketInclude,
                orderBy: { createdAt: "desc" },
            });
        }

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// ─── POST /api/tickets ─────────────────────────────────────────────────────────
// Create a new ticket. Only owner and admin roles can create tickets.
export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin"], req);

    if (user instanceof NextResponse) return user;

    try {
        const body = await req.json();
        const { title, description, projectId, status, assignedUserId, priority } = body;

        if (!title || !description || !projectId) {
            return NextResponse.json(
                { error: "title, description, and projectId are required" },
                { status: 400 }
            );
        }

        // Ensure the project belongs to the user's company before creating.
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const project = await prisma.project.findFirst({
            where: { id: projectId, companyId: dbUser.companyId },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or does not belong to your company" },
                { status: 403 }
            );
        }

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                projectId,
                status: (status as $Enums.TicketStatus) ?? "pending",
                priority: (priority as $Enums.Priority) ?? "low",
                ...(assignedUserId ? { assignedUserId } : {}),
            },
        });

        return NextResponse.json({ ticket }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}

// ─── PATCH /api/tickets ────────────────────────────────────────────────────────
// Update ticket status or priority.
export async function PATCH(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member"], req);

    if (user instanceof NextResponse) return user;

    try {
        const body = await req.json();
        const { id, status, priority, reasonBlocked, reasonReopen } = body;

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        if (status === undefined && priority === undefined) {
            return NextResponse.json(
                { error: "Either status or priority is required" },
                { status: 400 }
            );
        }

        // Fetch user's company info to check permissions.
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        // Verify ticket belongs to user's company.
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: { project: true },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json(
                { error: "Ticket not found or unauthorized" },
                { status: 403 }
            );
        }

        const updateData: any = {};
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

        return NextResponse.json({ ticket: updatedTicket });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}
