import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
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
import { createDeadline, updateDeadline } from "@/api/deadlines";
import { Deadline } from "@/types";
import { useToast } from "@/hooks/useToast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  priority: z.enum(["Low", "Medium", "High"]),
  category: z.string().min(1, "Category is required"),
});

interface CreateDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeadlineCreated: () => void;
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialDeadline?.title || "",
      dueDate: initialDeadline?.dueDate ? new Date(initialDeadline.dueDate) : new Date(),
      priority: (initialDeadline?.priority as "Low" | "Medium" | "High") || "Medium",
      category: initialDeadline?.category || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (mode === "edit" && initialDeadline) {
        await updateDeadline(initialDeadline.id, {
          ...values,
          dueDate: values.dueDate.toISOString(),
        });
        toast({
          title: "Success",
          description: "Deadline updated successfully",
        });
      } else {
        await createDeadline({
          ...values,
          dueDate: values.dueDate.toISOString(),
          status: "Pending",
        });
        toast({
          title: "Success",
          description: "Deadline created successfully",
        });
      }
      onDeadlineCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating/updating deadline:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save deadline",
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
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
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
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

            <Button type="submit" className="w-full">
              {mode === "edit" ? "Update Deadline" : "Create Deadline"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
