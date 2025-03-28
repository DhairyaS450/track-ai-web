import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Task, Event, StudySession } from "@/types";

interface CalendarConflictPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingItems: (Task | Event | StudySession)[];
  onReschedule: (itemId: string, newStartTime: string, newEndTime?: string) => void;
  onDelete: (itemId: string) => void;
  onIgnore: () => void;
}

export function CalendarConflictPopup({
  open,
  onOpenChange,
  conflictingItems,
  onReschedule,
  onDelete,
  onIgnore,
}: CalendarConflictPopupProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"reschedule" | "delete" | "both">("reschedule");

  // Add logging to see what's coming in
  console.log("Conflicting items received:", conflictingItems);

  // Reset the selected item when the conflicting items change or the popup opens
  if (open && conflictingItems.length > 0 && selectedItemId === "") {
    // Make sure we set a valid ID
    const firstItem = conflictingItems[0];
    if (firstItem && firstItem.id) {
      setSelectedItemId(firstItem.id);
    }
  }

  const handleReschedule = () => {
    if (!selectedItemId || !rescheduleTime) return;
    
    const selectedItem = conflictingItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;
    
    // Calculate new end time if needed
    let newEndTime: string | undefined;
    if ('endTime' in selectedItem && selectedItem.endTime) {
      let startTime: Date;
      if ('startTime' in selectedItem && selectedItem.startTime) {
        startTime = new Date(selectedItem.startTime);
      } else if ('scheduledFor' in selectedItem && selectedItem.scheduledFor) {
        startTime = new Date(selectedItem.scheduledFor);
      } else {
        // Default to current time if no valid start time
        startTime = new Date();
      }
      
      const oldEnd = new Date(selectedItem.endTime);
      const duration = oldEnd.getTime() - startTime.getTime();
      
      const newStart = new Date(rescheduleTime);
      const newEnd = new Date(newStart.getTime() + duration);
      newEndTime = newEnd.toISOString();
    }
    
    onReschedule(selectedItemId, rescheduleTime, newEndTime);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!selectedItemId) return;
    onDelete(selectedItemId);
    onOpenChange(false);
  };

  const getItemTitle = (item: Task | Event | StudySession) => {
    // Add debug info
    if (!item) return 'Unknown item';
    
    if ('name' in item) return item.name;
    if ('title' in item) return item.title;
    if ('subject' in item) return item.subject;
    return 'Untitled';
  };

  const getItemTime = (item: Task | Event | StudySession) => {
    let startTimeStr = '';
    let endTimeStr = '';
    
    if ('startTime' in item && item.startTime) {
      startTimeStr = format(new Date(item.startTime), "MMM d, h:mm a");
      if (item.endTime) {
        endTimeStr = format(new Date(item.endTime), "h:mm a");
      }
    } else if ('scheduledFor' in item && item.scheduledFor) {
      startTimeStr = format(new Date(item.scheduledFor), "MMM d, h:mm a");
      if (item.duration) {
        const endTime = new Date(new Date(item.scheduledFor).getTime() + item.duration * 60000);
        endTimeStr = format(endTime, "h:mm a");
      }
    }
    
    if (endTimeStr) {
      return `${startTimeStr} - ${endTimeStr}`;
    }
    return startTimeStr;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">⚠️ Schedule Conflict!</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 text-amber-600 dark:text-amber-400 font-medium">
            The following items are scheduled at the same time:
          </div>
          
          <div className="space-y-2 mb-6">
            {conflictingItems.map(item => (
              <div key={item.id} className="p-2 border rounded-md">
                <div className="font-medium">{getItemTitle(item)}</div>
                <div className="text-sm text-muted-foreground">{getItemTime(item)}</div>
              </div>
            ))}
          </div>
          
          <div className="bg-muted p-3 rounded-md mb-6">
            <p className="text-sm italic">
              AI Suggestion: Consider rescheduling one of these items to avoid conflicts and ensure you can focus on one task at a time.
            </p>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button 
              variant={activeTab === "reschedule" ? "default" : "outline"} 
              onClick={() => setActiveTab("reschedule")}
              className="flex-1"
            >
              ✅ Reschedule
            </Button>
            <Button 
              variant={activeTab === "delete" ? "default" : "outline"} 
              onClick={() => setActiveTab("delete")}
              className="flex-1"
            >
              🗑️ Delete
            </Button>
            <Button 
              variant={activeTab === "both" ? "default" : "outline"} 
              onClick={() => setActiveTab("both")}
              className="flex-1"
            >
              🔄 Do Both
            </Button>
          </div>
          
          {activeTab === "reschedule" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="itemToReschedule">Select item to reschedule:</Label>
                <Select
                  value={selectedItemId}
                  onValueChange={setSelectedItemId}
                >
                  <SelectTrigger id="itemToReschedule">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {conflictingItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {getItemTitle(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="newTime">New start time:</Label>
                <Input
                  id="newTime"
                  type="datetime-local"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleReschedule}
                disabled={!selectedItemId || !rescheduleTime}
              >
                Reschedule Item
              </Button>
            </div>
          )}
          
          {activeTab === "delete" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="itemToDelete">Select item to delete:</Label>
                <Select
                  value={selectedItemId}
                  onValueChange={setSelectedItemId}
                >
                  <SelectTrigger id="itemToDelete">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {conflictingItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {getItemTitle(item)}
                      </SelectItem>
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
                Delete Item
              </Button>
            </div>
          )}
          
          {activeTab === "both" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                If you need to perform both tasks simultaneously or accept the conflict, you can mark this conflict as acceptable.
              </p>
              
              <Button 
                className="w-full" 
                variant="secondary" 
                onClick={onIgnore}
              >
                Accept This Conflict
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 