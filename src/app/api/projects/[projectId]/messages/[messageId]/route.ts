import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import { ablyRest } from "@/lib/ably";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; messageId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, messageId } = await params;
    if (!projectId || !messageId) {
        return NextResponse.json({ error: "Project ID and Message ID are required" }, { status: 400 });
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

        // Fetch message
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        imageUrl: true,
                    },
                },
            },
        });

        if (!message || message.projectId !== projectId) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        const body = await req.json();
        const { text, isStarred } = body;

        // Verify if user wants to update text (needs to be sender or admin/owner)
        if (text !== undefined) {
            const isSender = message.userId === dbUser.id;
            const isCompanyOwner = dbUser.role === "owner";
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                include: { admins: { select: { id: true } } },
            });
            const isProjectAdmin = project?.admins.some((a) => a.id === dbUser.id) || false;

            if (!isSender && !isCompanyOwner && !isProjectAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: You are not authorized to edit this message" },
                    { status: 403 }
                );
            }
        }

        // Perform update
        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                ...(text !== undefined ? { text: text.trim() } : {}),
                ...(isStarred !== undefined ? { isStarred } : {}),
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

        // Publish to Ably
        if (ablyRest) {
            try {
                const channel = ablyRest.channels.get(`project:${projectId}`);
                await channel.publish("message_update", updatedMessage);
            } catch (ablyError) {
                console.error("Failed to publish project message update to Ably:", ablyError);
            }
        }

        return NextResponse.json({ message: updatedMessage });
    } catch (error) {
        console.error("Error updating message:", error);
        return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; messageId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, messageId } = await params;
    if (!projectId || !messageId) {
        return NextResponse.json({ error: "Project ID and Message ID are required" }, { status: 400 });
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
        });

        if (!message || message.projectId !== projectId) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Verify if user is sender or project admin or company owner
        const isSender = message.userId === dbUser.id;
        const isCompanyOwner = dbUser.role === "owner";
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { admins: { select: { id: true } } },
        });
        const isProjectAdmin = project?.admins.some((a) => a.id === dbUser.id) || false;

        if (!isSender && !isCompanyOwner && !isProjectAdmin) {
            return NextResponse.json(
                { error: "Forbidden: You are not authorized to delete this message" },
                { status: 403 }
            );
        }

        // Soft delete the message
        const deletedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true },
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

        // Publish to Ably
        if (ablyRest) {
            try {
                const channel = ablyRest.channels.get(`project:${projectId}`);
                await channel.publish("message_delete", { id: messageId });
            } catch (ablyError) {
                console.error("Failed to publish project message deletion to Ably:", ablyError);
            }
        }

        return NextResponse.json({ success: true, messageId });
    } catch (error) {
        console.error("Error deleting message:", error);
        return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }
}
