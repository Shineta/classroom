import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Users } from "lucide-react";
import { Link } from "wouter";
import WalkthroughForm from "@/pages/WalkthroughForm";
import type { WalkthroughWithDetails } from "@shared/schema";

export default function WalkthroughEdit() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: walkthrough, isLoading, error } = useQuery<WalkthroughWithDetails>({
    queryKey: ["/api/walkthroughs", id],
    enabled: isAuthenticated && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/walkthroughs/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Walkthrough updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs"] });
      setLocation("/");
    },
    onError: (error) => {
      console.error("Error updating walkthrough:", error);
      toast({
        title: "Error",
        description: "Failed to update walkthrough",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading walkthrough...</p>
        </div>
      </div>
    );
  }

  if (error || !walkthrough) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Walkthrough Not Found</h2>
          <p className="text-gray-600 mb-6">The walkthrough you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Walkthrough</h1>
                <p className="text-gray-600">
                  {walkthrough.teacher.firstName} {walkthrough.teacher.lastName} - {walkthrough.subject}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {walkthrough.observers.length} observer{walkthrough.observers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalkthroughForm
          walkthrough={walkthrough}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          mode="edit"
        />
      </div>
    </div>
  );
}