import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Todo,
  useCreateTodo,
  useUpdateTodo,
  useGetTodo,
  getListTodosQueryKey,
  getGetTodoStatsQueryKey,
  getGetTodoQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional().nullable(),
});

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todoId?: number;
}

export function TodoFormDialog({ open, onOpenChange, todoId }: TodoFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEdit = !!todoId;

  const { data: todo, isLoading: isFetching } = useGetTodo(
    todoId!, 
    { query: { enabled: !!todoId && open, queryKey: getGetTodoQueryKey(todoId!) } }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: null,
    },
  });

  useEffect(() => {
    if (todo && isEdit) {
      form.reset({
        title: todo.title,
        description: todo.description || "",
        priority: todo.priority,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      });
    } else if (!isEdit) {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        dueDate: null,
      });
    }
  }, [todo, isEdit, form, open]);

  const createMutation = useCreateTodo({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Task created",
          description: "Your new task has been added.",
        });
        queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
        form.reset();
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create task.",
          variant: "destructive",
        });
      },
    },
  });

  const updateMutation = useUpdateTodo({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Task updated",
          description: "Your changes have been saved.",
        });
        queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
        if (todoId) {
          queryClient.invalidateQueries({ queryKey: getGetTodoQueryKey(todoId) });
        }
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update task.",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
    };

    if (isEdit && todoId) {
      updateMutation.mutate({ id: todoId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Make changes to your task here." 
              : "Add a new task to your list. Fill out the details below."}
          </DialogDescription>
        </DialogHeader>
        
        {isEdit && isFetching ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="What needs to be done?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any extra details here..." 
                        className="resize-none h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
