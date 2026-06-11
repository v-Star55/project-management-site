import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment variables.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

// Handle Next.js dev server caching after client regeneration
if (process.env.NODE_ENV !== "production") {
  if (prismaInstance && (!("note" in prismaInstance) || !("calendarEvent" in prismaInstance))) {
    prismaInstance = new PrismaClient({ adapter });
  }
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
