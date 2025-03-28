import { useMemo, useState, useEffect } from "react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  getDay,
  addMinutes,
  isBefore,
  isAfter
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Task, Event, StudySession, Reminder } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

interface CalendarGridProps {
  date: Date;
  onDateSelect: (date: Date) => void;
  onDateRangeChange: (start: Date, end: Date) => void;
  events: Event[];
  tasks: Task[];
  sessions: StudySession[];
  reminders: Reminder[];
  deadlines: Task[];
  onAddItem: () => void;
  onItemClick: (item: Task | Event | StudySession | Reminder) => void;
}

type CalendarViewType = "day" | "week" | "month" | "schedule";

export function CalendarGrid({
  date,
  onDateSelect,
  onDateRangeChange,
  events,
  tasks,
  sessions,
  reminders,
  deadlines,
  onAddItem,
  onItemClick,
}: CalendarGridProps) {
  const [viewType, setViewType] = useState<CalendarViewType>("week");
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Store data in component state to prevent loss during re-renders
  const [cachedEvents, setCachedEvents] = useState<Event[]>([]);
  const [cachedTasks, setCachedTasks] = useState<Task[]>([]);
  const [cachedSessions, setCachedSessions] = useState<StudySession[]>([]);
  const [cachedReminders, setCachedReminders] = useState<Reminder[]>([]);
  const [cachedDeadlines, setCachedDeadlines] = useState<Task[]>([]);
  
  // Update cached data when props change and are not empty
  useEffect(() => {
    if (events.length > 0) setCachedEvents(events);
    if (tasks.length > 0) setCachedTasks(tasks);
    if (sessions.length > 0) setCachedSessions(sessions);
    if (reminders.length > 0) setCachedReminders(reminders);
    if (deadlines.length > 0) setCachedDeadlines(deadlines);
  }, [events, tasks, sessions, reminders, deadlines]);
  
  // Use cached data or prop data, whichever has content
  const effectiveEvents = events.length > 0 ? events : cachedEvents;
  const effectiveTasks = tasks.length > 0 ? tasks : cachedTasks;
  const effectiveSessions = sessions.length > 0 ? sessions : cachedSessions;
  const effectiveReminders = reminders.length > 0 ? reminders : cachedReminders;
  const effectiveDeadlines = deadlines.length > 0 ? deadlines : cachedDeadlines;
  
  // Debug data at the component level
  console.log(`CalendarGrid rendered with: ${effectiveEvents.length} events, ${effectiveTasks.length} tasks, ${effectiveSessions.length} sessions`);
  
  // Get current view dates
  const viewDates = useMemo(() => {
    switch (viewType) {
      case "day":
        return [date];
      case "week": {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      }
      case "month": {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        // Get day of week for month start (0 = Sunday, 1 = Monday, etc.)
        const startDay = getDay(monthStart);
        // Start from previous month's last days to fill the first week
        const calendarStart = addDays(monthStart, startDay === 0 ? -6 : -(startDay - 1));
        // Add days to fill out the last week
        const endDay = getDay(monthEnd);
        const calendarEnd = addDays(monthEnd, endDay === 0 ? 0 : 7 - endDay);
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      }
      case "schedule":
        return [date];
      default:
        return [date];
    }
  }, [date, viewType]);

  // Move the dateRange update to useEffect instead of during render
  useEffect(() => {
    if (viewDates.length > 0) {
      onDateRangeChange(viewDates[0], viewDates[viewDates.length - 1]);
    }
  }, [viewDates, onDateRangeChange]);

  // Fix the useEffect hook that was resetting view to day on mobile
  useEffect(() => {
    // Only run this effect on initial load, not on subsequent renders
    if (isMobile) {
      const hasInitialized = localStorage.getItem('calendar-mobile-initialized');
      if (!hasInitialized) {
        setViewType("day");
        localStorage.setItem('calendar-mobile-initialized', 'true');
      }
    }
  }, [isMobile]); // Only depend on isMobile, not viewType

  const getAllItemsForDate = (date: Date) => {
    // Force input date to midnight in local timezone for consistent comparison
    const targetDateStr = format(date, "yyyy-MM-dd");
    console.log(`Searching for events on: ${targetDateStr}`);
    console.log(`Available events: ${effectiveEvents.length}, tasks: ${effectiveTasks.length}, sessions: ${effectiveSessions.length}`);
    
    // Debug all events
    effectiveEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      console.log(`Event: ${event.name}, Date: ${format(eventDate, "yyyy-MM-dd")}, Matches: ${format(eventDate, "yyyy-MM-dd") === targetDateStr}`);
    });
    
    // Get events for this day by comparing string dates (most reliable)
    const dayEvents = effectiveEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return format(eventDate, "yyyy-MM-dd") === targetDateStr;
    }).map(event => ({
      id: event.id,
      title: event.name,
      start: new Date(event.startTime),
      end: event.endTime ? new Date(event.endTime) : addMinutes(new Date(event.startTime), 60),
      type: "event" as const,
      isAllDay: event.isAllDay,
      color: "blue",
      item: event
    }));

    // Use the same robust string comparison for tasks
    const dayTasks = effectiveTasks.filter(task => 
      task.timeSlots?.some(slot => {
        const slotDate = new Date(slot.startDate);
        return format(slotDate, "yyyy-MM-dd") === targetDateStr;
      })
    ).flatMap(task => 
      task.timeSlots
        .filter(slot => {
          const slotDate = new Date(slot.startDate);
          return format(slotDate, "yyyy-MM-dd") === targetDateStr;
        })
        .map(slot => ({
          id: `${task.id}-${slot.startDate}`,
          title: task.title,
          start: new Date(slot.startDate),
          end: slot.endDate ? new Date(slot.endDate) : addMinutes(new Date(slot.startDate), 60),
          type: "task" as const,
          isAllDay: false,
          color: "green",
          item: task
        }))
    );

    // Use string comparison for sessions
    const daySessions = effectiveSessions.filter(session => {
      const sessionDate = new Date(session.scheduledFor);
      return format(sessionDate, "yyyy-MM-dd") === targetDateStr;
    }).map(session => ({
      id: session.id,
      title: session.subject,
      start: new Date(session.scheduledFor),
      end: addMinutes(new Date(session.scheduledFor), session.duration),
      type: "session" as const,
      isAllDay: false,
      color: "purple",
      item: session
    }));

    // Use string comparison for reminders
    const dayReminders = effectiveReminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderTime);
      return format(reminderDate, "yyyy-MM-dd") === targetDateStr;
    }).map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      start: new Date(reminder.reminderTime),
      end: addMinutes(new Date(reminder.reminderTime), 30),
      type: "reminder" as const,
      isAllDay: false,
      color: "yellow",
      item: reminder
    }));

    // Use string comparison for deadlines
    const dayDeadlines = effectiveDeadlines.filter(deadline => {
      if (!deadline.deadline) return false;
      const deadlineDate = new Date(deadline.deadline);
      return format(deadlineDate, "yyyy-MM-dd") === targetDateStr;
    }).map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      start: new Date(deadline.deadline),
      end: addMinutes(new Date(deadline.deadline), 30),
      type: "deadline" as const,
      isAllDay: false,
      color: "red",
      item: deadline
    }));

    const allItems = [...dayEvents, ...dayTasks, ...daySessions, ...dayReminders, ...dayDeadlines]
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    console.log(`Total items found for ${targetDateStr}: ${allItems.length}`);
    return allItems;
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "event":
        return "bg-blue-100 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-300";
      case "task":
        return "bg-green-100 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-300";
      case "session":
        return "bg-purple-100 dark:bg-purple-900/20 border-purple-400 text-purple-800 dark:text-purple-300";
      case "reminder":
        return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-300";
      case "deadline":
        return "bg-red-100 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/20 border-gray-400 text-gray-800 dark:text-gray-300";
    }
  };

  // Navigation handlers
  const navigatePrevious = () => {
    switch (viewType) {
      case "day":
        onDateSelect(addDays(date, -1));
        break;
      case "week":
        onDateSelect(addDays(date, -7));
        break;
      case "month":
        onDateSelect(subMonths(date, 1));
        break;
      default:
        onDateSelect(addDays(date, -1));
    }
  };

  const navigateNext = () => {
    switch (viewType) {
      case "day":
        onDateSelect(addDays(date, 1));
        break;
      case "week":
        onDateSelect(addDays(date, 7));
        break;
      case "month":
        onDateSelect(addMonths(date, 1));
        break;
      default:
        onDateSelect(addDays(date, 1));
    }
  };

  const navigateToday = () => {
    onDateSelect(new Date());
  };

  // Calculate position for an event
  const calculateEventPosition = (start: Date, end: Date) => {
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 24); // Min height of 24px
    
    return { top, height };
  };

  // Check if events overlap
  const doEventsOverlap = (event1: any, event2: any) => {
    return isBefore(event1.start, event2.end) && isAfter(event1.end, event2.start);
  };

  // Detect conflicts between calendar items
  const detectConflicts = (items: any[]) => {
    if (!items.length) return new Map<string, boolean>();
    
    const conflictMap = new Map<string, boolean>();
    
    // Check each item against all others for overlaps
    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];
      
      // Skip all-day events and non-conflicting item types (deadlines and reminders)
      if (item1.isAllDay || item1.type === "deadline" || item1.type === "reminder") continue;
      
      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        
        // Skip all-day events and non-conflicting item types (deadlines and reminders)
        if (item2.isAllDay || item2.type === "deadline" || item2.type === "reminder") continue;
        
        // Check if the items overlap
        if (doEventsOverlap(item1, item2)) {
          conflictMap.set(item1.id, true);
          conflictMap.set(item2.id, true);
        }
      }
    }
    
    return conflictMap;
  };

  // Memoize event columns calculation
  const calculateEventColumns = (events: any[]) => {
    if (!events.length) return [];
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Assign columns to events
    const eventColumns: any[] = [];
    sortedEvents.forEach(event => {
      // Find the first column where the event doesn't overlap with existing events
      let column = 0;
      while (eventColumns[column]?.some((existingEvent: any) => doEventsOverlap(existingEvent, event))) {
        column++;
      }
      
      // Initialize the column if it doesn't exist
      if (!eventColumns[column]) {
        eventColumns[column] = [];
      }
      
      // Add the event to the column
      eventColumns[column].push(event);
    });
    
    return eventColumns;
  };

  // Render the calendar view
  return (
    <div className="space-y-4">
      {isMobile ? (
        // Mobile optimized header
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={navigateToday}>
              Today
            </Button>
            <h2 className="text-lg font-bold text-center">
              {viewType === "day" ? (
                format(date, "MMM d, yyyy")
              ) : viewType === "week" ? (
                `${format(viewDates[0], "MMM d")} - ${format(viewDates[viewDates.length - 1], "MMM d")}`
              ) : (
                format(date, "MMMM yyyy")
              )}
            </h2>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={onAddItem}>
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <select 
              className="h-7 border rounded px-1 text-xs bg-muted"
              value={viewType}
              onChange={(e) => setViewType(e.target.value as CalendarViewType)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="schedule">Schedule</option>
            </select>
          </div>
        </div>
      ) : (
        // Desktop layout (unchanged)
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex space-x-2 items-center">
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">
              {viewType === "day" ? (
                format(date, "MMMM d, yyyy")
              ) : viewType === "week" ? (
                `${format(viewDates[0], "MMM d")} - ${format(viewDates[viewDates.length - 1], "MMM d, yyyy")}`
              ) : (
                format(date, "MMMM yyyy")
              )}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tabs value={viewType} onValueChange={(val) => setViewType(val as CalendarViewType)}>
              <TabsList>
                <TabsTrigger value="day" className="px-2 py-1 text-xs">Day</TabsTrigger>
                <TabsTrigger value="week" className="px-2 py-1 text-xs">Week</TabsTrigger>
                <TabsTrigger value="month" className="px-2 py-1 text-xs">Month</TabsTrigger>
                <TabsTrigger value="schedule" className="px-2 py-1 text-xs">Schedule</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button size="sm" variant="outline" onClick={onAddItem}>
              <CalendarIcon className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto pb-4">
        {viewType === "day" && (
          <div className="min-w-full">
            <div className="grid grid-cols-1 gap-4">
              <Card className="overflow-hidden">
                <CardHeader className="p-2 text-center bg-muted">
                  <div className="font-medium">
                    {format(date, "EEEE")}
                  </div>
                  <div className="text-2xl font-bold">
                    {format(date, "d")}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                    {/* Time slots */}
                    {TIME_SLOTS.map((hour) => (
                      <div 
                        key={hour} 
                        className="absolute w-full border-t border-gray-200 dark:border-gray-800 flex"
                        style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      >
                        <div className="w-12 text-xs text-gray-500 pr-2 text-right">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                      </div>
                    ))}
                    
                    {/* Events */}
                    {(() => {
                      // Force a re-evaluation of the available events in this render context
                      console.log(`Day view rendering with: ${effectiveEvents.length} events, ${effectiveTasks.length} tasks, ${effectiveSessions.length} sessions`);
                      const targetDateStr = format(date, "yyyy-MM-dd");
                      
                      
                      
                      // Get events with direct filtering to ensure data is processed
                      const dayEvents = effectiveEvents
                        .filter(event => {
                          const eventDate = new Date(event.startTime);
                          return format(eventDate, "yyyy-MM-dd") === targetDateStr;
                        })
                        .map(event => ({
                          id: event.id,
                          title: event.name,
                          start: new Date(event.startTime),
                          end: event.endTime ? new Date(event.endTime) : addMinutes(new Date(event.startTime), 60),
                          type: "event" as const,
                          isAllDay: event.isAllDay,
                          color: "blue",
                          item: event
                        }));
                      
                      // Similar direct processing for other item types
                      const dayTasks = effectiveTasks
                        .filter(task => 
                          task.timeSlots?.some(slot => {
                            const slotDate = new Date(slot.startDate);
                            return format(slotDate, "yyyy-MM-dd") === targetDateStr;
                          })
                        )
                        .flatMap(task => 
                          task.timeSlots
                            .filter(slot => {
                              const slotDate = new Date(slot.startDate);
                              return format(slotDate, "yyyy-MM-dd") === targetDateStr;
                            })
                            .map(slot => ({
                              id: `${task.id}-${slot.startDate}`,
                              title: task.title,
                              start: new Date(slot.startDate),
                              end: slot.endDate ? new Date(slot.endDate) : addMinutes(new Date(slot.startDate), 60),
                              type: "task" as const,
                              isAllDay: false,
                              color: "green",
                              item: task
                            }))
                        );
                      
                      const daySessions = effectiveSessions
                        .filter(session => {
                          const sessionDate = new Date(session.scheduledFor);
                          return format(sessionDate, "yyyy-MM-dd") === targetDateStr;
                        })
                        .map(session => ({
                          id: session.id,
                          title: session.subject,
                          start: new Date(session.scheduledFor),
                          end: addMinutes(new Date(session.scheduledFor), session.duration),
                          type: "session" as const,
                          isAllDay: false,
                          color: "purple",
                          item: session
                        }));
                      
                      const dayReminders = effectiveReminders
                        .filter(reminder => {
                          const reminderDate = new Date(reminder.reminderTime);
                          return format(reminderDate, "yyyy-MM-dd") === targetDateStr;
                        })
                        .map(reminder => ({
                          id: reminder.id,
                          title: reminder.title,
                          start: new Date(reminder.reminderTime),
                          end: addMinutes(new Date(reminder.reminderTime), 30),
                          type: "reminder" as const,
                          isAllDay: false,
                          color: "yellow",
                          item: reminder
                        }));
                      
                      const dayDeadlines = effectiveDeadlines
                        .filter(deadline => {
                          if (!deadline.deadline) return false;
                          const deadlineDate = new Date(deadline.deadline);
                          return format(deadlineDate, "yyyy-MM-dd") === targetDateStr;
                        })
                        .map(deadline => ({
                          id: deadline.id,
                          title: deadline.title,
                          start: new Date(deadline.deadline),
                          end: addMinutes(new Date(deadline.deadline), 30),
                          type: "deadline" as const,
                          isAllDay: false,
                          color: "red",
                          item: deadline
                        }));
                      
                      const allItems = [...dayEvents, ...dayTasks, ...daySessions, ...dayReminders, ...dayDeadlines]
                        .sort((a, b) => a.start.getTime() - b.start.getTime());
                      
                      console.log(`Day view direct calculation - items found for ${targetDateStr}: ${allItems.length}`);
                      
                      if (allItems.length === 0) {
                        return (
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground">
                            No events for this day
                          </div>
                        );
                      }
                      
                      const columns = calculateEventColumns(allItems);
                      
                      // Detect conflicts for visual indication
                      const conflictMap = detectConflicts(allItems);
                      
                      return columns.map((column, colIndex) => 
                        column.map((event: any) => {
                          const { top, height } = calculateEventPosition(event.start, event.end);
                          const colWidth = 100 / (columns.length || 1);
                          const hasConflict = conflictMap.get(event.id);
                          
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "absolute rounded-md border-l-4 p-1 overflow-hidden shadow-sm cursor-pointer",
                                getTypeStyles(event.type)
                              )}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `${12 + (colIndex * colWidth)}%`,
                                width: `${colWidth - 1}%`,
                              }}
                              onClick={() => onItemClick(event.item)}
                            >
                              <div className="text-xs font-medium truncate">
                                {event.title} {hasConflict && <span className="ml-1">⚠️</span>}
                              </div>
                              <div className="text-xs opacity-80">
                                {format(event.start, "h:mm a")}
                                {!isSameDay(event.start, event.end) && " - " + format(event.end, "h:mm a")}
                              </div>
                            </div>
                          );
                        })
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {viewType === "week" && (
          <div className={cn("w-full", isMobile ? "min-w-full" : "min-w-[800px]")}>
            <div className={cn(
              "grid gap-1", 
              isMobile ? "grid-cols-7" : "grid-cols-7 gap-4"
            )}>
              {viewDates.map((day) => (
                <Card 
                  key={day.toISOString()} 
                  className={cn(
                    "overflow-hidden",
                    isSameDay(day, new Date()) && "border-blue-500",
                    isMobile && "border-[1px]"
                  )}
                >
                  <CardHeader 
                    className={cn(
                      "cursor-pointer text-center",
                      isSameMonth(day, date) ? "bg-muted" : "bg-muted/50",
                      isMobile ? "p-1" : "p-2"
                    )}
                    onClick={() => {
                      onDateSelect(day);
                      setViewType("day");
                    }}
                  >
                    <div className={cn("font-medium", isMobile && "text-xs")}>
                      {format(day, "EEE")}
                    </div>
                    <div className={cn("font-bold", isMobile ? "text-base" : "text-2xl")}>
                      {format(day, "d")}
                    </div>
                  </CardHeader>
                  <CardContent className={cn(
                    "p-0 overflow-y-auto", 
                    isMobile ? "h-[120px]" : "h-[300px]"
                  )}>
                    <ScrollArea className="h-full">
                      {(() => {
                        const items = getAllItemsForDate(day);
                        const conflictMap = detectConflicts(items);
                        return items.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "rounded border-l-2 cursor-pointer",
                              getTypeStyles(event.type),
                              isMobile ? "m-0.5 p-0.5 text-[10px]" : "m-1 p-1 text-xs"
                            )}
                            onClick={() => onItemClick(event.item)}
                          >
                            <div className="font-medium truncate">
                              {event.title} {conflictMap.get(event.id) && <span className="ml-1">⚠️</span>}
                            </div>
                            {!isMobile && (
                              <div className="text-xs opacity-80">
                                {format(event.start, "h:mm a")}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {viewType === "month" && (
          <div className={cn("w-full", isMobile ? "min-w-full" : "min-w-[800px]")}>
            <div className="grid grid-cols-7 gap-1">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <div key={index} className={cn(
                  "text-center font-medium text-sm",
                  isMobile ? "py-1 text-xs" : "py-2"
                )}>
                  {day}
                </div>
              ))}
              
              {viewDates.map((day) => (
                <Card 
                  key={day.toISOString()}
                  className={cn(
                    "overflow-hidden border",
                    isSameDay(day, new Date()) && "border-blue-500",
                    !isSameMonth(day, date) && "opacity-50",
                    isMobile ? "h-[80px]" : "h-[120px]",
                    isMobile && "border-[1px]"
                  )}
                  onClick={() => {
                    onDateSelect(day);
                    setViewType("day");
                  }}
                >
                  <div className={cn(
                    "border-b text-right",
                    isMobile ? "p-0.5" : "p-1"
                  )}>
                    <span className={cn(
                      "inline-block rounded-full text-center",
                      isSameDay(day, new Date()) && "bg-blue-500 text-white",
                      isMobile ? "w-4 h-4 text-[10px] leading-4" : "w-6 h-6 text-xs leading-6"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <ScrollArea className={isMobile ? "h-[55px]" : "h-[90px]"}>
                    <div className={cn(
                      "space-y-1",
                      isMobile ? "p-0.5" : "p-1"
                    )}>
                      {(() => {
                        const items = getAllItemsForDate(day);
                        const conflictMap = detectConflicts(items);
                        return items.slice(0, isMobile ? 2 : 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "truncate rounded border-l-2",
                              getTypeStyles(event.type),
                              isMobile ? "px-0.5 text-[8px]" : "px-1 text-xs"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(event.item);
                            }}
                          >
                            {event.title} {conflictMap.get(event.id) && <span className="ml-1">⚠️</span>}
                          </div>
                        ));
                      })()}
                      {getAllItemsForDate(day).length > (isMobile ? 2 : 3) && (
                        <div className={cn(
                          "text-center text-muted-foreground",
                          isMobile ? "text-[8px]" : "text-xs"
                        )}>
                          +{getAllItemsForDate(day).length - (isMobile ? 2 : 3)} more
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {viewType === "schedule" && (
          <Card className="w-full">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Schedule - {format(date, "MMMM d, yyyy")}</h3>
              <div className="space-y-3">
                <ScheduleView 
                  date={date}
                  events={effectiveEvents}
                  tasks={effectiveTasks}
                  sessions={effectiveSessions}
                  reminders={effectiveReminders}
                  deadlines={effectiveDeadlines}
                  onItemClick={onItemClick}
                  getTypeStyles={getTypeStyles}
                  detectConflicts={detectConflicts}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Separate component for Schedule view to avoid IIFE type issues
function ScheduleView({
  date,
  events,
  tasks,
  sessions,
  reminders,
  deadlines,
  onItemClick,
  getTypeStyles,
  detectConflicts
}: {
  date: Date;
  events: Event[];
  tasks: Task[];
  sessions: StudySession[];
  reminders: Reminder[];
  deadlines: Task[];
  onItemClick: (item: any) => void;
  getTypeStyles: (type: string) => string;
  detectConflicts: (items: any[]) => Map<string, boolean>;
}) {
  // Force a re-evaluation of the available events in this render context
  console.log(`Schedule view rendering with: ${events.length} events, ${tasks.length} tasks, ${sessions.length} sessions`);
  const targetDateStr = format(date, "yyyy-MM-dd");
  
  // Get events with direct filtering to ensure data is processed
  const dayEvents = events
    .filter(event => {
      const eventDate = new Date(event.startTime);
      const matches = format(eventDate, "yyyy-MM-dd") === targetDateStr;
      console.log(`Schedule view event check: ${event.name}, Date: ${format(eventDate, "yyyy-MM-dd")}, Matches: ${matches}`);
      return matches;
    })
    .map(event => ({
      id: event.id,
      title: event.name,
      start: new Date(event.startTime),
      end: event.endTime ? new Date(event.endTime) : addMinutes(new Date(event.startTime), 60),
      type: "event" as const,
      isAllDay: event.isAllDay,
      color: "blue",
      item: event
    }));
  
  // Similar direct processing for other item types
  const dayTasks = tasks
    .filter(task => 
      task.timeSlots?.some(slot => {
        const slotDate = new Date(slot.startDate);
        return format(slotDate, "yyyy-MM-dd") === targetDateStr;
      })
    )
    .flatMap(task => 
      task.timeSlots
        .filter(slot => {
          const slotDate = new Date(slot.startDate);
          return format(slotDate, "yyyy-MM-dd") === targetDateStr;
        })
        .map(slot => ({
          id: `${task.id}-${slot.startDate}`,
          title: task.title,
          start: new Date(slot.startDate),
          end: slot.endDate ? new Date(slot.endDate) : addMinutes(new Date(slot.startDate), 60),
          type: "task" as const,
          isAllDay: false,
          color: "green",
          item: task
        }))
    );
  
  const daySessions = sessions
    .filter(session => {
      const sessionDate = new Date(session.scheduledFor);
      return format(sessionDate, "yyyy-MM-dd") === targetDateStr;
    })
    .map(session => ({
      id: session.id,
      title: session.subject,
      start: new Date(session.scheduledFor),
      end: addMinutes(new Date(session.scheduledFor), session.duration),
      type: "session" as const,
      isAllDay: false,
      color: "purple",
      item: session
    }));
  
  const dayReminders = reminders
    .filter(reminder => {
      const reminderDate = new Date(reminder.reminderTime);
      return format(reminderDate, "yyyy-MM-dd") === targetDateStr;
    })
    .map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      start: new Date(reminder.reminderTime),
      end: addMinutes(new Date(reminder.reminderTime), 30),
      type: "reminder" as const,
      isAllDay: false,
      color: "yellow",
      item: reminder
    }));
  
  const dayDeadlines = deadlines
    .filter(deadline => {
      if (!deadline.deadline) return false;
      const deadlineDate = new Date(deadline.deadline);
      return format(deadlineDate, "yyyy-MM-dd") === targetDateStr;
    })
    .map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      start: new Date(deadline.deadline),
      end: addMinutes(new Date(deadline.deadline), 30),
      type: "deadline" as const,
      isAllDay: false,
      color: "red",
      item: deadline
    }));
  
  const allItems = [...dayEvents, ...dayTasks, ...daySessions, ...dayReminders, ...dayDeadlines]
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  
  console.log(`Schedule view direct calculation - items found for ${targetDateStr}: ${allItems.length}`);
  
  if (allItems.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-4">
        No items scheduled for this day
      </div>
    );
  }
  
  // Detect conflicts for schedule view
  const conflictMap = detectConflicts(allItems);
  
  return (
    <>
      {allItems.map(item => (
        <div
          key={item.id}
          className={cn(
            "flex items-center border-l-4 rounded-md p-3 cursor-pointer",
            getTypeStyles(item.type)
          )}
          onClick={() => onItemClick(item.item)}
        >
          <div className="flex-1">
            <div className="flex items-center">
              <div className="font-medium">{item.title}</div>
              {conflictMap.get(item.id) && (
                <div className="ml-2 text-amber-500">⚠️</div>
              )}
            </div>
            <div className="text-muted-foreground text-sm">
              {format(item.start, "h:mm a")} - {format(item.end, "h:mm a")}
            </div>
          </div>
        </div>
      ))}
    </>
  );
} 