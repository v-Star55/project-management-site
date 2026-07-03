import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { projectId } = await params;
    if (!projectId) {
        return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
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

        // Fetch discussion groups for the project
        const groups = await prisma.projectDiscussionGroup.findMany({
            where: { projectId },
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
            orderBy: [
                { isPinned: "desc" },
                { createdAt: "asc" }
            ],
        });

        return NextResponse.json({ groups });
    } catch (error) {
        console.error("Error fetching discussion groups:", error);
        return NextResponse.json({ error: "Failed to fetch discussion groups" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { projectId } = await params;
    if (!projectId) {
        return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
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

        const body = await req.json();
        const { title, type, content, memberIds, ticketIds } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Ensure the creator is always added as a member of the group
        const connectedMemberIds = Array.from(new Set([...(memberIds || []), dbUser.id]));

        // Create the project discussion group
        const group = await prisma.projectDiscussionGroup.create({
            data: {
                title: title.trim(),
                type: type || "discussion",
                content: content ? content.trim() : null,
                projectId,
                userId: dbUser.id,
                members: {
                    connect: connectedMemberIds.map((id: string) => ({ id }))
                },
                tickets: ticketIds && ticketIds.length > 0 ? {
                    connect: ticketIds.map((id: string) => ({ id }))
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

        return NextResponse.json({ group }, { status: 201 });
    } catch (error) {
        console.error("Error creating discussion group:", error);
        return NextResponse.json({ error: "Failed to create discussion group" }, { status: 500 });
    }
}
