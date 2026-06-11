import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/helpers/permission";

export async function GET(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date"); // expected YYYY-MM-DD
        
        let targetDate = new Date();
        if (dateStr) {
            targetDate = new Date(dateStr);
        }

        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

        const events = await prisma.calendarEvent.findMany({
            where: {
                assignedTo: {
                    some: {
                        id: user.id
                    }
                },
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: {
                startTime: "asc",
            },
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await requireRole(["owner", "admin", "member", "client"], req);
    if (user instanceof NextResponse) return user;

    try {
        const body = await req.json();
        const {
            title,
            description,
            date,
            startTime,
            endTime,
            type,
            priority,
            status,
            link,
            projectId,
            assignedTo // array of user IDs
        } = body;

        if (!title || !date || !startTime || !type) {
            return NextResponse.json({ error: "Title, date, startTime, and type are required" }, { status: 400 });
        }

        // Parse date
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        // Prepare assignedTo connect array
        // If assignedTo is empty or not provided, we at least assign the current user
        let assignedToConnect = [];
        if (Array.isArray(assignedTo) && assignedTo.length > 0) {
            assignedToConnect = assignedTo.map((id: string) => ({ id }));
        } else {
            assignedToConnect = [{ id: user.id }];
        }

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description: description || null,
                date: parsedDate,
                startTime,
                endTime: endTime || null,
                type,
                priority: priority || "low",
                status: status || "scheduled",
                link: link || null,
                project: projectId ? { connect: { id: projectId } } : undefined,
                assignedTo: {
                    connect: assignedToConnect
                }
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            }
        });

        return NextResponse.json({ event }, { status: 201 });
    } catch (error) {
        console.error("Failed to create calendar event:", error);
        return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
    }
}
