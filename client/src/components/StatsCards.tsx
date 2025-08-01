import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Calendar, UserCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  total: number;
  thisWeek: number;
  teachersObserved: number;
  avgDuration: number;
}

export default function StatsCards() {
  const { isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Walkthroughs",
      value: stats?.total || 0,
      icon: ClipboardList,
      iconColor: "text-primary-600",
    },
    {
      title: "This Week",
      value: stats?.thisWeek || 0,
      icon: Calendar,
      iconColor: "text-secondary-600",
    },
    {
      title: "Teachers Observed",
      value: stats?.teachersObserved || 0,
      icon: UserCheck,
      iconColor: "text-accent-600",
    },
    {
      title: "Avg. Duration",
      value: `${stats?.avgDuration || 0}m`,
      icon: Clock,
      iconColor: "text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <IconComponent className={`text-2xl ${card.iconColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
