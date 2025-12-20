import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import { 
  type User, 
  type InsertUser, 
  type Device, 
  type RiceContribution,
  type InsertRiceContribution,
  users,
  devices,
  riceContributions 
} from "@shared/schema";
import { randomUUID } from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  registerDevice(anonymousId: string): Promise<Device>;
  getDevice(anonymousId: string): Promise<Device | undefined>;
  addRiceContribution(contribution: InsertRiceContribution): Promise<RiceContribution>;
  getTotalRice(): Promise<number>;
  getDeviceRice(anonymousId: string): Promise<number>;
  getTotalMeditators(): Promise<number>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async registerDevice(anonymousId: string): Promise<Device> {
    const existing = await this.getDevice(anonymousId);
    if (existing) {
      return existing;
    }
    const result = await db.insert(devices).values({ anonymousId }).returning();
    return result[0];
  }

  async getDevice(anonymousId: string): Promise<Device | undefined> {
    const result = await db.select().from(devices).where(eq(devices.anonymousId, anonymousId));
    return result[0];
  }

  async addRiceContribution(contribution: InsertRiceContribution): Promise<RiceContribution> {
    await this.registerDevice(contribution.anonymousId);
    const result = await db.insert(riceContributions).values(contribution).returning();
    return result[0];
  }

  async getTotalRice(): Promise<number> {
    const result = await db.select({ 
      total: sql<number>`COALESCE(SUM(${riceContributions.amount}), 0)` 
    }).from(riceContributions);
    return Number(result[0]?.total ?? 0);
  }

  async getDeviceRice(anonymousId: string): Promise<number> {
    const result = await db.select({ 
      total: sql<number>`COALESCE(SUM(${riceContributions.amount}), 0)` 
    }).from(riceContributions).where(eq(riceContributions.anonymousId, anonymousId));
    return Number(result[0]?.total ?? 0);
  }

  async getTotalMeditators(): Promise<number> {
    const result = await db.select({ 
      count: sql<number>`COUNT(DISTINCT ${devices.anonymousId})` 
    }).from(devices);
    return Number(result[0]?.count ?? 0);
  }
}

export const storage = new DatabaseStorage();
