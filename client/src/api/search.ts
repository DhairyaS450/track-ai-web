import { auth } from "@/config/firebase";
import { useData } from "@/contexts/DataProvider";

export interface SearchResult {
  id: string;
  title: string;
  type: "task" | "event" | "study";
  dueDate?: Date;
  completed?: boolean;
  status?: string;
}

export async function searchItems(
  searchQuery: string,
  data: ReturnType<typeof useData>
): Promise<SearchResult[]> {
  if (!searchQuery.trim() || !auth.currentUser) return [];

  const { tasks, events, sessions } = data;
  const results: SearchResult[] = [];
  const query = searchQuery.toLowerCase();

  console.log('--------------------------------')
  // Search tasks
  tasks.forEach((task) => {
    if (task.title?.toLowerCase().includes(query)) {
      results.push({
        id: task.id,
        title: task.title,
        type: "task",
        dueDate: task.deadline ? new Date(task.deadline) : undefined,
        completed: task.status === "completed",
      });
    }
  });

  // Search events
  events.forEach((event) => {
    if (event.name?.toLowerCase().includes(query)) {
      results.push({
        id: event.id,
        title: event.name,
        type: "event",
        dueDate: event.startTime ? new Date(event.startTime) : undefined,
      });
    }
  });

  // Search study sessions
  sessions.forEach((session) => {
    if (session.subject?.toLowerCase().includes(query)) {
      results.push({
        id: session.id,
        title: session.subject,
        type: "study",
        dueDate: session.scheduledFor ? new Date(session.scheduledFor) : undefined,
      });
    }
  });

  return results;
}
