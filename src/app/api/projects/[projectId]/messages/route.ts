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

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { select: { id: true } },
                admins: { select: { id: true } },
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Access control:
        // owner can access any project in the company.
        // admin can only access if they are a project admin of this project.
        // member & client can only access if they are a member or admin of the project.
        if (dbUser.role !== "owner") {
            const isMember = project.members.some((m) => m.id === dbUser.id);
            const isProjectAdmin = project.admins.some((a) => a.id === dbUser.id);
            if (dbUser.role === "admin") {
                if (!isProjectAdmin) {
                    return NextResponse.json(
                        { error: "Forbidden: You are not an admin of this project" },
                        { status: 403 }
                    );
                }
            } else {
                if (!isMember && !isProjectAdmin) {
                    return NextResponse.json(
                        { error: "Forbidden: You are not a member of this project" },
                        { status: 403 }
                    );
                }
            }
        }

        // Fetch messages for the project
        const messages = await prisma.message.findMany({
            where: { projectId },
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
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching project messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { select: { id: true } },
                admins: { select: { id: true } },
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Access control:
        // owner can send message to any project in the company.
        // admin can only send message if they are a project admin of this project.
        // member & client can only send message if they are a member or admin of the project.
        if (dbUser.role !== "owner") {
            const isMember = project.members.some((m) => m.id === dbUser.id);
            const isProjectAdmin = project.admins.some((a) => a.id === dbUser.id);
            if (dbUser.role === "admin") {
                if (!isProjectAdmin) {
                    return NextResponse.json(
                        { error: "Forbidden: You are not an admin of this project" },
                        { status: 403 }
                    );
                }
            } else {
                if (!isMember && !isProjectAdmin) {
                    return NextResponse.json(
                        { error: "Forbidden: You are not a member of this project" },
                        { status: 403 }
                    );
                }
            }
        }

        const body = await req.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Message text is required" }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                text: text.trim(),
                projectId,
                userId: user.id,
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

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error("Error creating project message:", error);
        return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }
}
