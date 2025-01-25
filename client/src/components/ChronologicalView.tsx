import { Task, Event, StudySession, Deadline, Reminder } from "@/types";
import { format, isSameDay, isBefore, isAfter } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  BookOpen,
  Bell,
} from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChronologicalViewProps {
  date: Date;
  tasks: Task[];
  events: Event[];
  sessions: StudySession[];
  deadlines: Deadline[];
  reminders: Reminder[];
  onItemClick: (item: Task | Event | StudySession | Deadline | Reminder) => void;
}

interface TimeSlotItem {
  id: string;
  type: 'task' | 'event' | 'session' | 'deadline' | 'reminder';
  title: string;
  startTime: string;
  endTime?: string;
  isDeadline?: boolean;
  isReminder?: boolean;
  priority?: string;
  item: Task | Event | StudySession | Deadline | Reminder;
}

export function ChronologicalView({
  date,
  tasks,
  events,
  sessions,
  deadlines,
  reminders,
  onItemClick,
}: ChronologicalViewProps) {
  // Combine all items into a single array with normalized structure
  const allItems: TimeSlotItem[] = [
    ...tasks.flatMap((task) =>
      task.timeSlots.map((slot) => ({
        id: `task-${task.id}-${slot.startDate}`,
        type: "task" as const,
        title: task.title,
        startTime: slot.startDate,
        endTime: slot.endDate,
        item: task,
      }))
    ),
    ...events.map((event) => ({
      id: `event-${event.id}`,
      type: "event" as const,
      title: event.name,
      startTime: event.startTime,
      endTime: event.endTime,
      item: event,
    })),
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      type: "session" as const,
      title: session.subject,
      startTime: session.scheduledFor,
      endTime: format(new Date(
        new Date(session.scheduledFor).getTime() + session.duration * 60000
      ), 'yyyy-MM-dd HH:mm'),
      item: session,
    })),
    ...deadlines.map((deadline) => ({
      id: `deadline-${deadline.id}`,
      type: "deadline" as const,
      title: deadline.title,
      startTime: deadline.dueDate,
      isDeadline: true,
      priority: deadline.priority,
      item: deadline,
    })),
    ...reminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      type: "reminder" as const,
      title: reminder.title,
      startTime: reminder.reminderTime,
      isReminder: true,
      item: reminder,
    })),
  ].filter((item) => isSameDay(new Date(item.startTime), date));

  // Sort items by start time using 24-hour format for proper AM/PM sorting
  allItems.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return timeA - timeB;
  });

  // Group items by hour
  const itemsByHour: Record<string, TimeSlotItem[]> = {};
  allItems.forEach(item => {
    const hour = format(new Date(item.startTime), 'HH');
    if (!itemsByHour[hour]) {
      itemsByHour[hour] = [];
    }
    itemsByHour[hour].push(item);
  });

  // Sort hours numerically
  // const sortedHours = Object.keys(itemsByHour).sort((a, b) => parseInt(a) - parseInt(b));

  // Check if time overlaps
  const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return isBefore(start1, end2) && isAfter(end1, start2);
  };

  // Check for time conflicts (only for non-deadline items)
  const hasConflict = (item: TimeSlotItem) => {
    if (!item.endTime || item.isDeadline || item.isReminder) return false;
    return allItems.some(
      (other) =>
        other.id !== item.id &&
        other.endTime &&
        !other.isDeadline &&
        isOverlapping(
          new Date(item.startTime),
          new Date(item.endTime!),
          new Date(other.startTime),
          new Date(other.endTime)
        )
    );
  };

  const getItemStyle = (type: string, isDeadline?: boolean) => {
    switch (type) {
      case "task":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "event":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "session":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      case "reminder":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "deadline":
        return isDeadline
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "";
    }
  };

  const getItemIcon = (type: string, isDeadline?: boolean) => {
    if (isDeadline) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }

    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "event":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "session":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "reminder":
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case "deadline":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-20rem)]">
      <div className="space-y-4">
        {Object.entries(itemsByHour).map(([hour, items]) => (
          <div key={hour} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {format(new Date().setHours(parseInt(hour), 0), 'h a')}
            </h4>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                    getItemStyle(item.type, item.isDeadline),
                    item.priority && item.priority === "High" && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                    item.priority && item.priority === "Medium" && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
                    item.priority && item.priority === "Low" && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                    hasConflict(item) && 
                      "ring-2 ring-red-500 dark:ring-red-400"
                  )}
                  onClick={() => onItemClick(item.item)}
                >
                  {hasConflict(item) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Time conflict</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {getItemIcon(item.type, item.isDeadline)}
                  <div className="flex-1 ml-2">
                    <div className="truncate">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.startTime), "h:mm a")}
                        {item.endTime && ` - ${format(new Date(item.endTime), "h:mm a")}`}
                      </p>
                    </div>
                  </div>
                  {item.priority && (
                    <Badge
                      variant={
                        item.priority === "High"
                          ? "destructive"
                          : item.priority === "Medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.priority}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {allItems.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No events scheduled for this day
          </p>
        )}
      </div>
    </ScrollArea>
  );
}