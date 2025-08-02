import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Timer, Eye, Clock, Calendar, User, BookOpen, MessageSquare, Send } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WalkthroughWithDetails } from "@shared/schema";

export default function ReviewDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewComments, setReviewComments] = useState("");

  // Get pending reviews assigned to current user
  const { data: pendingReviews, isLoading: pendingLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ["/api/reviews/pending"],
    enabled: !!user,
  });

  // Get completed reviews by current user
  const { data: completedReviews, isLoading: completedLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ["/api/walkthroughs", { assignedReviewer: user?.id, reviewStatus: "completed" }],
    enabled: !!user,
  });

  // Get in-progress reviews by current user
  const { data: inProgressReviews, isLoading: inProgressLoading } = useQuery<WalkthroughWithDetails[]>({
    queryKey: ["/api/walkthroughs", { assignedReviewer: user?.id, reviewStatus: "in-progress" }],
    enabled: !!user,
  });

  const startReviewMutation = useMutation({
    mutationFn: async (walkthroughId: string) => {
      const response = await apiRequest("POST", `/api/reviews/${walkthroughId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs"] });
      toast({
        title: "Review Started",
        description: "You have started reviewing this walkthrough.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeReviewMutation = useMutation({
    mutationFn: async ({ walkthroughId, feedback, comments }: {
      walkthroughId: string;
      feedback: string;
      comments: string;
    }) => {
      const response = await apiRequest("POST", `/api/reviews/${walkthroughId}/complete`, {
        reviewerFeedback: feedback,
        reviewerComments: comments,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/walkthroughs"] });
      setActiveReview(null);
      setReviewFeedback("");
      setReviewComments("");
      toast({
        title: "Review Completed",
        description: "Your review has been submitted and the observer has been notified.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartReview = (walkthroughId: string) => {
    startReviewMutation.mutate(walkthroughId);
  };

  const handleCompleteReview = () => {
    if (!activeReview) return;
    
    completeReviewMutation.mutate({
      walkthroughId: activeReview,
      feedback: reviewFeedback,
      comments: reviewComments,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="w-4 h-4" />;
      case "medium": return <Clock className="w-4 h-4" />;
      case "low": return <Timer className="w-4 h-4" />;
      default: return <Timer className="w-4 h-4" />;
    }
  };

  const ReviewCard = ({ walkthrough, showActions = true }: { walkthrough: WalkthroughWithDetails; showActions?: boolean }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {walkthrough.teacher.firstName} {walkthrough.teacher.lastName}
            </CardTitle>
            <CardDescription className="mt-1">
              {walkthrough.subject} • {walkthrough.gradeLevel || "No grade level"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {walkthrough.priority && (
              <Badge variant={getPriorityColor(walkthrough.priority)} className="flex items-center gap-1">
                {getPriorityIcon(walkthrough.priority)}
                {walkthrough.priority.toUpperCase()} PRIORITY
              </Badge>
            )}
            {walkthrough.reviewStatus && (
              <Badge variant={
                walkthrough.reviewStatus === "completed" ? "default" :
                walkthrough.reviewStatus === "in-progress" ? "secondary" : "outline"
              }>
                {walkthrough.reviewStatus === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                {walkthrough.reviewStatus === "in-progress" && <Timer className="w-3 h-3 mr-1" />}
                {walkthrough.reviewStatus === "pending" && <AlertCircle className="w-3 h-3 mr-1" />}
                {walkthrough.reviewStatus?.replace("-", " ").toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {format(new Date(walkthrough.dateTime), 'PPp')}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            Observer: {walkthrough.creator.firstName} {walkthrough.creator.lastName}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="w-4 h-4 mr-2" />
            Duration: {walkthrough.duration ? `${walkthrough.duration} minutes` : "Not specified"}
          </div>
          {walkthrough.followUpDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Follow-up: {format(new Date(walkthrough.followUpDate), 'PP')}
            </div>
          )}
        </div>

        {walkthrough.reviewerFeedback && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-medium text-green-900 mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Your Review Feedback
            </h4>
            <p className="text-green-800 text-sm whitespace-pre-wrap">{walkthrough.reviewerFeedback}</p>
          </div>
        )}

        {walkthrough.reviewerComments && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Additional Comments</h4>
            <p className="text-blue-800 text-sm whitespace-pre-wrap">{walkthrough.reviewerComments}</p>
          </div>
        )}

        {showActions && (
          <div className="flex items-center space-x-2">
            <Link href={`/walkthrough/${walkthrough.id}/report`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Report
              </Button>
            </Link>
            
            {walkthrough.reviewStatus === "pending" && (
              <Button 
                onClick={() => handleStartReview(walkthrough.id)}
                disabled={startReviewMutation.isPending}
                size="sm"
              >
                <Timer className="w-4 h-4 mr-2" />
                Start Review
              </Button>
            )}
            
            {walkthrough.reviewStatus === "in-progress" && (
              <Button 
                onClick={() => setActiveReview(walkthrough.id)}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Complete Review
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (pendingLoading || completedLoading || inProgressLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Pending ({pendingReviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            In Progress ({inProgressReviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed ({completedReviews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Reviews</h3>
                <p className="text-gray-600">You don't have any walkthroughs waiting for review at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            pendingReviews?.map((walkthrough) => (
              <ReviewCard key={walkthrough.id} walkthrough={walkthrough} />
            ))
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressReviews?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No In-Progress Reviews</h3>
                <p className="text-gray-600">You don't have any reviews currently in progress.</p>
              </CardContent>
            </Card>
          ) : (
            inProgressReviews?.map((walkthrough) => (
              <ReviewCard key={walkthrough.id} walkthrough={walkthrough} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedReviews?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Reviews</h3>
                <p className="text-gray-600">You haven't completed any reviews yet.</p>
              </CardContent>
            </Card>
          ) : (
            completedReviews?.map((walkthrough) => (
              <ReviewCard key={walkthrough.id} walkthrough={walkthrough} showActions={false} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Completion Modal */}
      {activeReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Complete Review</CardTitle>
              <CardDescription>
                Provide your feedback and comments for this walkthrough review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="feedback">Review Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide detailed feedback about the walkthrough observations, teaching effectiveness, and areas for improvement..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  rows={5}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="comments">Additional Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Any additional comments, suggestions, or follow-up actions..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveReview(null);
                    setReviewFeedback("");
                    setReviewComments("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteReview}
                  disabled={completeReviewMutation.isPending || !reviewFeedback.trim()}
                >
                  {completeReviewMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}