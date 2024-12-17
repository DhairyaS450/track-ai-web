import { useState } from "react";
import { Task, Event, StudySession } from "@/types";
import { format, isSameDay, isBefore, isAfter } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  BookOpen,
  Clock,
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
  deadlines: Task[];
  onItemClick: (item: Task | Event | StudySession) => void;
}

interface TimeSlotItem {
  id: string;
  type: 'task' | 'event' | 'session' | 'deadline';
  title: string;
  startTime: string;
  endTime?: string;
  isDeadline?: boolean;
  item: Task | Event | StudySession;
}

export function ChronologicalView({
  date,
  tasks,
  events,
  sessions,
  deadlines,
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
    ...deadlines.map((task) => ({
      id: `deadline-${task.id}`,
      type: "deadline" as const,
      title: task.title,
      startTime: task.deadline,
      isDeadline: true,
      item: task,
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
  const sortedHours = Object.keys(itemsByHour).sort((a, b) => parseInt(a) - parseInt(b));

  // Check if time overlaps
  const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
    return isBefore(start1, end2) && isAfter(end1, start2);
  };

  // Check for time conflicts (only for non-deadline items)
  const hasConflict = (item: TimeSlotItem) => {
    if (!item.endTime || item.isDeadline) return false;
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
    if (isDeadline) {
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    }

    switch (type) {
      case "task":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "event":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "session":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
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
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
      <div className="space-y-2">
        {sortedHours.map((hour) => (
          <div key={hour} className="group">
            <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-2">
              <div className="w-16 text-sm font-medium text-muted-foreground">
                {format(new Date(`2000-01-01T${hour}:00`), "h:mm a")}
              </div>
              <div className="h-px flex-1 bg-border group-first:bg-transparent" />
            </div>
            <div className="ml-16 space-y-2">
              {itemsByHour[hour].map((item) => (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent cursor-pointer relative",
                          getItemStyle(item.type, item.isDeadline),
                          hasConflict(item) &&
                            "ring-2 ring-red-500 dark:ring-red-400"
                        )}
                        onClick={() => onItemClick(item.item)}
                      >
                        {hasConflict(item) && (
                          <AlertTriangle className="absolute -top-2 -right-2 h-4 w-4 text-red-500" />
                        )}
                        {getItemIcon(item.type, item.isDeadline)}
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(item.startTime), "h:mm a")}
                            {item.endTime && !item.isDeadline && (
                              <>
                                {" - "}
                                {format(new Date(item.endTime), "h:mm a")}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {'priority' in item.item && item.item.priority && (
                            <Badge variant={
                              item.item.priority === 'High'
                                ? 'destructive'
                                : item.item.priority === 'Medium'
                                ? 'default'
                                : 'secondary'
                            }>
                              {item.item.priority}
                            </Badge>
                          )}
                          {'completion' in item.item && (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${item.item.completion}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {item.item.completion}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-sm">
                      <div className="space-y-2">
                        {'description' in item.item && item.item.description && (
                          <p className="text-sm">{item.item.description}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        ))}

        {allItems.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No items scheduled for this day
          </div>
        )}
      </div>
    </ScrollArea>
  );
}