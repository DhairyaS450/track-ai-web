import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { updateDeadline } from "@/api/deadlines";
import { addTask } from "@/api/tasks";
import { Deadline, DeadlineStatus } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  priority: z.enum(["Low", "Medium", "High"]),
  category: z.string(),
});

interface CreateDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeadlineCreated: (deadline: Deadline) => void;
  initialDeadline?: Deadline | null;
  mode?: "create" | "edit";
}

export function CreateDeadlineDialog({
  open,
  onOpenChange,
  onDeadlineCreated,
  initialDeadline,
  mode = "create",
}: CreateDeadlineDialogProps) {
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [selectedTime, setSelectedTime] = useState<string>("00:00");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      dueDate: new Date(),
      priority: "Medium",
      category: "",
    },
  });

  useEffect(() => {
    if (initialDeadline && mode === "edit") {
      try {
        const dueDate = initialDeadline.dueDate ? new Date(initialDeadline.dueDate) : new Date();
        if (!isNaN(dueDate.getTime())) {
          setSelectedTime(format(dueDate, "HH:mm"));
          form.reset({
            title: initialDeadline.title,
            dueDate: dueDate,
            priority: initialDeadline.priority || "Medium",
            category: initialDeadline.category || "",
          });
        } else {
          console.error("Invalid date from initialDeadline:", initialDeadline.dueDate);
          const now = new Date();
          setSelectedTime(format(now, "HH:mm"));
          form.reset({
            title: initialDeadline.title,
            dueDate: now,
            priority: initialDeadline.priority || "Medium",
            category: initialDeadline.category || "",
          });
        }
      } catch (error) {
        console.error("Error processing initialDeadline date:", error);
        const now = new Date();
        setSelectedTime(format(now, "HH:mm"));
        form.reset({
          title: initialDeadline.title,
          dueDate: now,
          priority: initialDeadline.priority || "Medium",
          category: initialDeadline.category || "",
        });
      }
    }
  }, [initialDeadline, mode]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const dueDate = new Date(values.dueDate);
      dueDate.setHours(hours, minutes, 0, 0);

      const deadlineData = {
        title: values.title,
        dueDate: dueDate.toISOString(),
        priority: values.priority,
        category: values.category,
        status: "Pending" as DeadlineStatus
      };

      if (mode === "edit" && initialDeadline) {
        onDeadlineCreated({
          ...deadlineData,
          id: initialDeadline.id,
          createdAt: initialDeadline.createdAt,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: "Success",
          description: "Deadline updated successfully",
        });
      } else {
        onDeadlineCreated(deadlineData as Deadline);
        toast({
          title: "Success",
          description: "Deadline created successfully",
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating/updating deadline:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create/update deadline",
      });
    }
  };

  const handleConvertToTask = async () => {
    try {
      const status : 'todo' | 'in-progress' | 'completed' = 'todo'
      const taskData = {
        title: form.getValues("title"),
        description: "",
        priority: form.getValues("priority").toLowerCase() as "High" | "Medium" | "Low",
        deadline: form.getValues("dueDate").toISOString(),
        timeSlots: [],
        status: status,
        subject: form.getValues("category"),
        completion: 0,
        source: "manual" as const,
      };

      const { task } = await addTask(taskData);
      
      if (initialDeadline) {
        // Update the deadline with the associated task ID
        await updateDeadline(initialDeadline.id, {
          associatedTaskId: task.id,
        });
      }

      toast({
        title: "Success",
        description: "Deadline converted to task successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error converting deadline to task:", error);
      toast({
        title: "Error",
        description: "Failed to convert deadline to task",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Deadline" : "Add Deadline"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter deadline title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center">
                  <FormLabel className="md:w-1/3">Due Date & Time</FormLabel>
                  <div className="flex flex-col md:flex-row space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {isMobile ? (
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="mt-2 w-[120px]"
                      />
                    ) : (
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="mt-0 w-[120px]"
                      />
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConvertToTask}
                  disabled={!form.formState.isValid}
                >
                  Convert to Task
                </Button>
                <Button type="submit" disabled={!form.formState.isValid}>
                  {mode === "create" ? "Create" : "Update"} Deadline
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
