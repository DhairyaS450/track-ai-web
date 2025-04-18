import { useActionVisualization } from "@/contexts/ActionVisualizationProvider";
import { ActionCard } from "./ActionCard";
import { useData } from "@/contexts/DataProvider";
import { StudySession, Task, Event } from "@/types";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UnifiedItemDialog } from "./UnifiedItemDialog";
import { ItemType, SchedulableItem, UnifiedStudySession, UnifiedTask, UnifiedEvent } from "@/types/unified";

export function ActionCardList() {
  const { actions, removeAction } = useActionVisualization();
  const { 
    addSession, 
    addTask,
    addEvent,
  } = useData();
  
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<SchedulableItem | null>(null);
  const [itemType, setItemType] = useState<ItemType>("task");

  const handleUndo = async (actionId: string, entityType: string, originalData: StudySession | Task | Event) => {
    try {
      setError(null);
      if (entityType === "Study Session") {
        await addSession(originalData as StudySession);
      } else if (entityType === "Task") {
        await addTask(originalData as Task);
      } else if (entityType === "Event") {
        await addEvent(originalData as Event);
      }
      // Remove the action card after successful restoration
      removeAction(actionId);
    } catch (error) {
      console.error("Error undoing action:", error);
      setError(`Failed to undo action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertToUnifiedItem = (entityType: string, entity: StudySession | Task | Event): SchedulableItem => {
    const now = new Date().toISOString();
    
    if (entityType === "Study Session") {
      const session = entity as StudySession;
      return {
        id: session.id,
        title: session.subject,
        description: session.goal || "",
        startTime: session.scheduledFor,
        endTime: new Date(new Date(session.scheduledFor).getTime() + session.duration * 60000).toISOString(),
        priority: session.priority || "Medium",
        status: session.status || "scheduled",
        itemType: "session",
        userId: "",
        createdAt: now,
        // Study session specifics
        subject: session.subject,
        goal: session.goal || "",
        duration: session.duration,
        technique: session.technique || "",
        scheduledFor: session.scheduledFor,
        isFlexible: session.isFlexible || false,
        breakInterval: session.breakInterval || 0,
        breakDuration: session.breakDuration || 0,
        materials: session.materials || "",
        notes: session.notes || ""
      } as UnifiedStudySession;
    } else if (entityType === "Task") {
      const task = entity as Task;
      return {
        id: task.id,
        title: task.title,
        description: task.description || "",
        startTime: task.deadline ? new Date(new Date(task.deadline).getTime() - 3600000).toISOString() : now,
        endTime: task.deadline || now,
        priority: task.priority || "Medium",
        status: (task.status as 'todo' | 'in-progress' | 'completed') || "todo",
        itemType: "task",
        userId: "",
        createdAt: now,
        // Task specifics
        deadline: task.deadline || "",
        completion: task.completion || 0,
        timeSlots: task.timeSlots || []
      } as UnifiedTask;
    } else if (entityType === "Event") {
      const event = entity as Event;
      return {
        id: event.id,
        title: event.name,
        description: event.description || "",
        startTime: event.startTime,
        endTime: event.endTime,
        priority: event.priority || "Medium",
        status: "scheduled",
        itemType: "event",
        userId: "",
        createdAt: now,
        // Event specifics
        isAllDay: event.isAllDay || false,
        isFlexible: event.isFlexible || false,
        location: event.location || ""
      } as UnifiedEvent;
    }
    
    // Default fallback (should never happen)
    return {
      id: entity.id,
      title: "",
      description: "",
      startTime: now,
      endTime: now,
      priority: "Medium",
      status: "todo",
      itemType: "task",
      userId: "",
      createdAt: now
    };
  };

  const handleEdit = async (
    actionId: string, 
    entityType: string, 
    entityId: string,
    originalData: StudySession | Task | Event
  ) => {
    try {
      setError(null);
      
      // Map entity type to UnifiedItemDialog type
      let type: ItemType = "task";
      if (entityType === "Study Session") type = "session";
      else if (entityType === "Task") type = "task";
      else if (entityType === "Event") type = "event";
      
      // Convert the entity to a format that UnifiedItemDialog can understand
      const unifiedItem = convertToUnifiedItem(entityType, originalData);
      
      // Set the item to edit
      setItemToEdit(unifiedItem);
      setItemType(type);
      
      // Open the edit dialog
      setEditDialogOpen(true);
      
    } catch (error) {
      console.error("Error editing item:", error);
      setError(`Failed to edit ${entityType.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleSaveEdit = (item: SchedulableItem) => {
    console.log("Saved item:", item);
    setEditDialogOpen(false);
    // Don't remove the action from the list - keep it visible
  };

  const handleDeleteEdit = (itemId: string) => {
    console.log("Delete item ID:", itemId);
    setEditDialogOpen(false);
    // When an item is deleted from the edit dialog in action list,
    // we don't need to actually delete it from the database,
    // just remove it from the action list
    if (itemToEdit?.id) {
      removeAction(itemToEdit.id);
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (actions.length === 0 && !error) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 border rounded-lg bg-card shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <div className="p-3 flex justify-between items-center cursor-pointer hover:bg-accent/50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <h3 className="text-sm font-medium">Recent Actions {actions.length > 0 && `(${actions.length})`}</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-3 pb-3">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={clearError} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                title={action.title}
                type={action.actionType}
                entityType={action.entityType}
                details={action.details}
                timestamp={action.timestamp}
                onEdit={action.actionType !== "delete" && action.originalData 
                  ? () => handleEdit(
                      action.id,
                      action.entityType,
                      action.entityId,
                      action.originalData as StudySession | Task | Event
                    ) 
                  : undefined}
                onUndo={action.actionType === "delete" && action.originalData 
                  ? () => handleUndo(action.id, action.entityType, action.originalData as StudySession | Task | Event) 
                  : undefined
                }
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Edit Dialog */}
      <UnifiedItemDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialItem={itemToEdit}
        initialType={itemType}
        onSave={handleSaveEdit}
        onDelete={handleDeleteEdit}
        mode="edit"
      />
    </div>
  );
} 