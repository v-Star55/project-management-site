import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment variables.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean database
  await prisma.ticketAttachment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
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
      password: "hashed_password",
      role: "owner",
      companyId: company.id,
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Sarah Admin",
      email: "admin@acme.com",
      password: "hashed_password",
      role: "admin",
      companyId: company.id,
      isVerified: true,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Mike Developer",
      email: "mike@acme.com",
      password: "hashed_password",
      role: "member",
      companyId: company.id,
      isVerified: true,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Emma Designer",
      email: "emma@acme.com",
      password: "hashed_password",
      role: "member",
      companyId: company.id,
      isVerified: true,
    },
  });

  const client = await prisma.user.create({
    data: {
      name: "Robert Client",
      email: "client@example.com",
      password: "hashed_password",
      role: "client",
      companyId: company.id,
      isVerified: true,
    },
  });

  // Project 1
  const crmProject = await prisma.project.create({
    data: {
      title: "CRM Dashboard",
      description: "Internal customer management dashboard",
      status: "in_progress",
      imageUrl: "https://picsum.photos/600/400",
      companyId: company.id,
      members: {
        connect: [
          { id: owner.id },
          { id: admin.id },
          { id: member1.id },
          { id: member2.id },
        ],
      },
    },
  });

  // Project 2
  const ecommerceProject = await prisma.project.create({
    data: {
      title: "E-Commerce Platform",
      description: "Modern online shopping application",
      status: "pending",
      imageUrl: "https://picsum.photos/600/401",
      companyId: company.id,
      members: {
        connect: [
          { id: admin.id },
          { id: member1.id },
          { id: client.id },
        ],
      },
    },
  });

  // Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: "Build Authentication Module",
      description: "Implement JWT authentication",
      status: "in_progress",
      priority: "high",
      projectId: crmProject.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-07-15"),
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: "Design Dashboard UI",
      description: "Create Figma designs",
      status: "completed",
      priority: "medium",
      projectId: crmProject.id,
      assignedUserId: member2.id,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: "Payment Gateway Integration",
      description: "Integrate Razorpay",
      status: "pending",
      priority: "high",
      projectId: ecommerceProject.id,
      assignedUserId: member1.id,
      dueDate: new Date("2026-08-01"),
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      title: "Product Catalog APIs",
      description: "Create CRUD APIs",
      status: "reopen",
      priority: "medium",
      projectId: ecommerceProject.id,
      assignedUserId: admin.id,
    },
  });

  // Attachments
  await prisma.ticketAttachment.createMany({
    data: [
      {
        ticketId: ticket1.id,
        fileName: "auth-flow.pdf",
        fileUrl: "https://example.com/files/auth-flow.pdf",
      },
      {
        ticketId: ticket2.id,
        fileName: "dashboard-design.fig",
        fileUrl: "https://example.com/files/dashboard.fig",
      },
    ],
  });

  // Messages
  await prisma.message.createMany({
    data: [
      {
        text: "Authentication module has been started.",
        projectId: crmProject.id,
        userId: member1.id,
        ticketId: ticket1.id,
      },
      {
        text: "UI design is ready for review.",
        projectId: crmProject.id,
        userId: member2.id,
        ticketId: ticket2.id,
      },
      {
        text: "Client approved initial requirements.",
        projectId: ecommerceProject.id,
        userId: client.id,
      },
    ],
  });

  // Time Logs
  await prisma.timeLog.createMany({
    data: [
      {
        userId: member1.id,
        ticketId: ticket1.id,
        startTime: new Date("2026-06-01T09:00:00Z"),
        endTime: new Date("2026-06-01T13:00:00Z"),
        duration: 240,
        description: "Implemented login and register APIs",
      },
      {
        userId: member2.id,
        ticketId: ticket2.id,
        startTime: new Date("2026-06-02T10:00:00Z"),
        endTime: new Date("2026-06-02T15:00:00Z"),
        duration: 300,
        description: "Designed dashboard screens",
      },
      {
        userId: admin.id,
        ticketId: ticket4.id,
        startTime: new Date("2026-06-03T11:00:00Z"),
        endTime: new Date("2026-06-03T13:30:00Z"),
        duration: 150,
        description: "Reviewed API specifications",
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