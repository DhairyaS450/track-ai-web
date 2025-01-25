import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/config/firebase";

export interface Reminder {
  id: string;
  title: string;
  reminderTime: string;
  notificationMessage?: string;
  status: "Active" | "Dismissed";
  type: "Quick Reminder";
  recurring?: {
    frequency: "Once" | "Daily" | "Weekly" | "Monthly";
    interval: number;
    endDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function createReminder(data: Omit<Reminder, "id" | "createdAt" | "updatedAt">): Promise<Reminder> {
  try {
    if (!auth.currentUser) throw new Error("No authenticated user");

    const reminderData = {
      ...data,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "reminders"), reminderData);
    return {
      ...reminderData,
      id: docRef.id,
    } as Reminder;
  } catch (error) {
    console.error("Error creating reminder:", error);
    throw error;
  }
}

export async function updateReminder(id: string, data: Partial<Reminder>): Promise<void> {
  try {
    if (!auth.currentUser) throw new Error("No authenticated user");

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "reminders", id), updateData);
  } catch (error) {
    console.error("Error updating reminder:", error);
    throw error;
  }
}

export async function getReminder(id: string): Promise<{ reminder: Reminder }> {
  try {
    if (!auth.currentUser) throw new Error("No authenticated user");

    const docRef = doc(db, "reminders", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Reminder not found");
    }

    return {
      reminder: {
        id: docSnap.id,
        ...docSnap.data(),
      } as Reminder,
    };
  } catch (error) {
    console.error("Error getting reminder:", error);
    throw error;
  }
}

export async function getReminders(): Promise<{ reminders: Reminder[] }> {
  try {
    if (!auth.currentUser) throw new Error("No authenticated user");

    const q = query(
      collection(db, "reminders"),
      where("userId", "==", auth.currentUser.uid),
      where("status", "==", "Active"),
      orderBy("reminderTime", "asc")
    );

    const querySnapshot = await getDocs(q);
    const reminders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reminder[];

    return { reminders };
  } catch (error) {
    console.error("Error getting reminders:", error);
    throw error;
  }
}

export async function dismissReminder(id: string): Promise<void> {
  try {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await deleteDoc(doc(db, "reminders", id));
  } catch (error) {
    console.error("Error dismissing reminder:", error);
    throw error;
  }
}
