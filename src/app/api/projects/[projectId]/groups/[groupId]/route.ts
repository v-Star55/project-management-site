import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; groupId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, groupId } = await params;
    if (!projectId || !groupId) {
        return NextResponse.json(
            { error: "Project ID and Group ID are required" },
            { status: 400 }
        );
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

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { select: { id: true, name: true, email: true, role: true, imageUrl: true, designation: true } },
                admins: { select: { id: true, name: true, email: true, role: true, imageUrl: true, designation: true } },
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Access control
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
                // member
                if (!isMember && !isProjectAdmin) {
                    return NextResponse.json(
                        { error: "Forbidden: You are not a member or admin of this project" },
                        { status: 403 }
                    );
                }
            }
        }

        // Fetch the group with full ticket details
        const group = await prisma.projectGroup.findUnique({
            where: { id: groupId },
            include: {
                tickets: {
                    where: { isDeleted: false },
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
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!group || group.projectId !== projectId) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Fetch activity logs for this group
        const activityLogs = await prisma.activityLog.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({
            group,
            activityLogs,
            projectMembers: project.members,
            projectAdmins: project.admins,
        });
    } catch (error) {
        console.error("Error fetching group detail:", error);
        return NextResponse.json(
            { error: "Failed to fetch group details" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; groupId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, groupId } = await params;
    if (!projectId || !groupId) {
        return NextResponse.json(
            { error: "Project ID and Group ID are required" },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const { name, description, goal, type, status, startDate, endDate } = body;

        // Perform access check
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

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                members: { select: { id: true } },
                admins: { select: { id: true } },
            },
        });

        if (!project || project.companyId !== dbUser.companyId) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        let isAuthorized = false;
        if (dbUser.role === "owner") {
            isAuthorized = true;
        } else if (dbUser.role === "admin") {
            isAuthorized = project.admins.some((a) => a.id === dbUser.id);
        }

        if (!isAuthorized) {
            return NextResponse.json(
                { error: "Forbidden: Only owners and project admins can edit sprints" },
                { status: 403 }
            );
        }

        // Update the project group/sprint
        const updatedGroup = await prisma.projectGroup.update({
            where: { id: groupId },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(goal !== undefined && { goal }),
                ...(type !== undefined && { type }),
                ...(status !== undefined && { status }),
                ...(startDate !== undefined && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
            },
        });

        // Log an activity log for updating the sprint
        await prisma.activityLog.create({
            data: {
                action: "GROUP_UPDATED",
                description: `updated sprint details: ${name || updatedGroup.name}`,
                userId: dbUser.id,
                projectId,
                groupId,
            }
        });

        return NextResponse.json({ group: updatedGroup });
    } catch (error) {
        console.error("Error updating group detail:", error);
        return NextResponse.json(
            { error: "Failed to update group details" },
            { status: 500 }
        );
    }
}
