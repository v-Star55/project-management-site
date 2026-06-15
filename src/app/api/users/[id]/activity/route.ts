import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id?: string }> }
) {
    try {
        // Authenticate the caller (only allow owners, admins, members, and clients)
        const authUser = await requireRole(["owner", "admin", "member", "client"], req);
        if (authUser instanceof NextResponse) return authUser;

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Fetch caller details to verify they belong to the same company
        const dbAuthUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { companyId: true, role: true },
        });

        // Fetch target user details to check their company association
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { companyId: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Enforce company boundary security checks
        if (dbAuthUser?.companyId !== targetUser.companyId) {
            return NextResponse.json({ error: "Forbidden: unauthorized access" }, { status: 403 });
        }

        // Restrict members and clients to only view their own activity logs
        const isRestrictedRole = dbAuthUser?.role === "member" || dbAuthUser?.role === "client";
        if (isRestrictedRole && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden: you can only view your own activity logs" }, { status: 403 });
        }

        // Parse search/pagination params
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "8", 10);
        const skip = (page - 1) * limit;

        // Fetch paginated activity logs for the target user
        const activityLogs = await prisma.activityLog.findMany({
            where: { userId: id },
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

        // Dynamically resolve projects for the activity logs
        const projectIds = Array.from(
            new Set(activityLogs.map((log) => log.projectId).filter(Boolean))
        ) as string[];

        const projects = await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, title: true },
        });

        const projectMap = new Map(projects.map((p) => [p.id, p]));

        const activityLogsWithProject = activityLogs.map((log) => ({
            ...log,
            project: log.projectId ? projectMap.get(log.projectId) || null : null,
        }));

        const totalLogs = await prisma.activityLog.count({
            where: { userId: id },
        });

        const hasMore = skip + activityLogs.length < totalLogs;
        const nextPage = hasMore ? page + 1 : null;

        return NextResponse.json({
            activityLogs: activityLogsWithProject,
            nextPage,
            totalLogs,
        });

    } catch (error) {
        console.error("Error fetching user activity logs:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
