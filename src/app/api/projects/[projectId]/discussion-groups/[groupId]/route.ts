import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; groupId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, groupId } = await params;
    if (!projectId || !groupId) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { title, type, content, isPinned, isArchived, memberIds, ticketIds } = body;

        // Perform update
        const updated = await prisma.projectDiscussionGroup.update({
            where: { id: groupId, projectId },
            data: {
                title: title !== undefined ? title.trim() : undefined,
                type: type || undefined,
                content: content !== undefined ? content : undefined,
                isPinned: isPinned !== undefined ? isPinned : undefined,
                isArchived: isArchived !== undefined ? isArchived : undefined,
                members: memberIds !== undefined ? {
                    set: memberIds.map((id: string) => ({ id }))
                } : undefined,
                tickets: ticketIds !== undefined ? {
                    set: ticketIds.map((id: string) => ({ id }))
                } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        imageUrl: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        imageUrl: true,
                        designation: true,
                    },
                },
                tickets: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
            },
        });

        return NextResponse.json({ group: updated });
    } catch (error) {
        console.error("Error updating discussion group:", error);
        return NextResponse.json({ error: "Failed to update discussion group" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; groupId?: string }> }
) {
    const user = await requireRole(["owner", "admin"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, groupId } = await params;
    if (!projectId || !groupId) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        await prisma.projectDiscussionGroup.delete({
            where: { id: groupId, projectId },
        });
        return NextResponse.json({ message: "Discussion group deleted successfully", groupId });
    } catch (error) {
        console.error("Error deleting discussion group:", error);
        return NextResponse.json({ error: "Failed to delete discussion group" }, { status: 500 });
    }
}
