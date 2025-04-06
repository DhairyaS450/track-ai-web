import { Event } from "@/types";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { MapPin, Clock, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface EventsTimelineProps {
  onEventClick: (event: Event) => void;
  events: Event[];
}

export function EventsTimeline({ onEventClick, events }: EventsTimelineProps) {
  const filteredEvents = events
    .filter((event) => {
      if (event.isAllDay) {
        // For all-day events, extract date parts without time components
        const eventDateStr = event.startTime.includes('T') ? event.startTime.split('T')[0] : event.startTime;
        const today = format(new Date(), "yyyy-MM-dd");
        const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
        
        // Check if the event date matches today or tomorrow
        return eventDateStr === today || eventDateStr === tomorrow;
      } else {
        // For regular events with time, use the existing logic
        const eventDate = new Date(event.startTime);
        return isToday(eventDate) || isTomorrow(eventDate);
      }
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    // For all-day events, use the date string for comparison
    if (event.isAllDay) {
      const eventDateStr = event.startTime.includes('T') ? event.startTime.split('T')[0] : event.startTime;
      const today = format(new Date(), "yyyy-MM-dd");
      const key = eventDateStr === today ? "Today" : "Tomorrow";
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    } else {
      // For regular events, use the existing logic
      const date = new Date(event.startTime);
      const key = isToday(date) ? "Today" : "Tomorrow";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    }
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-2">
        {Object.entries(groupedEvents).map(([day, dayEvents]) => (
          <div key={day} className="space-y-2">
            <div className="sticky top-0 z-10 bg-card pb-1">
              <h3 className="text-sm font-semibold px-2 py-1 bg-muted inline-block rounded-md">
                {day}
              </h3>
            </div>
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 rounded-lg border bg-background transition-colors hover:bg-accent/50 cursor-pointer",
                    isToday(new Date(event.startTime))
                      ? "border-blue-200 dark:border-blue-800"
                      : "",
                    event.source === "google_calendar"
                      ? "bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900 dark:to-yellow-900"
                      : ""
                  )}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-base">{event.name}</div>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>
                            {event.isAllDay ? (
                              "All-day"
                            ) : (
                              <>
                                {format(new Date(event.startTime), "h:mm a")}
                                {" - "}
                                {format(new Date(event.endTime), "h:mm a")}
                              </>
                            )}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {event.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end ml-2">
                      {event.source === "google_calendar" && (
                        <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Google
                        </Badge>
                      )}
                      {event.priority && (
                        <Badge
                          variant={
                            event.priority === "High"
                              ? "destructive"
                              : event.priority === "Medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {event.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <p>No events scheduled for today or tomorrow</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => onEventClick({} as Event)}
            >
              Add an Event
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
