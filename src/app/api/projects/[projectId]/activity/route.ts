import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string }> }
) {
    try {
        const authUser = await requireRole(["owner", "admin", "member", "client"], req);
        if (authUser instanceof NextResponse) return authUser;

        const { projectId } = await params;
        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        // Fetch caller details to verify company
        const dbAuthUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { companyId: true, role: true },
        });

        if (!dbAuthUser || !dbAuthUser.companyId) {
            return NextResponse.json({ error: "User is not associated with a company" }, { status: 403 });
        }

        // Fetch project details to verify company and membership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { 
                companyId: true,
                members: { select: { id: true } },
                admins: { select: { id: true } },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.companyId !== dbAuthUser.companyId) {
            return NextResponse.json({ error: "Forbidden: unauthorized access to this project" }, { status: 403 });
        }

        // Access control:
        // owner can access any project in the company.
        // admin, member & client can only access if they are a member or admin of the project.
        if (dbAuthUser.role !== "owner") {
            const isMember = project.members.some((m) => m.id === authUser.id);
            const isProjectAdmin = project.admins.some((a) => a.id === authUser.id);
            if (!isMember && !isProjectAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: You are not a member or admin of this project" },
                    { status: 403 }
                );
            }
        }

        // Parse search/pagination params
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "8", 10);
        const skip = (page - 1) * limit;

        // Fetch paginated activity logs for the project
        const activityLogs = await prisma.activityLog.findMany({
            where: { projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                targetUser: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        const totalLogs = await prisma.activityLog.count({
            where: { projectId },
        });

        const hasMore = skip + activityLogs.length < totalLogs;
        const nextPage = hasMore ? page + 1 : null;

        return NextResponse.json({
            activityLogs,
            nextPage,
            totalLogs,
        });

    } catch (error) {
        console.error("Error fetching project activity logs:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
