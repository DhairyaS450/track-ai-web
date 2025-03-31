import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { CalendarIcon, ChevronDown, ChevronUp, Plus, Trash2, X, Timer, LayoutGrid } from "lucide-react";
import { 
  SchedulableItem, 
  ItemType, 
  UnifiedTask, 
  UnifiedEvent, 
  UnifiedStudySession, 
  UnifiedReminder 
} from "@/types/unified";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";
import { Slider } from "./ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { BookOpen } from "lucide-react";

interface UnifiedItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: SchedulableItem | null;
  initialType?: ItemType;
  onSave: (item: SchedulableItem) => void;
  mode?: "create" | "edit";
}

export function UnifiedItemDialog({
  open,
  onOpenChange,
  initialItem,
  initialType = "task",
  onSave,
  mode = "create"
}: UnifiedItemDialogProps) { 
  const [itemType, setItemType] = useState<ItemType>(initialType);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  // Task-specific fields
  const [completion, setCompletion] = useState(0);
  const [subject, setSubject] = useState("");
  const [resources, setResources] = useState("");
  const [timeSlots, setTimeSlots] = useState([{ startDate: "", endDate: "" }]);
  
  // Event-specific fields
  const [isAllDay, setIsAllDay] = useState(false);
  const [isFlexible, setIsFlexible] = useState(false);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [eventReminders, setEventReminders] = useState<Array<{type: 'minutes' | 'hours' | 'days', amount: number}>>([]);
  
  // Study Session-specific fields
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(60);
  const [technique, setTechnique] = useState("pomodoro");
  const [breakInterval, setBreakInterval] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [materials, setMaterials] = useState("");
  const [notes, setNotes] = useState("");
  const [sessionMode, setSessionMode] = useState("basic");
  const [sections, setSections] = useState<Array<{ id?: string; subject: string; duration: number; breakDuration: number; materials?: string }>>([]);
  
  // Reminder-specific fields
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly" | "Once">("Daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);

  // Reset form when dialog opens/closes or item type changes
  useEffect(() => {
    if (open) {
      if (initialItem) {
        // Populate form with initial item data
        setItemType(initialItem.itemType);
        setTitle(initialItem.title);
        setDescription(initialItem.description);
        setPriority(initialItem.priority as "High" | "Medium" | "Low");
        setStartTime(initialItem.startTime);
        setEndTime(initialItem.endTime || "");
        
        // Populate type-specific fields
        switch (initialItem.itemType) {
          case 'task':
            { const task = initialItem as UnifiedTask;
            setCompletion(task.completion);
            setSubject(task.subject || "");
            setResources(task.resources || "");
            setTimeSlots(task.timeSlots || [{ startDate: "", endDate: "" }]);
            break; }
          case 'event':
            { const event = initialItem as UnifiedEvent;
            setIsAllDay(event.isAllDay);
            setIsFlexible(event.isFlexible);
            setLocation(event.location || "");
            setCategory(event.category || "");
            setEventReminders(event.reminders || []);
            break; }
          case 'session':
            { const session = initialItem as UnifiedStudySession;
            setGoal(session.goal);
            setDuration(session.duration);
            setTechnique(session.technique);
            setBreakInterval(session.breakInterval || 25);
            setBreakDuration(session.breakDuration || 5);
            setMaterials(session.materials || "");
            setNotes(session.notes);
            setSessionMode(session.sessionMode || "basic");
            setSections(session.sections || []);
            break; }
          case 'reminder':
            { const reminder = initialItem as UnifiedReminder;
            setNotificationMessage(reminder.notificationMessage || "");
            if (reminder.recurring) {
              setIsRecurring(true);
              setRecurrenceFrequency(reminder.recurring.frequency);
              setRecurrenceInterval(reminder.recurring.interval);
              setRecurrenceEndDate(reminder.recurring.endDate ? new Date(reminder.recurring.endDate) : undefined);
            }
            break; }
        }
      } else {
        // Set default values
        resetForm();
        setItemType(initialType);
      }
    }
  }, [open, initialItem, initialType]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setStartTime("");
    setEndTime("");
    setCompletion(0);
    setSubject("");
    setResources("");
    setTimeSlots([{ startDate: "", endDate: "" }]);
    setIsAllDay(false);
    setIsFlexible(false);
    setLocation("");
    setCategory("");
    setEventReminders([]);
    setGoal("");
    setDuration(60);
    setTechnique("pomodoro");
    setBreakInterval(25);
    setBreakDuration(5);
    setMaterials("");
    setNotes("");
    setNotificationMessage("");
    setIsRecurring(false);
    setRecurrenceFrequency("Daily");
    setRecurrenceInterval(1);
    setRecurrenceEndDate(undefined);
    setShowAdvanced(false);
    setSessionMode("basic");
    setSections([]);
  };

  const handleTypeChange = (type: string) => {
    setItemType(type as ItemType);
    setShowAdvanced(false);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { startDate: "", endDate: "" }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][field] = value;
    setTimeSlots(newTimeSlots);
  };

  const addReminder = () => {
    setEventReminders([...eventReminders, { type: 'minutes', amount: 15 }]);
  };

  const removeReminder = (index: number) => {
    setEventReminders(eventReminders.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a title",
      });
      return;
    }

    if (!startTime && itemType !== 'reminder') {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a start time",
      });
      return;
    }

    try {
      // Helper function to format event times
      function formatEventTimes(start: string, end: string | undefined, allDay: boolean): { startTime: string; endTime: string } {
        if (allDay) {
          // For all-day events, ensure startTime is just the date part.
          // The backend expects YYYY-MM-DD for all-day start time.
          // We set endTime to the same date for consistency in Firestore, though Google uses an exclusive end date.
          const datePart = start.split('T')[0];
          return { startTime: datePart, endTime: datePart };
        } else {
          // For timed events, ensure both start and end are valid datetime-local strings.
          // Add seconds if missing, though HTML input type=datetime-local might not include them.
          const formatDateTime = (dateTimeStr: string | undefined) => {
             if (!dateTimeStr) return new Date().toISOString().slice(0, 16); // Fallback
             return dateTimeStr.length === 16 ? dateTimeStr : new Date(dateTimeStr).toISOString().slice(0, 16);
          };
          
          let formattedStart = formatDateTime(start);
          let formattedEnd = formatDateTime(end);
          
          // Ensure end is after start
          if (new Date(formattedEnd) <= new Date(formattedStart)) {
              // Set end time to one hour after start time as a default
              const startDateObj = new Date(formattedStart);
              formattedEnd = new Date(startDateObj.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
          }
          
          return { startTime: formattedStart, endTime: formattedEnd };
        }
      }

      let finalStartTime = startTime;
      let finalEndTime = endTime;
      let finalIsAllDay = false;

      if (itemType === 'event') {
        finalIsAllDay = isAllDay; // Use the state value
        
        if (isAllDay) {
          // For all-day events, ensure we're using just the date
          // If there's no T in the startTime, it's already a date string
          finalStartTime = startTime.includes('T') ? startTime.split('T')[0] : startTime;
          // For all-day events, endTime should match the start date or be empty
          finalEndTime = finalStartTime;
        } else {
          // For regular events, ensure both start and end are properly formatted
          const formattedTimes = formatEventTimes(startTime, endTime, isAllDay);
          finalStartTime = formattedTimes.startTime;
          finalEndTime = formattedTimes.endTime;
        }
      }

      // Create base item
      const baseItem: Partial<SchedulableItem> = {
        ...(initialItem?.id && { id: initialItem.id }),
        title,
        description,
        priority,
        status: initialItem?.status || (itemType === 'task' ? 'todo' : 'scheduled'),
        itemType,
        startTime: finalStartTime,
        endTime: finalEndTime || undefined,
        createdAt: initialItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: initialItem?.source || 'manual',
      };

      // Add type-specific fields
      let itemData: SchedulableItem;
      
      switch (itemType) {
        case 'task':
          itemData = {
            ...baseItem,
            deadline: finalStartTime,
            completion,
            timeSlots: timeSlots.filter(slot => slot.startDate && slot.endDate),
            subject,
            resources,
          } as UnifiedTask;
          break;
          
        case 'event':
          itemData = {
            ...baseItem,
            startTime: finalStartTime,
            endTime: finalEndTime,
            isAllDay: finalIsAllDay,
            isFlexible,
            location,
            category,
            reminders: eventReminders,
          } as UnifiedEvent;
          break;
          
        case 'session':
          itemData = {
            ...baseItem,
            subject: subject || title,
            goal,
            duration,
            technique,
            scheduledFor: finalStartTime,
            breakInterval,
            breakDuration,
            materials,
            notes,
            isFlexible,
            sessionMode,
            sections,
          } as UnifiedStudySession;
          break;
          
        case 'reminder':
          itemData = {
            ...baseItem,
            reminderTime: finalStartTime,
            notificationMessage,
            recurring: isRecurring ? {
              frequency: recurrenceFrequency,
              interval: recurrenceInterval,
              endDate: recurrenceEndDate?.toISOString(),
            } : undefined,
          } as UnifiedReminder;
          break;
          
        default:
          itemData = baseItem as SchedulableItem;
      }

      onSave(itemData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save item",
      });
    }
  };

  const handleAddSection = () => {
    setSections([...sections, { subject: "", duration: 0, breakDuration: 0, materials: "" }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof typeof sections[number], value: string | number) => {
    const newSections = [...sections];
    const sectionToUpdate = newSections[index];

    if ((field === 'duration' || field === 'breakDuration') && typeof value === 'number') {
      sectionToUpdate[field] = value;
    } else if ((field === 'subject' || field === 'materials' || field === 'id') && typeof value === 'string') {
      // Ensure 'id' doesn't get assigned a number, though it's less likely from input
      sectionToUpdate[field] = value;
    }
    // If type mismatch, potentially log an error or handle gracefully, 
    // but for now, we'll just prevent incorrect assignment.

    setSections(newSections);
  };

  const calculateTotalDuration = () => {
    return sections.reduce((total, section) => total + section.duration, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create" : "Edit"} {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={itemType} onValueChange={handleTypeChange} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="reminder">Reminder</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] pr-4 overflow-y-auto">
            {/* Common fields for all items */}
            <div className="space-y-4 mb-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <RadioGroup
                  value={priority}
                  onValueChange={(value: "High" | "Medium" | "Low") => setPriority(value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="High" id="priority-high" />
                    <Label htmlFor="priority-high">High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Medium" id="priority-medium" />
                    <Label htmlFor="priority-medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Low" id="priority-low" />
                    <Label htmlFor="priority-low">Low</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Item type specific content */}
            <TabsContent value="task" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startTime">Deadline</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={600}
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Completion</Label>
                  <span className="text-sm text-muted-foreground">{completion}%</span>
                </div>
                <Slider
                  value={[completion]}
                  onValueChange={(values) => setCompletion(values[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <Collapsible 
                open={showAdvanced} 
                onOpenChange={setShowAdvanced}
                className="border rounded-md p-4"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full justify-between">
                    Advanced Options
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <Label>Time Slots</Label>
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="space-y-2">
                        <div className="grid sm:flex items-start sm:items-center gap-2">
                          <div className="w-full sm:flex-1">
                            <Label>Start Time</Label>
                            <Input
                              type="datetime-local"
                              value={slot.startDate}
                              onChange={(e) => updateTimeSlot(index, 'startDate', e.target.value)}
                              step={600}
                            />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label>End Time</Label>
                            <Input
                              type="datetime-local"
                              value={slot.endDate}
                              onChange={(e) => updateTimeSlot(index, 'endDate', e.target.value)}
                              step={600}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mt-6 sm:mt-0"
                            onClick={() => removeTimeSlot(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={addTimeSlot}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="resources">Resources</Label>
                    <Input
                      id="resources"
                      value={resources}
                      onChange={(e) => setResources(e.target.value)}
                      placeholder="Enter resource links"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="event" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isAllDay"
                    checked={isAllDay}
                    onCheckedChange={(checked) => {
                      // When turning on All Day, strip any time component
                      if (checked && startTime) {
                        // Extract just the date part and update the startTime
                        const datePart = startTime.split('T')[0];
                        setStartTime(datePart);
                        // Since all-day events don't need end time, we can clear it
                        setEndTime('');
                      }
                      setIsAllDay(Boolean(checked));
                    }} 
                  />
                  <Label htmlFor="isAllDay" className="cursor-pointer">All Day Event</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isFlexible"
                    checked={isFlexible}
                    onCheckedChange={(checked) => setIsFlexible(Boolean(checked))} 
                  />
                  <Label htmlFor="isFlexible" className="cursor-pointer">Flexible (Allow AI rescheduling)</Label>
                </div>
              </div>
              
              <div className={isAllDay ? "grid gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                {/* Single date picker for All Day events */}
                {isAllDay ? (
                  <div className="grid gap-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={startTime.split('T')[0] || startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    {/* Start Time input for regular events */}
                    <div className="grid gap-2">
                      <Label htmlFor="event-startTime">Start Time</Label>
                      <Input
                        id="event-startTime"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step={600}
                      />
                    </div>
                    {/* End Time input for regular events */}
                    <div className="grid gap-2">
                      <Label htmlFor="event-endTime">End Time</Label>
                      <Input
                        id="event-endTime"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        min={startTime}
                        step={600}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location (optional)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter category (optional)"
                />
              </div>

              <Collapsible 
                open={showAdvanced} 
                onOpenChange={setShowAdvanced}
                className="border rounded-md p-4"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full justify-between">
                    Advanced Options
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Reminders</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addReminder}
                      >
                        Add Reminder
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {eventReminders.map((reminder, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={reminder.amount}
                            onChange={(e) => {
                              const newReminders = [...eventReminders];
                              newReminders[index].amount = parseInt(e.target.value);
                              setEventReminders(newReminders);
                            }}
                            className="w-20"
                          />
                          <Select
                            value={reminder.type}
                            onValueChange={(value: 'minutes' | 'hours' | 'days') => {
                              const newReminders = [...eventReminders];
                              newReminders[index].type = value;
                              setEventReminders(newReminders);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeReminder(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="session" className="space-y-4">
              <div className="grid gap-3 items-start md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goal">Goal</Label>
                  <Input
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Complete chapter 5 exercises"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={600}
                />
              </div>

              <div className="grid gap-3 items-start md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Mode</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={sessionMode === "basic" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setSessionMode("basic")}
                    >
                      <Timer className="h-4 w-4 mr-2" />
                      Basic
                    </Button>
                    <Button
                      type="button"
                      variant={sessionMode === "sections" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setSessionMode("sections")}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Sections
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value as "High" | "Medium" | "Low")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sessionMode === "basic" ? (
                <>
                  <div className="grid gap-3 items-start md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="240"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        placeholder="e.g. 60"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="breakInterval">Study Interval (minutes)</Label>
                      <Input
                        id="breakInterval"
                        type="number"
                        min="5"
                        max="90"
                        value={breakInterval}
                        onChange={(e) => setBreakInterval(parseInt(e.target.value))}
                        placeholder="e.g. 25"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="breakDuration">Break Length (minutes)</Label>
                      <Input
                        id="breakDuration"
                        type="number"
                        min="1"
                        max="30"
                        value={breakDuration}
                        onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                        placeholder="e.g. 5"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center">
                      <Label>Session Sections</Label>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={handleAddSection}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Section
                      </Button>
                    </div>
                    
                    <div className="space-y-3 max-h-[250px] overflow-y-auto rounded-md border p-2">
                      {sections.length > 0 ? (
                        sections.map((section, index) => (
                          <div 
                            key={section.id || index} 
                            className="rounded-md border p-3 bg-card/50"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Section {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSection(index)}
                                className="h-8 w-8 p-0 text-muted-foreground"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-3 mb-2">
                              <div className="grid gap-2">
                                <Label htmlFor={`section-${index}-subject`} className="text-xs">
                                  Subject
                                </Label>
                                <Input
                                  id={`section-${index}-subject`}
                                  value={section.subject}
                                  onChange={(e) => handleSectionChange(index, "subject", e.target.value)}
                                  placeholder="e.g. Algebra"
                                  className="h-8"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1">
                                  <Label htmlFor={`section-${index}-duration`} className="text-xs">
                                    Duration (min)
                                  </Label>
                                  <Input
                                    id={`section-${index}-duration`}
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={section.duration}
                                    onChange={(e) => handleSectionChange(index, "duration", parseInt(e.target.value))}
                                    placeholder="e.g. 25"
                                    className="h-8"
                                  />
                                </div>
                                <div className="grid gap-1">
                                  <Label htmlFor={`section-${index}-break`} className="text-xs">
                                    Break (min)
                                  </Label>
                                  <Input
                                    id={`section-${index}-break`}
                                    type="number"
                                    min="0"
                                    max="30"
                                    value={section.breakDuration}
                                    onChange={(e) => handleSectionChange(index, "breakDuration", parseInt(e.target.value))}
                                    placeholder="e.g. 5"
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid gap-1">
                                <Label htmlFor={`section-${index}-materials`} className="text-xs">
                                  Materials (optional)
                                </Label>
                                <Input
                                  id={`section-${index}-materials`}
                                  value={section.materials}
                                  onChange={(e) => handleSectionChange(index, "materials", e.target.value)}
                                  placeholder="e.g. Textbook p.125-130"
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p>No sections added yet</p>
                          <p className="text-xs mt-1">
                            Add sections to break your study session into focused chunks
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground italic">
                      Total duration: {calculateTotalDuration()} minutes
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="reminder" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="reminder-description">Notification Message</Label>
                <Textarea
                  id="reminder-description"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="What should the notification say?"
                />
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="reminderTime">Reminder Time</Label>
                    <Input
                      id="reminderTime"
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      step={600}
                    />
                  </div>
               </div>
               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="recurring"
                   checked={isRecurring}
                   onCheckedChange={(checked: boolean) => setIsRecurring(checked)}
                 />
                 <label
                   htmlFor="recurring"
                   className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                 >
                   Recurring Reminder
                 </label>
               </div>
               {isRecurring && (
                 <div className="space-y-4">
                   <div className="grid gap-2">
                     <Label htmlFor="recurrenceFrequency">Frequency</Label>
                     <Select
                       value={recurrenceFrequency}
                       onValueChange={(value) => setRecurrenceFrequency(value as "Daily" | "Weekly" | "Monthly" | "Yearly")}
                     >
                       <SelectTrigger id="recurrenceFrequency">
                         <SelectValue placeholder="Select frequency" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Daily">Daily</SelectItem>
                         <SelectItem value="Weekly">Weekly</SelectItem>
                         <SelectItem value="Monthly">Monthly</SelectItem>
                         <SelectItem value="Yearly">Yearly</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="grid gap-2">
                     <Label htmlFor="recurrenceInterval">Interval</Label>
                     <Input
                       id="recurrenceInterval"
                       type="number"
                       min={1}
                       value={recurrenceInterval}
                       onChange={(e) => setRecurrenceInterval(Math.max(1, e.target.valueAsNumber))}
                       placeholder="Enter interval"
                     />
                   </div>

                   <div className="grid gap-2">
                     <Label htmlFor="recurrenceEndDate">End Date (Optional)</Label>
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button
                           variant={"outline"}
                           className={cn(
                             "w-full pl-3 text-left font-normal",
                             !recurrenceEndDate && "text-muted-foreground"
                           )}
                         >
                           {recurrenceEndDate ? (
                             format(recurrenceEndDate, "PPP")
                           ) : (
                             <span>Pick an end date</span>
                           )}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0" align="start">
                         <Calendar
                           mode="single"
                           selected={recurrenceEndDate}
                           onSelect={setRecurrenceEndDate}
                           disabled={(date: Date) =>
                             date < new Date(new Date().setHours(0, 0, 0, 0))
                           }
                           initialFocus
                         />
                       </PopoverContent>
                     </Popover>
                   </div>
                 </div>
               )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}