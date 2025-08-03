import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  ArrowLeft,
  Edit,
  FileText,
  GraduationCap,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import type { LessonPlanWithDetails } from "@shared/schema";

interface LessonPlanViewProps {
  lessonPlanId: string;
}

export default function LessonPlanView({ lessonPlanId }: LessonPlanViewProps) {
  const [, setLocation] = useLocation();

  // Fetch lesson plan data
  const { data: lessonPlan, isLoading } = useQuery({
    queryKey: ["/api/lesson-plans", lessonPlanId],
    enabled: !!lessonPlanId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  if (!lessonPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson Plan Not Found</h2>
          <p className="text-gray-600 mb-6">The lesson plan you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")} className="bg-gradient-to-r from-green-600 to-emerald-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const plan = lessonPlan as LessonPlanWithDetails;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "finalized": return "bg-green-100 text-green-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">{plan.title}</h1>
                <p className="text-green-100">Lesson Plan Details</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setLocation(`/lesson-plan/${plan.id}/edit`)}
                className="bg-white text-green-600 hover:bg-green-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
              <Button 
                onClick={() => setLocation("/")}
                variant="ghost" 
                className="text-white hover:bg-green-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(plan.status || "draft")}>{plan.status}</Badge>
                {plan.isPublic && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Public
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <BookOpen className="w-4 h-4" />
                  Subject
                </div>
                <p className="font-medium">{plan.subject}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <GraduationCap className="w-4 h-4" />
                  Grade Level
                </div>
                <p className="font-medium">{plan.gradeLevel}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Duration
                </div>
                <p className="font-medium">{plan.duration} minutes</p>
              </div>
              {plan.estimatedStudentCount && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Users className="w-4 h-4" />
                    Student Count
                  </div>
                  <p className="font-medium">{plan.estimatedStudentCount}</p>
                </div>
              )}
            </div>
            
            {plan.dateScheduled && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Scheduled Date
                </div>
                <p className="font-medium">{format(new Date(plan.dateScheduled), "MMMM d, yyyy 'at' h:mm a")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Objectives */}
        {plan.objective && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Learning Objectives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.objective}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topics */}
        {plan.topics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Topics Covered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.topics}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Standards */}
        {plan.standardsCovered && plan.standardsCovered.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Standards Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {plan.standardsCovered.map((standard, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {standard}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities */}
        {plan.activities && (
          <Card>
            <CardHeader>
              <CardTitle>Learning Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.activities}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        {plan.materials && (
          <Card>
            <CardHeader>
              <CardTitle>Materials & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.materials}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assessment */}
        {plan.assessment && (
          <Card>
            <CardHeader>
              <CardTitle>Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.assessment}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Differentiation */}
        {plan.differentiation && (
          <Card>
            <CardHeader>
              <CardTitle>Differentiation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.differentiation}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classroom Notes */}
        {plan.classroomNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Classroom Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{plan.classroomNotes}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}