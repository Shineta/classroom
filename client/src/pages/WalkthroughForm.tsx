import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Check, Clock, Users, Sparkles, BookOpen } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import StarRating from "@/components/StarRating";
import StandardsSelector from "@/components/StandardsSelector";
import AIFeedbackSuggestions from "@/components/AIFeedbackSuggestions";
import type { Teacher, Location, User, WalkthroughWithDetails, LessonPlanWithDetails } from "@shared/schema";

const formSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  locationId: z.string().min(1, "Location is required"),
  dateTime: z.string().min(1, "Date and time is required"),
  subject: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().optional(),
  lessonObjective: z.string().optional(),
  lessonPlanUrl: z.string().optional(),
  
  // Enhanced data model fields
  standardsCovered: z.array(z.string()).optional(),
  studentCount: z.number().min(0).optional(),
  lessonTopics: z.string().optional(),
  
  // Redesigned Evidence of Student Learning - Multi-select checklist
  evidenceOfLearning: z.object({
    checkedItems: z.array(z.string()).optional(),
    otherItem: z.string().optional(),
    clarification: z.string().max(100).optional(),
  }).optional(),
  
  // Redesigned Behavior & Routines with compliance and rating
  behaviorRoutines: z.object({
    routines: z.array(z.string()),
    complianceLevel: z.enum(["all", "most", "some", "none"]).optional(),
    consistencyRating: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
  }).optional(),
  
  // Enhanced Climate with conditional follow-up
  climate: z.enum(["warm", "neutral", "tense"]).optional(),
  climateContributors: z.array(z.string()).optional(),
  
  // Redesigned Additional Notes with preset tags
  additionalNotesTags: z.array(z.string()).optional(),
  additionalNotesText: z.string().max(100).optional(),
  
  // New coaching and tracking features
  flagForCoaching: z.boolean().optional(),
  observerDuration: z.number().optional(),
  engagementLevel: z.enum(["1", "2", "3", "4", "5"]).optional(),
  transitions: z.enum(["smooth", "needs-improvement"]).optional(),
  transitionComments: z.string().optional(),
  effectivenessRatings: z.object({
    clearInstructions: z.enum(["excellent", "good", "needs-improvement", "poor"]).optional(),
    questioningTechniques: z.enum(["excellent", "good", "needs-improvement", "poor"]).optional(),
    useOfMaterials: z.enum(["excellent", "good", "needs-improvement", "poor"]).optional(),
    studentInteraction: z.enum(["excellent", "good", "needs-improvement", "poor"]).optional(),
    differentiation: z.enum(["excellent", "good", "needs-improvement", "poor"]).optional(),
    timeManagement: z.enum(["excellent", "good", "needs-improvement", "poor"]).optional(),
  }).optional(),
  strengths: z.string().optional(),
  areasForGrowth: z.string().optional(),
  additionalComments: z.string().optional(),
  
  // Growth tracking fields
  previousFeedbackAddressed: z.boolean().optional(),
  growthNotes: z.string().optional(),
  
  followUpNeeded: z.boolean().optional(),
  assignedReviewer: z.string().optional(),
  followUpDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  observerIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function WalkthroughForm() {
  const [, params] = useRoute("/walkthrough/:id");
  const [, editParams] = useRoute("/walkthrough/:id/edit");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("basic-info");
  const [selectedObservers, setSelectedObservers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startTime] = useState(new Date());
  const [evidenceLearningOther, setEvidenceLearningOther] = useState("");
  const [showEvidenceOther, setShowEvidenceOther] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [additionalNotesOther, setAdditionalNotesOther] = useState("");
  const [showNotesOther, setShowNotesOther] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lessonPlanMode, setLessonPlanMode] = useState<"upload" | "select">("upload");
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlanWithDetails | null>(null);

  const walkthroughId = params?.id || editParams?.id;
  const isEditing = walkthroughId && walkthroughId !== "new";
  
  console.log("WalkthroughForm Debug:", {
    params,
    editParams,
    walkthroughId,
    isEditing,
    currentPath: window.location.pathname
  });

  // WebSocket for real-time collaboration
  const { sendMessage, lastMessage, activeSessions } = useWebSocket(walkthroughId);

  // Queries
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
    enabled: isAuthenticated,
  });

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    enabled: isAuthenticated,
  });

  const { data: walkthrough, isLoading: walkthroughLoading } = useQuery<WalkthroughWithDetails>({
    queryKey: ["/api/walkthroughs", walkthroughId],
    enabled: isAuthenticated && !!isEditing && walkthroughId !== "new",
  });

  const { data: userSearchResults } = useQuery<User[]>({
    queryKey: ["/api/users/search", { q: searchQuery }],
    enabled: isAuthenticated && searchQuery.length > 2,
  });

  // Fetch public lesson plans for observers to select from
  const { data: publicLessonPlans, isLoading: lessonPlansLoading } = useQuery<LessonPlanWithDetails[]>({
    queryKey: ["/api/lesson-plans/public"],
    enabled: isAuthenticated && lessonPlanMode === "select",
  });

  // AI feedback generation mutation
  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!walkthroughId || walkthroughId === "new") {
        throw new Error("Please save the walkthrough as a draft first to generate AI feedback");
      }
      const response = await apiRequest("POST", `/api/walkthroughs/${walkthroughId}/generate-feedback`);
      return await response.json();
    },
    onSuccess: (feedback) => {
      console.log("AI Feedback received:", feedback);
      
      // Ensure we have string values
      const strengths = typeof feedback.strengths === 'string' ? feedback.strengths : String(feedback.strengths || '');
      const areasForGrowth = typeof feedback.areasForGrowth === 'string' ? feedback.areasForGrowth : String(feedback.areasForGrowth || '');
      const additionalComments = typeof feedback.additionalComments === 'string' ? feedback.additionalComments : String(feedback.additionalComments || '');
      
      // Update form fields with AI-generated content
      form.setValue("strengths", strengths);
      form.setValue("areasForGrowth", areasForGrowth);
      form.setValue("additionalComments", additionalComments);
      
      // Trigger auto-save for each field
      handleFieldChange("strengths", strengths);
      handleFieldChange("areasForGrowth", areasForGrowth);
      handleFieldChange("additionalComments", additionalComments);
      
      toast({
        title: "AI Feedback Generated",
        description: "Review and edit the AI-generated suggestions as needed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Generate AI Feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      standardsCovered: [],
      studentCount: undefined,
      lessonTopics: "",
      behaviorRoutines: { routines: [], notes: "" },
      effectivenessRatings: {},
      previousFeedbackAddressed: false,
      growthNotes: "",
      observerIds: [],
    },
  });

  // Load walkthrough data into form
  useEffect(() => {
    if (walkthrough) {
      const observers = walkthrough.observers?.map((obs) => obs.observer) || [];
      setSelectedObservers(observers);
      
      form.reset({
        teacherId: walkthrough.teacherId,
        locationId: walkthrough.locationId || "",
        dateTime: new Date(walkthrough.dateTime).toISOString().slice(0, 16),
        subject: walkthrough.subject,
        gradeLevel: walkthrough.gradeLevel || "",
        lessonObjective: walkthrough.lessonObjective || "",
        lessonPlanUrl: walkthrough.lessonPlanUrl || "",
        
        // Enhanced data model fields
        standardsCovered: (walkthrough as any).standardsCovered || [],
        studentCount: (walkthrough as any).studentCount || undefined,
        lessonTopics: (walkthrough as any).lessonTopics || "",
        
        evidenceOfLearning: walkthrough.evidenceOfLearning || "",
        behaviorRoutines: walkthrough.behaviorRoutines as any || { routines: [], notes: "" },
        climate: walkthrough.climate || undefined,
        climateNotes: walkthrough.climateNotes || "",
        engagementLevel: walkthrough.engagementLevel || undefined,
        transitions: walkthrough.transitions || undefined,
        transitionComments: walkthrough.transitionComments || "",
        effectivenessRatings: walkthrough.effectivenessRatings as any || {},
        strengths: walkthrough.strengths || "",
        areasForGrowth: walkthrough.areasForGrowth || "",
        additionalComments: walkthrough.additionalComments || "",
        
        // Growth tracking fields
        previousFeedbackAddressed: (walkthrough as any).previousFeedbackAddressed || false,
        growthNotes: (walkthrough as any).growthNotes || "",
        
        followUpNeeded: walkthrough.followUpNeeded || false,
        assignedReviewer: walkthrough.assignedReviewer || "",
        followUpDate: walkthrough.followUpDate ? new Date(walkthrough.followUpDate).toISOString().slice(0, 10) : "",
        priority: walkthrough.priority || undefined,
        observerIds: observers.map((obs) => obs.id),
      });
    }
  }, [walkthrough, form]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/walkthroughs", {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Walkthrough created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs"] });
      setLocation(`/walkthrough/${data.id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create walkthrough",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { isCompletion?: boolean }) => {
      console.log("Update mutation - Debug:", {
        walkthroughId,
        isEditing,
        data,
        url: `/api/walkthroughs/${walkthroughId}`
      });
      
      if (!walkthroughId) {
        throw new Error("No walkthrough ID available for update");
      }
      
      const { isCompletion, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/walkthroughs/${walkthroughId}`, {
        ...updateData,
        dateTime: new Date(updateData.dateTime).toISOString(),
        followUpDate: updateData.followUpDate ? new Date(updateData.followUpDate).toISOString() : undefined,
      });
      return { ...await response.json(), isCompletion };
    },
    onSuccess: (data) => {
      if (data.isCompletion) {
        toast({ title: "Walkthrough completed successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs", walkthroughId] });
        // Navigate to dashboard after completion
        setLocation("/");
      } else {
        // Only show toast for manual saves, not auto-saves
        if (!isAutoSaving) {
          toast({ title: "Walkthrough updated successfully" });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs", walkthroughId] });
      }
    },
    onError: (error) => {
      console.error("Error updating walkthrough:", {
        error,
        walkthroughId,
        isEditing,
        errorMessage: (error as Error).message
      });
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to update walkthrough: ${(error as Error).message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle real-time field updates
  useEffect(() => {
    if (lastMessage?.type === 'field-update' && lastMessage.walkthroughId === walkthroughId) {
      const { fieldName, fieldValue } = lastMessage;
      form.setValue(fieldName as any, fieldValue);
      
      toast({
        title: "Field updated",
        description: `${fieldName} was updated by another observer`,
      });
    }
  }, [lastMessage, form, walkthroughId, toast]);

  // Handle form field changes for real-time collaboration
  const handleFieldChange = (fieldName: string, value: any) => {
    if (walkthroughId && user) {
      sendMessage({
        type: 'walkthrough-update',
        walkthroughId,
        fieldName,
        fieldValue: value,
        userId: (user as any)?.id || 'unknown',
      });
    }
  };

  // Form submission with duration tracking
  const onSubmit = (data: FormData) => {
    const observerDuration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60); // Duration in minutes
    
    const formData = {
      ...data,
      observerIds: selectedObservers.map(obs => obs.id),
      observerDuration,
    };

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    const observerDuration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60);
    onSubmit({ ...data, status: "draft", observerDuration } as any);
  };

  const handleComplete = () => {
    const data = form.getValues();
    const observerDuration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60);
    
    if (isEditing) {
      updateMutation.mutate({ ...data, status: "completed", observerDuration, isCompletion: true } as any);
    } else {
      createMutation.mutate({ ...data, status: "completed", observerDuration } as any);
    }
  };

  // Handle lesson plan upload
  const handleLessonPlanUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await response.json();
      return { method: "PUT" as const, url: uploadURL };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: any) => {
    const uploadURL = result.successful[0]?.uploadURL;
    if (uploadURL) {
      try {
        const response = await apiRequest("PUT", "/api/lesson-plans", { lessonPlanURL: uploadURL });
        const { objectPath } = await response.json();
        form.setValue("lessonPlanUrl", objectPath);
        toast({ title: "Lesson plan uploaded successfully" });
        
        // Auto-save the form with the new file URL but don't show toast
        if (isEditing) {
          setIsAutoSaving(true);
          const data = form.getValues();
          updateMutation.mutate({ ...data, lessonPlanUrl: objectPath } as any);
          setIsAutoSaving(false);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle lesson plan selection from teacher-created plans
  const handleLessonPlanSelect = (lessonPlan: LessonPlanWithDetails) => {
    setSelectedLessonPlan(lessonPlan);
    
    // Auto-populate form fields with lesson plan data
    if (lessonPlan.subject) {
      form.setValue("subject", lessonPlan.subject);
      handleFieldChange("subject", lessonPlan.subject);
    }
    if (lessonPlan.gradeLevel) {
      form.setValue("gradeLevel", lessonPlan.gradeLevel);
      handleFieldChange("gradeLevel", lessonPlan.gradeLevel);
    }
    if (lessonPlan.objective) {
      form.setValue("lessonObjective", lessonPlan.objective);
      handleFieldChange("lessonObjective", lessonPlan.objective);
    }
    if (lessonPlan.topics) {
      form.setValue("lessonTopics", lessonPlan.topics);
      handleFieldChange("lessonTopics", lessonPlan.topics);
    }
    if (lessonPlan.standardsCovered && lessonPlan.standardsCovered.length > 0) {
      form.setValue("standardsCovered", lessonPlan.standardsCovered);
      handleFieldChange("standardsCovered", lessonPlan.standardsCovered);
    }
    if (lessonPlan.estimatedStudentCount) {
      form.setValue("studentCount", lessonPlan.estimatedStudentCount);
      handleFieldChange("studentCount", lessonPlan.estimatedStudentCount);
    }
    
    // Set lesson plan URL reference
    form.setValue("lessonPlanUrl", `/lesson-plan/${lessonPlan.id}`);
    handleFieldChange("lessonPlanUrl", `/lesson-plan/${lessonPlan.id}`);
    
    toast({
      title: "Lesson Plan Selected",
      description: `"${lessonPlan.title}" has been selected and form fields populated.`,
    });
  };

  // Tab configuration
  const tabs = [
    { id: "basic-info", label: "Basic Information" },
    { id: "observations", label: "Observations" },
    { id: "assessment", label: "Assessment & Ratings" },
    { id: "feedback", label: "Feedback & Follow-up" },
  ];

  if (walkthroughLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading walkthrough...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Walkthrough" : "New Classroom Walkthrough"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time collaboration indicator */}
              {activeSessions.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="flex -space-x-2">
                    {activeSessions.slice(0, 3).map((session, index) => (
                      <div
                        key={session.user.id}
                        className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-xs text-white"
                        title={`${session.user.firstName} ${session.user.lastName}`}
                      >
                        {session.user.firstName?.[0]}{session.user.lastName?.[0]}
                      </div>
                    ))}
                    {activeSessions.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center text-xs text-white">
                        +{activeSessions.length - 3}
                      </div>
                    )}
                  </div>
                  <span>{activeSessions.length} observer{activeSessions.length !== 1 ? 's' : ''} editing</span>
                </div>
              )}
              <span className="text-sm text-green-600">
                <Save className="w-4 h-4 inline mr-1" />
                Auto-saved
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                    currentTab === tab.id
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information Tab */}
                {currentTab === "basic-info" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teacher Name *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleFieldChange("teacherId", value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a teacher..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teachers?.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleFieldChange("locationId", value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a location..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations?.map((location) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date & Time *</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange("dateTime", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject/Class Period *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 3rd Period Mathematics"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange("subject", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Level</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleFieldChange("gradeLevel", value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade level..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kindergarten">Kindergarten</SelectItem>
                              <SelectItem value="grade-1">Grade 1</SelectItem>
                              <SelectItem value="grade-2">Grade 2</SelectItem>
                              <SelectItem value="grade-3">Grade 3</SelectItem>
                              <SelectItem value="grade-4">Grade 4</SelectItem>
                              <SelectItem value="grade-5">Grade 5</SelectItem>
                              <SelectItem value="grade-6">Grade 6</SelectItem>
                              <SelectItem value="grade-7">Grade 7</SelectItem>
                              <SelectItem value="grade-8">Grade 8</SelectItem>
                              <SelectItem value="grade-9">Grade 9</SelectItem>
                              <SelectItem value="grade-10">Grade 10</SelectItem>
                              <SelectItem value="grade-11">Grade 11</SelectItem>
                              <SelectItem value="grade-12">Grade 12</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormLabel>Observer(s) *</FormLabel>
                      <div className="space-y-3">
                        <Input
                          placeholder="Type to search and add observers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {userSearchResults && userSearchResults.length > 0 && (
                          <div className="border rounded-lg p-2 max-h-32 overflow-y-auto">
                            {userSearchResults.map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => {
                                  if (!selectedObservers.find(obs => obs.id === user.id)) {
                                    const newObservers = [...selectedObservers, user];
                                    setSelectedObservers(newObservers);
                                    form.setValue("observerIds", newObservers.map(obs => obs.id));
                                  }
                                  setSearchQuery("");
                                }}
                                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                              >
                                {user.firstName} {user.lastName}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {selectedObservers.map((observer) => (
                            <span
                              key={observer.id}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                            >
                              {observer.firstName} {observer.lastName}
                              <button
                                type="button"
                                onClick={() => {
                                  const newObservers = selectedObservers.filter(obs => obs.id !== observer.id);
                                  setSelectedObservers(newObservers);
                                  form.setValue("observerIds", newObservers.map(obs => obs.id));
                                }}
                                className="ml-2 text-primary-600 hover:text-primary-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="studentCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Students</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              placeholder="e.g., 25"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : undefined;
                                field.onChange(value);
                                handleFieldChange("studentCount", value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="lessonObjective"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson Objective/Focus</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter the lesson objective or focus area being observed..."
                                rows={3}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange("lessonObjective", e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="lessonTopics"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson Topics/Content Areas</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the specific topics, concepts, or content areas covered in this lesson..."
                                rows={2}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleFieldChange("lessonTopics", e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <StandardsSelector
                        value={form.watch("standardsCovered") || []}
                        onChange={(standards: string[]) => {
                          form.setValue("standardsCovered", standards);
                          handleFieldChange("standardsCovered", standards);
                        }}
                        subject={form.watch("subject")}
                        lessonObjective={form.watch("lessonObjective")}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormLabel>Lesson Plan Access</FormLabel>
                      
                      {/* Mode selector */}
                      <div className="mb-4">
                        <div className="flex rounded-lg bg-gray-100 p-1">
                          <button
                            type="button"
                            onClick={() => setLessonPlanMode("upload")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                              lessonPlanMode === "upload"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            Upload or Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setLessonPlanMode("select")}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                              lessonPlanMode === "select"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            Select Teacher Plan
                          </button>
                        </div>
                      </div>

                      {lessonPlanMode === "upload" ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760}
                            onGetUploadParameters={handleLessonPlanUpload}
                            onComplete={handleUploadComplete}
                          >
                            <div className="flex flex-col items-center">
                              <div className="text-4xl text-gray-400 mb-4">📎</div>
                              <p className="text-sm text-gray-600 mb-2">Upload lesson plan or paste link</p>
                              <span className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                                Choose File or Add Link
                              </span>
                            </div>
                          </ObjectUploader>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {lessonPlansLoading ? (
                            <div className="text-center py-6">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-600">Loading lesson plans...</p>
                            </div>
                          ) : publicLessonPlans && publicLessonPlans.length > 0 ? (
                            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {publicLessonPlans.map((plan) => (
                                <div
                                  key={plan.id}
                                  onClick={() => handleLessonPlanSelect(plan)}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-blue-50 hover:border-blue-300 ${
                                    selectedLessonPlan?.id === plan.id
                                      ? "bg-blue-50 border-blue-300"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{plan.title}</h4>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        <span>{plan.subject}</span>
                                        <span>{plan.gradeLevel}</span>
                                        <span>{plan.duration} min</span>
                                      </div>
                                      
                                      {/* Teacher and Date Information */}
                                      <div className="flex items-center gap-4 mt-2 text-sm text-blue-600">
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          <span>By: {plan.teacher ? `${plan.teacher.firstName} ${plan.teacher.lastName}` : 'Unknown Teacher'}</span>
                                        </div>
                                        {plan.dateScheduled && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Scheduled: {new Date(plan.dateScheduled).toLocaleDateString('en-US', { 
                                              weekday: 'short', 
                                              month: 'short', 
                                              day: 'numeric' 
                                            })}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {plan.objective && (
                                        <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                                          {plan.objective}
                                        </p>
                                      )}
                                    </div>
                                    {selectedLessonPlan?.id === plan.id && (
                                      <div className="ml-3 text-blue-600">
                                        <Check className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No public lesson plans available</p>
                              <p className="text-xs mt-1">Teachers need to create and publish lesson plans first</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Status message */}
                      {(form.watch("lessonPlanUrl") || selectedLessonPlan) && (
                        <div className="mt-2">
                          {selectedLessonPlan ? (
                            <p className="text-sm text-green-600 flex items-center">
                              <Check className="w-4 h-4 mr-1" />
                              Selected: "{selectedLessonPlan.title}"
                            </p>
                          ) : form.watch("lessonPlanUrl") ? (
                            <p className="text-sm text-green-600 flex items-center">
                              <Check className="w-4 h-4 mr-1" />
                              Lesson plan uploaded
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observations Tab - Redesigned */}
                {currentTab === "observations" && (
                  <div className="space-y-6">
                    {/* Evidence of Student Learning - Multi-select Checklist */}
                    <FormField
                      control={form.control}
                      name="evidenceOfLearning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium">Evidence of Student Learning</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {[
                                "Students applied new vocabulary",
                                "Students used content-specific tools/technology", 
                                "Students collaborated effectively",
                                "Students explained their thinking",
                                "Observable formative assessment was used",
                                "Product/work sample was produced"
                              ].map((evidenceItem, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                  <Checkbox
                                    id={`evidence-${index}`}
                                    checked={selectedEvidence.includes(evidenceItem)}
                                    onCheckedChange={(checked) => {
                                      const newEvidence = checked
                                        ? [...selectedEvidence, evidenceItem]
                                        : selectedEvidence.filter(e => e !== evidenceItem);
                                      setSelectedEvidence(newEvidence);
                                      field.onChange({
                                        checkedItems: newEvidence,
                                        otherItem: evidenceLearningOther,
                                        clarification: field.value?.clarification || ""
                                      });
                                      handleFieldChange("evidenceOfLearning", {
                                        checkedItems: newEvidence,
                                        otherItem: evidenceLearningOther,
                                        clarification: field.value?.clarification || ""
                                      });
                                    }}
                                  />
                                  <label htmlFor={`evidence-${index}`} className="text-sm text-gray-700 flex-1">
                                    {evidenceItem}
                                  </label>
                                </div>
                              ))}
                              
                              {/* Add Other Option */}
                              <div className="flex items-start space-x-3">
                                <Checkbox
                                  id="evidence-other"
                                  checked={showEvidenceOther}
                                  onCheckedChange={(checked) => {
                                    setShowEvidenceOther(!!checked);
                                    if (!checked) {
                                      setEvidenceLearningOther("");
                                      field.onChange({
                                        checkedItems: selectedEvidence,
                                        otherItem: "",
                                        clarification: field.value?.clarification || ""
                                      });
                                    }
                                  }}
                                />
                                <label htmlFor="evidence-other" className="text-sm text-gray-700 flex-1">
                                  Other (specify below)
                                </label>
                              </div>
                              
                              {showEvidenceOther && (
                                <Input
                                  placeholder="Specify other evidence..."
                                  value={evidenceLearningOther}
                                  onChange={(e) => {
                                    setEvidenceLearningOther(e.target.value);
                                    field.onChange({
                                      checkedItems: selectedEvidence,
                                      otherItem: e.target.value,
                                      clarification: field.value?.clarification || ""
                                    });
                                  }}
                                  className="ml-6"
                                />
                              )}
                              
                              {/* Optional clarification */}
                              <div className="ml-6 pt-2">
                                <Input
                                  placeholder="Optional: Brief clarification (max 100 chars)"
                                  maxLength={100}
                                  value={field.value?.clarification || ""}
                                  onChange={(e) => {
                                    field.onChange({
                                      checkedItems: selectedEvidence,
                                      otherItem: evidenceLearningOther,
                                      clarification: e.target.value
                                    });
                                  }}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {(field.value?.clarification || "").length}/100 characters
                                </p>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Behavior & Routines - Enhanced with Compliance and Rating */}
                    <FormField
                      control={form.control}
                      name="behaviorRoutines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium">Behavior & Routines Observed</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {/* Checkboxes for routines */}
                              <div className="space-y-3">
                                {[
                                  "Students follow established classroom procedures",
                                  "Clear expectations are communicated",
                                  "Positive behavior reinforcement is used",
                                  "Students are actively engaged"
                                ].map((routine, index) => (
                                  <div key={index} className="flex items-start space-x-3">
                                    <Checkbox
                                      id={`routine-${index}`}
                                      checked={field.value?.routines?.includes(routine) || false}
                                      onCheckedChange={(checked) => {
                                        const currentRoutines = field.value?.routines || [];
                                        const newRoutines = checked
                                          ? [...currentRoutines, routine]
                                          : currentRoutines.filter(r => r !== routine);
                                        const newValue = { 
                                          ...field.value,
                                          routines: newRoutines 
                                        };
                                        field.onChange(newValue);
                                        handleFieldChange("behaviorRoutines", newValue);
                                      }}
                                    />
                                    <label htmlFor={`routine-${index}`} className="text-sm text-gray-700">
                                      {routine}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Level of Compliance Toggle Group */}
                              <div>
                                <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                  Level of Compliance
                                </FormLabel>
                                <div className="flex space-x-2">
                                  {[
                                    { value: "all", label: "All students", color: "bg-green-100 text-green-800 border-green-300" },
                                    { value: "most", label: "Most students", color: "bg-blue-100 text-blue-800 border-blue-300" },
                                    { value: "some", label: "Some students", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
                                    { value: "none", label: "None observed", color: "bg-red-100 text-red-800 border-red-300" }
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => {
                                        const newValue = { 
                                          ...field.value,
                                          complianceLevel: option.value as any
                                        };
                                        field.onChange(newValue);
                                        handleFieldChange("behaviorRoutines", newValue);
                                      }}
                                      className={`px-3 py-1 text-xs border rounded-full transition-colors ${
                                        field.value?.complianceLevel === option.value
                                          ? option.color
                                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Consistency Rating Slider */}
                              <div>
                                <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                  Overall Classroom Routine Consistency (1-5 scale)
                                </FormLabel>
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm text-gray-500">1</span>
                                  <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={field.value?.consistencyRating || 3}
                                    onChange={(e) => {
                                      const newValue = { 
                                        ...field.value,
                                        consistencyRating: parseInt(e.target.value)
                                      };
                                      field.onChange(newValue);
                                      handleFieldChange("behaviorRoutines", newValue);
                                    }}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-500">5</span>
                                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {field.value?.consistencyRating || 3}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Optional notes */}
                              <Textarea
                                placeholder="Additional notes about behavior and routines..."
                                rows={2}
                                value={field.value?.notes || ""}
                                onChange={(e) => {
                                  const newValue = { 
                                    ...field.value,
                                    notes: e.target.value 
                                  };
                                  field.onChange(newValue);
                                  handleFieldChange("behaviorRoutines", newValue);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Enhanced Classroom Climate with Conditional Follow-up */}
                    <FormField
                      control={form.control}
                      name="climate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium">Classroom Climate</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleFieldChange("climate", value);
                                  // Reset contributors when climate changes
                                  form.setValue("climateContributors", []);
                                }}
                                defaultValue={field.value}
                                className="flex space-x-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="warm" id="warm" />
                                  <label htmlFor="warm" className="text-sm text-gray-700 flex items-center cursor-pointer">
                                    <span className="text-2xl mr-2">😊</span>Warm
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="neutral" id="neutral" />
                                  <label htmlFor="neutral" className="text-sm text-gray-700 flex items-center cursor-pointer">
                                    <span className="text-2xl mr-2">😐</span>Neutral
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="tense" id="tense" />
                                  <label htmlFor="tense" className="text-sm text-gray-700 flex items-center cursor-pointer">
                                    <span className="text-2xl mr-2">🥶</span>Tense
                                  </label>
                                </div>
                              </RadioGroup>
                              
                              {/* Conditional Follow-up Dropdowns */}
                              {field.value && field.value !== "neutral" && (
                                <FormField
                                  control={form.control}
                                  name="climateContributors"
                                  render={({ field: contributorsField }) => (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                        What contributed to this climate?
                                      </FormLabel>
                                      <div className="space-y-2">
                                        {field.value === "warm" && [
                                          "Peer support observed",
                                          "Student-led activity",
                                          "Positive energy in room",
                                          "Clear engagement with content",
                                          "Collaborative learning",
                                          "Teacher enthusiasm"
                                        ].map((contributor, index) => (
                                          <div key={index} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`warm-${index}`}
                                              checked={contributorsField.value?.includes(contributor) || false}
                                              onCheckedChange={(checked) => {
                                                const current = contributorsField.value || [];
                                                const updated = checked
                                                  ? [...current, contributor]
                                                  : current.filter(c => c !== contributor);
                                                contributorsField.onChange(updated);
                                                handleFieldChange("climateContributors", updated);
                                              }}
                                            />
                                            <label htmlFor={`warm-${index}`} className="text-sm text-gray-700">
                                              {contributor}
                                            </label>
                                          </div>
                                        ))}
                                        
                                        {field.value === "tense" && [
                                          "Technology issues observed",
                                          "Student conflict evident",
                                          "Unclear directions given",
                                          "Time pressure apparent",
                                          "Disruptions occurred",
                                          "Low engagement level"
                                        ].map((contributor, index) => (
                                          <div key={index} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`tense-${index}`}
                                              checked={contributorsField.value?.includes(contributor) || false}
                                              onCheckedChange={(checked) => {
                                                const current = contributorsField.value || [];
                                                const updated = checked
                                                  ? [...current, contributor]
                                                  : current.filter(c => c !== contributor);
                                                contributorsField.onChange(updated);
                                                handleFieldChange("climateContributors", updated);
                                              }}
                                            />
                                            <label htmlFor={`tense-${index}`} className="text-sm text-gray-700">
                                              {contributor}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Redesigned Additional Notes with Preset Tags */}
                    <FormField
                      control={form.control}
                      name="additionalNotesTags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium">Additional Notes</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <div>
                                <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                  Select relevant tags:
                                </FormLabel>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    "Off-task behavior observed",
                                    "Smooth transitions noted",
                                    "Technology usage issues",
                                    "Positive reinforcement heard",
                                    "Differentiation evident",
                                    "Time management concerns",
                                    "Student questions encouraged",
                                    "Clear learning objectives"
                                  ].map((tag, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`tag-${index}`}
                                        checked={field.value?.includes(tag) || false}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          const updated = checked
                                            ? [...current, tag]
                                            : current.filter(t => t !== tag);
                                          field.onChange(updated);
                                          handleFieldChange("additionalNotesTags", updated);
                                        }}
                                      />
                                      <label htmlFor={`tag-${index}`} className="text-sm text-gray-700">
                                        {tag}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Short clarification text */}
                              <FormField
                                control={form.control}
                                name="additionalNotesText"
                                render={({ field: textField }) => (
                                  <div>
                                    <FormLabel className="text-sm font-medium text-gray-700 mb-2 block">
                                      Brief clarification (optional, max 100 characters):
                                    </FormLabel>
                                    <Input
                                      placeholder="Add brief context or details..."
                                      maxLength={100}
                                      value={textField.value || ""}
                                      onChange={(e) => {
                                        textField.onChange(e.target.value);
                                        handleFieldChange("additionalNotesText", e.target.value);
                                      }}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      {(textField.value || "").length}/100 characters
                                    </p>
                                  </div>
                                )}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Flag for Coaching Follow-Up */}
                    <FormField
                      control={form.control}
                      name="flagForCoaching"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <Checkbox
                              id="coaching-flag"
                              checked={field.value || false}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleFieldChange("flagForCoaching", checked);
                              }}
                            />
                            <div>
                              <label htmlFor="coaching-flag" className="text-sm font-medium text-gray-900 cursor-pointer">
                                Flag for Coaching Follow-Up
                              </label>
                              <p className="text-xs text-gray-600">
                                Check this to request additional coaching support for this observation
                              </p>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Assessment & Ratings Tab */}
                {currentTab === "assessment" && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="engagementLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Engagement Level</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-4">
                              <StarRating
                                value={field.value ? parseInt(field.value) : 0}
                                onChange={(value) => {
                                  field.onChange(value.toString());
                                  handleFieldChange("engagementLevel", value.toString());
                                }}
                              />
                              <span className="text-sm text-gray-600">1 = Low, 5 = Exceptional</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transitions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transitions</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleFieldChange("transitions", value);
                              }}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="smooth" id="smooth" />
                                <label htmlFor="smooth" className="text-sm text-gray-700 flex items-center">
                                  <span className="text-green-500 mr-1">✓</span>Smooth
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="needs-improvement" id="needs-improvement" />
                                <label htmlFor="needs-improvement" className="text-sm text-gray-700 flex items-center">
                                  <span className="text-yellow-500 mr-1">⚠</span>Needs Improvement
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transitionComments"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Comments about transitions between activities..."
                              rows={2}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange("transitionComments", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">
                        Teaching Effectiveness Indicators
                      </FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: "clearInstructions", label: "Clear Instructions" },
                          { key: "questioningTechniques", label: "Questioning Techniques" },
                          { key: "useOfMaterials", label: "Use of Materials" },
                          { key: "studentInteraction", label: "Student Interaction" },
                          { key: "differentiation", label: "Differentiation" },
                          { key: "timeManagement", label: "Time Management" },
                        ].map((indicator) => (
                          <div key={indicator.key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{indicator.label}</span>
                            <Select
                              onValueChange={(value) => {
                                const currentRatings = form.watch("effectivenessRatings") || {};
                                const newRatings = { ...currentRatings, [indicator.key]: value };
                                form.setValue("effectivenessRatings", newRatings);
                                handleFieldChange("effectivenessRatings", newRatings);
                              }}
                              defaultValue={(form.watch("effectivenessRatings") as any)?.[indicator.key] || ""}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback & Follow-up Tab */}
                {currentTab === "feedback" && (
                  <div className="space-y-6">
                    <AIFeedbackSuggestions
                      observationData={{
                        subject: form.watch("subject") || "",
                        gradeLevel: form.watch("gradeLevel") || "",
                        lessonObjective: form.watch("lessonObjective") || "",
                        engagementLevel: form.watch("engagementLevel") || "3",
                        climate: form.watch("climate") || "neutral",
                        evidenceOfLearning: form.watch("evidenceOfLearning") || "",
                        effectivenessRatings: form.watch("effectivenessRatings") || {},
                      }}
                      onApplyFeedback={(feedback) => {
                        form.setValue("strengths", feedback.strengths);
                        form.setValue("areasForGrowth", feedback.areasForGrowth);
                        form.setValue("additionalComments", feedback.additionalComments);
                        
                        // Auto-save the changes
                        handleFieldChange("strengths", feedback.strengths);
                        handleFieldChange("areasForGrowth", feedback.areasForGrowth);
                        handleFieldChange("additionalComments", feedback.additionalComments);
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="strengths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strengths Observed</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Highlight the positive aspects and strengths you observed during the walkthrough..."
                              rows={4}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange("strengths", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="areasForGrowth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Areas for Growth & Suggestions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide constructive feedback and suggestions for improvement..."
                              rows={4}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange("areasForGrowth", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalComments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Comments</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional observations, notes, or context..."
                              rows={3}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFieldChange("additionalComments", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Growth Tracking Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Growth & Development Tracking</h4>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="previousFeedbackAddressed"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    handleFieldChange("previousFeedbackAddressed", checked);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Previous feedback was addressed</FormLabel>
                                <p className="text-sm text-gray-600">Check if the teacher implemented previous suggestions</p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="growthNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Growth Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Document progress from previous observations, growth areas, and development trends..."
                                  rows={3}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleFieldChange("growthNotes", e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Follow-up Actions</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="followUpNeeded"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    handleFieldChange("followUpNeeded", checked);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Follow-up meeting needed</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="assignedReviewer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assign to Reviewer</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleFieldChange("assignedReviewer", value);
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select reviewer..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="9c7509e3-1f54-4e1a-ba38-2d91b7dcebfa">Admin User</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="followUpDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Follow-up Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleFieldChange("followUpDate", e.target.value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority Level</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleFieldChange("priority", value);
                                  }}
                                  defaultValue={field.value}
                                  className="flex space-x-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="low" id="low" />
                                    <label htmlFor="low" className="text-sm text-gray-700 flex items-center">
                                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>Low
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="medium" id="medium" />
                                    <label htmlFor="medium" className="text-sm text-gray-700 flex items-center">
                                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>Medium
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="high" id="high" />
                                    <label htmlFor="high" className="text-sm text-gray-700 flex items-center">
                                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>High
                                    </label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Walkthrough Duration: <strong>
                        {Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60))} minutes
                      </strong>
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSaveDraft}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      onClick={handleComplete}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Complete Walkthrough
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
