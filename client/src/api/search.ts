import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/config/firebase";

export interface SearchResult {
  id: string;
  title: string;
  type: "task" | "event" | "study" | "deadline" | "reminder";
  dueDate?: Date;
  completed?: boolean;
  status?: string;
}

export async function searchItems(searchQuery: string): Promise<SearchResult[]> {
  if (!searchQuery.trim() || !auth.currentUser) return [];

  const userId = auth.currentUser.uid;
  const results: SearchResult[] = [];

  // Search tasks
  const tasksQuery = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    where("title", ">=", searchQuery),
    where("title", "<=", searchQuery + "\uf8ff"),
    orderBy("title"),
    orderBy("deadline", "asc")
  );

  const taskDocs = await getDocs(tasksQuery);
  taskDocs.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      title: data.title,
      type: "task",
      dueDate: data.deadline ? new Date(data.deadline) : undefined,
      completed: data.completed,
    });
  });

  // Search events
  const eventsQuery = query(
    collection(db, "events"),
    where("userId", "==", userId),
    where("name", ">=", searchQuery),
    where("name", "<=", searchQuery + "\uf8ff"),
    orderBy("name"),
    orderBy("startTime", "asc")
  );

  const eventDocs = await getDocs(eventsQuery);
  eventDocs.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      title: data.name,
      type: "event",
      dueDate: data.startTime ? new Date(data.startTime) : undefined,
    });
  });

  // Search study sessions
  const studyQuery = query(
    collection(db, "studySessions"),
    where("userId", "==", userId),
    where("subject", ">=", searchQuery),
    where("subject", "<=", searchQuery + "\uf8ff"),
    orderBy("subject"),
    orderBy("scheduledFor", "asc")
  );

  const studyDocs = await getDocs(studyQuery);
  studyDocs.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      title: data.subject,
      type: "study",
      dueDate: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
    });
  });

  // Search deadlines
  const deadlinesQuery = query(
    collection(db, "deadlines"),
    where("userId", "==", userId),
    where("title", ">=", searchQuery),
    where("title", "<=", searchQuery + "\uf8ff"),
    orderBy("title"),
    orderBy("dueDate", "asc")
  );

  const deadlineDocs = await getDocs(deadlinesQuery);
  deadlineDocs.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      title: data.title,
      type: "deadline",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: data.status,
    });
  });

  // Search reminders
  const remindersQuery = query(
    collection(db, "reminders"),
    where("userId", "==", userId),
    where("title", ">=", searchQuery),
    where("title", "<=", searchQuery + "\uf8ff"),
    orderBy("title"),
    orderBy("reminderTime", "asc")
  );

  const reminderDocs = await getDocs(remindersQuery);
  reminderDocs.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      title: data.title,
      type: "reminder",
      dueDate: data.reminderTime ? new Date(data.reminderTime) : undefined,
      status: data.status,
    });
  });

  return results;
}
