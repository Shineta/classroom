import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ClipboardCheck, Plus, LogOut, FileText, CheckSquare, Users } from "lucide-react";
import { Link } from "wouter";
import StatsCards from "@/components/StatsCards";
import FilterBar from "@/components/FilterBar";
import WalkthroughList from "@/components/WalkthroughList";
import ReviewDashboard from "@/components/ReviewDashboard";
import type { WalkthroughWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    teacherId: "",
    locationId: "",
    subject: "",
    dateRange: "this-week",
  });

  const { data: walkthroughs, isLoading: walkthroughsLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ["/api/walkthroughs"],
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.clear();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ClipboardCheck className="text-primary-600 text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Classroom Walkthrough Tool</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Classroom Walkthroughs</h2>
            <p className="text-gray-600 mt-1">Manage and review classroom observations</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            {(user?.role === 'coach' || user?.role === 'admin') && (
              <Link href="/coach/dashboard">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Coach Dashboard
                </Button>
              </Link>
            )}
            {(user?.role === 'leadership' || user?.role === 'admin') && (
              <Link href="/leadership/dashboard">
                <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                  <Users className="w-4 h-4 mr-2" />
                  Leadership Dashboard
                </Button>
              </Link>
            )}
            <Link href="/walkthrough/new">
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                New Walkthrough
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="walkthroughs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="walkthroughs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              My Walkthroughs
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Review Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="walkthroughs" className="space-y-6">
            {/* Statistics Cards */}
            <StatsCards />

            {/* Filters */}
            <FilterBar filters={filters} onFiltersChange={setFilters} />

            {/* Walkthrough List */}
            <WalkthroughList 
              walkthroughs={walkthroughs || []}
              loading={walkthroughsLoading}
              filters={filters}
            />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}