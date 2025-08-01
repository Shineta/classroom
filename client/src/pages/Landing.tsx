import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, Users, TrendingUp, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ClipboardCheck className="text-primary-600 text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Classroom Walkthrough Tool</h1>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Streamline Classroom Observations
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A collaborative platform for instructional teams to conduct, document, and track classroom walkthroughs with real-time collaboration and comprehensive reporting.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <ClipboardCheck className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Observations</h3>
              <p className="text-gray-600">
                Comprehensive forms with ratings, checklists, and detailed feedback sections.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Collaboration</h3>
              <p className="text-gray-600">
                Multiple observers can collaborate on the same walkthrough simultaneously.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor improvement trends and track follow-up actions with detailed analytics.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Reports</h3>
              <p className="text-gray-600">
                Generate detailed summaries and export data for analysis and documentation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="bg-primary-600 rounded-2xl text-white text-center py-16 mt-16">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Observations?</h3>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join educational teams already using our platform to improve instruction and student outcomes.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = "/api/login"}
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
