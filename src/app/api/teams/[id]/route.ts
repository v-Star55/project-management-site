import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id?: string }> }
) {
    try {
        const user = await requireRole(["owner", "admin", "member", "client"], req);
        if (user instanceof NextResponse) return user;

        const { id: workspaceId } = await params;

        if (!workspaceId) {
            return NextResponse.json({ message: "Workspace not found" }, { status: 404 });
        }

        // Fetch user from DB to verify they are in this company/workspace
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { companyId: true, role: true },
        });

        if (!dbUser || dbUser.companyId !== workspaceId) {
            return NextResponse.json({ message: "Forbidden: unauthorized company access" }, { status: 403 });
        }

        const isRestrictedRole = dbUser.role === "member" || dbUser.role === "client";

        const dbUsers = await prisma.user.findMany({
            where: {
                companyId: workspaceId,
                ...(isRestrictedRole ? {
                    OR: [
                        { id: user.id },
                        {
                            projects: {
                                some: {
                                    members: {
                                        some: { id: user.id }
                                    }
                                }
                            }
                        }
                    ]
                } : {})
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                lastActive: true,
                projects: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        });

        const teams = dbUsers.map(u => {
            const roleCapitalized = (u.role.charAt(0).toUpperCase() + u.role.slice(1)) as "Owner" | "Admin" | "Member" | "Client";
            
            const nameParts = u.name.trim().split(/\s+/).filter(Boolean);
            const initials = nameParts.length > 1 
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : nameParts.length === 1 ? nameParts[0][0].toUpperCase() : "U";

            let status: "Online" | "Away" | "Offline" = "Offline";
            let lastActiveStr = "Offline";

            if (u.lastActive) {
                const diffMs = Date.now() - new Date(u.lastActive).getTime();
                const diffMins = Math.floor(diffMs / (60 * 1000));
                if (diffMins < 5) {
                    status = "Online";
                    lastActiveStr = "Active now";
                } else if (diffMins < 60) {
                    status = "Away";
                    lastActiveStr = `Active ${diffMins}m ago`;
                } else {
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) {
                        status = "Offline";
                        lastActiveStr = `Active ${diffHours}h ago`;
                    } else {
                        status = "Offline";
                        lastActiveStr = `Active ${Math.floor(diffHours / 24)}d ago`;
                    }
                }
            }

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: roleCapitalized,
                status,
                lastActive: lastActiveStr,
                initials,
                projects: u.projects,
            };
        });

        return NextResponse.json({ message: "Teams fetched successfully", teams });
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 });
    }
}