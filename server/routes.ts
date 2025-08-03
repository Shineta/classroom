import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService } from "./objectStorage";
import { aiService } from "./aiService";
import { emailService } from "./emailService";
import { insertTeacherSchema, insertLocationSchema, insertWalkthroughSchema, insertLessonPlanSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { extractLessonPlanData } from "./file-processor";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes are handled in setupAuth

  // Teacher routes
  app.get("/api/teachers", isAuthenticated, async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.post("/api/teachers", isAuthenticated, async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(teacherData);
      res.status(201).json(teacher);
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(400).json({ message: "Failed to create teacher" });
    }
  });

  app.get("/api/teachers/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const teachers = await storage.searchTeachers(query);
      res.json(teachers);
    } catch (error) {
      console.error("Error searching teachers:", error);
      res.status(500).json({ message: "Failed to search teachers" });
    }
  });

  // Location routes
  app.get("/api/locations", isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", isAuthenticated, async (req, res) => {
    try {
      const locationData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(400).json({ message: "Failed to create location" });
    }
  });

  // User search routes
  app.get("/api/users/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Review workflow routes
  app.get("/api/reviews/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const pendingReviews = await storage.getWalkthroughsNeedingReview(userId);
      res.json(pendingReviews);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      res.status(500).json({ message: "Failed to fetch pending reviews" });
    }
  });

  app.get("/api/reviews/in-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthroughs = await storage.getWalkthroughs({
        assignedReviewer: userId,
        reviewStatus: "in-progress"
      });
      res.json(walkthroughs);
    } catch (error) {
      console.error("Error fetching in-progress reviews:", error);
      res.status(500).json({ message: "Failed to fetch in-progress reviews" });
    }
  });

  app.get("/api/reviews/completed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthroughs = await storage.getWalkthroughs({
        assignedReviewer: userId,
        reviewStatus: "completed"
      });
      res.json(walkthroughs);
    } catch (error) {
      console.error("Error fetching completed reviews:", error);
      res.status(500).json({ message: "Failed to fetch completed reviews" });
    }
  });

  app.post("/api/reviews/:id/start", isAuthenticated, async (req: any, res) => {
    try {
      const walkthroughId = req.params.id;
      const userId = req.user.id;
      
      // Verify user is assigned to review this walkthrough
      const walkthrough = await storage.getWalkthrough(walkthroughId);
      if (!walkthrough || walkthrough.assignedReviewer !== userId) {
        return res.status(403).json({ message: "Not authorized to review this walkthrough" });
      }
      
      await storage.startReview(walkthroughId);
      res.status(200).json({ message: "Review started successfully" });
    } catch (error) {
      console.error("Error starting review:", error);
      res.status(500).json({ message: "Failed to start review" });
    }
  });

  app.post("/api/reviews/:walkthroughId/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthroughId = req.params.walkthroughId;
      
      // Verify user is assigned reviewer
      const walkthrough = await storage.getWalkthrough(walkthroughId);
      if (!walkthrough) {
        return res.status(404).json({ message: "Walkthrough not found" });
      }
      
      if (walkthrough.assignedReviewer !== userId) {
        return res.status(403).json({ message: "Not authorized to review this walkthrough" });
      }
      
      const updatedWalkthrough = await storage.startReview(walkthroughId, userId);
      res.json(updatedWalkthrough);
    } catch (error) {
      console.error("Error starting review:", error);
      res.status(500).json({ message: "Failed to start review" });
    }
  });

  app.post("/api/reviews/:walkthroughId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthroughId = req.params.walkthroughId;
      
      const reviewDataSchema = z.object({
        reviewerFeedback: z.string().optional(),
        reviewerComments: z.string().optional(),
      });
      
      const reviewData = reviewDataSchema.parse(req.body);
      
      // Verify user is assigned reviewer
      const walkthrough = await storage.getWalkthrough(walkthroughId);
      if (!walkthrough) {
        return res.status(404).json({ message: "Walkthrough not found" });
      }
      
      if (walkthrough.assignedReviewer !== userId) {
        return res.status(403).json({ message: "Not authorized to review this walkthrough" });
      }
      
      const updatedWalkthrough = await storage.completeReview(walkthroughId, reviewData);
      
      // Send completion notification to observer
      try {
        const reviewer = await storage.getUser(userId);
        const teacher = await storage.getTeacher(updatedWalkthrough.teacherId);
        const observer = await storage.getUser(updatedWalkthrough.createdBy);
        
        if (reviewer && teacher && observer) {
          const reportUrl = `${req.protocol}://${req.get('host')}/walkthrough/${updatedWalkthrough.id}/report`;
          
          await emailService.sendReviewCompletionNotification({
            walkthrough: updatedWalkthrough,
            teacher,
            reviewer,
            observer,
            reportUrl
          });
          
          console.log(`Review completion notification sent to ${observer.email}`);
        }
      } catch (emailError) {
        console.error("Error sending review completion email:", emailError);
        // Don't fail the completion if email fails
      }
      
      res.json(updatedWalkthrough);
    } catch (error) {
      console.error("Error completing review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete review" });
    }
  });

  // AI feedback generation
  app.post("/api/walkthroughs/:id/generate-feedback", isAuthenticated, async (req, res) => {
    try {
      const walkthroughId = req.params.id;
      const walkthrough = await storage.getWalkthrough(walkthroughId);
      
      if (!walkthrough) {
        return res.status(404).json({ message: "Walkthrough not found" });
      }

      // Prepare data for AI analysis
      const analysisData = {
        subject: walkthrough.subject,
        gradeLevel: walkthrough.gradeLevel || undefined,
        teacherName: `${walkthrough.teacher.firstName} ${walkthrough.teacher.lastName}`,
        lessonObjective: walkthrough.lessonObjective || undefined,
        evidenceOfLearning: walkthrough.evidenceOfLearning || undefined,
        behaviorRoutines: walkthrough.behaviorRoutines as any,
        climate: walkthrough.climate || undefined,
        climateNotes: walkthrough.climateNotes || undefined,
        engagementLevel: walkthrough.engagementLevel || undefined,
        transitions: walkthrough.transitions || undefined,
        transitionComments: walkthrough.transitionComments || undefined,
        effectivenessRatings: walkthrough.effectivenessRatings as any,
      };

      const feedback = await aiService.generateWalkthroughFeedback(analysisData);
      
      // Debug logging
      console.log("AI Feedback generated:", {
        strengths: typeof feedback.strengths,
        areasForGrowth: typeof feedback.areasForGrowth,
        additionalComments: typeof feedback.additionalComments
      });
      
      res.json(feedback);
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      res.status(500).json({ message: "Failed to generate AI feedback" });
    }
  });

  // Walkthrough routes
  app.get("/api/walkthroughs", isAuthenticated, async (req, res) => {
    try {
      const filters = {
        teacherId: req.query.teacherId as string,
        subject: req.query.subject as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        status: req.query.status as string,
        reviewStatus: req.query.reviewStatus as string,
        assignedReviewer: req.query.assignedReviewer as string,
        followUpNeeded: req.query.followUpNeeded === 'true' ? true : req.query.followUpNeeded === 'false' ? false : undefined,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const walkthroughs = await storage.getWalkthroughs(filters);
      res.json(walkthroughs);
    } catch (error) {
      console.error("Error fetching walkthroughs:", error);
      res.status(500).json({ message: "Failed to fetch walkthroughs" });
    }
  });

  app.get("/api/walkthroughs/:id", isAuthenticated, async (req, res) => {
    try {
      const walkthrough = await storage.getWalkthrough(req.params.id);
      if (!walkthrough) {
        return res.status(404).json({ message: "Walkthrough not found" });
      }
      res.json(walkthrough);
    } catch (error) {
      console.error("Error fetching walkthrough:", error);
      res.status(500).json({ message: "Failed to fetch walkthrough" });
    }
  });

  app.post("/api/walkthroughs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthroughData = insertWalkthroughSchema.parse({
        ...req.body,
        createdBy: userId,
        startTime: new Date(),
      });
      
      const walkthrough = await storage.createWalkthrough(walkthroughData);
      
      // Add observers if provided
      if (req.body.observerIds && Array.isArray(req.body.observerIds)) {
        for (const observerId of req.body.observerIds) {
          await storage.addObserver(walkthrough.id, observerId);
        }
      }

      res.status(201).json(walkthrough);
    } catch (error) {
      console.error("Error creating walkthrough:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create walkthrough" });
    }
  });

  app.put("/api/walkthroughs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthrough = await storage.getWalkthrough(req.params.id);
      
      if (!walkthrough) {
        return res.status(404).json({ message: "Walkthrough not found" });
      }

      // Check if user is creator, assigned observer, admin, or has observer/coach role
      const isCreator = walkthrough.createdBy === userId;
      const isAssignedObserver = walkthrough.observers.some(obs => obs.observerId === userId);
      const isAdmin = req.user.role === 'admin';
      const isObserverRole = req.user.role === 'observer';
      const isCoach = req.user.role === 'coach';
      
      if (!isCreator && !isAssignedObserver && !isAdmin && !isObserverRole && !isCoach) {
        return res.status(403).json({ message: "Not authorized to edit this walkthrough" });
      }

      const updateData = insertWalkthroughSchema.partial().parse(req.body);
      
      // If status is being changed to completed, set end time
      if (updateData.status === "completed" && walkthrough.status !== "completed") {
        updateData.endTime = new Date();
        if (walkthrough.startTime) {
          updateData.duration = Math.round((new Date().getTime() - walkthrough.startTime.getTime()) / (1000 * 60));
        }
      }

      // Handle review workflow changes
      const wasAssignedReviewer = walkthrough.assignedReviewer;
      const wasFollowUpNeeded = walkthrough.followUpNeeded;
      const newAssignedReviewer = updateData.assignedReviewer;
      const newFollowUpNeeded = updateData.followUpNeeded;

      // Set review status when follow-up and reviewer are assigned
      if (newFollowUpNeeded && newAssignedReviewer && (!wasFollowUpNeeded || !wasAssignedReviewer)) {
        updateData.reviewStatus = "pending";
        updateData.notificationSent = false;
      }
      // Clear review status if follow-up is turned off or reviewer is removed
      else if (!newFollowUpNeeded || !newAssignedReviewer) {
        updateData.reviewStatus = "not-required";
        updateData.notificationSent = false;
      }

      const updatedWalkthrough = await storage.updateWalkthrough(req.params.id, updateData);

      // Send email notification if reviewer was just assigned
      if (newFollowUpNeeded && newAssignedReviewer && 
          (!wasFollowUpNeeded || wasAssignedReviewer !== newAssignedReviewer) && 
          !updatedWalkthrough.notificationSent) {
        
        try {
          const reviewer = await storage.getUser(newAssignedReviewer);
          const teacher = await storage.getTeacher(updatedWalkthrough.teacherId);
          const observer = await storage.getUser(updatedWalkthrough.createdBy);
          
          if (reviewer && teacher && observer) {
            const reportUrl = `${req.protocol}://${req.get('host')}/walkthrough/${updatedWalkthrough.id}/report`;
            
            const emailSent = await emailService.sendReviewAssignmentNotification({
              walkthrough: updatedWalkthrough,
              teacher,
              reviewer,
              observer,
              reportUrl
            });
            
            if (emailSent) {
              await storage.updateWalkthrough(req.params.id, { notificationSent: true });
              console.log(`Review assignment notification sent to ${reviewer.email}`);
            }
          }
        } catch (emailError) {
          console.error("Error sending review assignment email:", emailError);
          // Don't fail the update if email fails
        }
      }
      
      // Handle observer updates if provided
      if (req.body.observerIds && Array.isArray(req.body.observerIds)) {
        // Get current observers
        const currentObservers = await storage.getObservers(req.params.id);
        const currentObserverIds = currentObservers.map(obs => obs.observerId);
        const newObserverIds = req.body.observerIds;

        // Add new observers
        for (const observerId of newObserverIds) {
          if (!currentObserverIds.includes(observerId)) {
            await storage.addObserver(req.params.id, observerId);
          }
        }

        // Remove observers not in new list
        for (const observerId of currentObserverIds) {
          if (!newObserverIds.includes(observerId)) {
            await storage.removeObserver(req.params.id, observerId);
          }
        }
      }

      res.json(updatedWalkthrough);
    } catch (error) {
      console.error("Error updating walkthrough:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update walkthrough" });
    }
  });

  app.delete("/api/walkthroughs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const walkthrough = await storage.getWalkthrough(req.params.id);
      
      if (!walkthrough) {
        return res.status(404).json({ message: "Walkthrough not found" });
      }

      // Only creator can delete
      if (walkthrough.createdBy !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this walkthrough" });
      }

      await storage.deleteWalkthrough(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting walkthrough:", error);
      res.status(500).json({ message: "Failed to delete walkthrough" });
    }
  });

  // Collaboration routes
  app.get("/api/walkthroughs/:id/sessions", isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions(req.params.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Statistics route
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getWalkthroughStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Analytics routes for Coach Insights
  app.get("/api/analytics/observer-activity", isAuthenticated, async (req, res) => {
    try {
      const observerActivity = await storage.getObserverActivity();
      res.json(observerActivity);
    } catch (error) {
      console.error("Error fetching observer activity:", error);
      res.status(500).json({ message: "Failed to fetch observer activity" });
    }
  });

  app.get("/api/analytics/engagement-trends", isAuthenticated, async (req, res) => {
    try {
      const trends = await storage.getEngagementTrends();
      res.json(trends);
    } catch (error) {
      console.error("Error fetching engagement trends:", error);
      res.status(500).json({ message: "Failed to fetch engagement trends" });
    }
  });

  app.get("/api/analytics/subject-distribution", isAuthenticated, async (req, res) => {
    try {
      const subjectData = await storage.getSubjectDistribution();
      res.json(subjectData);
    } catch (error) {
      console.error("Error fetching subject distribution:", error);
      res.status(500).json({ message: "Failed to fetch subject distribution" });
    }
  });

  app.get("/api/analytics/strengths-growth", isAuthenticated, async (req, res) => {
    try {
      const strengthsGrowthData = await storage.getStrengthsGrowthData();
      res.json(strengthsGrowthData);
    } catch (error) {
      console.error("Error fetching strengths and growth data:", error);
      res.status(500).json({ message: "Failed to fetch strengths and growth data" });
    }
  });

  app.get("/api/analytics/overview", isAuthenticated, async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  // Leadership Analytics Routes
  app.get("/api/leadership/overview", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user has leadership or admin role
      if (req.user.role !== 'leadership' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { location, dateRange } = req.query;
      const overview = await storage.getLeadershipOverview(location, dateRange);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching leadership overview:", error);
      res.status(500).json({ message: "Failed to fetch leadership overview" });
    }
  });

  app.get("/api/leadership/locations", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'leadership' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { dateRange } = req.query;
      const locationStats = await storage.getLocationStats(dateRange);
      res.json(locationStats);
    } catch (error) {
      console.error("Error fetching location stats:", error);
      res.status(500).json({ message: "Failed to fetch location stats" });
    }
  });

  app.get("/api/leadership/subjects", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'leadership' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { location, dateRange } = req.query;
      const subjectData = await storage.getLeadershipSubjectDistribution(location, dateRange);
      res.json(subjectData);
    } catch (error) {
      console.error("Error fetching leadership subject distribution:", error);
      res.status(500).json({ message: "Failed to fetch subject distribution" });
    }
  });

  app.get("/api/leadership/standards", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'leadership' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { location, dateRange } = req.query;
      const standardsData = await storage.getStandardsTracking(location, dateRange);
      res.json(standardsData);
    } catch (error) {
      console.error("Error fetching standards tracking:", error);
      res.status(500).json({ message: "Failed to fetch standards tracking" });
    }
  });

  app.get("/api/leadership/teachers", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'leadership' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { location, dateRange } = req.query;
      const teacherData = await storage.getTeacherPerformance(location, dateRange);
      res.json(teacherData);
    } catch (error) {
      console.error("Error fetching teacher performance:", error);
      res.status(500).json({ message: "Failed to fetch teacher performance" });
    }
  });

  app.get("/api/leadership/engagement-trends", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'leadership' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { location, dateRange } = req.query;
      const trendsData = await storage.getLeadershipEngagementTrends(location, dateRange);
      res.json(trendsData);
    } catch (error) {
      console.error("Error fetching engagement trends:", error);
      res.status(500).json({ message: "Failed to fetch engagement trends" });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = {
        totalUsers: (await storage.getAllUsers()).length,
        totalTeachers: (await storage.getTeachers()).length,
        totalLocations: (await storage.getLocations()).length,
        systemHealth: "good",
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // File upload routes
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/lesson-plans", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.body.lessonPlanURL) {
        return res.status(400).json({ error: "lessonPlanURL is required" });
      }

      const userId = req.user.id;
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.lessonPlanURL,
        {
          owner: userId,
          visibility: "private", // Lesson plans should be private
        }
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting lesson plan:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: "read" as any,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.sendStatus(404);
    }
  });

  // AI/Automation Routes
  app.post("/api/ai/suggest-standards", isAuthenticated, async (req, res) => {
    try {
      const { lessonObjective, subject } = req.body;
      
      if (!lessonObjective || !subject) {
        return res.status(400).json({ message: "Lesson objective and subject are required" });
      }

      const { suggestStandards } = await import('./ai-services');
      const suggestions = await suggestStandards(lessonObjective, subject);
      res.json(suggestions);
    } catch (error) {
      console.error("Error suggesting standards:", error);
      res.status(500).json({ message: "Failed to suggest standards" });
    }
  });

  app.post("/api/ai/generate-feedback", isAuthenticated, async (req, res) => {
    try {
      const observationData = req.body;
      
      const { generateFeedbackSuggestions } = await import('./ai-services');
      const feedback = await generateFeedbackSuggestions(observationData);
      res.json(feedback);
    } catch (error) {
      console.error("Error generating feedback:", error);
      res.status(500).json({ message: "Failed to generate feedback" });
    }
  });

  app.get("/api/ai/analyze-patterns", isAuthenticated, async (req: any, res) => {
    try {
      if (!['coach', 'leadership', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const walkthroughs = await storage.getWalkthroughs();
      const { analyzeWalkthroughPatterns } = await import('./ai-services');
      
      const walkthroughData = walkthroughs.map(w => ({
        id: w.id,
        teacherId: w.teacherId,
        subject: w.subject,
        strengths: w.strengths || '',
        areasForGrowth: w.areasForGrowth || '',
        engagementLevel: w.engagementLevel || '3',
        dateTime: w.dateTime.toISOString(),
      }));

      const patterns = await analyzeWalkthroughPatterns(walkthroughData);
      res.json(patterns);
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      res.status(500).json({ message: "Failed to analyze patterns" });
    }
  });

  app.post("/api/ai/generate-report", isAuthenticated, async (req: any, res) => {
    try {
      if (!['leadership', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { timeframe } = req.body;
      const stats = await storage.getStats();
      const walkthroughs = await storage.getWalkthroughs();
      
      const { analyzeWalkthroughPatterns, generateAutomatedReport } = await import('./ai-services');
      
      const walkthroughData = walkthroughs.map(w => ({
        id: w.id,
        teacherId: w.teacherId,
        subject: w.subject,
        strengths: w.strengths || '',
        areasForGrowth: w.areasForGrowth || '',
        engagementLevel: w.engagementLevel || '3',
        dateTime: w.dateTime.toISOString(),
      }));

      const patterns = await analyzeWalkthroughPatterns(walkthroughData);
      
      const reportStats = {
        totalWalkthroughs: stats.total,
        pendingReviews: walkthroughs.filter(w => w.reviewStatus === 'pending').length,
        averageEngagement: stats.averageRating || 3,
        topSubjects: Object.entries(
          walkthroughs.reduce((acc, w) => {
            acc[w.subject] = (acc[w.subject] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([subject, count]) => ({ subject, count })).slice(0, 5),
        teachersObserved: stats.teachersObserved,
      };

      const report = await generateAutomatedReport(timeframe || 'this month', reportStats, patterns);
      res.json({ report, patterns, stats: reportStats });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Lesson Plan routes
  app.get("/api/lesson-plans", isAuthenticated, async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.teacherId) filters.teacherId = req.query.teacherId;
      if (req.query.subject) filters.subject = req.query.subject;
      if (req.query.status) filters.status = req.query.status;
      
      const lessonPlans = await storage.getLessonPlans(filters);
      res.json(lessonPlans);
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      res.status(500).json({ message: "Failed to fetch lesson plans" });
    }
  });

  app.get("/api/lesson-plans/my-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lessonPlans = await storage.getLessonPlans({ createdBy: userId });
      res.json(lessonPlans);
    } catch (error) {
      console.error("Error fetching user lesson plans:", error);
      res.status(500).json({ message: "Failed to fetch lesson plans" });
    }
  });

  app.get("/api/lesson-plans/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getLessonPlanStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching lesson plan stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/lesson-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const lessonPlan = await storage.getLessonPlan(req.params.id);
      if (!lessonPlan) {
        return res.status(404).json({ message: "Lesson plan not found" });
      }
      res.json(lessonPlan);
    } catch (error) {
      console.error("Error fetching lesson plan:", error);
      res.status(500).json({ message: "Failed to fetch lesson plan" });
    }
  });

  app.post("/api/lesson-plans", isAuthenticated, async (req: any, res) => {
    try {
      const lessonPlanData = insertLessonPlanSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      const lessonPlan = await storage.createLessonPlan(lessonPlanData);
      res.status(201).json(lessonPlan);
    } catch (error) {
      console.error("Error creating lesson plan:", error);
      res.status(400).json({ message: "Failed to create lesson plan" });
    }
  });

  app.patch("/api/lesson-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const lessonPlanData = insertLessonPlanSchema.partial().parse(req.body);
      const lessonPlan = await storage.updateLessonPlan(req.params.id, lessonPlanData);
      res.json(lessonPlan);
    } catch (error) {
      console.error("Error updating lesson plan:", error);
      res.status(400).json({ message: "Failed to update lesson plan" });
    }
  });

  app.delete("/api/lesson-plans/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteLessonPlan(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      res.status(500).json({ message: "Failed to delete lesson plan" });
    }
  });

  // File upload and data extraction endpoint
  app.post("/api/lesson-plans/extract-from-file", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("Processing file:", req.file.originalname, "Type:", req.file.mimetype);
      const extractedData = await extractLessonPlanData(req.file);
      console.log("Extracted data:", JSON.stringify(extractedData, null, 2));
      res.json(extractedData);
    } catch (error) {
      console.error("Error extracting lesson plan data:", error);
      res.status(500).json({ message: "Failed to extract data from file" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join-walkthrough') {
          const { walkthroughId, userId } = data;
          
          // Only update session for existing walkthroughs
          if (walkthroughId && walkthroughId !== "new") {
            try {
              await storage.updateSession(walkthroughId, userId);
            } catch (error) {
              console.error("Session update error:", error);
            }
          }
          
          // Broadcast to all clients in this walkthrough (only for existing walkthroughs)
          const sessions = walkthroughId && walkthroughId !== "new" 
            ? await storage.getActiveSessions(walkthroughId) 
            : [];
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'active-sessions',
                walkthroughId,
                sessions: sessions.map(s => ({ user: s.user, lastSeen: s.lastSeen }))
              }));
            }
          });
        }
        
        if (data.type === 'walkthrough-update') {
          const { walkthroughId, fieldName, fieldValue, userId } = data;
          
          // Only update session for existing walkthroughs
          if (walkthroughId && walkthroughId !== "new") {
            try {
              await storage.updateSession(walkthroughId, userId);
            } catch (error) {
              console.error("Session update error:", error);
            }
          }
          
          // Broadcast field update to other clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'field-update',
                walkthroughId,
                fieldName,
                fieldValue,
                updatedBy: userId
              }));
            }
          });
        }
        
        if (data.type === 'leave-walkthrough') {
          const { walkthroughId, userId } = data;
          if (walkthroughId && walkthroughId !== "new") {
            try {
              await storage.deactivateSession(walkthroughId, userId);
            } catch (error) {
              console.error("Session deactivation error:", error);
            }
          }
          
          const sessions = walkthroughId && walkthroughId !== "new" 
            ? await storage.getActiveSessions(walkthroughId) 
            : [];
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'active-sessions',
                walkthroughId,
                sessions: sessions.map(s => ({ user: s.user, lastSeen: s.lastSeen }))
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
