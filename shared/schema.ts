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
  role: varchar("role").default("observer"), // observer, admin, coach, leadership, teacher
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Locations table
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  active: boolean("active").default(true),
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

// Lesson Plans table - for teachers to pre-populate walkthrough data
export const lessonPlans = pgTable("lesson_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  createdBy: varchar("created_by").notNull().references(() => users.id), // User who created this plan
  
  // Basic lesson information
  title: varchar("title").notNull(),
  subject: varchar("subject").notNull(),
  gradeLevel: varchar("grade_level"),
  dateScheduled: timestamp("date_scheduled"),
  duration: integer("duration"), // minutes
  
  // Lesson content
  objective: text("objective"),
  topics: text("topics"), // Content areas covered
  standardsCovered: jsonb("standards_covered").$type<string[]>().default([]),
  materials: text("materials"),
  
  // Class information
  estimatedStudentCount: integer("estimated_student_count"),
  classroomNotes: text("classroom_notes"),
  
  // Planning details
  activities: text("activities"),
  assessment: text("assessment"),
  differentiation: text("differentiation"),
  
  // File attachments
  attachmentUrls: jsonb("attachment_urls").$type<string[]>().default([]),
  
  // Status and workflow
  status: varchar("status").default("draft"), // draft, submitted, finalized, archived
  isPublic: boolean("is_public").default(false), // Can observers see this for reference?
  
  // Weekly submission tracking
  weekOfYear: integer("week_of_year"), // Track which week this plan is for (1-52)
  submittedAt: timestamp("submitted_at"), // When the plan was submitted
  isLateSubmission: boolean("is_late_submission").default(false), // Track if submitted after Friday deadline
  coachNotified: boolean("coach_notified").default(false), // Track if coach was notified of submission
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums for walkthrough data
export const complianceLevelEnum = pgEnum("compliance_level", ["all", "most", "some", "none"]);
export const engagementLevelEnum = pgEnum("engagement_level", ["1", "2", "3", "4", "5"]);
export const climateEnum = pgEnum("climate", ["warm", "neutral", "tense"]);
export const transitionsEnum = pgEnum("transitions", ["smooth", "needs-improvement"]);
export const effectivenessRatingEnum = pgEnum("effectiveness_rating", ["excellent", "good", "needs-improvement", "poor"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("status", ["draft", "completed", "follow-up-needed"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "in-progress", "completed", "not-required"]);

// Walkthroughs table
export const walkthroughs = pgTable("walkthroughs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id),
  locationId: varchar("location_id").references(() => locations.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  // Basic Information
  dateTime: timestamp("date_time").notNull(),
  subject: varchar("subject").notNull(),
  gradeLevel: varchar("grade_level"),
  lessonObjective: text("lesson_objective"),
  lessonPlanUrl: varchar("lesson_plan_url"),
  lessonPlanId: varchar("lesson_plan_id").references(() => lessonPlans.id), // Link to teacher's lesson plan
  
  // Enhanced data model features
  standardsCovered: jsonb("standards_covered").$type<string[]>().default([]), // Standards/CSP principles tracked
  studentCount: integer("student_count"), // Number of students present
  lessonTopics: text("lesson_topics"), // Additional content description beyond objective
  
  // Redesigned structured observations
  evidenceOfLearning: jsonb("evidence_of_learning"), // {checkedItems: string[], otherItem: string, clarification: string}
  behaviorRoutines: jsonb("behavior_routines"), // {routines: string[], complianceLevel: string, consistencyRating: number, notes: string}
  climate: climateEnum("climate"),
  climateContributors: jsonb("climate_contributors").$type<string[]>().default([]), // Conditional follow-up based on climate
  
  // Redesigned additional notes with preset tags
  additionalNotesTags: jsonb("additional_notes_tags").$type<string[]>().default([]),
  additionalNotesText: varchar("additional_notes_text", { length: 100 }),
  
  // New coaching and tracking features
  flagForCoaching: boolean("flag_for_coaching").default(false),
  observerDuration: integer("observer_duration"), // Duration in minutes that observer spent
  
  // Assessment & Ratings
  engagementLevel: engagementLevelEnum("engagement_level"),
  transitions: transitionsEnum("transitions"),
  transitionComments: text("transition_comments"),
  effectivenessRatings: jsonb("effectiveness_ratings"), // {clearInstructions: string, questioningTechniques: string, etc.}
  
  // Feedback
  strengths: text("strengths"),
  areasForGrowth: text("areas_for_growth"),
  additionalComments: text("additional_comments"),
  
  // Growth tracking features
  previousFeedbackAddressed: boolean("previous_feedback_addressed"), // Progress on prior observations
  growthNotes: text("growth_notes"), // Specific growth observations and improvements
  
  // Follow-up
  followUpNeeded: boolean("follow_up_needed").default(false),
  assignedReviewer: varchar("assigned_reviewer").references(() => users.id),
  followUpDate: timestamp("follow_up_date"),
  priority: priorityEnum("priority"),
  
  // Review Workflow
  reviewStatus: reviewStatusEnum("review_status").default("not-required"),
  reviewStartedAt: timestamp("review_started_at"),
  reviewCompletedAt: timestamp("review_completed_at"),
  reviewerFeedback: text("reviewer_feedback"),
  reviewerComments: text("reviewer_comments"),
  notificationSent: boolean("notification_sent").default(false),
  
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

export const locationsRelations = relations(locations, ({ many }) => ({
  walkthroughs: many(walkthroughs),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  walkthroughs: many(walkthroughs),
  lessonPlans: many(lessonPlans),
}));

export const lessonPlansRelations = relations(lessonPlans, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [lessonPlans.teacherId],
    references: [teachers.id],
  }),
  creator: one(users, {
    fields: [lessonPlans.createdBy],
    references: [users.id],
  }),
  walkthroughs: many(walkthroughs),
}));

export const walkthroughsRelations = relations(walkthroughs, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [walkthroughs.teacherId],
    references: [teachers.id],
  }),
  location: one(locations, {
    fields: [walkthroughs.locationId],
    references: [locations.id],
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
  lessonPlan: one(lessonPlans, {
    fields: [walkthroughs.lessonPlanId],
    references: [lessonPlans.id],
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

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).pick({
  firstName: true,
  lastName: true,
  email: true,
  gradeLevel: true,
  subjects: true,
});

export const insertLessonPlanSchema = createInsertSchema(lessonPlans).pick({
  teacherId: true,
  title: true,
  subject: true,
  gradeLevel: true,
  dateScheduled: true,
  duration: true,
  objective: true,
  topics: true,
  standardsCovered: true,
  materials: true,
  estimatedStudentCount: true,
  classroomNotes: true,
  activities: true,
  assessment: true,
  differentiation: true,
  attachmentUrls: true,
  status: true,
  isPublic: true,
  createdBy: true,
  weekOfYear: true,
  submittedAt: true,
  isLateSubmission: true,
  coachNotified: true,
}).extend({
  dateScheduled: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
  submittedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
});

export const insertWalkthroughSchema = createInsertSchema(walkthroughs).pick({
  teacherId: true,
  locationId: true,
  dateTime: true,
  subject: true,
  gradeLevel: true,
  lessonObjective: true,
  lessonPlanUrl: true,
  lessonPlanId: true,
  evidenceOfLearning: true,
  behaviorRoutines: true,
  climate: true,
  climateContributors: true,
  additionalNotesTags: true,
  additionalNotesText: true,
  flagForCoaching: true,
  observerDuration: true,
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
  reviewStatus: true,
  reviewerFeedback: true,
  reviewerComments: true,
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
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertLessonPlan = z.infer<typeof insertLessonPlanSchema>;
export type LessonPlan = typeof lessonPlans.$inferSelect;
export type InsertWalkthrough = z.infer<typeof insertWalkthroughSchema>;
export type Walkthrough = typeof walkthroughs.$inferSelect;
export type WalkthroughObserver = typeof walkthroughObservers.$inferSelect;
export type WalkthroughSession = typeof walkthroughSessions.$inferSelect;

// Extended types for API responses
export type LessonPlanWithDetails = LessonPlan & {
  teacher: Teacher;
  creator: User;
};

export type WalkthroughWithDetails = Walkthrough & {
  teacher: Teacher;
  location: Location;
  creator: User;
  reviewer?: User;
  lessonPlan?: LessonPlan;
  observers: (WalkthroughObserver & { observer: User })[];
};
