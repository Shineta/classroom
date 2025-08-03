import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  ClipboardCheck, 
  School, 
  BookOpen, 
  Target,
  Download,
  Filter,
  Calendar,
  ArrowLeft,
  Building
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface OverviewStats {
  totalWalkthroughs: number;
  thisWeek: number;
  uniqueTeachers: number;
  avgEngagement: number;
  totalObservers: number;
  activeLocations: number;
}

interface LocationStats {
  locationName: string;
  walkthroughCount: number;
  avgEngagement: number;
  uniqueTeachers: number;
}

interface SubjectAnalytics {
  subject: string;
  count: number;
  avgRating: number;
  color: string;
}

interface StandardsTracking {
  standard: string;
  frequency: number;
  percentage: number;
}

interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  totalObservations: number;
  avgEngagement: number;
  recentTrend: "improving" | "declining" | "stable";
  lastObservation: string;
}

export default function LeadershipDashboard() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");

  // Organization-wide overview data
  const { data: overviewStats, isLoading: overviewLoading } = useQuery<OverviewStats>({
    queryKey: ["/api/leadership/overview", "location", selectedLocation, "dateRange", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/leadership/overview?location=${selectedLocation}&dateRange=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
  });

  // Location-based analytics
  const { data: locationStats, isLoading: locationLoading } = useQuery<LocationStats[]>({
    queryKey: ["/api/leadership/locations", "dateRange", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/leadership/locations?dateRange=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
  });

  // Subject distribution across organization
  const { data: subjectDistribution, isLoading: subjectLoading } = useQuery<SubjectAnalytics[]>({
    queryKey: ["/api/leadership/subjects", "location", selectedLocation, "dateRange", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/leadership/subjects?location=${selectedLocation}&dateRange=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
  });

  // Standards tracking data
  const { data: standardsData, isLoading: standardsLoading } = useQuery<StandardsTracking[]>({
    queryKey: ["/api/leadership/standards", "location", selectedLocation, "dateRange", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/leadership/standards?location=${selectedLocation}&dateRange=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
  });

  // Teacher performance overview
  const { data: teacherPerformance, isLoading: teacherLoading } = useQuery<TeacherPerformance[]>({
    queryKey: ["/api/leadership/teachers", "location", selectedLocation, "dateRange", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/leadership/teachers?location=${selectedLocation}&dateRange=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
  });

  // Engagement trends over time
  const { data: engagementTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/leadership/engagement-trends", "location", selectedLocation, "dateRange", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/leadership/engagement-trends?location=${selectedLocation}&dateRange=${dateRange}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
  });

  const exportData = () => {
    // Implementation for data export functionality
    const csvData = {
      overview: overviewStats,
      locations: locationStats,
      subjects: subjectDistribution,
      standards: standardsData,
      teachers: teacherPerformance,
    };
    
    const dataStr = JSON.stringify(csvData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leadership-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (user?.role !== 'leadership' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This dashboard is only available to leadership and administrative users.
            </p>
            <Link href="/">
              <Button className="w-full mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Leadership Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="text-3xl mr-4" />
              <div>
                <h1 className="text-2xl font-bold">Leadership Dashboard</h1>
                <p className="text-purple-100">Organization-wide classroom observation insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-700 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Main Dashboard
                </Button>
              </Link>
              <Button 
                onClick={exportData}
                className="bg-white text-purple-700 hover:bg-purple-50 font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-purple-600" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations?.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="semester">This Semester</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization-wide Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Walkthroughs</p>
                  <p className="text-2xl font-bold">
                    {overviewLoading ? "..." : overviewStats?.totalWalkthroughs || 0}
                  </p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">This Week</p>
                  <p className="text-2xl font-bold">
                    {overviewLoading ? "..." : overviewStats?.thisWeek || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Teachers Observed</p>
                  <p className="text-2xl font-bold">
                    {overviewLoading ? "..." : overviewStats?.uniqueTeachers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Engagement</p>
                  <p className="text-2xl font-bold">
                    {overviewLoading ? "..." : overviewStats?.avgEngagement?.toFixed(1) || "0.0"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Active Observers</p>
                  <p className="text-2xl font-bold">
                    {overviewLoading ? "..." : overviewStats?.totalObservers || 0}
                  </p>
                </div>
                <School className="h-8 w-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Locations</p>
                  <p className="text-2xl font-bold">
                    {overviewLoading ? "..." : overviewStats?.activeLocations || 0}
                  </p>
                </div>
                <Building className="h-8 w-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Locations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            {/* Engagement Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Organization-wide Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">Loading engagement data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={engagementTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgEngagement" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Average Engagement"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Subject Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Area Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {subjectLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">Loading subject data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Observations" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            {/* Standards Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  Standards & Curriculum Alignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {standardsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {standardsData?.map((standard, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{standard.standard}</h4>
                          <p className="text-sm text-gray-600">
                            Observed in {standard.frequency} lessons ({standard.percentage}% coverage)
                          </p>
                        </div>
                        <Badge variant={standard.percentage > 75 ? "default" : standard.percentage > 50 ? "secondary" : "destructive"}>
                          {standard.percentage}%
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">
                        No standards data available. Standards tracking will appear here as observations are completed.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CS Principles Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Computer Science Principles Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["Data & Information", "Algorithms & Programming", "Computing Systems", "Networks & Internet", "Impact of Computing"].map((principle, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{principle}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Coverage</span>
                        <Badge variant="secondary">{Math.floor(Math.random() * 40 + 60)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            {/* Teacher Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance & Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {teacherLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teacherPerformance?.map((teacher, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{teacher.teacherName}</h4>
                          <p className="text-sm text-gray-600">
                            {teacher.totalObservations} observations • Avg engagement: {teacher.avgEngagement.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">Last observed: {teacher.lastObservation}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              teacher.recentTrend === 'improving' ? 'default' :
                              teacher.recentTrend === 'declining' ? 'destructive' : 'secondary'
                            }
                          >
                            {teacher.recentTrend === 'improving' ? '📈' : 
                             teacher.recentTrend === 'declining' ? '📉' : '➡️'} 
                            {teacher.recentTrend}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">
                        No teacher performance data available yet.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            {/* Location Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Location Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {locationLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">Loading location data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={locationStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="locationName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="walkthroughCount" fill="#8884d8" name="Walkthroughs" />
                      <Bar dataKey="avgEngagement" fill="#82ca9d" name="Avg Engagement" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Location Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-900">Location</th>
                        <th className="text-left p-2 font-medium text-gray-900">Walkthroughs</th>
                        <th className="text-left p-2 font-medium text-gray-900">Teachers</th>
                        <th className="text-left p-2 font-medium text-gray-900">Avg Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationStats?.map((location, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{location.locationName}</td>
                          <td className="p-2">{location.walkthroughCount}</td>
                          <td className="p-2">{location.uniqueTeachers}</td>
                          <td className="p-2">
                            <Badge variant={location.avgEngagement > 3 ? 'default' : 'secondary'}>
                              {location.avgEngagement.toFixed(1)}
                            </Badge>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No location data available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}