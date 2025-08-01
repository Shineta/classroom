import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("observer"), // observer, admin, coach
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teachers table
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  gradeLevel: varchar("grade_level"),
  subjects: text("subjects").array(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums for walkthrough data
export const engagementLevelEnum = pgEnum("engagement_level", ["1", "2", "3", "4", "5"]);
export const climateEnum = pgEnum("climate", ["warm", "neutral", "tense"]);
export const transitionsEnum = pgEnum("transitions", ["smooth", "needs-improvement"]);
export const effectivenessRatingEnum = pgEnum("effectiveness_rating", ["excellent", "good", "needs-improvement", "poor"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("status", ["draft", "completed", "follow-up-needed"]);

// Walkthroughs table
export const walkthroughs = pgTable("walkthroughs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  // Basic Information
  dateTime: timestamp("date_time").notNull(),
  subject: varchar("subject").notNull(),
  gradeLevel: varchar("grade_level"),
  lessonObjective: text("lesson_objective"),
  lessonPlanUrl: varchar("lesson_plan_url"),
  
  // Observations
  evidenceOfLearning: text("evidence_of_learning"),
  behaviorRoutines: jsonb("behavior_routines"), // {routines: string[], notes: string}
  climate: climateEnum("climate"),
  climateNotes: text("climate_notes"),
  
  // Assessment & Ratings
  engagementLevel: engagementLevelEnum("engagement_level"),
  transitions: transitionsEnum("transitions"),
  transitionComments: text("transition_comments"),
  effectivenessRatings: jsonb("effectiveness_ratings"), // {clearInstructions: string, questioningTechniques: string, etc.}
  
  // Feedback
  strengths: text("strengths"),
  areasForGrowth: text("areas_for_growth"),
  additionalComments: text("additional_comments"),
  
  // Follow-up
  followUpNeeded: boolean("follow_up_needed").default(false),
  assignedReviewer: varchar("assigned_reviewer").references(() => users.id),
  followUpDate: timestamp("follow_up_date"),
  priority: priorityEnum("priority"),
  
  // Metadata
  status: statusEnum("status").default("draft"),
  duration: integer("duration"), // minutes
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Walkthrough observers (many-to-many relationship)
export const walkthroughObservers = pgTable("walkthrough_observers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walkthroughId: varchar("walkthrough_id").notNull().references(() => walkthroughs.id, { onDelete: "cascade" }),
  observerId: varchar("observer_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Real-time collaboration tracking
export const walkthroughSessions = pgTable("walkthrough_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walkthroughId: varchar("walkthrough_id").notNull().references(() => walkthroughs.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  lastSeen: timestamp("last_seen").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  walkthroughUserUnique: unique().on(table.walkthroughId, table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdWalkthroughs: many(walkthroughs, { relationName: "creator" }),
  assignedWalkthroughs: many(walkthroughs, { relationName: "reviewer" }),
  observerSessions: many(walkthroughObservers),
  collaborationSessions: many(walkthroughSessions),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  walkthroughs: many(walkthroughs),
}));

export const walkthroughsRelations = relations(walkthroughs, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [walkthroughs.teacherId],
    references: [teachers.id],
  }),
  creator: one(users, {
    fields: [walkthroughs.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
  reviewer: one(users, {
    fields: [walkthroughs.assignedReviewer],
    references: [users.id],
    relationName: "reviewer",
  }),
  observers: many(walkthroughObservers),
  sessions: many(walkthroughSessions),
}));

export const walkthroughObserversRelations = relations(walkthroughObservers, ({ one }) => ({
  walkthrough: one(walkthroughs, {
    fields: [walkthroughObservers.walkthroughId],
    references: [walkthroughs.id],
  }),
  observer: one(users, {
    fields: [walkthroughObservers.observerId],
    references: [users.id],
  }),
}));

export const walkthroughSessionsRelations = relations(walkthroughSessions, ({ one }) => ({
  walkthrough: one(walkthroughs, {
    fields: [walkthroughSessions.walkthroughId],
    references: [walkthroughs.id],
  }),
  user: one(users, {
    fields: [walkthroughSessions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertTeacherSchema = createInsertSchema(teachers).pick({
  firstName: true,
  lastName: true,
  email: true,
  gradeLevel: true,
  subjects: true,
});

export const insertWalkthroughSchema = createInsertSchema(walkthroughs).pick({
  teacherId: true,
  dateTime: true,
  subject: true,
  gradeLevel: true,
  lessonObjective: true,
  lessonPlanUrl: true,
  evidenceOfLearning: true,
  behaviorRoutines: true,
  climate: true,
  climateNotes: true,
  engagementLevel: true,
  transitions: true,
  transitionComments: true,
  effectivenessRatings: true,
  strengths: true,
  areasForGrowth: true,
  additionalComments: true,
  followUpNeeded: true,
  assignedReviewer: true,
  followUpDate: true,
  priority: true,
  status: true,
  duration: true,
  startTime: true,
  endTime: true,
  createdBy: true,
}).extend({
  // Transform string dates to Date objects
  dateTime: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  followUpDate: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
  startTime: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
  endTime: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertWalkthrough = z.infer<typeof insertWalkthroughSchema>;
export type Walkthrough = typeof walkthroughs.$inferSelect;
export type WalkthroughObserver = typeof walkthroughObservers.$inferSelect;
export type WalkthroughSession = typeof walkthroughSessions.$inferSelect;

// Extended types for API responses
export type WalkthroughWithDetails = Walkthrough & {
  teacher: Teacher;
  creator: User;
  reviewer?: User;
  observers: (WalkthroughObserver & { observer: User })[];
};
