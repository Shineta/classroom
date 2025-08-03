import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import WalkthroughForm from "@/pages/WalkthroughForm";
import WalkthroughReport from "@/pages/WalkthroughReport";
import WalkthroughEdit from "@/pages/WalkthroughEdit";
import CoachDashboard from "@/pages/CoachDashboard";
import CoachInsights from "@/pages/CoachInsights";
import LeadershipDashboard from "@/pages/LeadershipDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import LessonPlanForm from "@/pages/LessonPlanForm";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Get user role for role-based routing
  const userRole = (user as any)?.role;

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={AuthPage} />
        </>
      ) : userRole === "teacher" ? (
        // Teacher-only routes - no walkthrough/observation access
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/teacher/dashboard" component={TeacherDashboard} />
          <Route path="/lesson-plan/new" component={() => <LessonPlanForm lessonPlanId="new" />} />
          <Route path="/lesson-plan/:id/edit" component={({ params }) => <LessonPlanForm lessonPlanId={params.id} />} />
          {/* Redirect any other routes to teacher dashboard */}
          <Route component={() => <TeacherDashboard />} />
        </>
      ) : (
        // All other roles (observer, admin, coach, leadership) have full access
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/walkthrough/new" component={WalkthroughForm} />
          <Route path="/walkthrough/:id/edit" component={WalkthroughEdit} />
          <Route path="/walkthrough/:id/report" component={WalkthroughReport} />
          <Route path="/walkthrough/:id" component={WalkthroughForm} />
          <Route path="/coach/dashboard" component={CoachDashboard} />
          <Route path="/coach/insights" component={CoachInsights} />
          <Route path="/leadership/dashboard" component={LeadershipDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/teacher/dashboard" component={TeacherDashboard} />
          <Route path="/lesson-plan/new" component={() => <LessonPlanForm lessonPlanId="new" />} />
          <Route path="/lesson-plan/:id/edit" component={({ params }) => <LessonPlanForm lessonPlanId={params.id} />} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
