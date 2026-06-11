import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string; groupId?: string }> }
) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    const { projectId, groupId } = await params;
    if (!projectId || !groupId) {
        return NextResponse.json(
            { error: "Project ID and Group ID are required" },
            { status: 400 }
        );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "8", 10);
    const skip = (page - 1) * limit;

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
            select: { id: true, companyId: true, isActive: true },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Fetch activity logs for this group (paginated)
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
            skip,
            take: limit,
        });

        const totalLogs = await prisma.activityLog.count({
            where: { groupId },
        });

        const hasMore = skip + activityLogs.length < totalLogs;
        const nextPage = hasMore ? page + 1 : null;

        return NextResponse.json({
            activityLogs,
            nextPage,
            totalLogs,
        });
    } catch (error) {
        console.error("Error fetching group activity logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch activity logs" },
            { status: 500 }
        );
    }
}
