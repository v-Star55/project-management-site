import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";
import bcryptjs from "bcryptjs";


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
            select: { id: true, companyId: true, role: true },
        });

        if (!dbUser || dbUser.companyId !== workspaceId) {
            return NextResponse.json({ message: "Forbidden: unauthorized company access" }, { status: 403 });
        }

        const isRestrictedRole = dbUser.role !== "owner";

        const dbUsers = await prisma.user.findMany({
            where: {
                companyId: workspaceId,
                ...(isRestrictedRole ? {
                    OR: [
                        { id: user.id },
                        {
                            projects: {
                                some: {
                                    OR: [
                                        { members: { some: { id: user.id } } },
                                        { admins: { some: { id: user.id } } }
                                    ]
                                }
                            }
                        },
                        {
                            adminProjects: {
                                some: {
                                    OR: [
                                        { members: { some: { id: user.id } } },
                                        { admins: { some: { id: user.id } } }
                                    ]
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
                designation: true,
                createdAt: true,
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
                designation: u.designation,
                createdAt: u.createdAt,
            };
        });

        return NextResponse.json({ message: "Teams fetched successfully", teams });
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json({ message: "Failed to fetch teams" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id?: string }> }
) {
    try {
        const user = await requireRole(["owner", "admin"], req);
        if (user instanceof NextResponse) return user;

        const { id: workspaceId } = await params;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is missing" }, { status: 400 });
        }

        // Verify that the current user belongs to this company and is owner/admin
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, companyId: true, role: true },
        });

        if (!dbUser || dbUser.companyId !== workspaceId) {
            return NextResponse.json({ error: "Forbidden: unauthorized company access" }, { status: 403 });
        }

        if (dbUser.role !== "owner" && dbUser.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: only owners and admins can invite members" }, { status: 403 });
        }

        const reqBody = await req.json();
        const { name, email, password, role, designation } = reqBody;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate role is lowercase matching Role enum
        const validRoles = ["owner", "admin", "member", "manager", "qa", "client"];
        const lowerRole = role.toLowerCase();
        if (!validRoles.includes(lowerRole)) {
            return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // If the user already belongs to a company, don't allow re-assigning
            if (existingUser.companyId) {
                if (existingUser.companyId === workspaceId) {
                    return NextResponse.json({ error: "User is already a member of this company" }, { status: 400 });
                } else {
                    return NextResponse.json({ error: "User is already associated with another company" }, { status: 400 });
                }
            }

            // If user has no company associated, we associate them
            const updatedUser = await prisma.user.update({
                where: { email },
                data: {
                    companyId: workspaceId,
                    role: lowerRole as any,
                    designation: designation || existingUser.designation,
                },
            });
            return NextResponse.json({ message: "Existing user associated with company successfully", user: updatedUser }, { status: 200 });
        }

        // Create new user
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: lowerRole as any,
                designation: designation || null,
                companyId: workspaceId,
            },
        });

        return NextResponse.json({ message: "Team member invited successfully", user: newUser }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating team member:", error);
        return NextResponse.json({ error: error.message || "Failed to create team member" }, { status: 500 });
    }
}