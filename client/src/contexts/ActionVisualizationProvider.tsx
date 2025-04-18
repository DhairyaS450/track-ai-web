import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from "react";
import { StudySession, Task, Event } from "@/types";

type EntityType = "Study Session" | "Task" | "Event";
type ActionType = "create" | "update" | "delete";

interface ActionDetail {
  label: string;
  before?: string | number | boolean;
  after?: string | number | boolean;
}

interface ActionInfo {
  id: string;
  entityId: string;
  entityType: EntityType;
  actionType: ActionType;
  title: string;
  details: ActionDetail[];
  timestamp: Date;
  originalData?: StudySession | Task | Event;
}

interface ActionContextType {
  actions: ActionInfo[];
  addCreateAction: (entity: StudySession | Task | Event, entityType: EntityType) => void;
  addUpdateAction: (
    entityType: EntityType, 
    oldEntity: StudySession | Task | Event, 
    newEntity: StudySession | Task | Event 
  ) => void;
  addDeleteAction: (entity: StudySession | Task | Event, entityType: EntityType) => void;
  clearActions: () => void;
  removeAction: (id: string) => void;
}

const ActionContext = createContext<ActionContextType | null>(null);

export function ActionVisualizationProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ActionInfo[]>([]);

  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2, 11);
  }, []);

  const addCreateAction = useCallback((entity: StudySession | Task | Event, entityType: EntityType) => {
    const details: ActionDetail[] = [];
    
    // Add entity-specific details based on type
    if (entityType === "Study Session") {
      const session = entity as StudySession;
      details.push({ label: "Subject", after: session.subject });
      details.push({ label: "Scheduled For", after: new Date(session.scheduledFor).toLocaleString() });
      details.push({ label: "Duration", after: `${session.duration} minutes` });
      if (session.goal) details.push({ label: "Goal", after: session.goal });
      if (session.technique) details.push({ label: "Technique", after: session.technique });
    } else if (entityType === "Task") {
      const task = entity as Task;
      details.push({ label: "Title", after: task.title });
      if (task.description) details.push({ label: "Description", after: task.description });
      if (task.deadline) details.push({ label: "Deadline", after: new Date(task.deadline).toLocaleString() });
      details.push({ label: "Priority", after: task.priority });
    } else if (entityType === "Event") {
      const event = entity as Event;
      details.push({ label: "Name", after: event.name });
      details.push({ label: "Start Time", after: new Date(event.startTime).toLocaleString() });
      details.push({ label: "End Time", after: new Date(event.endTime).toLocaleString() });
      if (event.location) details.push({ label: "Location", after: event.location });
    }

    const action: ActionInfo = {
      id: generateId(),
      entityId: entity.id,
      entityType,
      actionType: "create",
      title: entityType === "Study Session" 
        ? (entity as StudySession).subject 
        : entityType === "Task" 
          ? (entity as Task).title 
          : entityType === "Event" 
            ? (entity as Event).name 
            : "",
      details,
      timestamp: new Date(),
      originalData: entity
    };

    setActions(prev => [action, ...prev]);
  }, [generateId]);

  const addUpdateAction = useCallback((
    entityType: EntityType, 
    oldEntity: StudySession | Task | Event, 
    newEntity: StudySession | Task | Event
  ) => {
    const details: ActionDetail[] = [];

    // Compare old and new entities to identify changes
    if (entityType === "Study Session") {
      const oldSession = oldEntity as StudySession;
      const newSession = newEntity as StudySession;
      
      if (oldSession.subject !== newSession.subject) {
        details.push({ label: "Subject", before: oldSession.subject, after: newSession.subject });
      }
      
      if (oldSession.scheduledFor !== newSession.scheduledFor) {
        details.push({ 
          label: "Scheduled For", 
          before: new Date(oldSession.scheduledFor).toLocaleString(), 
          after: new Date(newSession.scheduledFor).toLocaleString() 
        });
      }
      
      if (oldSession.duration !== newSession.duration) {
        details.push({ label: "Duration", before: `${oldSession.duration} min`, after: `${newSession.duration} min` });
      }
      
      if (oldSession.goal !== newSession.goal) {
        details.push({ label: "Goal", before: oldSession.goal, after: newSession.goal });
      }
      
      if (oldSession.technique !== newSession.technique) {
        details.push({ label: "Technique", before: oldSession.technique, after: newSession.technique });
      }
      
      if (oldSession.priority !== newSession.priority) {
        details.push({ label: "Priority", before: oldSession.priority, after: newSession.priority });
      }
    } else if (entityType === "Task") {
      const oldTask = oldEntity as Task;
      const newTask = newEntity as Task;
      
      if (oldTask.title !== newTask.title) {
        details.push({ label: "Title", before: oldTask.title, after: newTask.title });
      }
      
      if (oldTask.description !== newTask.description) {
        details.push({ label: "Description", before: oldTask.description, after: newTask.description });
      }
      
      if (oldTask.deadline !== newTask.deadline) {
        details.push({ 
          label: "Deadline", 
          before: oldTask.deadline ? new Date(oldTask.deadline).toLocaleString() : "None", 
          after: newTask.deadline ? new Date(newTask.deadline).toLocaleString() : "None" 
        });
      }
      
      if (oldTask.priority !== newTask.priority) {
        details.push({ label: "Priority", before: oldTask.priority, after: newTask.priority });
      }
      
      if (oldTask.status !== newTask.status) {
        details.push({ label: "Status", before: oldTask.status, after: newTask.status });
      }
    } else if (entityType === "Event") {
      const oldEvent = oldEntity as Event;
      const newEvent = newEntity as Event;
      
      if (oldEvent.name !== newEvent.name) {
        details.push({ label: "Name", before: oldEvent.name, after: newEvent.name });
      }
      
      if (oldEvent.startTime !== newEvent.startTime) {
        details.push({ 
          label: "Start Time", 
          before: new Date(oldEvent.startTime).toLocaleString(), 
          after: new Date(newEvent.startTime).toLocaleString() 
        });
      }
      
      if (oldEvent.endTime !== newEvent.endTime) {
        details.push({ 
          label: "End Time", 
          before: new Date(oldEvent.endTime).toLocaleString(), 
          after: new Date(newEvent.endTime).toLocaleString() 
        });
      }
      
      if (oldEvent.location !== newEvent.location) {
        details.push({ label: "Location", before: oldEvent.location, after: newEvent.location });
      }
    }

    // Only add action if there are actual changes
    if (details.length > 0) {
      const action: ActionInfo = {
        id: generateId(),
        entityId: newEntity.id,
        entityType,
        actionType: "update",
        title: entityType === "Study Session" 
          ? (newEntity as StudySession).subject 
          : entityType === "Task" 
            ? (newEntity as Task).title 
            : entityType === "Event" 
              ? (newEntity as Event).name 
              : "",
        details,
        timestamp: new Date(),
        originalData: oldEntity
      };

      setActions(prev => [action, ...prev]);
    }
  }, [generateId]);

  const addDeleteAction = useCallback((entity: StudySession | Task | Event, entityType: EntityType) => {
    const details: ActionDetail[] = [];
    
    // Add entity-specific details based on type
    if (entityType === "Study Session") {
      const session = entity as StudySession;
      details.push({ label: "Subject", before: session.subject });
      details.push({ label: "Scheduled For", before: new Date(session.scheduledFor).toLocaleString() });
      details.push({ label: "Duration", before: `${session.duration} minutes` });
    } else if (entityType === "Task") {
      const task = entity as Task;
      details.push({ label: "Title", before: task.title });
      if (task.description) details.push({ label: "Description", before: task.description });
      if (task.deadline) details.push({ label: "Deadline", before: new Date(task.deadline).toLocaleString() });
    } else if (entityType === "Event") {
      const event = entity as Event;
      details.push({ label: "Name", before: event.name });
      details.push({ label: "Date", before: `${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()}` });
    }

    const action: ActionInfo = {
      id: generateId(),
      entityId: entity.id,
      entityType,
      actionType: "delete",
      title: entityType === "Study Session" 
        ? (entity as StudySession).subject 
        : entityType === "Task" 
          ? (entity as Task).title 
          : entityType === "Event" 
            ? (entity as Event).name 
            : "",
      details,
      timestamp: new Date(),
      originalData: entity
    };

    setActions(prev => [action, ...prev]);
  }, [generateId]);

  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(action => action.id !== id));
  }, []);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  const value = useMemo(() => ({
    actions,
    addCreateAction,
    addUpdateAction,
    addDeleteAction,
    clearActions,
    removeAction
  }), [actions, addCreateAction, addUpdateAction, addDeleteAction, clearActions, removeAction]);

  return (
    <ActionContext.Provider value={value}>
      {children}
    </ActionContext.Provider>
  );
}

export function useActionVisualization() {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error("useActionVisualization must be used within an ActionVisualizationProvider");
  }
  return context;
} 