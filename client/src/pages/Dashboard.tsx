import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ClipboardCheck, Plus } from "lucide-react";
import { Link } from "wouter";
import StatsCards from "@/components/StatsCards";
import FilterBar from "@/components/FilterBar";
import WalkthroughList from "@/components/WalkthroughList";
import type { WalkthroughWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    teacherId: "",
    subject: "",
    dateRange: "this-week",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: walkthroughs, isLoading: walkthroughsLoading, error } = useQuery({
    queryKey: ["/api/walkthroughs", filters],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

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
    return null; // Will redirect in useEffect
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
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
              >
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
          <div className="mt-4 sm:mt-0">
            <Link href="/walkthrough/new">
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                New Walkthrough
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatsCards />

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Walkthrough List */}
        <WalkthroughList 
          walkthroughs={walkthroughs as WalkthroughWithDetails[] || []}
          loading={walkthroughsLoading}
          filters={filters}
        />
      </div>
    </div>
  );
}
