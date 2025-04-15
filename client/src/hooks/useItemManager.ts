import { useCallback } from "react";
import { useToast } from "./useToast";
import { useData } from "@/contexts/DataProvider";
import { updateExternalTask } from "@/api/tasks";
import {
  SchedulableItem,
  UnifiedTask,
  UnifiedEvent,
  UnifiedReminder,
  UnifiedStudySession,
  convertFromUnified
} from "@/types/unified";

/**
 * Custom hook that provides functionality to save and manage schedulable items
 * This centralizes the logic to create, update, and manage tasks, events, study sessions and reminders
 */
export function useItemManager() {
  const { toast } = useToast();
  const {
    tasks: allTasks,
    addTask,
    updateTask,
    addEvent,
    updateEvent,
    addSession,
    updateSession,
    addReminder,
    updateReminder
  } = useData();

  /**
   * Save or update a schedulable item based on its type
   * @param item The unified item to save
   * @returns A promise that resolves when the save operation is complete
   */
  const handleSaveItem = useCallback(async (item: SchedulableItem) => {
    try {
      const originalItem = convertFromUnified(item);
      
      switch (item.itemType) {
        case 'task': {
          const task = item as UnifiedTask;
          if (task.id) {
            // Check if external task
            const existingTask = allTasks.find(t => t.id === task.id);
            if (existingTask?.source && ['google_tasks', 'google_calendar'].includes(existingTask.source)) {
              const shouldUpdate = window.confirm(
                `Do you want to update this task in ${existingTask.source === 'google_tasks' ? 'Google Tasks' : 'Google Calendar'} as well?`
              );
              
              if (shouldUpdate) {
                await updateExternalTask(originalItem);
              }
            }
            
            await updateTask(task.id, originalItem);
            toast({
              title: "Success",
              description: "Task updated successfully",
            });
          } else {
            await addTask(originalItem);
            toast({
              title: "Success",
              description: "Task created successfully",
            });
          }
          break;
        }
        
        case 'event': {
          const event = item as UnifiedEvent;
          if (event.id) {
            await updateEvent(event.id, originalItem);
            toast({
              title: "Success",
              description: "Event updated successfully",
            });
          } else {
            await addEvent(originalItem);
            toast({
              title: "Success",
              description: "Event created successfully",
            });
          }
          break;
        }
        
        case 'session': {
          const session = item as UnifiedStudySession;
          if (session.id) {
            await updateSession(session.id, originalItem);
            toast({
              title: "Success",
              description: "Study session updated successfully",
            });
          } else {
            await addSession(originalItem);
            toast({
              title: "Success",
              description: "Study session created successfully",
            });
          }
          break;
        }
        
        case 'reminder': {
          const reminder = item as UnifiedReminder;
          if (reminder.id) {
            await updateReminder(reminder.id, originalItem);
            toast({
              title: "Success",
              description: "Reminder updated successfully",
            });
          } else {
            await addReminder(originalItem);
            toast({
              title: "Success",
              description: "Reminder created successfully",
            });
          }
          break;
        }
      }
      
      return true; // Indicate success
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save ${item.itemType}`,
      });
      
      return false; // Indicate failure
    }
  }, [allTasks, addEvent, addReminder, addSession, addTask, toast, updateEvent, updateReminder, updateSession, updateTask]);

  return {
    handleSaveItem
  };
}
