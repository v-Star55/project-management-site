import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await requireRole(["owner", "admin", "client"], req);
    if (user instanceof NextResponse) return user;

    const { id: feedbackId } = await context.params;

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

        const feedback = await prisma.feedback.findUnique({
            where: { id: feedbackId },
            include: { user: { select: { companyId: true } } },
        });

        if (!feedback) {
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        // Verify company scoping
        if (feedback.user.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        // Verify user access based on role
        if (dbUser.role === "client") {
            if (feedback.userId !== dbUser.id) {
                return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
            }
        } else if (dbUser.role === "admin") {
            const isCreator = feedback.userId === dbUser.id;
            if (!isCreator) {
                if (feedback.projectId) {
                    const hasProjectAccess = await prisma.project.findFirst({
                        where: {
                            id: feedback.projectId,
                            companyId: dbUser.companyId,
                            OR: [
                                { admins: { some: { id: dbUser.id } } },
                                { members: { some: { id: dbUser.id } } },
                            ]
                        }
                    });
                    if (!hasProjectAccess) {
                        return NextResponse.json({ error: "Unauthorized access to this project's feedback" }, { status: 403 });
                    }
                } else {
                    return NextResponse.json({ error: "Unauthorized access to this feedback" }, { status: 403 });
                }
            }
        } else if (dbUser.role !== "owner") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const comments = await prisma.feedbackComment.findMany({
            where: { feedbackId },
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
            orderBy: {
                createdAt: "asc",
            },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const user = await requireRole(["owner", "admin", "client"], req);
    if (user instanceof NextResponse) return user;

    const { id: feedbackId } = await context.params;

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

        const feedback = await prisma.feedback.findUnique({
            where: { id: feedbackId },
            include: { user: { select: { companyId: true } } },
        });

        if (!feedback) {
            return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
        }

        // Verify company scoping
        if (feedback.user.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        // Verify user access based on role
        if (dbUser.role === "client") {
            if (feedback.userId !== dbUser.id) {
                return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
            }
        } else if (dbUser.role === "admin") {
            const isCreator = feedback.userId === dbUser.id;
            if (!isCreator) {
                if (feedback.projectId) {
                    const hasProjectAccess = await prisma.project.findFirst({
                        where: {
                            id: feedback.projectId,
                            companyId: dbUser.companyId,
                            OR: [
                                { admins: { some: { id: dbUser.id } } },
                                { members: { some: { id: dbUser.id } } },
                            ]
                        }
                    });
                    if (!hasProjectAccess) {
                        return NextResponse.json({ error: "Unauthorized access to this project's feedback" }, { status: 403 });
                    }
                } else {
                    return NextResponse.json({ error: "Unauthorized access to this feedback" }, { status: 403 });
                }
            }
        } else if (dbUser.role !== "owner") {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const body = await req.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
        }

        const comment = await prisma.feedbackComment.create({
            data: {
                text: text.trim(),
                feedbackId,
                userId: dbUser.id,
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
            },
        });

        return NextResponse.json({ comment });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
