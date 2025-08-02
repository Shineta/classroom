import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, User, GraduationCap, FileText, Star, Clock, Users } from "lucide-react";
import type { WalkthroughWithDetails } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function WalkthroughReport() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const walkthroughId = params.id;

  const { data: walkthrough, isLoading } = useQuery<WalkthroughWithDetails>({
    queryKey: ["/api/walkthroughs", walkthroughId],
    enabled: isAuthenticated && !!walkthroughId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!walkthrough) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Walkthrough Not Found</h2>
            <p className="text-gray-600 mb-6">The requested walkthrough could not be found.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingDisplay = (rating: string | undefined) => {
    if (!rating) return "Not Rated";
    const numRating = parseInt(rating);
    return (
      <div className="flex items-center">
        <span className="mr-2">{rating}/5</span>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= numRating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Header - Only visible when printing */}
      <div className="print:block hidden text-center py-4 border-b">
        <h1 className="text-2xl font-bold text-gray-900">Classroom Walkthrough Report</h1>
        <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Screen Header - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Walkthrough Report</h1>
          </div>
          <Button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700">
            <FileText className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-0">
        {/* Basic Information */}
        <Card className="mb-6 print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Walkthrough Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">Teacher:</span>
                <span className="ml-2">{walkthrough.teacher.firstName} {walkthrough.teacher.lastName}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">Location:</span>
                <span className="ml-2">{walkthrough.location.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">Date & Time:</span>
                <span className="ml-2">{formatDate(walkthrough.dateTime)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">Subject:</span>
                <span className="ml-2">{walkthrough.subject}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">Grade Level:</span>
                <span className="ml-2">{walkthrough.gradeLevel || 'Not specified'}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  walkthrough.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {walkthrough.status === 'completed' ? 'Completed' : 'Draft'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Information */}
        {walkthrough.lessonObjective && (
          <Card className="mb-6 print:shadow-none print:border-0">
            <CardHeader>
              <CardTitle>Lesson Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lesson Objective</h4>
                  <p className="text-gray-700">{walkthrough.lessonObjective}</p>
                </div>
                {walkthrough.evidenceOfLearning && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Evidence of Learning</h4>
                    <p className="text-gray-700">{walkthrough.evidenceOfLearning}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classroom Observations */}
        <Card className="mb-6 print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle>Classroom Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Behavior & Routines */}
            {walkthrough.behaviorRoutines && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Behavior Management & Routines</h4>
                {(walkthrough.behaviorRoutines as any)?.routines?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Observed Routines:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                      {(walkthrough.behaviorRoutines as any).routines.map((routine: string, index: number) => (
                        <li key={index}>{routine}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(walkthrough.behaviorRoutines as any)?.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Notes:</p>
                    <p className="text-gray-600 text-sm">{(walkthrough.behaviorRoutines as any).notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Classroom Climate */}
            {walkthrough.climate && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Classroom Climate</h4>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 mr-3">Rating:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    walkthrough.climate === 'warm' ? 'bg-green-100 text-green-800' :
                    walkthrough.climate === 'neutral' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {walkthrough.climate === 'warm' ? '😊 Warm' : 
                     walkthrough.climate === 'neutral' ? '😐 Neutral' : '😟 Tense'}
                  </span>
                </div>
                {walkthrough.climateNotes && (
                  <p className="text-gray-600 text-sm">{walkthrough.climateNotes}</p>
                )}
              </div>
            )}

            {/* Student Engagement */}
            {walkthrough.engagementLevel && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Student Engagement Level</h4>
                <div className="flex items-center">
                  <span className="mr-3 text-sm font-medium text-gray-700">Rating:</span>
                  <span className="text-lg font-semibold text-primary-600">{walkthrough.engagementLevel}/5</span>
                  <div className="flex ml-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= parseInt(walkthrough.engagementLevel || "0") 
                            ? "text-yellow-400 fill-current" 
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transitions */}
            {walkthrough.transitions && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Transitions</h4>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 mr-3">Rating:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    walkthrough.transitions === 'smooth' ? 'bg-green-100 text-green-800' :
                    walkthrough.transitions === 'adequate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {walkthrough.transitions.charAt(0).toUpperCase() + walkthrough.transitions.slice(1)}
                  </span>
                </div>
                {walkthrough.transitionComments && (
                  <p className="text-gray-600 text-sm">{walkthrough.transitionComments}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teaching Effectiveness Ratings */}
        {walkthrough.effectivenessRatings && Object.keys(walkthrough.effectivenessRatings as any).length > 0 && (
          <Card className="mb-6 print:shadow-none print:border-0">
            <CardHeader>
              <CardTitle>Teaching Effectiveness Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(walkthrough.effectivenessRatings as any).map(([key, value]) => {
                  if (!value) return null;
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{label}</span>
                      {getRatingDisplay(value as string)}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section */}
        <Card className="mb-6 print:shadow-none print:border-0">
          <CardHeader>
            <CardTitle>Feedback & Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {walkthrough.strengths && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Strengths Observed</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{walkthrough.strengths}</p>
                </div>
              </div>
            )}

            {walkthrough.areasForGrowth && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Areas for Growth & Suggestions</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{walkthrough.areasForGrowth}</p>
                </div>
              </div>
            )}

            {walkthrough.additionalComments && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Additional Comments</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{walkthrough.additionalComments}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Actions */}
        {(walkthrough.followUpNeeded || walkthrough.assignedReviewer || walkthrough.followUpDate || walkthrough.priority) && (
          <Card className="mb-6 print:shadow-none print:border-0">
            <CardHeader>
              <CardTitle>Follow-up Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {walkthrough.followUpNeeded && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">Follow-up meeting required</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {walkthrough.assignedReviewer && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Assigned Reviewer:</span>
                    <p className="text-sm text-gray-600 mt-1">{walkthrough.assignedReviewer}</p>
                  </div>
                )}
                
                {walkthrough.followUpDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Follow-up Date:</span>
                    <p className="text-sm text-gray-600 mt-1">{new Date(walkthrough.followUpDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {walkthrough.priority && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Priority Level:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      walkthrough.priority === 'high' ? 'bg-red-100 text-red-800' :
                      walkthrough.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {walkthrough.priority.charAt(0).toUpperCase() + walkthrough.priority.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Footer - Only visible when printing */}
        <div className="print:block hidden text-center py-6 border-t">
          <p className="text-sm text-gray-600">
            This report was generated from the Classroom Walkthrough Tool
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Walkthrough ID: {walkthrough.id}
          </p>
        </div>
      </div>
    </div>
  );
}