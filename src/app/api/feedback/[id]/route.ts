import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function PATCH(
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
        const { status, subject, description, type, priority, projectId } = body;

        const isCreator = feedback.userId === dbUser.id;
        const isAdminOrOwner = dbUser.role === "owner" || dbUser.role === "admin";

        const updateData: any = {};

        // 1. Status update (Admins & Owners only)
        if (status !== undefined) {
            if (!isAdminOrOwner) {
                return NextResponse.json({ error: "Only admins or owners can update feedback status" }, { status: 403 });
            }
            const allowedStatuses = ["pending", "in_progress", "resolved", "rejected"];
            if (!allowedStatuses.includes(status)) {
                return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
            }
            updateData.status = status;
        }

        // 2. Creator updates (only if status is "pending")
        if (subject !== undefined || description !== undefined || type !== undefined || priority !== undefined || projectId !== undefined) {
            if (!isCreator) {
                return NextResponse.json({ error: "Only the creator can edit this feedback" }, { status: 403 });
            }
            if (feedback.status !== "pending") {
                return NextResponse.json({ error: "Feedback cannot be edited once it is in progress or resolved" }, { status: 400 });
            }

            if (subject !== undefined) {
                if (!subject.trim()) return NextResponse.json({ error: "Subject cannot be empty" }, { status: 400 });
                updateData.subject = subject.trim();
            }
            if (description !== undefined) {
                if (!description.trim()) return NextResponse.json({ error: "Description cannot be empty" }, { status: 400 });
                updateData.description = description.trim();
            }
            if (type !== undefined) updateData.type = type;
            if (priority !== undefined) updateData.priority = priority;
            if (projectId !== undefined) {
                if (projectId) {
                    const project = await prisma.project.findFirst({
                        where: { id: projectId, companyId: dbUser.companyId },
                    });
                    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 400 });
                }
                updateData.projectId = projectId || null;
            }
        }

        const updatedFeedback = await prisma.feedback.update({
            where: { id: feedbackId },
            data: updateData,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
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

        return NextResponse.json({ feedback: updatedFeedback });
    } catch (error) {
        console.error("Error updating feedback:", error);
        return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
    }
}

export async function DELETE(
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

        const isCreator = feedback.userId === dbUser.id;
        const isAdminOrOwner = dbUser.role === "owner" || dbUser.role === "admin";

        // Creator can delete only if pending. Admins/owners can delete anytime.
        if (!isAdminOrOwner) {
            if (!isCreator) {
                return NextResponse.json({ error: "Unauthorized to delete this feedback" }, { status: 403 });
            }
            if (feedback.status !== "pending") {
                return NextResponse.json({ error: "Feedback cannot be deleted once it has been processed" }, { status: 400 });
            }
        }

        await prisma.feedback.delete({
            where: { id: feedbackId },
        });

        return NextResponse.json({ success: true, message: "Feedback deleted successfully" });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
    }
}
