import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTasks } from "@/api/tasks";
import { getStudySessions } from "@/api/sessions";
import { Task, StudySession } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [tasksData, sessionsData] = await Promise.all([
        getTasks(),
        getStudySessions(),
      ]);
      setTasks(tasksData.tasks);
      setSessions(sessionsData.sessions);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back!</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Due {format(new Date(task.endDate), "p")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      {
                        "bg-red-100 text-red-700": task.priority === "High",
                        "bg-yellow-100 text-yellow-700":
                          task.priority === "Medium",
                        "bg-green-100 text-green-700": task.priority === "Low",
                      }
                    )}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Study Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border p-4"
                >
                  <h3 className="font-medium">{session.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    {session.goal}
                  </p>
                  <div className="mt-2 text-sm">
                    {format(new Date(session.scheduledFor), "PPp")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}