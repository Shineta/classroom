import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { ObjectStorageService } from "./objectStorage";
import { aiService } from "./aiService";
import { insertTeacherSchema, insertLocationSchema, insertWalkthroughSchema } from "@shared/schema";
import { z } from "zod";

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

      const updatedWalkthrough = await storage.updateWalkthrough(req.params.id, updateData);
      
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
          
          // Update session in database
          await storage.updateSession(walkthroughId, userId);
          
          // Broadcast to all clients in this walkthrough
          const sessions = await storage.getActiveSessions(walkthroughId);
          
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
          
          // Update session activity
          await storage.updateSession(walkthroughId, userId);
          
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
          await storage.deactivateSession(walkthroughId, userId);
          
          const sessions = await storage.getActiveSessions(walkthroughId);
          
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
