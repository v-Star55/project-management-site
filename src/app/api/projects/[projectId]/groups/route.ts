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
                admins: { select: { id: true } },
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Access control:
        // owner & admin can access any project in the company.
        // member & client can only access if they are a member or admin of the project.
        if (dbUser.role !== "owner" && dbUser.role !== "admin") {
            const isMember = project.members.some((m) => m.id === dbUser.id);
            const isProjectAdmin = project.admins.some((a) => a.id === dbUser.id);
            if (!isMember && !isProjectAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: You are not a member or admin of this project" },
                    { status: 403 }
                );
            }
        }

        // Fetch groups for the project
        const groups = await prisma.projectGroup.findMany({
            where: { projectId },
            include: {
                tickets: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ groups });
    } catch (error) {
        console.error("Error fetching project groups:", error);
        return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId?: string }> }
) {
    // Allow owner, admin, and member roles to create groups (member dynamically verified)
    const user = await requireRole(["owner", "admin", "member"], req);
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
                admins: { select: { id: true } },
            },
        });

        if (!project || project.companyId !== dbUser.companyId || !project.isActive) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Access Control:
        // owner & admin can create groups for any project in their company.
        // members can create groups only if they are a project admin of this project.
        if (dbUser.role !== "owner" && dbUser.role !== "admin") {
            const isProjectAdmin = project.admins.some((a) => a.id === dbUser.id);
            if (!isProjectAdmin) {
                return NextResponse.json(
                    { error: "Forbidden: You are not an admin of this project" },
                    { status: 403 }
                );
            }
        }

        const body = await req.json();
        const { name, description, goal, type, startDate, endDate, status } = body;

        if (!name || !description || !startDate) {
            return NextResponse.json(
                { error: "Name, description, and startDate are required" },
                { status: 400 }
            );
        }

        const group = await prisma.projectGroup.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                goal: goal ? goal.trim() : null,
                type: type ?? "sprint",
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status: status ?? "not_started",
                projectId,
                companyId: dbUser.companyId,
            },
            include: {
                tickets: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
            },
        });

        return NextResponse.json({ group }, { status: 201 });
    } catch (error) {
        console.error("Error creating project group:", error);
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
}
