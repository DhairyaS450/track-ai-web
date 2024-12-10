import { useEffect, useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTasks } from "@/api/tasks";
import { getStudySessions } from "@/api/sessions";
import { Task, StudySession } from "@/types";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (selectedDate: Date) => {
    try {
      setLoading(true);
      setError(null);
      const [tasksData, sessionsData] = await Promise.all([
        getTasks(),
        getStudySessions(),
      ]);

      // Filter tasks that have time slots on the selected date
      const filteredTasks = tasksData.tasks.filter(task =>
        task.timeSlots.some(slot => 
          isSameDay(new Date(slot.startDate), selectedDate)
        )
      );

      // Filter sessions scheduled for the selected date
      const filteredSessions = sessionsData.sessions.filter(session =>
        isSameDay(new Date(session.scheduledFor), selectedDate)
      );

      setTasks(filteredTasks);
      setSessions(filteredSessions);
    } catch (err) {
      setError("Failed to load calendar events. Please try again later.");
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(date);
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="grid gap-6 md:grid-cols-[380px,1fr]">
        <Card className="bg-card">
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                }
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Events for {format(date, 'MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {tasks.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Tasks</h3>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                          >
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.timeSlots[0] && format(new Date(task.timeSlots[0].startDate), 'p')} - {task.timeSlots[0] && format(new Date(task.timeSlots[0].endDate), 'p')}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium
                                  ${task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' : ''}
                                  ${task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' : ''}
                                  ${task.priority === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}`}
                              >
                                {task.priority}
                              </span>
                              <span className={`text-xs font-medium rounded-full px-2 py-1
                                ${task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}
                                ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : ''}
                                ${task.status === 'todo' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' : ''}`}
                              >
                                {task.status}
                              </span>
                            </div>
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
                            className="rounded-lg border p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{session.subject}</p>
                                <p className="text-sm text-muted-foreground">{session.goal}</p>
                                <p className="text-sm mt-1">
                                  {format(new Date(session.scheduledFor), 'p')} ({session.duration} minutes)
                                </p>
                              </div>
                              <span className={`text-xs font-medium rounded-full px-2 py-1
                                ${session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}
                                ${session.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : ''}
                                ${session.status === 'scheduled' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' : ''}`}
                              >
                                {session.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tasks.length === 0 && sessions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No events scheduled for this day
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}