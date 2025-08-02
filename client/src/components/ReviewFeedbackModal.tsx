import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  CalendarDays, 
  BookOpen, 
  MapPin,
  Save,
  Send,
  Star,
  MessageSquare,
  FileText,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { WalkthroughWithDetails } from "@shared/schema";

interface ReviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  walkthrough: WalkthroughWithDetails;
  onComplete: () => void;
}

export function ReviewFeedbackModal({
  isOpen,
  onClose,
  walkthrough,
  onComplete,
}: ReviewFeedbackModalProps) {
  const { toast } = useToast();
  const [reviewerFeedback, setReviewerFeedback] = useState(walkthrough.reviewerFeedback || "");
  const [reviewerComments, setReviewerComments] = useState(walkthrough.reviewerComments || "");
  const [isDraft, setIsDraft] = useState(true);

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/walkthroughs/${walkthrough.id}`, {
        reviewerFeedback,
        reviewerComments,
      });
    },
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "Your feedback has been saved as a draft.",
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

  const completeReviewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/reviews/${walkthrough.id}/complete`, {
        reviewerFeedback,
        reviewerComments,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Completed",
        description: "The review has been completed and the observer has been notified.",
      });
      onComplete();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const handleSubmitReview = () => {
    if (!reviewerFeedback.trim()) {
      toast({
        title: "Missing Feedback",
        description: "Please provide reviewer feedback before submitting.",
        variant: "destructive",
      });
      return;
    }
    completeReviewMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Review Walkthrough - {walkthrough.teacher.firstName} {walkthrough.teacher.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[70vh]">
          {/* Left Pane - Original Observation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Original Observation</h3>
            </div>

            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {/* Walkthrough Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Walkthrough Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span><strong>Teacher:</strong> {walkthrough.teacher.firstName} {walkthrough.teacher.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span><strong>Subject:</strong> {walkthrough.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        <span><strong>Date:</strong> {formatDate(walkthrough.dateTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span><strong>Location:</strong> {walkthrough.location.name}</span>
                      </div>
                    </div>
                    
                    {walkthrough.gradeLevel && (
                      <div className="text-sm">
                        <strong>Grade Level:</strong> {walkthrough.gradeLevel}
                      </div>
                    )}
                    
                    {walkthrough.priority && (
                      <div>
                        <Badge variant="outline" className={
                          walkthrough.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                          walkthrough.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }>
                          {walkthrough.priority.charAt(0).toUpperCase() + walkthrough.priority.slice(1)} Priority
                        </Badge>
                      </div>
                    )}
                    
                    {walkthrough.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span><strong>Duration:</strong> {walkthrough.duration} minutes</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lesson Objective */}
                {walkthrough.lessonObjective && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Lesson Objective</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{walkthrough.lessonObjective}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Engagement Level */}
                {walkthrough.engagementLevel && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Engagement Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className={`h-4 w-4 ${getRatingColor(parseInt(walkthrough.engagementLevel))}`} />
                          <span className={`font-semibold ${getRatingColor(parseInt(walkthrough.engagementLevel))}`}>
                            {walkthrough.engagementLevel}/5
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Student Engagement Level</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Climate */}
                {walkthrough.climate && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Classroom Climate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <Badge variant="outline" className={
                          walkthrough.climate === 'warm' ? 'bg-green-100 text-green-800 border-green-200' :
                          walkthrough.climate === 'neutral' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }>
                          {walkthrough.climate.charAt(0).toUpperCase() + walkthrough.climate.slice(1)}
                        </Badge>
                        {walkthrough.climateNotes && (
                          <p className="text-gray-700 mt-2">{walkthrough.climateNotes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Evidence of Learning */}
                {walkthrough.evidenceOfLearning && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Evidence of Learning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{walkthrough.evidenceOfLearning}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Strengths */}
                {walkthrough.strengths && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{walkthrough.strengths}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Areas for Growth */}
                {walkthrough.areasForGrowth && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Areas for Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{walkthrough.areasForGrowth}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Comments */}
                {walkthrough.additionalComments && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Additional Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{walkthrough.additionalComments}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Pane - Review Feedback Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Review Feedback</h3>
            </div>

            <div className="space-y-6 h-full flex flex-col">
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="reviewerFeedback" className="text-base font-medium">
                    Reviewer Feedback <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Provide comprehensive feedback on the observation, including instructional insights and recommendations.
                  </p>
                  <Textarea
                    id="reviewerFeedback"
                    value={reviewerFeedback}
                    onChange={(e) => setReviewerFeedback(e.target.value)}
                    placeholder="Enter your detailed feedback on the observation, teaching strategies, and instructional effectiveness..."
                    className="min-h-[200px] resize-none"
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="reviewerComments" className="text-base font-medium">
                    Next Steps & Action Items
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Outline specific next steps, follow-up actions, or professional development recommendations.
                  </p>
                  <Textarea
                    id="reviewerComments"
                    value={reviewerComments}
                    onChange={(e) => setReviewerComments(e.target.value)}
                    placeholder="List specific action items, follow-up meetings, resources, or professional development recommendations..."
                    className="min-h-[150px] resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                </Button>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={completeReviewMutation.isPending || !reviewerFeedback.trim()}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {completeReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}