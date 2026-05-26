import { format } from "date-fns";
import { Check, Clock, Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Todo,
  useToggleTodo,
  useDeleteTodo,
  getListTodosQueryKey,
  getGetTodoStatsQueryKey
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { TodoFormDialog } from "./todo-form-dialog";

interface TodoItemProps {
  todo: Todo;
  index: number;
}

const priorityColors = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-accent/20 text-accent",
  high: "bg-destructive/10 text-destructive",
};

export function TodoItem({ todo, index }: TodoItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const toggleMutation = useToggleTodo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update status.",
          variant: "destructive",
        });
      },
    },
  });

  const deleteMutation = useDeleteTodo({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Todo deleted",
          description: "The task has been permanently removed.",
        });
        queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
        setShowDelete(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete the task.",
          variant: "destructive",
        });
      },
    },
  });

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <>
      <div 
        className={`group relative flex items-start gap-4 p-4 rounded-xl border bg-card transition-all duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4`}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
        data-testid={`todo-item-${todo.id}`}
      >
        <div className="pt-1">
          <Checkbox 
            checked={todo.completed} 
            onCheckedChange={() => toggleMutation.mutate({ id: todo.id })}
            className="h-6 w-6 rounded-full border-2 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            data-testid={`checkbox-toggle-${todo.id}`}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-lg truncate transition-colors ${todo.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {todo.title}
            </h3>
            <Badge variant="secondary" className={`${priorityColors[todo.priority]} border-none uppercase text-[10px] px-2 py-0.5 font-bold tracking-wider`}>
              {todo.priority}
            </Badge>
          </div>
          
          {todo.description && (
            <p className={`text-sm mb-3 line-clamp-2 ${todo.completed ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
              {todo.description}
            </p>
          )}

          {todo.dueDate && (
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isOverdue ? 'Overdue: ' : 'Due: '}
                {format(new Date(todo.dueDate), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => setShowEdit(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDelete(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TodoFormDialog 
        open={showEdit} 
        onOpenChange={setShowEdit} 
        todoId={todo.id} 
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              "{todo.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate({ id: todo.id });
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
