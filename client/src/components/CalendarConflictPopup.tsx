import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { SchedulableItem, ItemType, UnifiedStudySession, UnifiedTask, UnifiedReminder } from "@/types/unified";
import { AlertCircle, CheckCircle } from "lucide-react";

// Import API functions
import { getConflictSuggestion, ChatbotAction, ConflictSuggestionResponse } from "@/api/chatbot";
import { updateTask, deleteTask } from "@/api/tasks";
import { updateEvent, deleteEvent } from "@/api/events";
import { updateStudySession, deleteStudySession } from "@/api/sessions";
// Import conflict API functions and auth
import { saveConflictResolution, saveAiSuggestion, getSavedAiSuggestion } from "@/api/conflicts";
import { auth } from '@/config/firebase'; // <-- Make sure this path is correct

import { useToast } from "@/hooks/useToast";
import { Spinner } from "./ui/spinner";

interface CalendarConflictPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingItems: SchedulableItem[];
  onReschedule: (itemId: string, itemType: ItemType, newStartTime: string, newEndTime?: string) => void;
  onDelete: (itemId: string, itemType: ItemType) => void;
  onResolve: () => void;
}

export function CalendarConflictPopup({
  open,
  onOpenChange,
  conflictingItems,
  onReschedule,
  onDelete,
  onResolve,
}: CalendarConflictPopupProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"reschedule" | "delete" | "ignore">("reschedule");

  // State for AI Suggestion
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [suggestionText, setSuggestionText] = useState<string>("");
  const [suggestedAction, setSuggestedAction] = useState<ChatbotAction | null>(null);
  const [suggestionError, setSuggestionError] = useState<string>("");
  const [isApplyingAction, setIsApplyingAction] = useState<boolean>(false);

  const { toast } = useToast();

  // Reset state when popup opens or items change
  useEffect(() => {
    if (open) {
      setSuggestionText("");
      setSuggestedAction(null);
      setSuggestionError("");
      setIsLoadingSuggestion(false);
      setIsApplyingAction(false);
      setActiveTab("reschedule");
      setRescheduleTime("");

      if (conflictingItems && conflictingItems.length > 0 && conflictingItems[0]?.id) {
        setSelectedItemId(conflictingItems[0].id);
      } else {
        setSelectedItemId("");
      }
    }
  }, [open, conflictingItems]);

  // Fetch AI Suggestion (or load from Firestore)
  useEffect(() => {
    // Ensure user is logged in
    const userId = auth.currentUser?.uid;
    if (!open || !userId) {
      setSuggestionText("");
      setSuggestedAction(null);
      setSuggestionError("");
      setIsLoadingSuggestion(false);
      return;
    }

    if (conflictingItems && conflictingItems.length >= 2) {
      const fetchOrLoadSuggestion = async () => {
        setIsLoadingSuggestion(true);
        setSuggestionError("");
        setSuggestionText("");
        setSuggestedAction(null);

        const item1 = conflictingItems[0];
        const item2 = conflictingItems[1];

        if (!item1?.id || !item2?.id || !item1?.itemType || !item2?.itemType) {
            setSuggestionError("Invalid conflicting item data.");
            setIsLoadingSuggestion(false);
            return;
        }

        try {
          // 1. Try fetching saved suggestion first
          const savedSuggestion = await getSavedAiSuggestion(userId, item1.id, item2.id);

          if (savedSuggestion) {
            console.log("Loaded suggestion from Firestore");
            setSuggestionText(savedSuggestion.suggestion || "Suggestion loaded."); // Handle potentially empty suggestion string
            setSuggestedAction(savedSuggestion.action || null);
            if (savedSuggestion.error) {
                setSuggestionError(`AI Error (cached): ${savedSuggestion.error}`);
            }
            setIsLoadingSuggestion(false);
            return; // Don't fetch from AI if found in cache
          }

          // 2. If not found, fetch from AI
          console.log("Fetching fresh suggestion from AI");
          const response = await getConflictSuggestion(item1, item2);
          setSuggestionText(response.suggestion);
          setSuggestedAction(response.action);
          if (response.error) {
            setSuggestionError(`AI Error: ${response.error}`);
          }

          // 3. Save the newly fetched suggestion (even if there was an error)
          try {
            await saveAiSuggestion(
              userId,
              item1,
              item2,
              response.suggestion,
              response.action,
              response.error
            );
          } catch (saveError: any) {
            console.error("Failed to save AI suggestion to Firestore:", saveError);
            // Non-critical error, maybe show a small warning or just log
          }

        } catch (error: any) {
          console.error("Error fetching/loading conflict suggestion:", error);
          setSuggestionError(`Error fetching suggestion: ${error.message || 'Unknown error'}`);
        } finally {
          setIsLoadingSuggestion(false);
        }
      };
      fetchOrLoadSuggestion();
    }
    else if (open) {
        setSuggestionText("Need at least two items for an AI suggestion.");
        setSuggestedAction(null);
        setIsLoadingSuggestion(false); // Ensure loading stops
    }
  }, [open, conflictingItems]); // Dependency on userId implicitly via auth.currentUser

  // Get the type of the selected item
  const getSelectedItemType = useCallback((): ItemType | null => {
    const item = conflictingItems?.find(i => i.id === selectedItemId);
    return item?.itemType || null;
  }, [selectedItemId, conflictingItems]);

  const handleReschedule = () => {
    if (!selectedItemId || !rescheduleTime) return;
    const itemType = getSelectedItemType();
    const selectedItem = conflictingItems?.find(item => item.id === selectedItemId);
    
    if (!itemType || !selectedItem) {
        console.error("Cannot reschedule: Item or ItemType not found");
        toast({ title: "Error", description: "Selected item not found.", variant: "destructive" });
        return;
    }

    let newEndTime: string | undefined;

    // Event Check
    if (selectedItem.itemType === 'event' && selectedItem.endTime && selectedItem.startTime) {
      try {
        const start = new Date(selectedItem.startTime);
        const end = new Date(selectedItem.endTime);
        const duration = end.getTime() - start.getTime();
        if (!isNaN(duration) && duration >= 0) {
          const newStart = new Date(rescheduleTime);
          const newEnd = new Date(newStart.getTime() + duration);
          newEndTime = newEnd.toISOString().slice(0, 16);
        }
      } catch (e) { console.error("Error calculating duration for event", e); }
    } 
    // Session Check
    else if (selectedItem.itemType === 'session') {
       // Cast to UnifiedStudySession after confirming type
       const sessionItem = selectedItem as UnifiedStudySession;
      if (typeof sessionItem.duration === 'number' && sessionItem.scheduledFor) {
          try {
              const durationMillis = sessionItem.duration * 60000; 
              const newStart = new Date(rescheduleTime);
              const newEnd = new Date(newStart.getTime() + durationMillis);
              newEndTime = newEnd.toISOString().slice(0, 16);
          } catch (e) { console.error("Error calculating session end time", e); }
      }
    } 
    // Task Check (with start/end)
    else if (selectedItem.itemType === 'task' && selectedItem.startTime && selectedItem.endTime) {
      try {
        const start = new Date(selectedItem.startTime);
        const end = new Date(selectedItem.endTime);
        const duration = end.getTime() - start.getTime();
        if (!isNaN(duration) && duration >= 0) {
          const newStart = new Date(rescheduleTime);
          const newEnd = new Date(newStart.getTime() + duration);
          newEndTime = newEnd.toISOString().slice(0, 16);
        }
      } catch (e) { console.error("Error calculating duration for task", e); }
    } 
    // Default: No duration calculable
    else {
      newEndTime = undefined;
    }

    console.log(`Manual Reschedule: ID=${selectedItemId}, Type=${itemType}, Start=${rescheduleTime}, End=${newEndTime}`);
    onReschedule(selectedItemId, itemType, rescheduleTime, newEndTime);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!selectedItemId) return;
    const itemType = getSelectedItemType();
    if (!itemType) { 
        console.error("Cannot delete: ItemType not found");
        toast({ title: "Error", description: "Item type unknown.", variant: "destructive" });
        return;
    }
    console.log(`Manual Delete: ID=${selectedItemId}, Type=${itemType}`);
    onDelete(selectedItemId, itemType);
    onOpenChange(false);
  };

  // --- Apply AI Suggestion ---
  const handleApplySuggestion = async () => {
    const userId = auth.currentUser?.uid;
    if (!suggestedAction || isApplyingAction || !userId) return;
    if (!conflictingItems || conflictingItems.length < 2 || !conflictingItems[0]?.id || !conflictingItems[1]?.id) {
        toast({ title: "Error", description: "Cannot apply suggestion, conflict data missing.", variant: "destructive" });
        return;
    }
    const item1 = conflictingItems[0];
    const item2 = conflictingItems[1];

    setIsApplyingAction(true);
    setSuggestionError(""); 

    try {
      const { type, data } = suggestedAction;
      console.log("Applying AI action:", type, data);

      if (!data || !data.id) {
        throw new Error("AI Action data is missing required 'id'.");
      }

      let success = false;
      let message = "Schedule updated based on suggestion.";

      switch (type) {
        case 'UPDATE_TASK':
          await updateTask(data.id, data);
          success = true;
          break;
        case 'UPDATE_EVENT':
          await updateEvent(data.id, data);
          success = true;
          break;
        case 'UPDATE_SESSION':
          await updateStudySession(data.id, data);
          success = true;
          break;
        case 'DELETE_TASK':
          await deleteTask(data.id);
          message = "Task deleted based on suggestion.";
          success = true;
          break;
        case 'DELETE_EVENT':
          await deleteEvent(data.id);
          message = "Event deleted based on suggestion.";
          success = true;
          break;
        case 'DELETE_SESSION':
           await deleteStudySession(data.id);
           message = "Study session deleted based on suggestion.";
          success = true;
          break;
        default:
          throw new Error(`Unsupported action type from AI: ${type}`);
      }

      if (success) {
        toast({
          title: "Suggestion Applied!",
          description: message,
          variant: "default",
        });

        // Save the resolution status
        try {
            await saveConflictResolution(userId, item1, item2, 'ai_applied', suggestionText, suggestedAction);
        } catch (saveError: any) {
            console.warn("Failed to save AI conflict resolution status:", saveError);
             toast({
                title: "Warning",
                description: "Could not save resolution status.",
                variant: "default", // Use default or a less intrusive variant
                duration: 3000,
            });
        }

        onResolve();
        onOpenChange(false);
      }

    } catch (error: any) {
      console.error("Error applying AI suggestion:", error);
      const errMessage = error?.response?.data?.error || error.message || "An unknown error occurred.";
      setSuggestionError(`Failed to apply suggestion: ${errMessage}`);
      toast({
        title: "Error Applying Suggestion",
        description: errMessage,
        variant: "destructive",
      });
    } finally {
      setIsApplyingAction(false);
    }
  };

  const getItemTitle = (item: SchedulableItem | null | undefined): string => {
    if (!item) return 'Unknown Item';
    // Check type first
    if (item.itemType === 'session') {
        // Cast to UnifiedStudySession before accessing subject
        return (item as UnifiedStudySession).subject || 'Untitled Session'; 
    }
    // Fallback for Task, Event, Reminder
    return item.title || 'Untitled Item';
  };

  const getItemTime = (item: SchedulableItem | null | undefined): string => {
    if (!item) return 'No time information';
    let startTimeStr = '';
    let endTimeStr = '';

    const formatTime = (dateStr: string, timeFormat: string = "h:mm a") => {
        try {
            return format(new Date(dateStr), timeFormat);
        } catch {
            return "Invalid time";
        }
    }
    const formatDate = (dateStr: string, dateFormat: string = "MMM d") => {
        try {
            return format(new Date(dateStr), dateFormat);
        } catch {
            return "Invalid date";
        }
    }

    // Handle different item types
    if ((item.itemType === 'event' || item.itemType === 'task') && item.startTime) {
        startTimeStr = `${formatDate(item.startTime)}, ${formatTime(item.startTime)}`;
        if (item.endTime) {
            const startDate = formatDate(item.startTime);
            const endDate = formatDate(item.endTime);
            endTimeStr = startDate === endDate
                ? formatTime(item.endTime)
                : `${endDate}, ${formatTime(item.endTime)}`;
        }
    } 
    // Session uses scheduledFor/duration
    else if (item.itemType === 'session') {
        const sessionItem = item as UnifiedStudySession;
        if (sessionItem.scheduledFor) { 
            startTimeStr = `${formatDate(sessionItem.scheduledFor)}, ${formatTime(sessionItem.scheduledFor)}`;
            if (typeof sessionItem.duration === 'number') { 
                try {
                    const endTime = new Date(new Date(sessionItem.scheduledFor).getTime() + sessionItem.duration * 60000);
                    const startDate = formatDate(sessionItem.scheduledFor);
                    const endDate = formatDate(endTime.toISOString());
                    endTimeStr = startDate === endDate
                        ? formatTime(endTime.toISOString())
                        : `${endDate}, ${formatTime(endTime.toISOString())}`;
                } catch { endTimeStr = "Invalid duration"; }
            }
        }
    } 
    // Task uses deadline (if no startTime)
    else if (item.itemType === 'task') { 
        const taskItem = item as UnifiedTask;
        if (taskItem.deadline) {
           startTimeStr = `Deadline: ${formatDate(taskItem.deadline)}, ${formatTime(taskItem.deadline)}`;
        }
    } 
    // Reminder uses reminderTime
    else if (item.itemType === 'reminder') { 
        const reminderItem = item as UnifiedReminder;
        if (reminderItem.reminderTime) {
           startTimeStr = `Reminder: ${formatDate(reminderItem.reminderTime)}, ${formatTime(reminderItem.reminderTime)}`;
        }
    }

    if (endTimeStr) {
      return `${startTimeStr} - ${endTimeStr}`;
    }
    return startTimeStr || "No specific time";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
             <AlertCircle className="w-6 h-6 mr-2 text-amber-500"/> Schedule Conflict!
          </DialogTitle>
        </DialogHeader>

        {conflictingItems && conflictingItems.length > 0 ? (
          <div className="py-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="text-sm text-muted-foreground">
              The following items overlap in your schedule:
            </div>

            <div className="space-y-2">
              {conflictingItems.map((item, index) => (
                item ? (
                  <div key={item.id || `conflict-${index}`} className="p-3 border rounded-md bg-background shadow-sm">
                    <div className="font-semibold">{getItemTitle(item)}</div>
                    <div className="text-sm text-muted-foreground">{getItemTime(item)}</div>
                  </div>
                ) : (
                  <div key={`conflict-null-${index}`} className="p-3 border rounded-md bg-red-100">
                     <p className="text-red-700 text-sm">Error: Invalid item data received.</p>
                  </div>
                )
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-200 dark:border-blue-800">
              <Label className="font-semibold text-blue-800 dark:text-blue-300 mb-2 block">Kai's Suggestion:</Label>
              {isLoadingSuggestion && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Spinner size="sm" />
                    <span>Analyzing conflict...</span>
                  </div>
              )}
              {!isLoadingSuggestion && suggestionError && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1"/> {suggestionError}
                  </div>
              )}
              {!isLoadingSuggestion && suggestionText && (
                  <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">{suggestionText}</p>
              )}
              {!isLoadingSuggestion && !suggestionError && suggestedAction && (
                  <Button
                      size="sm"
                      onClick={handleApplySuggestion}
                      disabled={isApplyingAction}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                      {isApplyingAction ? (
                          <> <Spinner size="sm" className="mr-2"/> Applying... </>
                      ) : (
                        <> <CheckCircle className="w-4 h-4 mr-2"/> Apply Suggestion </>
                      )}
                  </Button>
              )}
              {!isLoadingSuggestion && !suggestionError && !suggestedAction && !suggestionText && (
                  <p className="text-sm text-muted-foreground italic">Could not generate a specific action suggestion.</p>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="mb-3 block font-medium">Or Resolve Manually:</Label>
              <div className="flex space-x-2 mb-4">
                <Button
                  variant={activeTab === "reschedule" ? "secondary" : "outline"}
                  onClick={() => setActiveTab("reschedule")}
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  Reschedule
                </Button>
                <Button
                  variant={activeTab === "delete" ? "secondary" : "outline"}
                  onClick={() => setActiveTab("delete")}
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  Delete
                </Button>
                <Button
                  variant={activeTab === "ignore" ? "secondary" : "outline"}
                  onClick={() => setActiveTab("ignore")}
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  Ignore Conflict
                </Button>
              </div>

              {activeTab === "reschedule" && (
                <div className="space-y-4 p-3 border rounded-md bg-background">
                  <div className="grid gap-2">
                    <Label htmlFor="itemToReschedule">Item to Reschedule:</Label>
                    <Select
                      value={selectedItemId}
                      onValueChange={setSelectedItemId}
                      disabled={!conflictingItems || conflictingItems.length === 0}
                    >
                      <SelectTrigger id="itemToReschedule">
                        <SelectValue placeholder="Select item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {conflictingItems.map((item, index) => (
                          item && typeof item.id === 'string' ? (
                            <SelectItem key={item.id} value={item.id} disabled={!item.id}>
                              {getItemTitle(item)}
                            </SelectItem>
                          ) : null
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newTime">New Start Time:</Label>
                    <Input
                      id="newTime"
                      type="datetime-local"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      step={600} 
                      disabled={!selectedItemId}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleReschedule}
                    disabled={!selectedItemId || !rescheduleTime}
                  >
                    Confirm Reschedule
                  </Button>
                </div>
              )}

              {activeTab === "delete" && (
                  <div className="space-y-4 p-3 border rounded-md bg-background">
                  <div className="grid gap-2">
                    <Label htmlFor="itemToDelete">Item to Delete:</Label>
                    <Select
                      value={selectedItemId}
                      onValueChange={setSelectedItemId}
                      disabled={!conflictingItems || conflictingItems.length === 0}
                    >
                      <SelectTrigger id="itemToDelete">
                        <SelectValue placeholder="Select item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {conflictingItems.map((item, index) => (
                           item && typeof item.id === 'string' ? (
                            <SelectItem key={item.id} value={item.id} disabled={!item.id}>
                              {getItemTitle(item)}
                            </SelectItem>
                           ) : null
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={!selectedItemId}
                  >
                    Confirm Deletion
                  </Button>
                </div>
              )}

              {activeTab === "ignore" && (
                <div className="space-y-4 p-3 border rounded-md bg-background">
                  <p className="text-sm text-muted-foreground mb-4">
                      Choosing ignore will close this popup without making changes, and this specific conflict won't be shown again.
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={async () => { // Made async
                        const currentUserId = auth.currentUser?.uid;
                        if (currentUserId && conflictingItems && conflictingItems.length >= 2 && conflictingItems[0]?.id && conflictingItems[1]?.id) {
                            const item1 = conflictingItems[0];
                            const item2 = conflictingItems[1];
                            try {
                                await saveConflictResolution(currentUserId, item1, item2, 'ignored');
                                toast({
                                    title: "Conflict Ignored",
                                    description: "This specific conflict pair will be ignored.",
                                    variant: "default"
                                });
                            } catch (error) {
                                console.error("Failed to save ignore status:", error);
                                toast({
                                    title: "Error",
                                    description: "Could not save ignore status.",
                                    variant: "destructive"
                                });
                                // Decide if we should still close the popup on error
                                // return; // Maybe don't close if saving failed?
                            }
                        } else {
                             console.warn("Could not save ignore status: Missing user ID or conflict items.");
                             // Don't prevent closing, just couldn't save state.
                        }
                        onResolve(); // Notify parent about resolution attempt
                        onOpenChange(false); // Close popup
                    }}
                  >
                    Ignore & Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
             No conflict data available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 