import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, User, BookOpen, AlertCircle, Clock, CheckCircle, BarChart3, ArrowLeft, FileText } from "lucide-react";
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

  // Fetch weekly lesson plan submissions
  const { data: weeklySubmissions = [], isLoading: submissionsLoading } = useQuery<any[]>({
    queryKey: ['/api/lesson-plans/weekly-submissions'],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Instructional Coach Dashboard</h1>
                <p className="text-blue-100">Review walkthroughs • Provide feedback • Track team performance</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/coach/insights'} 
                variant="secondary"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics Dashboard
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="flex items-center gap-2 border-white/30 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Main Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Coach Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{pendingReviews.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressReviews.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedReviews.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weekly Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{weeklySubmissions.length}</p>
                <p className="text-xs text-gray-500">
                  {weeklySubmissions.filter((s: any) => s.isLateSubmission).length} late
                </p>
              </div>
            </div>
          </div>
        </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
            <AlertCircle className="h-4 w-4" />
            Pending Reviews ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Clock className="h-4 w-4" />
            In Progress ({inProgressReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            <FileText className="h-4 w-4" />
            Weekly Submissions ({weeklySubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Pending Reviews - Action Required</span>
                </div>
                <div className="text-sm text-orange-600 font-normal">
                  {pendingReviews.filter(w => w.priority === 'high').length} high priority
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderTabContent(
                pendingReviews,
                pendingLoading,
                "No pending reviews at this time. Great job staying on top of your review queue!",
                true,
                'start'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-progress">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>In Progress Reviews - Complete Your Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderTabContent(
                inProgressReviews,
                inProgressLoading,
                "No reviews currently in progress. Start a pending review to begin the feedback process.",
                true,
                'complete'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Completed Reviews - Archive & Reference</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderTabContent(
                completedReviews,
                completedLoading,
                "No completed reviews yet. Once you complete reviews, they'll appear here for reference.",
                false,
                'complete'
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <span>Weekly Lesson Plan Submissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : weeklySubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Weekly lesson plan submissions will appear here once teachers submit them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {weeklySubmissions.map((submission: any) => (
                    <Card key={submission.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-semibold text-gray-900">{submission.teacherName}</span>
                              <Badge variant={submission.isLateSubmission ? "destructive" : "default"}>
                                {submission.isLateSubmission ? "Late" : "On Time"}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3 w-3" />
                                <span className="font-medium">{submission.title}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span>{submission.subject}</span>
                                {submission.gradeLevel && (
                                  <span className="text-gray-400">• Grade {submission.gradeLevel}</span>
                                )}
                              </div>
                              
                              {submission.submittedAt && (
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-3 w-3" />
                                  <span>Submitted: {formatDate(submission.submittedAt)}</span>
                                  {submission.weekOfYear && (
                                    <span className="text-gray-400">• Week {submission.weekOfYear}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/lesson-plan/${submission.id}`, '_blank')}
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-3 w-3" />
                              View Plan
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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