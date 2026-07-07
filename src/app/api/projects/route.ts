import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import { $Enums } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "qa", "client"], req);

    if (user instanceof NextResponse) return user;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, companyId: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!dbUser.companyId) {
            return NextResponse.json(
                { error: "User is not associated with a company" },
                { status: 403 }
            );
        }

        let projects;

        if (dbUser.role === "owner") {
            // Show all projects of the company
            projects = await prisma.project.findMany({
                where: {
                    companyId: dbUser.companyId,
                    isActive: true,
                },
                include: {
                    admins: { select: { id: true, name: true } },
                    members: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: "desc" },
            });
        } else {
            // member or client: show projects on which user is currently working or is an admin of
            projects = await prisma.project.findMany({
                where: {
                    companyId: dbUser.companyId,
                    isActive: true,
                    OR: [
                        {
                            members: {
                                some: {
                                    id: dbUser.id,
                                },
                            },
                        },
                        {
                            admins: {
                                some: {
                                    id: dbUser.id,
                                },
                            },
                        },
                    ],
                },
                include: {
                    admins: { select: { id: true, name: true } },
                    members: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: "desc" },
            });
        }

        return NextResponse.json({ projects }, {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Only owner role can create projects
    const user = await requireRole(["owner", "admin"], req);
    if (user instanceof NextResponse) return user;

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
        const { title, description, status, startDate, completedDate, targetDate, phase, category, memberIds, adminIds } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Project title is required" }, { status: 400 });
        }

        const createData: any = {
            title: title.trim(),
            description: description || null,
            status: (status || "pending") as $Enums.ProjectStatus,
            phase: (phase || "idea") as $Enums.ProjectPhase,
            category: (category || "software") as $Enums.ProjectCategory,
            companyId: dbUser.companyId,
        };

        if (startDate) {
            createData.startDate = new Date(startDate);
        }
        if (completedDate) {
            createData.completedDate = new Date(completedDate);
        }
        if (targetDate) {
            createData.targetDate = new Date(targetDate);
        }

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
            createData.members = {
                connect: validIds.map((id) => ({ id })),
            };
        }

        let finalAdminIds = adminIds !== undefined && Array.isArray(adminIds) ? [...adminIds] : [];
        if (dbUser.role === "admin" && !finalAdminIds.includes(dbUser.id)) {
            finalAdminIds.push(dbUser.id);
        }

        if (finalAdminIds.length > 0) {
            // Validate all finalAdminIds exist in the company
            const companyUsers = await prisma.user.findMany({
                where: {
                    id: { in: finalAdminIds },
                    companyId: dbUser.companyId,
                },
                select: { id: true },
            });
            const validIds = companyUsers.map((u) => u.id);
            createData.admins = {
                connect: validIds.map((id) => ({ id })),
            };
        }

        const project = await prisma.project.create({
            data: createData,
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
                admins: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        imageUrl: true,
                        designation: true,
                    },
                },
            },
        });

        // Create an activity log for project creation
        await prisma.activityLog.create({
            data: {
                action: "PROJECT_CREATED",
                description: `Created ${project.title} project`,
                userId: dbUser.id,
                projectId: project.id,
            }
        });

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}

