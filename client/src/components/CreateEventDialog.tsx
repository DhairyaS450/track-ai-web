import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useToast } from "@/hooks/useToast";
import { Event, Task } from "@/types";
import { ScrollArea } from "./ui/scroll-area";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ExternalUpdateDialog } from "./ExternalUpdateDialog";
import { updateCalendarEvent } from "@/api/calendar";
import { DateTimeRangePicker, DateTimeRange } from "./ui/date-time-range-picker";
import { format, parseISO } from "date-fns";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: (event: Event) => void;
  initialEvent?: Event | null;
  mode?: "create" | "edit";
  tasks?: Task[];
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onEventCreated,
  initialEvent,
  mode = "create",
  tasks = [],
}: CreateEventDialogProps) {
  const [name, setName] = useState(initialEvent?.name || "");
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>(() => {
    if (initialEvent) {
      const startDate = initialEvent.startTime ? new Date(initialEvent.startTime) : new Date();
      const endDate = initialEvent.endTime ? new Date(initialEvent.endTime) : new Date();
      return { from: startDate, to: endDate };
    }
    // Default: start now, end in 1 hour
    const now = new Date();
    const inOneHour = new Date(now);
    inOneHour.setHours(inOneHour.getHours() + 1);
    return { from: now, to: inOneHour };
  });
  const [isAllDay, setIsAllDay] = useState(initialEvent?.isAllDay || false);
  const [isFlexible, setIsFlexible] = useState(initialEvent?.isFlexible || false);
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low" | undefined>(
    initialEvent?.priority
  );
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly" | undefined>(
    initialEvent?.recurrence
  );
  const [reminders, setReminders] = useState(initialEvent?.reminders || []);
  const [associatedTaskIds, setAssociatedTaskIds] = useState<string[]>(
    initialEvent?.associatedTaskIds || []
  );
  const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newlyCreatedEvent, setNewlyCreatedEvent] = useState<Event | null>(null);

  const isMobile = useMediaQuery("(max-width: 640px)");
  const { toast } = useToast();

  useEffect(() => {
    if (initialEvent) {
      setName(initialEvent.name);
      if (initialEvent.startTime) {
        const startDate = new Date(initialEvent.startTime);
        const endDate = initialEvent.endTime ? new Date(initialEvent.endTime) : new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
        setDateTimeRange({ from: startDate, to: endDate });
      }
      setIsAllDay(initialEvent.isAllDay);
      setIsFlexible(initialEvent.isFlexible);
      setLocation(initialEvent.location || "");
      setDescription(initialEvent.description || "");
      setCategory(initialEvent.category || "");
      setPriority(initialEvent.priority);
      setRecurrence(initialEvent.recurrence);
      setReminders(initialEvent.reminders || []);
      setAssociatedTaskIds(initialEvent.associatedTaskIds || []);
    } else {
      setName("");
      // Reset to default time range
      const now = new Date();
      const inOneHour = new Date(now);
      inOneHour.setHours(inOneHour.getHours() + 1);
      setDateTimeRange({ from: now, to: inOneHour });
      setIsAllDay(false);
      setIsFlexible(false);
      setLocation("");
      setDescription("");
      setCategory("");
      setPriority(undefined);
      setRecurrence(undefined);
      setReminders([]);
      setAssociatedTaskIds([]);
    }
  }, [initialEvent]);

  const addReminder = () => {
    setReminders([...reminders, { type: 'minutes', amount: 15 }]);
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const formatDateForEvent = (date: Date): string => {
    if (isAllDay) {
      return format(date, "yyyy-MM-dd");
    }
    return date.toISOString();
  };

  const handleSubmit = async () => {
    try {
      if (!dateTimeRange.from || !dateTimeRange.to) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please specify both start and end times",
        });
        return;
      }
      
      // Ensure end time is after start time
      if (dateTimeRange.to < dateTimeRange.from) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "End time must be after start time",
        });
        return;
      }

      const eventData = {
        name,
        startTime: formatDateForEvent(dateTimeRange.from),
        endTime: formatDateForEvent(dateTimeRange.to),
        isAllDay,
        isFlexible,
        location,
        description,
        category,
        priority,
        recurrence,
        reminders,
        associatedTaskIds,
        source: initialEvent?.source || 'manual',
        calendarId: initialEvent?.calendarId,
        id: initialEvent?.id
      };

      onEventCreated(eventData as Event);
      if (mode === "edit" && initialEvent?.source === "google_calendar") {
        setNewlyCreatedEvent(eventData as Event);
        setUpdateDialogOpen(true);
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save event",
      });
      console.error("Error saving event:", error);
    }
  };

  const handleConfirmUpdate = async (event: Event | null) => {
    try {
      if (!event) {
        return;
      }
      const calendarUpdates = {
        summary: event.name,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.isAllDay ? undefined : new Date(event.startTime).toISOString(),
          date: event.isAllDay ? event.startTime.split('T')[0] : undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.isAllDay ? undefined : new Date(event.endTime).toISOString(),
          date: event.isAllDay ? event.endTime.split('T')[0] : undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      if (!event.calendarId || !event.id) {
        throw new Error("Missing calendar ID or event ID");
      }

      await updateCalendarEvent(event.calendarId, event.id, calendarUpdates);
      toast({
        title: "Success",
        description: "Event updated in Google Calendar",
      });
    } catch (error) {
      console.error("Error updating event on Google Calendar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update event on Google Calendar",
      });
    } finally {
      setUpdateDialogOpen(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[600px] ${isMobile ? 'px-4' : ''} bg-background`}>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-8rem)] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Event Time*</Label>
              <DateTimeRangePicker
                dateTimeRange={dateTimeRange}
                setDateTimeRange={setDateTimeRange}
                showTime={!isAllDay}
                disabled={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAllDay"
                  checked={isAllDay}
                  onCheckedChange={setIsAllDay}
                />
                <Label htmlFor="isAllDay">All-day event</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFlexible"
                  checked={isFlexible}
                  onCheckedChange={setIsFlexible}
                />
                <Label htmlFor="isFlexible">Flexible time</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category (e.g., work, school, personal)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <RadioGroup
                value={priority}
                onValueChange={(value) => setPriority(value as "High" | "Medium" | "Low")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="High" id="priority-high" />
                  <Label htmlFor="priority-high">High</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Medium" id="priority-medium" />
                  <Label htmlFor="priority-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Low" id="priority-low" />
                  <Label htmlFor="priority-low">Low</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <Select
                value={recurrence}
                onValueChange={(value) => setRecurrence(value as "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Reminders</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminder}
                >
                  Add Reminder
                </Button>
              </div>
              <div className="space-y-2">
                {reminders.map((reminder, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={reminder.amount}
                      onChange={(e) => {
                        const newReminders = [...reminders];
                        newReminders[index].amount = parseInt(e.target.value);
                        setReminders(newReminders);
                      }}
                      className="w-20"
                    />
                    <Select
                      value={reminder.type}
                      onValueChange={(value: "minutes" | "hours" | "days") => {
                        const newReminders = [...reminders];
                        newReminders[index].type = value;
                        setReminders(newReminders);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReminder(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {tasks.length > 0 && (
              <div className="grid gap-2">
                <Label>Associated Tasks</Label>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={associatedTaskIds.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssociatedTaskIds([...associatedTaskIds, task.id]);
                          } else {
                            setAssociatedTaskIds(
                              associatedTaskIds.filter((id) => id !== task.id)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {mode === "edit" ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <ExternalUpdateDialog
      open={isUpdateDialogOpen}
      title="Update Google Calendar Event"
      dialogContent="Do you want to update the event on Google Calendar?"
      note="This will update the event on Google Calendar with the changes made in the app."
      onConfirm={() => handleConfirmUpdate(newlyCreatedEvent)}
      onCancel={() => setUpdateDialogOpen(false)}
    />
    </>
  );
}