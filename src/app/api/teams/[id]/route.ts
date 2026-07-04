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

        const dbUsers = await prisma.user.findMany({
            where: {
                companyId: workspaceId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                lastActive: true,
                designation: true,
                createdAt: true,
                isActive: true,
                isPending: true,
                projects: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                adminProjects: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                assignedTickets: {
                    where: { isDeleted: false },
                    select: {
                        status: true
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

            const mergedProjects = [
                ...(u.projects || []),
                ...(u.adminProjects || [])
            ].filter((p, index, self) => self.findIndex(t => t.id === p.id) === index);

            const assignedTicketsCount = u.assignedTickets?.length || 0;
            const completedTicketsCount = u.assignedTickets?.filter(t => t.status === "completed").length || 0;

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: roleCapitalized,
                status,
                lastActive: lastActiveStr,
                initials,
                projects: mergedProjects,
                designation: u.designation,
                createdAt: u.createdAt,
                isActive: u.isActive,
                isPending: u.isPending,
                assignedTicketsCount,
                completedTicketsCount,
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
        const validRoles = ["owner", "admin", "member", "qa", "client"];
        const lowerRole = role.toLowerCase();
        if (!validRoles.includes(lowerRole)) {
            return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
        }

        // Admin cannot invite owners or admins
        if (dbUser.role === "admin" && (lowerRole === "admin" || lowerRole === "owner")) {
            return NextResponse.json(
                { error: "Forbidden: Admins cannot invite owner or admin roles" },
                { status: 403 }
            );
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

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id?: string }> }
) {
    try {
        const user = await requireRole(["owner"], req);
        if (user instanceof NextResponse) return user;

        const { id: workspaceId } = await params;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is missing" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId");

        if (!memberId) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        if (memberId === user.id) {
            return NextResponse.json({ error: "Cannot remove yourself from the company" }, { status: 400 });
        }

        // Verify that the current user belongs to this company and is owner/admin
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, companyId: true, role: true },
        });

        if (!dbUser || dbUser.companyId !== workspaceId) {
            return NextResponse.json({ error: "Forbidden: unauthorized company access" }, { status: 403 });
        }

        const memberUser = await prisma.user.findUnique({
            where: { id: memberId },
            include: {
                projects: { select: { id: true } },
                adminProjects: { select: { id: true } },
            }
        });

        if (!memberUser || memberUser.companyId !== workspaceId) {
            return NextResponse.json({ error: "Member not found in this company" }, { status: 404 });
        }

        if (dbUser.role !== "owner") {
            return NextResponse.json(
                { error: "Forbidden: only owners can remove company members" },
                { status: 403 }
            );
        }

        // Update member to remove from company and reset project links
        await prisma.user.update({
            where: { id: memberId },
            data: {
                companyId: null,
                role: "member",
                projects: {
                    disconnect: memberUser.projects.map(p => ({ id: p.id }))
                },
                adminProjects: {
                    disconnect: memberUser.adminProjects.map(p => ({ id: p.id }))
                }
            }
        });

        return NextResponse.json({ message: "Member removed from company successfully" });
    } catch (error: any) {
        console.error("Error removing team member:", error);
        return NextResponse.json({ error: error.message || "Failed to remove team member" }, { status: 500 });
    }
}

export async function PATCH(
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

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, companyId: true, role: true },
        });

        if (!dbUser || dbUser.companyId !== workspaceId) {
            return NextResponse.json({ error: "Forbidden: unauthorized company access" }, { status: 403 });
        }

        const body = await req.json();
        const { memberId, projectIds, addMemberToProjectId } = body;

        if (!memberId) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: memberId },
            include: {
                projects: { select: { id: true } },
                adminProjects: { select: { id: true } }
            }
        });

        if (!targetUser || targetUser.companyId !== workspaceId) {
            return NextResponse.json({ error: "Member not found in this company" }, { status: 404 });
        }

        // Feature 1: Add a member directly to a specific project ("add member to project")
        // Can be called by owner, or an admin if they are a project admin of that project.
        if (addMemberToProjectId) {
            const project = await prisma.project.findUnique({
                where: { id: addMemberToProjectId },
                include: { admins: { select: { id: true } } }
            });

            if (!project || project.companyId !== workspaceId) {
                return NextResponse.json({ error: "Project not found in this company" }, { status: 404 });
            }

            if (dbUser.role !== "owner") {
                const isProjectAdmin = project.admins.some(a => a.id === dbUser.id);
                if (!isProjectAdmin) {
                    return NextResponse.json({ error: "Forbidden: You are not an admin of this project" }, { status: 403 });
                }
            }

            // Connect target user to the project
            // If target user is admin, add them to adminProjects. If member/qa/client, add them to members.
            const dataToUpdate: any = {};
            if (targetUser.role === "admin") {
                dataToUpdate.adminProjects = {
                    connect: { id: project.id }
                };
            } else {
                dataToUpdate.projects = {
                    connect: { id: project.id }
                };
            }

            await prisma.user.update({
                where: { id: targetUser.id },
                data: dataToUpdate
            });

            return NextResponse.json({ message: "Member successfully added to the project" });
        }

        // Feature 2: Assign projects list to an admin or member (Owner only)
        if (projectIds && Array.isArray(projectIds)) {
            if (dbUser.role !== "owner") {
                return NextResponse.json({ error: "Forbidden: Only owners can manage project assignments" }, { status: 403 });
            }

            // Verify all projectIds belong to the company
            const validProjects = await prisma.project.findMany({
                where: {
                    id: { in: projectIds },
                    companyId: workspaceId,
                    isActive: true
                },
                select: { id: true }
            });
            const validIds = validProjects.map(p => p.id);

            // Update user projects based on role
            // If target is admin: set adminProjects. If target is member/qa/client: set projects.
            const updateData: any = {};
            if (targetUser.role === "admin") {
                updateData.adminProjects = {
                    set: validIds.map(id => ({ id }))
                };
            } else {
                updateData.projects = {
                    set: validIds.map(id => ({ id }))
                };
            }

            await prisma.user.update({
                where: { id: targetUser.id },
                data: updateData
            });

            return NextResponse.json({ message: "Projects assigned successfully" });
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

    } catch (error: any) {
        console.error("Error patching team member projects:", error);
        return NextResponse.json({ error: error.message || "Failed to update member projects" }, { status: 500 });
    }
}
