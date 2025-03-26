import { useMemo, useState } from "react";
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
  getDate,
  differenceInMinutes,
  addMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, Event, StudySession, Reminder } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";

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
  
  // Get current view dates
  const viewDates = useMemo(() => {
    switch (viewType) {
      case "day":
        return [date];
      case "week":
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      case "month":
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
      case "schedule":
        return [date];
      default:
        return [date];
    }
  }, [date, viewType]);

  // Calculate date range for the current view
  useMemo(() => {
    if (viewDates.length > 0) {
      onDateRangeChange(viewDates[0], viewDates[viewDates.length - 1]);
    }
  }, [viewDates, onDateRangeChange]);

  // Format items for display
  const formatTimeString = (timeString: string) => {
    try {
      return format(new Date(timeString), "HH:mm");
    } catch {
      return "00:00";
    }
  };

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
      task.timeSlots.filter(slot => isSameDay(new Date(slot.startDate), date))
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
      isSameDay(new Date(deadline.deadline), date)
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

  // Calculate columns for overlapping events
  const calculateEventColumns = (events: any[]) => {
    if (events.length === 0) return events;
    
    const eventWithColumns = events.map(event => ({ ...event, column: 0, span: 1 }));
    const columns: any[][] = [[]];
    
    eventWithColumns.forEach(event => {
      // Find the first column where the event doesn't overlap with existing events
      let columnIndex = 0;
      while (
        columns[columnIndex]?.some(existingEvent => 
          doEventsOverlap(existingEvent, event)
        )
      ) {
        columnIndex++;
        if (!columns[columnIndex]) columns[columnIndex] = [];
      }
      
      event.column = columnIndex;
      columns[columnIndex].push(event);
    });
    
    // Calculate total columns and spans
    const totalColumns = columns.length;
    eventWithColumns.forEach(event => {
      event.span = 1;
      event.totalColumns = totalColumns;
    });
    
    return eventWithColumns;
  };

  // Render different views
  const renderDayView = () => {
    const dayItems = getAllItemsForDate(date);
    const itemsWithColumns = calculateEventColumns(dayItems);
    
    return (
      <div className="relative h-[1440px]"> {/* 24 hours * 60px per hour */}
        {/* Time labels */}
        <div className="absolute left-0 w-16 h-full border-r border-gray-200 dark:border-gray-800 z-10 bg-background">
          {TIME_SLOTS.map((hour) => (
            <div 
              key={hour} 
              className="flex items-start justify-end pr-2 h-[60px] text-xs text-muted-foreground"
              style={{ transform: 'translateY(-0.5rem)' }}
            >
              {format(setHours(date, hour), 'h a')}
            </div>
          ))}
        </div>
        
        {/* Current time indicator */}
        <div 
          className="absolute left-16 right-0 h-[1px] bg-red-500 z-20 pointer-events-none"
          style={{ 
            top: ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_HEIGHT
          }}
        >
          <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
        </div>
        
        {/* Hour grid lines */}
        <div className="absolute left-16 right-0 h-full">
          {TIME_SLOTS.map((hour) => (
            <div 
              key={hour} 
              className="h-[60px] border-t border-gray-200 dark:border-gray-800"
            >
              <div className="h-[30px] border-b border-dashed border-gray-200 dark:border-gray-800 opacity-50" />
            </div>
          ))}
        </div>
        
        {/* Events */}
        <div className="absolute left-16 right-0 h-full pointer-events-none">
          {itemsWithColumns.map((item) => {
            const { top, height } = calculateEventPosition(item.start, item.end);
            const width = 100 / item.totalColumns;
            const left = (item.column * width);
            
            return (
              <div
                key={item.id}
                className={cn(
                  "absolute rounded-md border p-2 overflow-hidden pointer-events-auto cursor-pointer",
                  getTypeStyles(item.type)
                )}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `${left}%`,
                  width: `${width}%`,
                }}
                onClick={() => onItemClick(item.item)}
              >
                <div className="font-medium text-xs truncate">{item.title}</div>
                <div className="text-xs opacity-70">
                  {format(item.start, 'h:mm a')} - {format(item.end, 'h:mm a')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="flex flex-col h-[80vh]">
        {/* Day headers */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <div className="w-16 shrink-0 border-r border-gray-200 dark:border-gray-800"></div>
          {viewDates.map((day) => (
            <div 
              key={day.toISOString()} 
              className={cn(
                "flex-1 text-center py-2 truncate",
                isSameDay(day, new Date()) && "bg-blue-50 dark:bg-blue-950/20"
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className={cn(
                "font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400",
                isSameDay(day, date) && "text-blue-600 dark:text-blue-400"
              )}>
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                "text-xl leading-none mt-1 cursor-pointer",
                isSameDay(day, date) && "text-blue-600 dark:text-blue-400",
                isSameDay(day, new Date()) && "inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Scrollable time grid */}
        <ScrollArea className="flex-1">
          <div className="relative h-[1440px]"> {/* 24 hours * 60px per hour */}
            <div className="flex h-full">
              {/* Time labels */}
              <div className="w-16 shrink-0 relative">
                {TIME_SLOTS.map((hour) => (
                  <div 
                    key={hour} 
                    className="flex items-start justify-end pr-2 h-[60px] text-xs text-muted-foreground"
                    style={{ transform: 'translateY(-0.5rem)' }}
                  >
                    {format(setHours(date, hour), 'h a')}
                  </div>
                ))}
              </div>
              
              {/* Day columns */}
              {viewDates.map((day) => {
                const dayItems = getAllItemsForDate(day);
                const itemsWithColumns = calculateEventColumns(dayItems);
                
                return (
                  <div 
                    key={day.toISOString()}
                    className={cn(
                      "flex-1 relative border-l border-gray-200 dark:border-gray-800",
                      isSameDay(day, new Date()) && "bg-blue-50/50 dark:bg-blue-950/10"
                    )}
                  >
                    {/* Hour grid lines */}
                    {TIME_SLOTS.map((hour) => (
                      <div 
                        key={hour} 
                        className="h-[60px] border-t border-gray-200 dark:border-gray-800"
                      >
                        <div className="h-[30px] border-b border-dashed border-gray-200 dark:border-gray-800 opacity-50" />
                      </div>
                    ))}
                    
                    {/* Current time indicator (only shown for today) */}
                    {isSameDay(day, new Date()) && (
                      <div 
                        className="absolute left-0 right-0 h-[1px] bg-red-500 z-20 pointer-events-none"
                        style={{ 
                          top: ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_HEIGHT
                        }}
                      >
                        <div className="absolute left-0 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    )}
                    
                    {/* Events */}
                    {itemsWithColumns.map((item) => {
                      const { top, height } = calculateEventPosition(item.start, item.end);
                      const width = 100 / item.totalColumns;
                      const left = (item.column * width);
                      
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "absolute rounded-md border p-1 overflow-hidden pointer-events-auto cursor-pointer",
                            getTypeStyles(item.type)
                          )}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          onClick={() => onItemClick(item.item)}
                        >
                          <div className="font-medium text-xs truncate">{item.title}</div>
                          {height > 40 && (
                            <div className="text-xs opacity-70">
                              {format(item.start, 'h:mm a')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderMonthView = () => {
    // Calculate weeks: array of arrays, each inner array represents a week
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    viewDates.forEach((day, index) => {
      currentWeek.push(day);
      
      if (index % 7 === 6 || index === viewDates.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return (
      <div className="grid grid-cols-7 auto-rows-fr border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {/* Day of week headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div 
            key={day} 
            className="text-center py-2 border-b border-gray-200 dark:border-gray-800 font-medium text-sm"
          >
            {day}
          </div>
        ))}
        
        {/* Date grid */}
        {weeks.map((week, weekIndex) => 
          week.map((day, dayIndex) => {
            const dayItems = getAllItemsForDate(day);
            const isCurrentMonth = isSameMonth(day, date);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, date);
            
            return (
              <div 
                key={`${weekIndex}-${dayIndex}`} 
                className={cn(
                  "min-h-[100px] p-1 border border-gray-200 dark:border-gray-800",
                  !isCurrentMonth && "bg-gray-50 dark:bg-gray-900/20 text-gray-400 dark:text-gray-600",
                  isToday && "bg-blue-50 dark:bg-blue-900/20",
                  isSelected && "ring-2 ring-inset ring-blue-500 dark:ring-blue-400"
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isToday && "bg-blue-600 text-white font-medium"
                  )}>
                    {getDate(day)}
                  </span>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDateSelect(day); 
                            onAddItem();
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add item</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Day events (limited display) */}
                <div className="space-y-1 mt-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "px-1 py-0.5 rounded text-xs truncate cursor-pointer",
                        getTypeStyles(item.type)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item.item);
                      }}
                    >
                      {item.isAllDay ? '· ' : `${format(item.start, 'h:mm a')} `}
                      {item.title}
                    </div>
                  ))}
                  
                  {dayItems.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      + {dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderScheduleView = () => {
    // Get items for all visible dates
    const allItems = viewDates.flatMap(day => 
      getAllItemsForDate(day).map(item => ({
        ...item,
        date: day
      }))
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Group items by date
    const itemsByDate: Record<string, any[]> = {};
    allItems.forEach(item => {
      const dateKey = format(item.date, 'yyyy-MM-dd');
      if (!itemsByDate[dateKey]) {
        itemsByDate[dateKey] = [];
      }
      itemsByDate[dateKey].push(item);
    });
    
    return (
      <ScrollArea className="h-[80vh]">
        <div className="space-y-6 p-2">
          {Object.entries(itemsByDate).length > 0 ? (
            Object.entries(itemsByDate).map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-2">
                <div 
                  className={cn(
                    "sticky top-0 z-10 py-1 font-medium bg-background",
                    isSameDay(new Date(dateKey), new Date()) && "text-blue-600 dark:text-blue-400"
                  )}
                >
                  {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="space-y-1 pl-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center p-2 rounded border cursor-pointer",
                        getTypeStyles(item.type)
                      )}
                      onClick={() => onItemClick(item.item)}
                    >
                      <div className="ml-2">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs">
                          {item.isAllDay 
                            ? 'All day' 
                            : `${format(item.start, 'h:mm a')} - ${format(item.end, 'h:mm a')}`
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No events scheduled in this time range
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-lg">
              {viewType === "day" && format(date, "MMMM d, yyyy")}
              {viewType === "week" && (
                <>
                  {format(viewDates[0], "MMM d")} - {format(viewDates[viewDates.length - 1], "MMM d, yyyy")}
                </>
              )}
              {viewType === "month" && format(date, "MMMM yyyy")}
              {viewType === "schedule" && format(date, "MMMM yyyy")}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tabs defaultValue={viewType} onValueChange={(v) => setViewType(v as CalendarViewType)}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="sm" onClick={onAddItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Render the appropriate view based on viewType */}
        {viewType === "day" && renderDayView()}
        {viewType === "week" && renderWeekView()}
        {viewType === "month" && renderMonthView()}
        {viewType === "schedule" && renderScheduleView()}
      </CardContent>
    </Card>
  );
} 