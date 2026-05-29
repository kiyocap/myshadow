import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const prisma = hasDatabaseUrl
  ? (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
      }))
  : null;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function getPrisma() {
  if (!prisma) {
    throw new Error("DATABASE_URL is required before accessing Prisma.");
  }

  return prisma;
}
