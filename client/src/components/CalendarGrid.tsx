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

  // Auto-switch to day view on mobile
  useEffect(() => {
    if (isMobile && viewType !== "day") {
      setViewType("day");
    }
  }, [isMobile, viewType]);

  const getAllItemsForDate = (date: Date) => {
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.startTime), date)
    ).map(event => ({
      id: event.id,
      title: event.name,
      start: new Date(event.startTime),
      end: event.endTime ? new Date(event.endTime) : addMinutes(new Date(event.startTime), 60),
      type: "event" as const,
      isAllDay: event.isAllDay,
      color: "blue",
      item: event
    }));

    const dayTasks = tasks.filter(task => 
      task.timeSlots?.some(slot => isSameDay(new Date(slot.startDate), date))
    ).flatMap(task => 
      task.timeSlots
        .filter(slot => isSameDay(new Date(slot.startDate), date))
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

    const daySessions = sessions.filter(session => 
      isSameDay(new Date(session.scheduledFor), date)
    ).map(session => ({
      id: session.id,
      title: session.subject,
      start: new Date(session.scheduledFor),
      end: addMinutes(new Date(session.scheduledFor), session.duration),
      type: "session" as const,
      isAllDay: false,
      color: "purple",
      item: session
    }));

    const dayReminders = reminders.filter(reminder => 
      isSameDay(new Date(reminder.reminderTime), date)
    ).map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      start: new Date(reminder.reminderTime),
      end: addMinutes(new Date(reminder.reminderTime), 30),
      type: "reminder" as const,
      isAllDay: false,
      color: "yellow",
      item: reminder
    }));

    const dayDeadlines = deadlines.filter(deadline => 
      deadline.deadline && isSameDay(new Date(deadline.deadline), date)
    ).map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      start: new Date(deadline.deadline),
      end: addMinutes(new Date(deadline.deadline), 30),
      type: "deadline" as const,
      isAllDay: false,
      color: "red",
      item: deadline
    }));

    return [...dayEvents, ...dayTasks, ...daySessions, ...dayReminders, ...dayDeadlines]
      .sort((a, b) => a.start.getTime() - b.start.getTime());
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
              {!isMobile && <TabsTrigger value="week" className="px-2 py-1 text-xs">Week</TabsTrigger>}
              {!isMobile && <TabsTrigger value="month" className="px-2 py-1 text-xs">Month</TabsTrigger>}
              <TabsTrigger value="schedule" className="px-2 py-1 text-xs">Schedule</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button size="sm" variant="outline" onClick={onAddItem}>
            <CalendarIcon className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
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
                      const events = getAllItemsForDate(date);
                      const columns = calculateEventColumns(events);
                      
                      return columns.map((column, colIndex) => 
                        column.map((event: any) => {
                          const { top, height } = calculateEventPosition(event.start, event.end);
                          const colWidth = 100 / (columns.length || 1);
                          
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
                                {event.title}
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
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-4">
              {viewDates.map((day) => (
                <Card key={day.toISOString()} className={cn(
                  "overflow-hidden",
                  isSameDay(day, new Date()) && "border-blue-500",
                )}>
                  <CardHeader 
                    className={cn(
                      "p-2 text-center cursor-pointer",
                      isSameMonth(day, date) ? "bg-muted" : "bg-muted/50"
                    )}
                    onClick={() => {
                      onDateSelect(day);
                      setViewType("day");
                    }}
                  >
                    <div className="font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(day, "d")}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 h-[300px] overflow-y-auto">
                    <ScrollArea className="h-full">
                      {getAllItemsForDate(day).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "m-1 p-1 rounded border-l-2 text-xs cursor-pointer",
                            getTypeStyles(event.type)
                          )}
                          onClick={() => onItemClick(event.item)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-80">
                            {format(event.start, "h:mm a")}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {viewType === "month" && (
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center font-medium py-2 text-sm">
                  {day}
                </div>
              ))}
              
              {viewDates.map((day) => (
                <Card 
                  key={day.toISOString()}
                  className={cn(
                    "h-[120px] overflow-hidden border",
                    isSameDay(day, new Date()) && "border-blue-500",
                    !isSameMonth(day, date) && "opacity-50"
                  )}
                  onClick={() => {
                    onDateSelect(day);
                    setViewType("day");
                  }}
                >
                  <div className="p-1 border-b text-right">
                    <span className={cn(
                      "inline-block w-6 h-6 rounded-full text-center leading-6 text-xs",
                      isSameDay(day, new Date()) && "bg-blue-500 text-white"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <ScrollArea className="h-[90px]">
                    <div className="p-1 space-y-1">
                      {getAllItemsForDate(day).slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "px-1 text-xs truncate rounded border-l-2",
                            getTypeStyles(event.type)
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemClick(event.item);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {getAllItemsForDate(day).length > 3 && (
                        <div className="text-xs text-center text-muted-foreground">
                          +{getAllItemsForDate(day).length - 3} more
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
                {getAllItemsForDate(date).length > 0 ? (
                  getAllItemsForDate(date).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-2 rounded border-l-4 cursor-pointer",
                        getTypeStyles(event.type)
                      )}
                      onClick={() => onItemClick(event.item)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm">
                          {format(event.start, "h:mm a")}
                          {" - "}
                          {format(event.end, "h:mm a")}
                        </div>
                      </div>
                      <div className="text-sm mt-1 capitalize">
                        {event.type}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No scheduled items for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 