import {
  users,
  teachers,
  locations,
  walkthroughs,
  walkthroughObservers,
  walkthroughSessions,
  lessonPlans,
  type User,
  type InsertUser,
  type UpsertUser,
  type Teacher,
  type InsertTeacher,
  type Location,
  type InsertLocation,
  type Walkthrough,
  type InsertWalkthrough,
  type WalkthroughObserver,
  type WalkthroughSession,
  type WalkthroughWithDetails,
  type LessonPlan,
  type InsertLessonPlan,
  type LessonPlanWithDetails,
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
  
  // Location operations
  createLocation(location: InsertLocation): Promise<Location>;
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  
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
    reviewStatus?: string;
    assignedReviewer?: string;
    followUpNeeded?: boolean;
  }): Promise<WalkthroughWithDetails[]>;
  updateWalkthrough(id: string, walkthrough: Partial<InsertWalkthrough>): Promise<Walkthrough>;
  deleteWalkthrough(id: string): Promise<void>;
  
  // Review workflow operations
  startReview(walkthroughId: string, reviewerId: string): Promise<Walkthrough>;
  completeReview(walkthroughId: string, reviewData: {
    reviewerFeedback?: string;
    reviewerComments?: string;
  }): Promise<Walkthrough>;
  getWalkthroughsNeedingReview(reviewerId: string): Promise<WalkthroughWithDetails[]>;
  
  // Observer operations
  addObserver(walkthroughId: string, observerId: string): Promise<WalkthroughObserver>;
  removeObserver(walkthroughId: string, observerId: string): Promise<void>;
  getObservers(walkthroughId: string): Promise<(WalkthroughObserver & { observer: User })[]>;
  
  // Collaboration operations
  updateSession(walkthroughId: string, userId: string): Promise<WalkthroughSession>;
  getActiveSessions(walkthroughId: string): Promise<(WalkthroughSession & { user: User })[]>;
  
  // Lesson plan operations
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  getLessonPlan(id: string): Promise<LessonPlanWithDetails | undefined>;
  getLessonPlans(filters?: {
    teacherId?: string;
    createdBy?: string;
    subject?: string;
    status?: string;
  }): Promise<LessonPlanWithDetails[]>;
  updateLessonPlan(id: string, lessonPlan: Partial<InsertLessonPlan>): Promise<LessonPlan>;
  deleteLessonPlan(id: string): Promise<void>;
  getLessonPlanStats(createdBy: string): Promise<{
    total: number;
    thisWeek: number;
    finalized: number;
    avgDuration: number;
  }>;
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

  // Location operations
  async createLocation(locationData: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(locationData).returning();
    return location;
  }

  async getLocations(): Promise<Location[]> {
    return await db
      .select()
      .from(locations)
      .where(eq(locations.active, true))
      .orderBy(locations.name);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
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
        location: true,
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
    reviewStatus?: string;
    assignedReviewer?: string;
    followUpNeeded?: boolean;
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
    if (filters.reviewStatus) {
      conditions.push(eq(walkthroughs.reviewStatus, filters.reviewStatus as any));
    }
    if (filters.assignedReviewer) {
      conditions.push(eq(walkthroughs.assignedReviewer, filters.assignedReviewer));
    }
    if (filters.followUpNeeded !== undefined) {
      conditions.push(eq(walkthroughs.followUpNeeded, filters.followUpNeeded));
    }

    const result = await db.query.walkthroughs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        teacher: true,
        location: true,
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
    // Handle assignedReviewer validation - set to null if empty string or reviewer doesn't exist
    if (walkthroughData.assignedReviewer !== undefined) {
      if (!walkthroughData.assignedReviewer || walkthroughData.assignedReviewer === "") {
        walkthroughData.assignedReviewer = null;
      } else {
        const reviewer = await db.query.users.findFirst({
          where: eq(users.id, walkthroughData.assignedReviewer)
        });
        if (!reviewer) {
          console.log(`Assigned reviewer ${walkthroughData.assignedReviewer} not found, setting to null`);
          walkthroughData.assignedReviewer = null;
        }
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

  // Review workflow operations
  async startReview(walkthroughId: string): Promise<Walkthrough> {
    const [walkthrough] = await db
      .update(walkthroughs)
      .set({
        reviewStatus: "in-progress",
        reviewStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(walkthroughs.id, walkthroughId))
      .returning();
    return walkthrough;
  }

  async completeReview(walkthroughId: string, reviewData: {
    reviewerFeedback?: string;
    reviewerComments?: string;
  }): Promise<Walkthrough> {
    const [walkthrough] = await db
      .update(walkthroughs)
      .set({
        reviewStatus: "completed",
        reviewCompletedAt: new Date(),
        reviewerFeedback: reviewData.reviewerFeedback,
        reviewerComments: reviewData.reviewerComments,
        updatedAt: new Date(),
      })
      .where(eq(walkthroughs.id, walkthroughId))
      .returning();
    return walkthrough;
  }

  async getWalkthroughsNeedingReview(reviewerId: string): Promise<WalkthroughWithDetails[]> {
    const result = await db.query.walkthroughs.findMany({
      where: and(
        eq(walkthroughs.assignedReviewer, reviewerId),
        eq(walkthroughs.reviewStatus, "pending"),
        eq(walkthroughs.followUpNeeded, true)
      ),
      with: {
        teacher: true,
        location: true,
        creator: true,
        reviewer: true,
        observers: {
          with: {
            observer: true,
          },
        },
      },
      orderBy: desc(walkthroughs.followUpDate),
    });
    
    return result as WalkthroughWithDetails[];
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

  // Review workflow methods
  async getWalkthroughsNeedingReview(reviewerId: string): Promise<WalkthroughWithDetails[]> {
    const result = await db.query.walkthroughs.findMany({
      where: and(
        eq(walkthroughs.assignedReviewer, reviewerId),
        eq(walkthroughs.reviewStatus, "pending")
      ),
      with: {
        teacher: true,
        location: true,
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

  async startReview(walkthroughId: string, reviewerId: string): Promise<Walkthrough> {
    const [walkthrough] = await db
      .update(walkthroughs)
      .set({
        reviewStatus: "in-progress",
        reviewStartedAt: new Date(),
      })
      .where(and(
        eq(walkthroughs.id, walkthroughId),
        eq(walkthroughs.assignedReviewer, reviewerId)
      ))
      .returning();
    
    return walkthrough;
  }

  async completeReview(walkthroughId: string, reviewData: {
    reviewerFeedback?: string;
    reviewerComments?: string;
  }): Promise<Walkthrough> {
    const [walkthrough] = await db
      .update(walkthroughs)
      .set({
        reviewStatus: "completed",
        reviewCompletedAt: new Date(),
        reviewerFeedback: reviewData.reviewerFeedback,
        reviewerComments: reviewData.reviewerComments,
      })
      .where(eq(walkthroughs.id, walkthroughId))
      .returning();
    
    return walkthrough;
  }

  // Analytics methods for Coach Insights
  async getObserverActivity(): Promise<any[]> {
    const result = await db
      .select({
        observerId: users.id,
        observerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        walkthroughCount: sql<number>`COUNT(${walkthroughs.id})`,
        avgRating: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = 'low' THEN 1
          WHEN ${walkthroughs.engagementLevel} = 'medium' THEN 2
          WHEN ${walkthroughs.engagementLevel} = 'high' THEN 3
          ELSE 2
        END)`,
        subjects: sql<string[]>`ARRAY_AGG(DISTINCT ${walkthroughs.subject})`,
      })
      .from(walkthroughs)
      .innerJoin(users, eq(walkthroughs.createdBy, users.id))
      .groupBy(users.id, users.firstName, users.lastName)
      .orderBy(sql`COUNT(${walkthroughs.id}) DESC`);

    return result.map(row => ({
      ...row,
      avgRating: row.avgRating || 0,
      subjects: row.subjects.filter(Boolean),
    }));
  }

  async getEngagementTrends(): Promise<any[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await db
      .select({
        date: sql<string>`DATE(${walkthroughs.dateTime})`,
        avgEngagement: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = 'low' THEN 1
          WHEN ${walkthroughs.engagementLevel} = 'medium' THEN 2
          WHEN ${walkthroughs.engagementLevel} = 'high' THEN 3
          ELSE 2
        END)`,
      })
      .from(walkthroughs)
      .where(gte(walkthroughs.dateTime, thirtyDaysAgo))
      .groupBy(sql`DATE(${walkthroughs.dateTime})`)
      .orderBy(sql`DATE(${walkthroughs.dateTime})`);

    return result.map(row => ({
      date: row.date,
      studentEngagement: row.avgEngagement || 0,
      instructionalStrategies: row.avgEngagement || 0,
      classroomEnvironment: row.avgEngagement || 0,
      lessonDelivery: row.avgEngagement || 0,
    }));
  }

  async getSubjectDistribution(): Promise<any[]> {
    const result = await db
      .select({
        subject: walkthroughs.subject,
        count: sql<number>`COUNT(*)`,
        avgRating: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = 'low' THEN 1
          WHEN ${walkthroughs.engagementLevel} = 'medium' THEN 2
          WHEN ${walkthroughs.engagementLevel} = 'high' THEN 3
          ELSE 2
        END)`,
      })
      .from(walkthroughs)
      .groupBy(walkthroughs.subject)
      .orderBy(sql`COUNT(*) DESC`);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    return result.map((row, index) => ({
      subject: row.subject,
      count: row.count,
      avgRating: row.avgRating || 0,
      color: colors[index % colors.length],
    }));
  }

  async getStrengthsGrowthData(): Promise<any[]> {
    const subjects = await db
      .selectDistinct({ subject: walkthroughs.subject })
      .from(walkthroughs);

    return subjects.map(({ subject }) => ({
      category: subject,
      strengths: Math.floor(Math.random() * 10) + 5, // Placeholder - would be actual analysis
      growthAreas: Math.floor(Math.random() * 8) + 2,
    }));
  }

  async getAnalyticsOverview(): Promise<any> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(walkthroughs);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const [monthResult] = await db
      .select({ count: count() })
      .from(walkthroughs)
      .where(gte(walkthroughs.dateTime, thisMonth));

    const [avgResult] = await db
      .select({ avg: sql<number>`AVG(CASE 
        WHEN ${walkthroughs.engagementLevel} = 'low' THEN 1
        WHEN ${walkthroughs.engagementLevel} = 'medium' THEN 2
        WHEN ${walkthroughs.engagementLevel} = 'high' THEN 3
        ELSE 2
      END)` })
      .from(walkthroughs)
      .where(sql`${walkthroughs.engagementLevel} IS NOT NULL`);

    return {
      totalWalkthroughs: totalResult.count,
      thisMonth: monthResult.count,
      avgEngagement: avgResult.avg || 0,
    };
  }

  // Leadership Analytics Methods
  async getLeadershipOverview(locationFilter?: string, dateRange?: string): Promise<any> {
    let dateCondition;
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        dateCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        dateCondition = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'semester':
        dateCondition = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
        break;
      case 'year':
        dateCondition = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const baseQuery = db.select().from(walkthroughs);
    let query = baseQuery;

    if (locationFilter && locationFilter !== 'all') {
      query = query.where(eq(walkthroughs.locationId, locationFilter));
    }

    if (dateCondition) {
      query = query.where(gte(walkthroughs.dateTime, dateCondition));
    }

    const walkthroughData = await query;

    // Calculate statistics
    const totalWalkthroughs = walkthroughData.length;
    const thisWeek = walkthroughData.filter(w => 
      new Date(w.dateTime) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const uniqueTeachers = new Set(walkthroughData.map(w => w.teacherId)).size;
    
    const validEngagements = walkthroughData.filter(w => w.engagementLevel);
    const avgEngagement = validEngagements.length > 0 
      ? validEngagements.reduce((acc, w) => acc + parseInt(w.engagementLevel), 0) / validEngagements.length 
      : 0;

    // Get observer count
    const uniqueObservers = new Set(walkthroughData.map(w => w.createdBy)).size;

    // Get active locations count
    const activeLocationsResult = await db
      .select({ count: count() })
      .from(locations)
      .where(eq(locations.active, true));

    return {
      totalWalkthroughs,
      thisWeek,
      uniqueTeachers,
      avgEngagement,
      totalObservers: uniqueObservers,
      activeLocations: activeLocationsResult[0]?.count || 0,
    };
  }

  async getLocationStats(dateRange?: string): Promise<any[]> {
    let dateCondition;
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        dateCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        dateCondition = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'semester':
        dateCondition = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
        break;
      case 'year':
        dateCondition = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const result = await db
      .select({
        locationId: walkthroughs.locationId,
        locationName: locations.name,
        walkthroughCount: sql<number>`COUNT(${walkthroughs.id})`,
        avgEngagement: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = '1' THEN 1
          WHEN ${walkthroughs.engagementLevel} = '2' THEN 2
          WHEN ${walkthroughs.engagementLevel} = '3' THEN 3
          WHEN ${walkthroughs.engagementLevel} = '4' THEN 4
          WHEN ${walkthroughs.engagementLevel} = '5' THEN 5
          ELSE 3
        END)`,
        uniqueTeachers: sql<number>`COUNT(DISTINCT ${walkthroughs.teacherId})`,
      })
      .from(walkthroughs)
      .innerJoin(locations, eq(walkthroughs.locationId, locations.id))
      .where(dateCondition ? gte(walkthroughs.dateTime, dateCondition) : sql`true`)
      .groupBy(walkthroughs.locationId, locations.name)
      .orderBy(sql`COUNT(${walkthroughs.id}) DESC`);

    return result.map(row => ({
      locationName: row.locationName,
      walkthroughCount: row.walkthroughCount,
      avgEngagement: row.avgEngagement || 0,
      uniqueTeachers: row.uniqueTeachers,
    }));
  }

  async getLeadershipSubjectDistribution(locationFilter?: string, dateRange?: string): Promise<any[]> {
    let dateCondition;
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        dateCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        dateCondition = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'semester':
        dateCondition = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
        break;
      case 'year':
        dateCondition = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let query = db
      .select({
        subject: walkthroughs.subject,
        count: sql<number>`COUNT(*)`,
        avgRating: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = '1' THEN 1
          WHEN ${walkthroughs.engagementLevel} = '2' THEN 2
          WHEN ${walkthroughs.engagementLevel} = '3' THEN 3
          WHEN ${walkthroughs.engagementLevel} = '4' THEN 4
          WHEN ${walkthroughs.engagementLevel} = '5' THEN 5
          ELSE 3
        END)`,
      })
      .from(walkthroughs);

    if (locationFilter && locationFilter !== 'all') {
      query = query.where(eq(walkthroughs.locationId, locationFilter));
    }

    if (dateCondition) {
      query = query.where(gte(walkthroughs.dateTime, dateCondition));
    }

    const result = await query
      .groupBy(walkthroughs.subject)
      .orderBy(sql`COUNT(*) DESC`);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    return result.map((row, index) => ({
      subject: row.subject,
      count: row.count,
      avgRating: row.avgRating || 0,
      color: colors[index % colors.length],
    }));
  }

  async getStandardsTracking(locationFilter?: string, dateRange?: string): Promise<any[]> {
    // Mock data for standards tracking since this would require additional schema
    // In a real implementation, you'd have a standards field in walkthroughs table
    const mockStandards = [
      { standard: "CCSS.MATH.CONTENT.K.CC.A.1", frequency: 15, percentage: 78 },
      { standard: "CCSS.MATH.CONTENT.K.CC.A.2", frequency: 12, percentage: 63 },
      { standard: "CCSS.ELA-LITERACY.K.RL.1.1", frequency: 18, percentage: 94 },
      { standard: "CCSS.ELA-LITERACY.K.RL.1.2", frequency: 10, percentage: 52 },
      { standard: "NGSS.K-ESS2-1", frequency: 8, percentage: 42 },
    ];

    return mockStandards;
  }

  async getTeacherPerformance(locationFilter?: string, dateRange?: string): Promise<any[]> {
    let dateCondition;
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        dateCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        dateCondition = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'semester':
        dateCondition = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
        break;
      case 'year':
        dateCondition = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        dateCondition = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let query = db
      .select({
        teacherId: walkthroughs.teacherId,
        teacherName: sql<string>`${teachers.firstName} || ' ' || ${teachers.lastName}`,
        totalObservations: sql<number>`COUNT(${walkthroughs.id})`,
        avgEngagement: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = '1' THEN 1
          WHEN ${walkthroughs.engagementLevel} = '2' THEN 2
          WHEN ${walkthroughs.engagementLevel} = '3' THEN 3
          WHEN ${walkthroughs.engagementLevel} = '4' THEN 4
          WHEN ${walkthroughs.engagementLevel} = '5' THEN 5
          ELSE 3
        END)`,
        lastObservation: sql<string>`MAX(${walkthroughs.dateTime})`,
      })
      .from(walkthroughs)
      .innerJoin(teachers, eq(walkthroughs.teacherId, teachers.id));

    if (locationFilter && locationFilter !== 'all') {
      query = query.where(eq(walkthroughs.locationId, locationFilter));
    }

    if (dateCondition) {
      query = query.where(gte(walkthroughs.dateTime, dateCondition));
    }

    const result = await query
      .groupBy(walkthroughs.teacherId, teachers.firstName, teachers.lastName)
      .orderBy(sql`COUNT(${walkthroughs.id}) DESC`);

    return result.map(row => ({
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      totalObservations: row.totalObservations,
      avgEngagement: row.avgEngagement || 0,
      recentTrend: Math.random() > 0.5 ? 'improving' : Math.random() > 0.5 ? 'declining' : 'stable', // Mock trend
      lastObservation: new Date(row.lastObservation).toLocaleDateString(),
    }));
  }

  async getLeadershipEngagementTrends(locationFilter?: string, dateRange?: string): Promise<any[]> {
    let dateCondition;
    const now = new Date();
    
    switch (dateRange) {
      case 'week':
        dateCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateCondition = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateCondition = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'semester':
        dateCondition = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateCondition = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateCondition = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = db
      .select({
        date: sql<string>`DATE(${walkthroughs.dateTime})`,
        avgEngagement: sql<number>`AVG(CASE 
          WHEN ${walkthroughs.engagementLevel} = '1' THEN 1
          WHEN ${walkthroughs.engagementLevel} = '2' THEN 2
          WHEN ${walkthroughs.engagementLevel} = '3' THEN 3
          WHEN ${walkthroughs.engagementLevel} = '4' THEN 4
          WHEN ${walkthroughs.engagementLevel} = '5' THEN 5
          ELSE 3
        END)`,
      })
      .from(walkthroughs);

    if (locationFilter && locationFilter !== 'all') {
      query = query.where(eq(walkthroughs.locationId, locationFilter));
    }

    if (dateCondition) {
      query = query.where(gte(walkthroughs.dateTime, dateCondition));
    }

    const result = await query
      .groupBy(sql`DATE(${walkthroughs.dateTime})`)
      .orderBy(sql`DATE(${walkthroughs.dateTime})`);

    return result.map(row => ({
      date: row.date,
      avgEngagement: row.avgEngagement || 0,
    }));
  }

  // Admin Methods
  async getAllUsers(): Promise<any[]> {
    const result = await db.select().from(users).orderBy(users.createdAt);
    return result;
  }

  async updateUser(id: string, userData: Partial<typeof users.$inferInsert>): Promise<any> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Lesson plan operations
  async createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const [plan] = await db.insert(lessonPlans).values(lessonPlan).returning();
    return plan;
  }

  async getLessonPlan(id: string): Promise<LessonPlanWithDetails | undefined> {
    const [plan] = await db.select()
      .from(lessonPlans)
      .leftJoin(teachers, eq(lessonPlans.teacherId, teachers.id))
      .leftJoin(users, eq(lessonPlans.createdBy, users.id))
      .where(eq(lessonPlans.id, id));

    if (!plan) return undefined;

    return {
      ...plan.lesson_plans,
      teacher: plan.teachers!,
      creator: plan.users!,
    };
  }

  async getLessonPlans(filters?: {
    teacherId?: string;
    createdBy?: string;
    subject?: string;
    status?: string;
  }): Promise<LessonPlanWithDetails[]> {
    let query = db.select()
      .from(lessonPlans)
      .leftJoin(teachers, eq(lessonPlans.teacherId, teachers.id))
      .leftJoin(users, eq(lessonPlans.createdBy, users.id))
      .orderBy(desc(lessonPlans.createdAt));

    const conditions = [];
    if (filters?.teacherId) {
      conditions.push(eq(lessonPlans.teacherId, filters.teacherId));
    }
    if (filters?.createdBy) {
      conditions.push(eq(lessonPlans.createdBy, filters.createdBy));
    }
    if (filters?.subject) {
      conditions.push(eq(lessonPlans.subject, filters.subject));
    }
    if (filters?.status) {
      conditions.push(eq(lessonPlans.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.execute();

    return results.map(result => ({
      ...result.lesson_plans,
      teacher: result.teachers!,
      creator: result.users!,
    }));
  }

  async updateLessonPlan(id: string, lessonPlan: Partial<InsertLessonPlan>): Promise<LessonPlan> {
    const [plan] = await db.update(lessonPlans)
      .set({
        ...lessonPlan,
        updatedAt: new Date(),
      })
      .where(eq(lessonPlans.id, id))
      .returning();
    return plan;
  }

  async deleteLessonPlan(id: string): Promise<void> {
    await db.delete(lessonPlans).where(eq(lessonPlans.id, id));
  }

  async getLessonPlanStats(createdBy: string): Promise<{
    total: number;
    thisWeek: number;
    finalized: number;
    avgDuration: number;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalResult] = await db.select({ count: count() })
      .from(lessonPlans)
      .where(eq(lessonPlans.createdBy, createdBy));

    const [thisWeekResult] = await db.select({ count: count() })
      .from(lessonPlans)
      .where(and(
        eq(lessonPlans.createdBy, createdBy),
        gte(lessonPlans.createdAt, weekAgo)
      ));

    const [finalizedResult] = await db.select({ count: count() })
      .from(lessonPlans)
      .where(and(
        eq(lessonPlans.createdBy, createdBy),
        eq(lessonPlans.status, "finalized")
      ));

    const [avgDurationResult] = await db.select({ 
      avg: sql<number>`COALESCE(AVG(duration), 0)::integer`
    })
      .from(lessonPlans)
      .where(eq(lessonPlans.createdBy, createdBy));

    return {
      total: totalResult.count,
      thisWeek: thisWeekResult.count,
      finalized: finalizedResult.count,
      avgDuration: avgDurationResult.avg,
    };
  }
}

export const storage = new DatabaseStorage();
