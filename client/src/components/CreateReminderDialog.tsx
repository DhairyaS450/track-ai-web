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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { addEvent } from "@/api/events";
import { Reminder } from "@/types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  reminderTime: z.date({
    required_error: "Reminder time is required",
  }),
  notificationMessage: z.string().optional(),
  frequency: z.enum(["Once", "Daily", "Weekly", "Monthly", "Yearly"]).optional().nullable(),
  interval: z.number().min(1).optional().nullable(),
  endDate: z.date().optional().nullable(),
});

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated: (reminder: Reminder) => void;
  initialReminder?: Reminder | null;
  mode?: "create" | "edit";
}

export function CreateReminderDialog({
  open,
  onOpenChange,
  onReminderCreated,
  initialReminder,
  mode = "create",
}: CreateReminderDialogProps) {
  const { toast } = useToast();
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedTime, setSelectedTime] = useState("12:00");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      reminderTime: new Date(),
      notificationMessage: "",
      frequency: null,
      interval: null,
      endDate: null,
    },
  });

  useEffect(() => {
    if (initialReminder) {
      const reminderDate = new Date(initialReminder.reminderTime || new Date());
      form.reset({
        title: initialReminder.title,
        reminderTime: reminderDate,
        notificationMessage: initialReminder.notificationMessage || "",
        frequency: initialReminder.recurring?.frequency || null,
        interval: initialReminder.recurring?.interval || null,
        endDate: initialReminder.recurring?.endDate ? new Date(initialReminder.recurring.endDate) : null,
      });
      setSelectedTime(format(reminderDate, "HH:mm"));
      setIsRecurring(!!initialReminder.recurring);
    }
  }, [initialReminder, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const reminderTime = new Date(values.reminderTime);
      reminderTime.setHours(hours, minutes, 0, 0);

      const baseReminderData = {
        title: values.title,
        reminderTime: reminderTime.toISOString(),
        notificationMessage: values.notificationMessage || "",
        status: "Active" as const,
        type: "Quick Reminder" as const,
      };

      const reminderData = isRecurring && values.frequency
        ? {
            ...baseReminderData,
            recurring: {
              frequency: values.frequency,
              interval: values.interval || 1,
              endDate: values.endDate?.toISOString(),
            },
          }
        : baseReminderData;

      if (mode === "edit" && initialReminder) {
        onReminderCreated({
          ...reminderData,
          id: initialReminder.id,
          createdAt: initialReminder.createdAt,
          updatedAt: new Date().toISOString(),
        });
      } else {
        onReminderCreated(reminderData as Reminder);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating/updating reminder:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save reminder",
      });
    }
  };

  const handleConvertToEvent = async () => {
    try {
      const reminderTime = form.getValues("reminderTime");
      const eventData = {
        name: form.getValues("title"),
        description: form.getValues("notificationMessage"),
        startTime: format(reminderTime, "yyyy-MM-dd'T'HH:mm"), // Default start time is the same as reminderTime,
        endTime: format(new Date(reminderTime.getTime() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"), // Default 30 min duration
        isAllDay: false,
        isFlexible: false,
        reminders: [{
          type: "minutes" as const,
          amount: 15,
        }],
        source: "manual" as const,
      };

      await addEvent(eventData);

      toast({
        title: "Success",
        description: "Reminder converted to event successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error converting reminder to event:", error);
      toast({
        title: "Error",
        description: "Failed to convert reminder to event",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Reminder" : "Add Reminder"}
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
                    <Input placeholder="Enter reminder title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminderTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Reminder Date & Time</FormLabel>
                  <div className="flex space-x-2">
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
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-[120px]"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notificationMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Message (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter custom notification message" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked: boolean) => setIsRecurring(checked)}
              />
              <label
                htmlFor="recurring"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Recurring Reminder
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Enter interval"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
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
                                <span>Pick an end date</span>
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
              </div>
            )}

            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConvertToEvent}
                  disabled={!form.formState.isValid}
                >
                  Convert to Event
                </Button>
                <Button type="submit" disabled={!form.formState.isValid}>
                  {mode === "create" ? "Create" : "Update"} Reminder
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
