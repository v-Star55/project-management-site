import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import { $Enums } from "@/generated/prisma";

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
                    orderBy: { createdAt: "desc" },
                    include: {
                        assignedUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Access control:
        // owner & admin can access any project in the company.
        // member & client can only access if they are a member of the project.
        if (dbUser.role !== "owner" && dbUser.role !== "admin") {
            const isMember = project.members.some((m) => m.id === dbUser.id);
            if (!isMember) {
                return NextResponse.json(
                    { error: "Forbidden: You are not a member of this project" },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Error fetching project details:", error);
        return NextResponse.json({ error: "Failed to fetch project details" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string }> }
) {
    // Only owner and admin roles can edit
    const user = await requireRole(["owner", "admin"], req);
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
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const body = await req.json();
        const { title, description, status, startDate, completedDate, memberIds } = body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status as $Enums.ProjectStatus;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (completedDate !== undefined) updateData.completedDate = completedDate ? new Date(completedDate) : null;

        if (memberIds !== undefined && Array.isArray(memberIds)) {
            // Validate all memberIds exist in the company
            const companyUsers = await prisma.user.findMany({
                where: {
                    id: { in: memberIds },
                    companyId: dbUser.companyId,
                },
                select: { id: true },
            });
            const validIds = companyUsers.map((u) => u.id);
            updateData.members = {
                set: validIds.map((id) => ({ id })),
            };
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
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
                    orderBy: { createdAt: "desc" },
                    include: {
                        assignedUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}
