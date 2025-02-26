import { useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Task, Event, StudySession, Reminder } from "@/types";

interface WeeklyTimelineProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: "prev" | "next") => void;
  tasks: Task[];
  events: Event[];
  sessions: StudySession[];
  deadlines: Task[];
  reminders: Reminder[];
}

export function WeeklyTimeline({
  currentDate,
  onDateSelect,
  onWeekChange,
  tasks,
  events,
  sessions,
  deadlines,
  reminders,
}: WeeklyTimelineProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const getEventsForDay = (date: Date) => {
    return {
      tasks: tasks.filter((task) =>
        task.timeSlots?.some((slot) =>
          isSameDay(new Date(slot.startDate), date)
        )
      ),
      events: events.filter((event) =>
        isSameDay(new Date(event.startTime), date)
      ),
      sessions: sessions.filter((session) =>
        isSameDay(new Date(session.scheduledFor), date)
      ),
      deadlines: deadlines.filter((deadline) =>
        isSameDay(new Date(deadline.deadline), date)
      ),
      reminders: reminders.filter((reminder) =>
        isSameDay(new Date(reminder.reminderTime), date)
      ),
    };
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onWeekChange("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onWeekChange("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(currentDate, day);
          const hasEvents =
            dayEvents.tasks.length > 0 ||
            dayEvents.events.length > 0 ||
            dayEvents.sessions.length > 0 ||
            dayEvents.deadlines.length > 0 ||
            dayEvents.reminders.length > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : hasEvents
                  ? "bg-secondary"
                  : "hover:bg-secondary"
              )}
            >
              <span className="text-sm font-medium">{format(day, "EEE")}</span>
              <span className="text-xl font-bold">{format(day, "d")}</span>
              {hasEvents && (
                <div className="flex gap-1 mt-2">
                  {dayEvents.deadlines.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                  {dayEvents.reminders.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  )}
                  {dayEvents.events.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                  {dayEvents.tasks.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {dayEvents.sessions.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Deadlines
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Reminders
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Events
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Tasks
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Study Sessions
        </div>
      </div>
    </div>
  );
}