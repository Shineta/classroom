import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Download, CheckCircle, Clock, Star, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import type { WalkthroughWithDetails } from "@shared/schema";

interface WalkthroughListProps {
  walkthroughs: WalkthroughWithDetails[];
  loading: boolean;
  filters: {
    search: string;
    teacherId: string;
    subject: string;
    dateRange: string;
  };
}

export default function WalkthroughList({ walkthroughs, loading, filters }: WalkthroughListProps) {
  if (loading) {
    return <div className="text-center py-8">Loading walkthroughs...</div>;
  }

  if (!walkthroughs || walkthroughs.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No walkthroughs</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new walkthrough.</p>
      </div>
    );
  }

  // Filter walkthroughs based on search and filters
  const filteredWalkthroughs = walkthroughs.filter((walkthrough) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const teacherName = `${walkthrough.teacher.firstName} ${walkthrough.teacher.lastName}`.toLowerCase();
      const subject = walkthrough.subject.toLowerCase();
      const observerNames = walkthrough.observers
        .map(obs => `${obs.observer.firstName} ${obs.observer.lastName}`)
        .join(" ")
        .toLowerCase();
      
      if (!teacherName.includes(searchLower) && 
          !subject.includes(searchLower) && 
          !observerNames.includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.teacherId && walkthrough.teacherId !== filters.teacherId) {
      return false;
    }
    
    if (filters.subject && !walkthrough.subject.toLowerCase().includes(filters.subject.toLowerCase())) {
      return false;
    }
    
    // Date range filtering would be more complex and require actual date parsing
    // For now, we'll keep it simple
    
    return true;
  });

  const getStatusBadge = (status: string, followUpNeeded?: boolean) => {
    if (status === "completed" && followUpNeeded) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Follow-up Needed
        </Badge>
      );
    }
    
    if (status === "completed") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        Draft
      </Badge>
    );
  };

  const getSubjectBadge = (subject: string) => {
    const colors: Record<string, string> = {
      "Mathematics": "bg-blue-100 text-blue-800",
      "English Language Arts": "bg-purple-100 text-purple-800",
      "Science": "bg-green-100 text-green-800",
      "Social Studies": "bg-orange-100 text-orange-800",
      "Art": "bg-pink-100 text-pink-800",
      "Music": "bg-indigo-100 text-indigo-800",
      "Physical Education": "bg-red-100 text-red-800",
    };
    
    return (
      <Badge className={colors[subject] || "bg-gray-100 text-gray-800"}>
        {subject}
      </Badge>
    );
  };

  const getEngagementStars = (level?: string) => {
    if (!level) return null;
    
    const rating = parseInt(level);
    return (
      <div className="flex items-center">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredWalkthroughs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No walkthroughs found</h3>
            <p>Try adjusting your filters or create a new walkthrough.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Walkthroughs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observer(s)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWalkthroughs.map((walkthrough) => (
              <tr key={walkthrough.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {walkthrough.teacher.firstName} {walkthrough.teacher.lastName}
                    </div>
                    {walkthrough.teacher.gradeLevel && (
                      <div className="text-sm text-gray-500">
                        Grade {walkthrough.teacher.gradeLevel}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getSubjectBadge(walkthrough.subject)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {walkthrough.observers
                    .map(obs => `${obs.observer.firstName} ${obs.observer.lastName}`)
                    .join(", ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(walkthrough.dateTime), "MMM dd, yyyy")}
                  <br />
                  <span className="text-xs">
                    {format(new Date(walkthrough.dateTime), "h:mm a")}
                    {walkthrough.duration && ` - ${walkthrough.duration}m`}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getEngagementStars(walkthrough.engagementLevel)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(walkthrough.status, walkthrough.followUpNeeded)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link href={`/walkthrough/${walkthrough.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/walkthrough/${walkthrough.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
