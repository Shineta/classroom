import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  Search,
  Eye,
  Edit,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import type { LessonPlanWithDetails } from "@shared/schema";

export default function TeacherDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("plans");

  // Fetch teacher's lesson plans
  const { data: lessonPlans = [], isLoading } = useQuery({
    queryKey: ["/api/lesson-plans/my-plans"],
  });

  // Fetch basic stats
  const { data: stats = {} } = useQuery({
    queryKey: ["/api/lesson-plans/stats"],
  });

  const filteredPlans = (lessonPlans as LessonPlanWithDetails[]).filter((plan: LessonPlanWithDetails) =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
                <p className="text-green-100">Manage your lesson plans and classroom preparation</p>
              </div>
            </div>
            <Link href="/lesson-plan/new">
              <Button className="bg-white text-green-600 hover:bg-green-50">
                <Plus className="w-4 h-4 mr-2" />
                New Lesson Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.total || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.thisWeek || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finalized</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.finalized || 0}</p>
                </div>
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.avgDuration || 0}m</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">My Lesson Plans</CardTitle>
                <CardDescription>
                  Create and manage your lesson plans for classroom observations
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plans">All Plans</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32"></div>
                    ))}
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first lesson plan to enable walkthrough data auto-population
                    </p>
                    <Link href="/lesson-plan/new">
                      <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Lesson Plan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPlans.map((plan: LessonPlanWithDetails) => (
                      <Card key={plan.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                                <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                                {plan.isPublic && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Public
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <BookOpen className="w-4 h-4" />
                                  {plan.subject}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  {plan.gradeLevel}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  {plan.duration} min
                                </div>
                                {plan.dateScheduled && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(plan.dateScheduled), "MMM d, h:mm a")}
                                  </div>
                                )}
                              </div>

                              {plan.objective && (
                                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                  <strong>Objective:</strong> {plan.objective}
                                </p>
                              )}

                              {plan.standardsCovered && plan.standardsCovered.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {plan.standardsCovered.slice(0, 3).map((standard, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {standard}
                                    </Badge>
                                  ))}
                                  {plan.standardsCovered.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{plan.standardsCovered.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Link href={`/lesson-plan/${plan.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              <Link href={`/lesson-plan/${plan.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <div className="text-center py-8 text-gray-500">
                  Recently modified lesson plans will appear here
                </div>
              </TabsContent>

              <TabsContent value="upcoming" className="mt-6">
                <div className="text-center py-8 text-gray-500">
                  Upcoming scheduled lessons will appear here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}