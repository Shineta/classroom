import {
  users,
  teachers,
  walkthroughs,
  walkthroughObservers,
  walkthroughSessions,
  type User,
  type InsertUser,
  type UpsertUser,
  type Teacher,
  type InsertTeacher,
  type Walkthrough,
  type InsertWalkthrough,
  type WalkthroughObserver,
  type WalkthroughSession,
  type WalkthroughWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, inArray, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Teacher operations
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  updateTeacher(id: string, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  searchTeachers(query: string): Promise<Teacher[]>;
  
  // Walkthrough operations
  createWalkthrough(walkthrough: InsertWalkthrough): Promise<Walkthrough>;
  getWalkthrough(id: string): Promise<WalkthroughWithDetails | undefined>;
  getWalkthroughs(filters?: {
    teacherId?: string;
    subject?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    createdBy?: string;
  }): Promise<WalkthroughWithDetails[]>;
  updateWalkthrough(id: string, walkthrough: Partial<InsertWalkthrough>): Promise<Walkthrough>;
  deleteWalkthrough(id: string): Promise<void>;
  
  // Observer operations
  addObserver(walkthroughId: string, observerId: string): Promise<WalkthroughObserver>;
  removeObserver(walkthroughId: string, observerId: string): Promise<void>;
  getObservers(walkthroughId: string): Promise<(WalkthroughObserver & { observer: User })[]>;
  
  // Collaboration operations
  updateSession(walkthroughId: string, userId: string): Promise<WalkthroughSession>;
  getActiveSessions(walkthroughId: string): Promise<(WalkthroughSession & { user: User })[]>;
  deactivateSession(walkthroughId: string, userId: string): Promise<void>;
  
  // Statistics
  getWalkthroughStats(userId?: string): Promise<{
    total: number;
    thisWeek: number;
    teachersObserved: number;
    avgDuration: number;
  }>;
  
  // Search
  searchUsers(query: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Teacher operations
  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(teacherData).returning();
    return teacher;
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).where(eq(teachers.active, true)).orderBy(teachers.lastName, teachers.firstName);
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async updateTeacher(id: string, teacherData: Partial<InsertTeacher>): Promise<Teacher> {
    const [teacher] = await db
      .update(teachers)
      .set({ ...teacherData, updatedAt: new Date() })
      .where(eq(teachers.id, id))
      .returning();
    return teacher;
  }

  async searchTeachers(query: string): Promise<Teacher[]> {
    return await db
      .select()
      .from(teachers)
      .where(
        and(
          eq(teachers.active, true),
          sql`${teachers.firstName} ILIKE ${`%${query}%`} OR ${teachers.lastName} ILIKE ${`%${query}%`}`
        )
      )
      .orderBy(teachers.lastName, teachers.firstName);
  }

  // Walkthrough operations
  async createWalkthrough(walkthroughData: InsertWalkthrough): Promise<Walkthrough> {
    const [walkthrough] = await db.insert(walkthroughs).values(walkthroughData).returning();
    return walkthrough;
  }

  async getWalkthrough(id: string): Promise<WalkthroughWithDetails | undefined> {
    const result = await db.query.walkthroughs.findFirst({
      where: eq(walkthroughs.id, id),
      with: {
        teacher: true,
        creator: true,
        reviewer: true,
        observers: {
          with: {
            observer: true,
          },
        },
      },
    });
    return result as WalkthroughWithDetails | undefined;
  }

  async getWalkthroughs(filters: {
    teacherId?: string;
    subject?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    createdBy?: string;
  } = {}): Promise<WalkthroughWithDetails[]> {
    const conditions = [];
    
    if (filters.teacherId) {
      conditions.push(eq(walkthroughs.teacherId, filters.teacherId));
    }
    if (filters.subject) {
      conditions.push(ilike(walkthroughs.subject, `%${filters.subject}%`));
    }
    if (filters.startDate) {
      conditions.push(gte(walkthroughs.dateTime, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(walkthroughs.dateTime, filters.endDate));
    }
    if (filters.status) {
      conditions.push(eq(walkthroughs.status, filters.status as any));
    }
    if (filters.createdBy) {
      conditions.push(eq(walkthroughs.createdBy, filters.createdBy));
    }

    const result = await db.query.walkthroughs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        teacher: true,
        creator: true,
        reviewer: true,
        observers: {
          with: {
            observer: true,
          },
        },
      },
      orderBy: desc(walkthroughs.dateTime),
    });
    
    return result as WalkthroughWithDetails[];
  }

  async updateWalkthrough(id: string, walkthroughData: Partial<InsertWalkthrough>): Promise<Walkthrough> {
    // Handle assignedReviewer validation - set to null if reviewer doesn't exist
    if (walkthroughData.assignedReviewer) {
      const reviewer = await db.query.users.findFirst({
        where: eq(users.id, walkthroughData.assignedReviewer)
      });
      if (!reviewer) {
        console.log(`Assigned reviewer ${walkthroughData.assignedReviewer} not found, setting to null`);
        walkthroughData.assignedReviewer = null;
      }
    }
    
    const [walkthrough] = await db
      .update(walkthroughs)
      .set({ ...walkthroughData, updatedAt: new Date() })
      .where(eq(walkthroughs.id, id))
      .returning();
    return walkthrough;
  }

  async deleteWalkthrough(id: string): Promise<void> {
    await db.delete(walkthroughs).where(eq(walkthroughs.id, id));
  }

  // Observer operations
  async addObserver(walkthroughId: string, observerId: string): Promise<WalkthroughObserver> {
    const [observer] = await db
      .insert(walkthroughObservers)
      .values({ walkthroughId, observerId })
      .returning();
    return observer;
  }

  async removeObserver(walkthroughId: string, observerId: string): Promise<void> {
    await db
      .delete(walkthroughObservers)
      .where(
        and(
          eq(walkthroughObservers.walkthroughId, walkthroughId),
          eq(walkthroughObservers.observerId, observerId)
        )
      );
  }

  async getObservers(walkthroughId: string): Promise<(WalkthroughObserver & { observer: User })[]> {
    const result = await db.query.walkthroughObservers.findMany({
      where: eq(walkthroughObservers.walkthroughId, walkthroughId),
      with: {
        observer: true,
      },
    });
    return result as (WalkthroughObserver & { observer: User })[];
  }

  // Collaboration operations
  async updateSession(walkthroughId: string, userId: string): Promise<WalkthroughSession> {
    // First try to update existing session
    const existing = await db
      .select()
      .from(walkthroughSessions)
      .where(
        and(
          eq(walkthroughSessions.walkthroughId, walkthroughId),
          eq(walkthroughSessions.userId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [session] = await db
        .update(walkthroughSessions)
        .set({ lastSeen: new Date(), isActive: true })
        .where(
          and(
            eq(walkthroughSessions.walkthroughId, walkthroughId),
            eq(walkthroughSessions.userId, userId)
          )
        )
        .returning();
      return session;
    } else {
      const [session] = await db
        .insert(walkthroughSessions)
        .values({ walkthroughId, userId, lastSeen: new Date(), isActive: true })
        .returning();
      return session;
    }
  }

  async getActiveSessions(walkthroughId: string): Promise<(WalkthroughSession & { user: User })[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await db.query.walkthroughSessions.findMany({
      where: and(
        eq(walkthroughSessions.walkthroughId, walkthroughId),
        eq(walkthroughSessions.isActive, true),
        gte(walkthroughSessions.lastSeen, fiveMinutesAgo)
      ),
      with: {
        user: true,
      },
    });
    return result as (WalkthroughSession & { user: User })[];
  }

  async deactivateSession(walkthroughId: string, userId: string): Promise<void> {
    await db
      .update(walkthroughSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(walkthroughSessions.walkthroughId, walkthroughId),
          eq(walkthroughSessions.userId, userId)
        )
      );
  }

  // Statistics
  async getWalkthroughStats(userId?: string): Promise<{
    total: number;
    thisWeek: number;
    teachersObserved: number;
    avgDuration: number;
  }> {
    const conditions = userId ? [eq(walkthroughs.createdBy, userId)] : [];
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(walkthroughs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get this week count
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekConditions = [...conditions, gte(walkthroughs.createdAt, oneWeekAgo)];
    const [weekResult] = await db
      .select({ count: count() })
      .from(walkthroughs)
      .where(and(...weekConditions));

    // Get unique teachers count
    const teachersResult = await db
      .selectDistinct({ teacherId: walkthroughs.teacherId })
      .from(walkthroughs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get average duration
    const [avgResult] = await db
      .select({ avg: sql<number>`AVG(${walkthroughs.duration})` })
      .from(walkthroughs)
      .where(
        and(
          ...(conditions.length > 0 ? conditions : []),
          sql`${walkthroughs.duration} IS NOT NULL`
        )
      );

    return {
      total: totalResult.count,
      thisWeek: weekResult.count,
      teachersObserved: teachersResult.length,
      avgDuration: Math.round(avgResult.avg || 0),
    };
  }

  // Search
  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        sql`${users.firstName} ILIKE ${`%${query}%`} OR ${users.lastName} ILIKE ${`%${query}%`} OR ${users.email} ILIKE ${`%${query}%`}`
      )
      .orderBy(users.firstName, users.lastName);
  }
}

export const storage = new DatabaseStorage();
