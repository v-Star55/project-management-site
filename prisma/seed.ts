import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcryptjs from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment variables.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = bcryptjs.hashSync("hashed_password", 10);

  // Clean database
  await prisma.activityLog.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.projectGroup.deleteMany();
  await prisma.project.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Company
  const company = await prisma.company.create({
    data: {
      name: "Acme Solutions",
      description: "Software development and consulting company",
      imageUrl: "https://picsum.photos/300/300",
      status: "active",
    },
  });

  // Users
  const owner = await prisma.user.create({
    data: {
      name: "John Owner",
      email: "owner@acme.com",
      password: hash,
      role: "owner",
      companyId: company.id,
      isVerified: true,
      designation: "CEO",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Sarah Admin",
      email: "admin@acme.com",
      password: hash,
      role: "admin",
      companyId: company.id,
      isVerified: true,
      designation: "Project Manager",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Mike Developer",
      email: "mike@acme.com",
      password: hash,
      role: "member",
      companyId: company.id,
      isVerified: true,
      designation: "Backend Developer",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Emily Designer",
      email: "emma@acme.com",
      password: hash,
      role: "member",
      companyId: company.id,
      isVerified: true,
      designation: "UI/UX Designer",
    },
  });

  const client = await prisma.user.create({
    data: {
      name: "Robert Client",
      email: "client@example.com",
      password: hash,
      role: "client",
      companyId: company.id,
      isVerified: true,
    },
  });

  // Project 1 - E-Commerce Platform
  const ecommerceProject = await prisma.project.create({
    data: {
      title: "E-Commerce Platform",
      description: "Setup and core development for the e-commerce platform.",
      status: "in_progress",
      imageUrl: "https://picsum.photos/600/400",
      companyId: company.id,
      phase: "development",
      category: "software",
      startDate: new Date("2026-04-01"),
      targetDate: new Date("2026-09-30"),
      members: {
        connect: [
          { id: owner.id },
          { id: admin.id },
          { id: member1.id },
          { id: member2.id },
          { id: client.id },
        ],
      },
      admins: {
        connect: [{ id: admin.id }],
      },
    },
  });

  // Project 2 - CRM Dashboard
  const crmProject = await prisma.project.create({
    data: {
      title: "CRM Dashboard",
      description: "Internal customer management dashboard",
      status: "in_progress",
      imageUrl: "https://picsum.photos/600/401",
      companyId: company.id,
      phase: "development",
      category: "software",
      startDate: new Date("2026-05-01"),
      targetDate: new Date("2026-08-31"),
      members: {
        connect: [
          { id: owner.id },
          { id: admin.id },
          { id: member1.id },
        ],
      },
      admins: {
        connect: [{ id: admin.id }],
      },
    },
  });

  // ─── Project Groups (Sprints) ─────────────────────────────────────

  const sprint1 = await prisma.projectGroup.create({
    data: {
      name: "Sprint 1",
      description: "Setup and core development for the e-commerce platform. The goal is to build a solid foundation for upcoming features.",
      goal: "Deliver core features for the e-commerce platform.",
      type: "sprint",
      status: "in_progress",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-15"),
      projectId: ecommerceProject.id,
      companyId: company.id,
    },
  });

  const sprint2 = await prisma.projectGroup.create({
    data: {
      name: "Sprint 2",
      description: "Payment integration and checkout flow development.",
      goal: "Complete payment gateway and checkout process.",
      type: "sprint",
      status: "not_started",
      startDate: new Date("2026-05-16"),
      endDate: new Date("2026-05-31"),
      projectId: ecommerceProject.id,
      companyId: company.id,
    },
  });

  const crmSprint1 = await prisma.projectGroup.create({
    data: {
      name: "Sprint 1",
      description: "CRM core module setup and authentication.",
      goal: "Build authentication and basic CRM layout.",
      type: "sprint",
      status: "in_progress",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-15"),
      projectId: crmProject.id,
      companyId: company.id,
    },
  });

  // ─── Tickets for E-Commerce Sprint 1 ──────────────────────────────

  const ticket101 = await prisma.ticket.create({
    data: {
      title: "Product Catalog APIs",
      description: "Create CRUD APIs for the product catalog module.",
      status: "pending",
      priority: "medium",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: admin.id,
      dueDate: new Date("2026-05-06"),
    },
  });

  const ticket102 = await prisma.ticket.create({
    data: {
      title: "User Registration Flow",
      description: "Implement user registration with email verification.",
      status: "pending",
      priority: "high",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-05-07"),
    },
  });

  const ticket103 = await prisma.ticket.create({
    data: {
      title: "Shopping Cart UI",
      description: "Design and implement the shopping cart interface.",
      status: "pending",
      priority: "medium",
      type: "task",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member2.id,
      dueDate: new Date("2026-05-09"),
    },
  });

  const ticket104 = await prisma.ticket.create({
    data: {
      title: "Authentication Module",
      description: "Implement JWT-based authentication with login and logout.",
      status: "in_progress",
      priority: "high",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-05-08"),
    },
  });

  const ticket105 = await prisma.ticket.create({
    data: {
      title: "Product Listing Page",
      description: "Build the product listing page with filters and search.",
      status: "in_progress",
      priority: "medium",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: admin.id,
      dueDate: new Date("2026-05-09"),
    },
  });

  const ticket106 = await prisma.ticket.create({
    data: {
      title: "Category Management",
      description: "Admin panel for managing product categories.",
      status: "in_review",
      priority: "medium",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member2.id,
      dueDate: new Date("2026-05-10"),
    },
  });

  const ticket107 = await prisma.ticket.create({
    data: {
      title: "Checkout Process",
      description: "Implement the multi-step checkout flow.",
      status: "in_review",
      priority: "high",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-05-11"),
    },
  });

  const ticket108 = await prisma.ticket.create({
    data: {
      title: "Order Management",
      description: "Build order tracking and management system.",
      status: "in_review",
      priority: "medium",
      type: "task",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: admin.id,
      dueDate: new Date("2026-05-12"),
    },
  });

  const ticket109 = await prisma.ticket.create({
    data: {
      title: "Database Schema",
      description: "Design and implement the database schema.",
      status: "completed",
      priority: "low",
      type: "task",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member1.id,
      isCompleted: true,
      completedAt: new Date("2026-05-01"),
    },
  });

  const ticket110 = await prisma.ticket.create({
    data: {
      title: "Project Setup",
      description: "Initialize the project with Next.js and configure tooling.",
      status: "completed",
      priority: "low",
      type: "task",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: admin.id,
      isCompleted: true,
      completedAt: new Date("2026-04-29"),
    },
  });

  const ticket111 = await prisma.ticket.create({
    data: {
      title: "Payment Gateway Integration",
      description: "Integrate Razorpay for payment processing.",
      status: "pending",
      priority: "high",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-05-13"),
    },
  });

  const ticket112 = await prisma.ticket.create({
    data: {
      title: "Email Notifications",
      description: "Set up transactional email notifications.",
      status: "pending",
      priority: "low",
      type: "task",
      projectId: ecommerceProject.id,
      groupId: sprint1.id,
      assignedUserId: member2.id,
      dueDate: new Date("2026-05-14"),
    },
  });

  // ─── Tickets for E-Commerce Sprint 2 ──────────────────────────────

  await prisma.ticket.create({
    data: {
      title: "Stripe Integration",
      description: "Add Stripe as an alternative payment provider.",
      status: "pending",
      priority: "high",
      type: "feature",
      projectId: ecommerceProject.id,
      groupId: sprint2.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-05-20"),
    },
  });

  await prisma.ticket.create({
    data: {
      title: "Order Confirmation Emails",
      description: "Send confirmation email after successful order.",
      status: "pending",
      priority: "medium",
      type: "task",
      projectId: ecommerceProject.id,
      groupId: sprint2.id,
      assignedUserId: member2.id,
      dueDate: new Date("2026-05-25"),
    },
  });

  // ─── Tickets for CRM Sprint 1 ─────────────────────────────────────

  await prisma.ticket.create({
    data: {
      title: "Build Authentication Module",
      description: "Implement JWT authentication for the CRM.",
      status: "in_progress",
      priority: "high",
      type: "feature",
      projectId: crmProject.id,
      groupId: crmSprint1.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-05-10"),
    },
  });

  await prisma.ticket.create({
    data: {
      title: "Design Dashboard UI",
      description: "Create Figma designs for the main CRM dashboard.",
      status: "completed",
      priority: "medium",
      type: "task",
      projectId: crmProject.id,
      groupId: crmSprint1.id,
      assignedUserId: member2.id,
      isCompleted: true,
      completedAt: new Date("2026-05-05"),
    },
  });

  // ─── Attachments ──────────────────────────────────────────────────

  await prisma.ticketAttachment.createMany({
    data: [
      {
        ticketId: ticket104.id,
        fileName: "auth-flow.pdf",
        fileUrl: "https://example.com/files/auth-flow.pdf",
      },
      {
        ticketId: ticket106.id,
        fileName: "category-wireframe.fig",
        fileUrl: "https://example.com/files/category-wireframe.fig",
      },
    ],
  });

  // ─── Messages ─────────────────────────────────────────────────────

  await prisma.message.createMany({
    data: [
      {
        text: "Authentication module has been started.",
        projectId: ecommerceProject.id,
        userId: member1.id,
        ticketId: ticket104.id,
      },
      {
        text: "Category management wireframes are ready for review.",
        projectId: ecommerceProject.id,
        userId: member2.id,
        ticketId: ticket106.id,
      },
      {
        text: "Client approved initial requirements.",
        projectId: ecommerceProject.id,
        userId: client.id,
      },
    ],
  });

  // ─── Time Logs ────────────────────────────────────────────────────

  await prisma.timeLog.createMany({
    data: [
      {
        userId: member1.id,
        ticketId: ticket104.id,
        projectId: ecommerceProject.id,
        startTime: new Date("2026-05-03T09:00:00Z"),
        endTime: new Date("2026-05-03T13:00:00Z"),
        duration: 240,
        description: "Implemented login and register APIs",
      },
      {
        userId: member2.id,
        ticketId: ticket106.id,
        projectId: ecommerceProject.id,
        startTime: new Date("2026-05-04T10:00:00Z"),
        endTime: new Date("2026-05-04T15:00:00Z"),
        duration: 300,
        description: "Designed category management screens",
      },
      {
        userId: admin.id,
        ticketId: ticket101.id,
        projectId: ecommerceProject.id,
        startTime: new Date("2026-05-05T11:00:00Z"),
        endTime: new Date("2026-05-05T13:30:00Z"),
        duration: 150,
        description: "Reviewed API specifications",
      },
    ],
  });

  // ─── Activity Logs ────────────────────────────────────────────────

  const now = new Date();

  await prisma.activityLog.createMany({
    data: [
      // Recent activity — Sprint 1
      {
        action: "TICKET_STATUS_CHANGED",
        description: "Moved Product Listing Page to In Progress",
        userId: admin.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket105.id,
        metadata: { from: "pending", to: "in_progress" },
        createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2m ago
      },
      {
        action: "TICKET_PRIORITY_CHANGED",
        description: "Updated Authentication Module priority to High",
        userId: member1.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket104.id,
        metadata: { from: "medium", to: "high" },
        createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15m ago
      },
      {
        action: "COMMENT_CREATED",
        description: "Commented on Checkout Process",
        userId: member2.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket107.id,
        createdAt: new Date(now.getTime() - 18 * 60 * 1000), // 18m ago
      },
      {
        action: "TICKET_CREATED",
        description: "Created ticket Category Management",
        userId: admin.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket106.id,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      },
      {
        action: "TICKET_MOVED",
        description: "Moved User Registration Flow to Todo",
        userId: member1.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket102.id,
        metadata: { from: "backlog", to: "pending" },
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3h ago
      },
      {
        action: "GROUP_CREATED",
        description: "Created Sprint 1",
        userId: admin.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5h ago
      },
      {
        action: "TICKET_ASSIGNED",
        description: "Assigned Database Schema to Mike Developer",
        userId: admin.id,
        targetUserId: member1.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket109.id,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6h ago
      },
      {
        action: "TICKET_STATUS_CHANGED",
        description: "Moved Database Schema to Completed",
        userId: member1.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket109.id,
        metadata: { from: "in_progress", to: "completed" },
        createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000), // 7h ago
      },
      {
        action: "TICKET_CREATED",
        description: "Created ticket Email Notifications",
        userId: member2.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket112.id,
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8h ago
      },
      {
        action: "FILE_UPLOADED",
        description: "Uploaded auth-flow.pdf to Authentication Module",
        userId: member1.id,
        projectId: ecommerceProject.id,
        groupId: sprint1.id,
        ticketId: ticket104.id,
        createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000), // 10h ago
      },

      // Some project-level activity (no groupId)
      {
        action: "PROJECT_UPDATED",
        description: "Updated project status to In Progress",
        userId: admin.id,
        projectId: ecommerceProject.id,
        metadata: { field: "status", from: "pending", to: "in_progress" },
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1d ago
      },
      {
        action: "MEMBER_INVITED",
        description: "Invited Emily Designer to the project",
        userId: admin.id,
        targetUserId: member2.id,
        projectId: ecommerceProject.id,
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2d ago
      },
      {
        action: "PROJECT_CREATED",
        description: "Created E-Commerce Platform project",
        userId: admin.id,
        projectId: ecommerceProject.id,
        createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3d ago
      },
    ],
  });

  console.log("✅ Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });