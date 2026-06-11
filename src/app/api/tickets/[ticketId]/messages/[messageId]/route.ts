import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ ticketId?: string; messageId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { ticketId, messageId } = await params;
    if (!ticketId || !messageId) {
        return NextResponse.json({ error: "Ticket ID and Message ID are required" }, { status: 400 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                ticket: {
                    select: {
                        projectId: true,
                        project: {
                            select: { companyId: true },
                        },
                    },
                },
            },
        });

        if (!message || message.ticketId !== ticketId || message.isDeleted) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        if (message.ticket?.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        // Only the author can edit their own message
        if (message.userId !== dbUser.id) {
            return NextResponse.json(
                { error: "Forbidden: You can only edit your own comments" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Message text is required" }, { status: 400 });
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                text: text.trim(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        imageUrl: true,
                    },
                },
            },
        });

        return NextResponse.json({ message: updatedMessage });
    } catch (error) {
        console.error("Error updating ticket message:", error);
        return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ ticketId?: string; messageId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { ticketId, messageId } = await params;
    if (!ticketId || !messageId) {
        return NextResponse.json({ error: "Ticket ID and Message ID are required" }, { status: 400 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser || !dbUser.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                ticket: {
                    select: {
                        projectId: true,
                        project: {
                            select: { companyId: true },
                        },
                    },
                },
            },
        });

        if (!message || message.ticketId !== ticketId || message.isDeleted) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        if (message.ticket?.project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        // Deletion access control: Author can delete. Owner or Admin can delete any comment in their company.
        const isAuthor = message.userId === dbUser.id;
        const isOwnerOrAdmin = dbUser.role === "owner" || dbUser.role === "admin";

        if (!isAuthor && !isOwnerOrAdmin) {
            return NextResponse.json(
                { error: "Forbidden: You are not authorized to delete this comment" },
                { status: 403 }
            );
        }

        // Soft delete by setting isDeleted to true
        await prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
            },
        });

        return NextResponse.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting ticket message:", error);
        return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }
}
