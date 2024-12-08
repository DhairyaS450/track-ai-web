import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTasks } from "@/api/tasks";
import { getStudySessions } from "@/api/sessions";
import { getMoodEntries } from "@/api/mood";
import { Task, StudySession, MoodEntry } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { format, startOfWeek, eachDayOfInterval, addDays } from "date-fns";

export function Analytics() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [tasksData, sessionsData, moodData] = await Promise.all([
        getTasks(),
        getStudySessions(),
        getMoodEntries(),
      ]);
      setTasks(tasksData.tasks);
      setSessions(sessionsData.sessions);
      setMoodEntries(moodData.entries);
    };
    fetchData();
  }, []);

  const startDate = startOfWeek(new Date());
  const weekDays = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 6),
  });

  const studyTimeBySubject = sessions.reduce((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + session.duration;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(studyTimeBySubject).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const dailyMoodData = weekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayMoods = moodEntries.filter(entry => 
      format(new Date(entry.timestamp), 'yyyy-MM-dd') === dayStr
    );
    
    return {
      date: format(day, 'EEE'),
      mood: dayMoods.reduce((sum, entry) => sum + entry.rating, 0) / (dayMoods.length || 1),
    };
  });

  const taskStatusData = [
    { status: 'To Do', count: tasks.filter(t => t.status === 'todo').length },
    { status: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length },
    { status: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Study Time by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Mood Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyMoodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}