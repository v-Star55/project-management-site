import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "client"], req);
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

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const type = searchParams.get("type");
        const status = searchParams.get("status");

        const whereClause: any = {};

        // Role-based scoping
        if (dbUser.role === "owner") {
            // Owner can see all feedbacks in the company
            whereClause.user = {
                companyId: dbUser.companyId,
            };
        } else if (dbUser.role === "admin") {
            // Admin can see feedbacks related to their projects, or feedbacks they created themselves
            const userProjects = await prisma.project.findMany({
                where: {
                    companyId: dbUser.companyId,
                    OR: [
                        { admins: { some: { id: dbUser.id } } },
                        { members: { some: { id: dbUser.id } } },
                    ]
                },
                select: { id: true },
            });
            const projectIds = userProjects.map((p) => p.id);

            whereClause.user = {
                companyId: dbUser.companyId,
            };
            whereClause.OR = [
                { projectId: { in: projectIds } },
                { userId: dbUser.id },
            ];
        } else {
            // Clients can only see feedbacks they submitted
            whereClause.userId = dbUser.id;
        }

        // Apply filters
        if (projectId) {
            whereClause.projectId = projectId;
        }
        if (type) {
            whereClause.type = type;
        }
        if (status) {
            whereClause.status = status;
        }

        const feedbacks = await prisma.feedback.findMany({
            where: whereClause,
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
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ feedbacks });
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "client"], req);
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
        const { subject, description, type, priority, projectId } = body;

        if (!subject || !subject.trim()) {
            return NextResponse.json({ error: "Subject is required" }, { status: 400 });
        }
        if (!description || !description.trim()) {
            return NextResponse.json({ error: "Description is required" }, { status: 400 });
        }
        if (!type) {
            return NextResponse.json({ error: "Type is required" }, { status: 400 });
        }
        if (!priority) {
            return NextResponse.json({ error: "Priority is required" }, { status: 400 });
        }

        // If projectId is provided, verify it belongs to the company
        if (projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    companyId: dbUser.companyId,
                },
            });
            if (!project) {
                return NextResponse.json({ error: "Project not found or invalid" }, { status: 400 });
            }
        }

        const feedback = await prisma.feedback.create({
            data: {
                subject: subject.trim(),
                description: description.trim(),
                type,
                priority,
                projectId: projectId || null,
                userId: dbUser.id,
            },
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
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error("Error creating feedback:", error);
        return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
    }
}
