import { useActionVisualization } from "@/contexts/ActionVisualizationProvider";
import { ActionCard } from "./ActionCard";
import { useData } from "@/contexts/DataProvider";
import { StudySession, Task, Event, Reminder } from "@/types";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActionCardList() {
  const { actions, removeAction } = useActionVisualization();
  const { 
    addSession, 
    addTask,
    addEvent,
    addReminder
  } = useData();
  
  const [error, setError] = useState<string | null>(null);

  const handleUndo = async (actionId: string, entityType: string, originalData: StudySession | Task | Event | Reminder) => {
    try {
      setError(null);
      if (entityType === "Study Session") {
        await addSession(originalData as StudySession);
      } else if (entityType === "Task") {
        await addTask(originalData as Task);
      } else if (entityType === "Event") {
        await addEvent(originalData as Event);
      } else if (entityType === "Reminder") {
        await addReminder(originalData as Reminder);
      }
      
      // Remove the action card after successful restoration
      removeAction(actionId);
    } catch (error) {
      console.error("Error undoing action:", error);
      setError(`Failed to undo action: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = async (
    actionId: string, 
    entityType: string, 
    entityId: string
  ) => {
    try {
      setError(null);
      // Open the appropriate edit dialog based on entity type
      // This will be integrated with the existing edit dialogs in the application
      
      // For now, just log the action (we'll update this when implementing the edit functionality)
      console.log(`Editing ${entityType} with ID ${entityId}`);
      
      // Once edited, we'll remove this action card
      removeAction(actionId);
    } catch (error) {
      console.error("Error editing item:", error);
      setError(`Failed to edit ${entityType.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (actions.length === 0 && !error) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2 max-w-2xl mx-auto">
      <h3 className="text-lg font-medium mb-2">Recent Actions</h3>
      
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
      
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          title={action.title}
          type={action.actionType}
          entityType={action.entityType}
          details={action.details}
          timestamp={action.timestamp}
          onEdit={action.actionType !== "delete" ? () => handleEdit(
            action.id,
            action.entityType,
            action.entityId
          ) : undefined}
          onUndo={action.actionType === "delete" && action.originalData 
            ? () => handleUndo(action.id, action.entityType, action.originalData!) 
            : undefined
          }
        />
      ))}
    </div>
  );
} 