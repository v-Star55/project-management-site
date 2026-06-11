import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

// POST /api/tickets/time-logs
// Logs hours worked on a ticket
export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    try {
        const body = await req.json();
        const { ticketId, startTime, endTime, duration, description } = body;

        if (!ticketId || !duration) {
            return NextResponse.json(
                { error: "ticketId and duration are required" },
                { status: 400 }
            );
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true, role: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { project: true },
        });

        if (!ticket || ticket.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Ticket not found or unauthorized" }, { status: 403 });
        }

        // PERMISSION CHECK: Only the assigned user, owner, or admin can log hours
        const isAssigned = ticket.assignedUserId === user.id;
        const isOwnerOrAdmin = dbUser.role === "owner" || dbUser.role === "admin";
        
        if (!isAssigned && !isOwnerOrAdmin) {
            return NextResponse.json(
                { error: "Forbidden: only the assigned user, owner, or admin can log hours on this ticket." },
                { status: 403 }
            );
        }

        // Calculate dates if not fully provided
        const logStartTime = startTime ? new Date(startTime) : new Date();
        const parsedDuration = parseInt(duration, 10);
        const logEndTime = endTime ? new Date(endTime) : new Date(logStartTime.getTime() + parsedDuration * 60000);

        const timeLog = await prisma.timeLog.create({
            data: {
                ticketId,
                userId: user.id,
                startTime: logStartTime,
                endTime: logEndTime,
                duration: parsedDuration,
                description: description || null,
            },
            include: {
                user: { select: { id: true, name: true, email: true, imageUrl: true } }
            }
        });

        return NextResponse.json({ timeLog }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create time log" }, { status: 500 });
    }
}

// DELETE /api/tickets/time-logs?id=xxx
// Deletes a specific time log entry
export async function DELETE(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "time log id is required" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true, role: true },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        const log = await prisma.timeLog.findUnique({
            where: { id },
            include: { ticket: { include: { project: true } } },
        });

        if (!log || log.ticket?.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Time log not found or unauthorized" }, { status: 403 });
        }

        // Only the creator of the log, or admin/owner can delete it
        if (log.userId !== user.id && dbUser.role !== "admin" && dbUser.role !== "owner") {
            return NextResponse.json({ error: "Forbidden: you can only delete your own time logs" }, { status: 403 });
        }

        await prisma.timeLog.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete time log" }, { status: 500 });
    }
}
