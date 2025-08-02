import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Teacher, Location } from "@shared/schema";

interface FilterBarProps {
  filters: {
    search: string;
    teacherId: string;
    locationId: string;
    subject: string;
    dateRange: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const { isAuthenticated } = useAuth();

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
    enabled: isAuthenticated,
  });

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    enabled: isAuthenticated,
  });

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value === "all" ? "" : value });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search teachers, subjects..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
            <Select
              value={filters.teacherId}
              onValueChange={(value) => handleFilterChange("teacherId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <Select
              value={filters.locationId}
              onValueChange={(value) => handleFilterChange("locationId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <Select
              value={filters.subject}
              onValueChange={(value) => handleFilterChange("subject", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Computer Science Essentials">Computer Science Essentials</SelectItem>
                <SelectItem value="Computer Science A">Computer Science A</SelectItem>
                <SelectItem value="Web Dev (Intro)">Web Dev (Intro)</SelectItem>
                <SelectItem value="Robotics">Robotics</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="English Language Arts">English Language Arts</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Social Studies">Social Studies</SelectItem>
                <SelectItem value="Art">Art</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Physical Education">Physical Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange("dateRange", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="custom-range">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
