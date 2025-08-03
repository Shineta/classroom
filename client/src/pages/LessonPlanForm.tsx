import { useState, useEffect } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLessonPlanSchema, type InsertLessonPlan } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { CalendarDays, Save, BookOpen, Users, Target, Settings } from "lucide-react";
import StandardsSelector from "@/components/StandardsSelector";
import LessonPlanUploader from "@/components/LessonPlanUploader";

interface LessonPlanFormProps {
  lessonPlanId?: string;
}

export default function LessonPlanForm({ lessonPlanId }: LessonPlanFormProps) {
  const isEditing = lessonPlanId && lessonPlanId !== "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch lesson plan data if editing
  const { data: lessonPlan, isLoading } = useQuery({
    queryKey: ["/api/lesson-plans", lessonPlanId],
    enabled: !!isEditing,
  });

  // Fetch teachers for the dropdown
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
  });

  const form = useForm<InsertLessonPlan>({
    resolver: zodResolver(insertLessonPlanSchema),
    defaultValues: {
      teacherId: "",
      title: "",
      subject: "",
      gradeLevel: "",
      dateScheduled: undefined,
      duration: 50,
      objective: "",
      topics: "",
      standardsCovered: [],
      materials: "",
      estimatedStudentCount: 20,
      classroomNotes: "",
      activities: "",
      assessment: "",
      differentiation: "",
      attachmentUrls: [],
      status: "draft",
      isPublic: false,
    },
  });

  // Load lesson plan data into form when editing
  useEffect(() => {
    if (lessonPlan) {
      const formData = {
        ...lessonPlan,
        dateScheduled: lessonPlan.dateScheduled ? new Date(lessonPlan.dateScheduled).toISOString().slice(0, 16) : undefined,
      };
      form.reset(formData);
    }
  }, [lessonPlan, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertLessonPlan) => {
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing ? `/api/lesson-plans/${lessonPlanId}` : "/api/lesson-plans";
      return await apiRequest(method, url, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-plans"] });
      
      if (!isEditing) {
        toast({
          title: "Lesson Plan Created",
          description: "Your lesson plan has been saved successfully.",
        });
        setLocation(`/lesson-plan/${result.id}`);
      } else {
        toast({
          title: "Lesson Plan Updated",
          description: "Your changes have been saved.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson plan",
        variant: "destructive",
      });
    },
  });

  const handleDataExtracted = (extractedData: any) => {
    console.log("Extracted data:", extractedData);
    
    // Auto-populate form fields with extracted data
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== "Not specified") {
        try {
          // Handle arrays properly
          if (Array.isArray(value) && value.length > 0) {
            form.setValue(key as keyof InsertLessonPlan, value);
          } else if (!Array.isArray(value)) {
            form.setValue(key as keyof InsertLessonPlan, value);
          }
        } catch (error) {
          console.warn(`Error setting field ${key}:`, error);
        }
      }
    });
    
    // Force form re-render
    form.trigger();
    
    toast({
      title: "Data extracted successfully",
      description: `Form fields have been populated with data from your uploaded file. Found: ${Object.keys(extractedData).filter(key => extractedData[key] && extractedData[key] !== "Not specified").join(", ")}`,
    });
  };

  const onSubmit = (data: InsertLessonPlan) => {
    // Convert date string back to Date object
    const processedData = {
      ...data,
      dateScheduled: data.dateScheduled ? new Date(data.dateScheduled) : undefined,
    };
    saveMutation.mutate(processedData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl font-bold">
                  {isEditing ? "Edit Lesson Plan" : "Create New Lesson Plan"}
                </CardTitle>
                <CardDescription className="text-green-100">
                  Plan your lesson to enable automatic walkthrough data population
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Planning
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Basic Information Tab */}
                  <TabsContent value="basic" className="space-y-6">
                    {/* File Upload Section */}
                    {!isEditing && (
                      <LessonPlanUploader onDataExtracted={handleDataExtracted} />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="teacherId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teacher</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(teachers as any[]).map((teacher: any) => (
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
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter lesson title" {...field} />
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
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="English Language Arts">English Language Arts</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                                <SelectItem value="Social Studies">Social Studies</SelectItem>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="World Languages">World Languages</SelectItem>
                                <SelectItem value="Arts">Arts</SelectItem>
                                <SelectItem value="Physical Education">Physical Education</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <FormControl>
                              <Input placeholder="e.g., 9th Grade, Kindergarten" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateScheduled"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scheduled Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                                value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().slice(0, 16)) : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="objective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Objective</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What will students learn and be able to do by the end of this lesson?"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="topics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topics Covered</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List the main topics, concepts, or themes covered in this lesson"
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="standardsCovered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Standards Alignment</FormLabel>
                          <FormControl>
                            <StandardsSelector
                              value={field.value || []}
                              onChange={field.onChange}
                              subject={form.watch("subject")}
                              gradeLevel={form.watch("gradeLevel")}
                              lessonObjective={form.watch("objective")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="materials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Materials & Resources</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List materials, technology, handouts, or resources needed"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Planning Tab */}
                  <TabsContent value="planning" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="estimatedStudentCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Number of Students</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="20"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="classroomNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Classroom Setup Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Seating arrangement, special setup requirements, etc."
                                rows={2}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="activities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesson Activities</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the sequence of activities, instructional strategies, and student tasks"
                              rows={4}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assessment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment Methods</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="How will you assess student understanding and progress?"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="differentiation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Differentiation Strategies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="How will you accommodate different learning needs and styles?"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="finalized">Finalized</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Make visible to observers</FormLabel>
                            <p className="text-sm text-gray-600">
                              Allow observers to reference this lesson plan during walkthroughs
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/teacher-dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveMutation.isPending ? "Saving..." : isEditing ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}