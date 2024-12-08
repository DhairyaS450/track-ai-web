import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTasks } from "@/api/tasks";
import { getStudySessions } from "@/api/sessions";
import { Task, StudySession } from "@/types";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const fetchEvents = async (selectedDate: Date) => {
    const [tasksData, sessionsData] = await Promise.all([
      getTasks(),
      getStudySessions(),
    ]);
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    setTasks(tasksData.tasks.filter(task => 
      format(new Date(task.startDate), 'yyyy-MM-dd') === selectedDateStr
    ));
    
    setSessions(sessionsData.sessions.filter(session => 
      format(new Date(session.scheduledFor), 'yyyy-MM-dd') === selectedDateStr
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-[380px,1fr]">
        <Card>
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                  fetchEvents(newDate);
                }
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Events for {format(date, 'MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {tasks.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Tasks</h3>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(task.startDate), 'p')} - {format(new Date(task.endDate), 'p')}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium
                              ${task.priority === 'High' ? 'bg-red-100 text-red-700' : ''}
                              ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                              ${task.priority === 'Low' ? 'bg-green-100 text-green-700' : ''}
                            `}
                          >
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sessions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Study Sessions</h3>
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded-lg border p-3"
                        >
                          <p className="font-medium">{session.subject}</p>
                          <p className="text-sm text-muted-foreground">{session.goal}</p>
                          <p className="text-sm mt-1">
                            {format(new Date(session.scheduledFor), 'p')} ({session.duration} minutes)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tasks.length === 0 && sessions.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No events scheduled for this day
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}