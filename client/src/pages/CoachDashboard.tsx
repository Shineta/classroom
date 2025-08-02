import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, User, BookOpen, AlertCircle, Clock, CheckCircle, BarChart3, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WalkthroughWithDetails } from "@shared/schema";
import { ReviewFeedbackModal } from "@/components/ReviewFeedbackModal";

export default function CoachDashboard() {
  const { toast } = useToast();
  const [selectedWalkthrough, setSelectedWalkthrough] = useState<WalkthroughWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch walkthroughs needing review
  const { data: pendingReviews = [], isLoading: pendingLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ['/api/reviews/pending'],
  });

  const { data: inProgressReviews = [], isLoading: inProgressLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ['/api/reviews/in-progress'],
  });

  const { data: completedReviews = [], isLoading: completedLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ['/api/reviews/completed'],
  });

  // Start review mutation
  const startReviewMutation = useMutation({
    mutationFn: async (walkthroughId: string) => {
      await apiRequest("POST", `/api/reviews/${walkthroughId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/in-progress'] });
      toast({
        title: "Review Started",
        description: "You have successfully started the review process.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStartReview = (walkthroughId: string) => {
    startReviewMutation.mutate(walkthroughId);
  };

  const handleCompleteReview = (walkthrough: WalkthroughWithDetails) => {
    setSelectedWalkthrough(walkthrough);
    setIsModalOpen(true);
  };

  const renderWalkthroughCard = (walkthrough: WalkthroughWithDetails, showActions: boolean, actionType: 'start' | 'complete') => (
    <Card key={walkthrough.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-900">
                {walkthrough.teacher.firstName} {walkthrough.teacher.lastName}
              </span>
              {walkthrough.priority && (
                <Badge variant="outline" className={getPriorityColor(walkthrough.priority)}>
                  {walkthrough.priority === 'high' && '🔴 '}
                  {walkthrough.priority.charAt(0).toUpperCase() + walkthrough.priority.slice(1)} Priority
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                <span>{walkthrough.subject}</span>
                {walkthrough.gradeLevel && (
                  <span className="text-gray-400">• Grade {walkthrough.gradeLevel}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3 w-3" />
                <span>{formatDate(walkthrough.dateTime)}</span>
                {walkthrough.followUpDate && (
                  <span className="text-orange-600 font-medium">
                    • Follow-up: {formatDate(walkthrough.followUpDate)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>Observer: {walkthrough.creator.firstName} {walkthrough.creator.lastName}</span>
              </div>

              {walkthrough.location && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📍 {walkthrough.location.name}</span>
                </div>
              )}
            </div>

            {/* Show review feedback for completed reviews */}
            {actionType === 'complete' && walkthrough.reviewStatus === 'completed' && walkthrough.reviewerFeedback && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="text-sm font-medium text-green-900 mb-1">Your Review Feedback:</div>
                <p className="text-sm text-green-800 line-clamp-3">{walkthrough.reviewerFeedback}</p>
              </div>
            )}
          </div>

          <div className="ml-4 flex flex-col gap-2">
            {/* View Report button for all review states */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/walkthrough/${walkthrough.id}/report`, '_blank')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-3 w-3" />
              View Report
            </Button>

            {showActions && (
              <>
                {actionType === 'start' ? (
                  <Button
                    onClick={() => handleStartReview(walkthrough.id)}
                    disabled={startReviewMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    {startReviewMutation.isPending ? 'Starting...' : 'Start Review'}
                  </Button>
                ) : actionType === 'complete' && walkthrough.reviewStatus === 'in-progress' ? (
                  <Button
                    onClick={() => handleCompleteReview(walkthrough)}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete Review
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {walkthrough.lessonObjective && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">Lesson Objective:</span>
            <p className="text-sm text-blue-800 mt-1">{walkthrough.lessonObjective}</p>
          </div>
        )}

        {/* Show timestamps for review workflow */}
        {(walkthrough.reviewStartedAt || walkthrough.reviewCompletedAt) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-4 text-xs text-gray-500">
              {walkthrough.reviewStartedAt && (
                <span>Started: {new Date(walkthrough.reviewStartedAt).toLocaleDateString()}</span>
              )}
              {walkthrough.reviewCompletedAt && (
                <span>Completed: {new Date(walkthrough.reviewCompletedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderTabContent = (
    reviews: WalkthroughWithDetails[],
    isLoading: boolean,
    emptyMessage: string,
    showActions: boolean,
    actionType: 'start' | 'complete'
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reviews.map(walkthrough => 
          renderWalkthroughCard(walkthrough, showActions, actionType)
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instructional Coach Dashboard</h1>
              <p className="text-gray-600">Manage walkthrough reviews, provide feedback, and track team performance</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/coach/insights'} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Coach Analytics
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending Reviews ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({inProgressReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTabContent(
                pendingReviews,
                pendingLoading,
                "No pending reviews at this time.",
                true,
                'start'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                In Progress Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTabContent(
                inProgressReviews,
                inProgressLoading,
                "No reviews currently in progress.",
                true,
                'complete'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTabContent(
                completedReviews,
                completedLoading,
                "No completed reviews yet.",
                false,
                'complete'
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedWalkthrough && (
        <ReviewFeedbackModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedWalkthrough(null);
          }}
          walkthrough={selectedWalkthrough}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/reviews/in-progress'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reviews/completed'] });
          }}
        />
      )}
      </div>
    </div>
  );
}