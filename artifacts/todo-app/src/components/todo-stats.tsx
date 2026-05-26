import { CheckCircle2, Circle, Clock, LayoutList } from "lucide-react";
import { TodoStats as TodoStatsType } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";

interface TodoStatsProps {
  stats?: TodoStatsType;
  isLoading: boolean;
}

export function TodoStats({ stats, isLoading }: TodoStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-4" />
              <div className="h-8 bg-muted rounded w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Total Tasks",
      value: stats.total,
      icon: LayoutList,
      color: "text-foreground",
      bg: "bg-secondary",
    },
    {
      title: "Active",
      value: stats.active,
      icon: Circle,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: Clock,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="border-none shadow-sm bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {item.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
