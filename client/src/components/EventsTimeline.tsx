import { Event } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { format, isToday, isTomorrow } from "date-fns";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface EventsTimelineProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function EventsTimeline({ events, onEventClick }: EventsTimelineProps) {
  // Filter and sort events for today and tomorrow
  const filteredEvents = events
    .filter(event => {
      const eventDate = new Date(event.startTime);
      return isToday(eventDate) || isTomorrow(eventDate);
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.startTime);
    const key = isToday(date) ? 'Today' : 'Tomorrow';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Events Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {Object.entries(groupedEvents).map(([day, dayEvents]) => (
            <div key={day} className="mb-4 last:mb-0">
              <h3 className="text-sm font-semibold mb-2">{day}</h3>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-start justify-between p-3 rounded-lg border transition-colors hover:bg-accent cursor-pointer",
                      isToday(new Date(event.startTime)) ? "border-blue-200 dark:border-blue-800" : ""
                    )}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.name}</span>
                        {event.priority && (
                          <Badge
                            variant={
                              event.priority === 'High'
                                ? 'destructive'
                                : event.priority === 'Medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {event.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(event.startTime), "h:mm a")}
                            {" - "}
                            {format(new Date(event.endTime), "h:mm a")}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No events scheduled for today or tomorrow
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}