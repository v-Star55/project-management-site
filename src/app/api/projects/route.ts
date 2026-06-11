import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);

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

        if (dbUser.role === "owner" || dbUser.role === "admin") {
            // Show all projects of the company
            projects = await prisma.project.findMany({
                where: {
                    companyId: dbUser.companyId,
                    isActive: true,
                },
                orderBy: { createdAt: "desc" },
            });
        } else {
            // member or client: show projects on which user is currently working
            projects = await prisma.project.findMany({
                where: {
                    companyId: dbUser.companyId,
                    isActive: true,
                    members: {
                        some: {
                            id: dbUser.id,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        }

        return NextResponse.json({ projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}
