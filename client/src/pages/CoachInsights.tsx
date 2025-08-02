import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  TrendingUp, 
  Star, 
  BookOpen, 
  Calendar,
  Award,
  Target,
  Activity,
  BarChart3
} from "lucide-react";

interface ObserverActivity {
  observerId: string;
  observerName: string;
  walkthroughCount: number;
  avgRating: number;
  subjects: string[];
}

interface EngagementTrend {
  date: string;
  studentEngagement: number;
  instructionalStrategies: number;
  classroomEnvironment: number;
  lessonDelivery: number;
}

interface SubjectData {
  subject: string;
  count: number;
  avgRating: number;
  color: string;
}

interface StrengthGrowthData {
  category: string;
  strengths: number;
  growthAreas: number;
}

export default function CoachInsights() {
  // Fetch analytics data
  const { data: observerActivity = [], isLoading: activityLoading } = useQuery<ObserverActivity[]>({
    queryKey: ['/api/analytics/observer-activity'],
  });

  const { data: engagementTrends = [], isLoading: trendsLoading } = useQuery<EngagementTrend[]>({
    queryKey: ['/api/analytics/engagement-trends'],
  });

  const { data: subjectData = [], isLoading: subjectLoading } = useQuery<SubjectData[]>({
    queryKey: ['/api/analytics/subject-distribution'],
  });

  const { data: strengthsGrowthData = [], isLoading: strengthsLoading } = useQuery<StrengthGrowthData[]>({
    queryKey: ['/api/analytics/strengths-growth'],
  });

  const { data: overallStats } = useQuery({
    queryKey: ['/api/analytics/overview'],
  });

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Coach Insights Dashboard</h1>
        <p className="text-gray-600">
          Analyze observer activity, engagement trends, and instructional patterns across all walkthroughs.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Walkthroughs</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats?.totalWalkthroughs || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Observers</p>
                <p className="text-2xl font-bold text-gray-900">{observerActivity.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats?.avgEngagement ? `${overallStats.avgEngagement.toFixed(1)}/5` : '0/5'}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats?.thisMonth || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Observer Activity
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement Trends
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject Analysis
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Strength Patterns
          </TabsTrigger>
        </TabsList>

        {/* Observer Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Observer Activity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-6">
                  {/* Activity Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={observerActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="observerName" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="walkthroughCount" fill="#3B82F6" name="Walkthroughs" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Observer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {observerActivity.map((observer) => (
                      <Card key={observer.observerId} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{observer.observerName}</h4>
                            <Badge variant="secondary">{observer.walkthroughCount} walks</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Avg Rating:</span>
                              <span className={`font-medium ${getRatingColor(observer.avgRating)}`}>
                                {observer.avgRating.toFixed(1)}/5
                              </span>
                            </div>
                            
                            <div>
                              <span className="text-xs text-gray-600">Subjects:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {observer.subjects.slice(0, 3).map((subject, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                                {observer.subjects.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{observer.subjects.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Score Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tickFormatter={formatDate}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value: number) => [`${value.toFixed(1)}/5`, '']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="studentEngagement" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Student Engagement"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="instructionalStrategies" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Instructional Strategies"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="classroomEnvironment" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="Classroom Environment"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lessonDelivery" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="Lesson Delivery"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Analysis Tab */}
        <TabsContent value="subjects">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subjectData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ subject, count }) => `${subject}: ${count}`}
                        >
                          {subjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Average Ratings by Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 5]} />
                        <YAxis dataKey="subject" type="category" width={100} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}/5`, 'Avg Rating']} />
                        <Bar dataKey="avgRating" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strength Patterns Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Common Strengths vs Growth Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strengthsLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strengthsGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="strengths" fill="#10B981" name="Strengths" />
                      <Bar dataKey="growthAreas" fill="#EF4444" name="Growth Areas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}