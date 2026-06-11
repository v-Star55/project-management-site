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

        // Fetch attachments for the project's tickets
        const files = await prisma.ticketAttachment.findMany({
            where: {
                ticket: {
                    projectId: projectId,
                    isDeleted: false,
                },
            },
            include: {
                ticket: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ files });
    } catch (error) {
        console.error("Error fetching project files:", error);
        return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }
}
