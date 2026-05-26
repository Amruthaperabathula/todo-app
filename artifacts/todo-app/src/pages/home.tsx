import { useState } from "react";
import { LayoutList, Plus } from "lucide-react";
import { 
  useListTodos, 
  useGetTodoStats,
  ListTodosStatus,
  ListTodosPriority 
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { TodoStats } from "@/components/todo-stats";
import { TodoItem } from "@/components/todo-item";
import { TodoFormDialog } from "@/components/todo-form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ListTodosStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<ListTodosPriority | "all">("all");

  const { data: todos, isLoading: todosLoading } = useListTodos({
    status: statusFilter === "all" ? undefined : statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
  });

  const { data: stats, isLoading: statsLoading } = useGetTodoStats();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl shadow-sm">
              T
            </div>
            <h1 className="text-xl font-bold tracking-tight">Focus List</h1>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-full shadow-sm hover-elevate">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Good to see you.</h2>
          <p className="text-muted-foreground text-lg">Here's a look at your productivity today.</p>
        </div>

        <TodoStats stats={stats} isLoading={statsLoading} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold">Your Tasks</h3>
          <div className="flex items-center gap-3">
            <Select 
              value={statusFilter} 
              onValueChange={(val) => setStatusFilter(val as ListTodosStatus)}
            >
              <SelectTrigger className="w-[140px] bg-card border-none shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={priorityFilter} 
              onValueChange={(val) => setPriorityFilter(val as ListTodosPriority | "all")}
            >
              <SelectTrigger className="w-[140px] bg-card border-none shadow-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {todosLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border bg-card">
                <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : todos && todos.length > 0 ? (
            todos.map((todo, index) => (
              <TodoItem key={todo.id} todo={todo} index={index} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <LayoutList className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No tasks found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                {statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? "We couldn't find any tasks matching your current filters."
                  : "Your list is completely clear. Enjoy the calm, or add a new task to get started."}
              </p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                <Plus className="w-4 h-4 mr-2" />
                Add your first task
              </Button>
            </div>
          )}
        </div>
      </main>

      <TodoFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
