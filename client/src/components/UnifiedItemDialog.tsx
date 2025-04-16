import { useState, useEffect, useRef } from "react";
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
import { 
  SchedulableItem, 
  ItemType, 
  UnifiedTask, 
  UnifiedEvent, 
  UnifiedStudySession, 
  UnifiedReminder 
} from "@/types/unified";
import { useToast } from "@/hooks/useToast";
import { 
  addMinutes, 
  format, 
  parseISO, 
  setMinutes, 
  getMinutes, 
  isValid, 
  isBefore 
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";
import { Slider } from "./ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { 
  Plus, 
  X, 
  CalendarIcon, 
  BookOpen, 
  Timer, 
  LayoutGrid, 
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2
} from "lucide-react";
import { getAuth } from "firebase/auth";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent
} from "./ui/tooltip";

interface UnifiedItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItem?: SchedulableItem | null;
  initialType?: ItemType;
  initialDate?: Date | null;
  onSave: (item: SchedulableItem) => void;
  onDelete?: (itemId: string) => void;
  mode?: "create" | "edit";
}

export function UnifiedItemDialog({
  open,
  onOpenChange,
  initialItem,
  initialType = "task",
  initialDate,
  onSave,
  onDelete,
  mode = "create"
}: UnifiedItemDialogProps) { 
  const [itemType, setItemType] = useState<ItemType>(initialType);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState(itemType); 
  const { toast } = useToast();

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTimeError, setStartTimeError] = useState("");
  const [endTimeError, setEndTimeError] = useState("");
  
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
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  
  // Reminder-specific fields
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly" | "Once">("Daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);

  // Determine the effective mode if not explicitly passed (fallback)
  const effectiveMode = mode || (initialItem ? 'edit' : 'create');

  // Reset form when dialog opens/closes or item type changes
  useEffect(() => {
    if (open) {
      if (effectiveMode === 'edit' && initialItem) {
        // Edit mode: Populate form with item data
        setItemType(initialItem.itemType);
        setTitle(initialItem.title);
        setDescription(initialItem.description);
        setPriority((initialItem.priority as "High" | "Medium" | "Low") || 'Medium');

        // Parse and set Start Date/Time
        const parsedStartDate = initialItem.startTime ? parseISO(initialItem.startTime) : null;
        if (parsedStartDate && isValid(parsedStartDate)) {
          setStartDate(parsedStartDate);
          setStartTime(format(parsedStartDate, "yyyy-MM-dd'T'HH:mm"));
        } else {
          // Handle invalid or missing start date (optional: set a default?)
          setStartDate(undefined);
          setStartTime('');
        }

        // Parse and set End Date/Time
        const parsedEndDate = initialItem.endTime ? parseISO(initialItem.endTime) : null;
        if (parsedEndDate && isValid(parsedEndDate)) {
          setEndDate(parsedEndDate);
          setEndTime(format(parsedEndDate, "yyyy-MM-dd'T'HH:mm"));
        } else if (parsedStartDate && isValid(parsedStartDate)) {
          // Default end time if missing/invalid: 1 hour after start time
          const defaultEndDate = addMinutes(parsedStartDate, 60);
          setEndDate(defaultEndDate);
          setEndTime(format(defaultEndDate, "yyyy-MM-dd'T'HH:mm"));
        } else {
          // Handle invalid or missing end date when start is also invalid
          setEndDate(undefined);
          setEndTime('');
        }

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
            setAutoSchedule(session.autoSchedule || true);
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
      } else if (effectiveMode === 'create') {
        // Create mode: Reset form or use initialDate
        resetForm();
        setItemType(initialType);
        
        if (initialDate && isValid(initialDate)) {
          // Use the clicked date/time from the grid
          const start = initialDate; // Already snapped to 15 mins by CalendarGrid
          const end = addMinutes(start, 60); // Default duration 60 mins
          setStartDate(start);
          setStartTime(format(start, "yyyy-MM-dd'T'HH:mm"));
          setEndDate(end);
          setEndTime(format(end, "yyyy-MM-dd'T'HH:mm"));
        } else {
          // Set default values
          // Set start date to nearest 15-minute interval
          const now = new Date();
          const minutes = getMinutes(now);
          const roundedMinutes = Math.ceil(minutes / 15) * 15;
          const roundedDate = setMinutes(now, roundedMinutes % 60);
          
          if (roundedMinutes >= 60) {
            roundedDate.setHours(now.getHours() + Math.floor(roundedMinutes / 60));
          }
          
          setStartDate(roundedDate);
          setStartTime(format(roundedDate, "yyyy-MM-dd'T'HH:mm"));
          
          // Set end date 1 hour after start date by default
          const defaultEndDate = addMinutes(roundedDate, 60);
          setEndDate(defaultEndDate);
          setEndTime(format(defaultEndDate, "yyyy-MM-dd'T'HH:mm"));
        }
      }
    }
  }, [open, initialItem, initialType, initialDate, effectiveMode]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setStartTime("");
    setEndTime("");
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTimeError("");
    setEndTimeError("");
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
    setAutoSchedule(true);
    setIsAutoScheduling(false);
  };

  const handleTypeChange = (type: string) => {
    setItemType(type as ItemType);
    setActiveTab(type as ItemType); 
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

  const handleSubmit = async () => {
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
          // For all-day events, use YYYY-MM-DD format.
          const datePart = format(new Date(start), 'yyyy-MM-dd');
          return { startTime: datePart, endTime: datePart };
        } else {
          // For timed events, ensure both start and end are valid datetime-local strings.
          const formatDateTime = (dateTimeStr: string | undefined) => {
            const date = dateTimeStr ? new Date(dateTimeStr) : new Date(); // Use current date as fallback
            return format(date, "yyyy-MM-dd'T'HH:mm");
          };
          
          let formattedStart = formatDateTime(start);
          let formattedEnd = formatDateTime(end);
          
          // Ensure end is after start
          if (new Date(formattedEnd) <= new Date(formattedStart)) {
              // Set end time to one hour after start time as a default
              const startDateObj = new Date(formattedStart);
              formattedEnd = format(addMinutes(startDateObj, 60), "yyyy-MM-dd'T'HH:mm");
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
          finalStartTime = format(new Date(startTime), 'yyyy-MM-dd');
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
            goal,
            duration,
            technique,
            breakInterval,
            breakDuration,
            materials,
            notes,
            sessionMode,
            sections: sessionMode === "sections" ? sections : [],
            autoSchedule,
            subject: subject || title, 
            scheduledFor: finalStartTime, 
            type: "studySession" 
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
              endDate: recurrenceEndDate ? format(recurrenceEndDate, "yyyy-MM-dd'T'HH:mm") : undefined,
            } : undefined,
          } as UnifiedReminder;
          break;
          
        default:
          itemData = baseItem as SchedulableItem;
      }

      // If it's a session with auto-schedule enabled, use the auto-scheduler API
      if (itemType === 'session' && autoSchedule && itemData.status !== 'completed') {
        try {
          setIsAutoScheduling(true);
          
          // Get the Firebase auth token
          const auth = getAuth();
          const currentUser = auth.currentUser;
          let authToken = '';
          
          if (currentUser) {
            try {
              authToken = await currentUser.getIdToken();
            } catch (error) {
              console.error('Error getting auth token:', error);
              throw new Error('Failed to authenticate. Please try again or log out and back in.');
            }
          } else {
            throw new Error('You must be logged in to auto-schedule study sessions.');
          }
          
          // Call the auto-schedule API
          console.log("Sending auto-schedule request to API");
          const response = await fetch('/api/study-sessions/autoschedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              subject: itemData.title,
              description: itemData.description,
              totalDurationRequired: duration,
              deadline: itemData.startTime,
              priority: itemData.priority,
              autoSchedule: true
            }),
          });

          console.log("Received response from API:", response.status);
          // Handle API errors carefully
          let data;
          try {
            const textResponse = await response.text();
            
            // Check if the response is valid JSON before parsing
            if (textResponse && textResponse.trim()) {
              try {
                data = JSON.parse(textResponse);
              } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                console.error('Raw response:', textResponse);
                throw new Error('Invalid response format from server. Please try again.');
              }
            } else {
              throw new Error('Empty response received from server. Please try again.');
            }
          } catch (responseError) {
            console.error('Response handling error:', responseError);
            throw responseError;
          }
          
          if (!response.ok) {
            const errorMessage = data?.message || data?.error || 'Failed to auto-schedule study sessions';
            console.error('Auto-scheduling error:', errorMessage, data);
            throw new Error(errorMessage);
          }

          // Successfully auto-scheduled
          // Don't save the original session when auto-scheduling - this prevents duplicate sessions
          setIsAutoScheduling(false);
          
          // Show success message about auto-scheduling
          toast({
            title: "Auto-Scheduling Complete",
            description: `Created ${data.sessions.length} study sessions for you!`,
            duration: 5000,
          });
          
          // Close the dialog
          onOpenChange(false);
          return; // Return early to prevent saving the original session
        } catch (error) {
          console.error('Auto-scheduling error:', error);
          toast({
            variant: "destructive",
            title: "Auto-Scheduling Failed",
            description: error instanceof Error ? error.message : 'Failed to auto-schedule study sessions',
          });
        } finally {
          setIsAutoScheduling(false);
        }
      } else {
        // Regular save process for other item types or non-auto-scheduled sessions
        onSave(itemData);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save item. Please try again.",
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
      sectionToUpdate[field] = value;
    }
    // If type mismatch, potentially log an error or handle gracefully, 
    // but for now, we'll just prevent incorrect assignment.

    setSections(newSections);
  };

  const calculateTotalDuration = () => {
    return sections.reduce((total, section) => total + section.duration, 0);
  };

  // Update start time and validate
  const handleStartTimeChange = (date: Date | undefined) => {
    if (!date) return;
    
    setStartDate(date);
    setStartTime(format(date, "yyyy-MM-dd'T'HH:mm"));
    setStartTimeError("");
    
    // Validate end time is after start time
    if (endDate && isBefore(endDate, date)) {
      const newEndDate = addMinutes(date, 60);
      setEndDate(newEndDate);
      setEndTime(format(newEndDate, "yyyy-MM-dd'T'HH:mm"));
      setEndTimeError("End time must be after start time");
    }
  };
  
  // Update end time and validate
  const handleEndTimeChange = (date: Date | undefined) => {
    if (!date) return;
    
    if (startDate && isBefore(date, startDate)) {
      setEndTimeError("End time must be after start time");
      return;
    }
    
    setEndDate(date);
    setEndTime(format(date, "yyyy-MM-dd'T'HH:mm"));
    setEndTimeError("");
  };
  
  // Custom time picker component
  const TimePicker = ({ 
    selectedTime: selectedTimeProp, 
    onChange 
  }: { 
    selectedTime: Date | undefined; 
    onChange: (date: Date) => void;
  }) => {
    const timeSlots = [];
    const baseDate = selectedTimeProp || new Date();
    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Generate time slots in 15-minute intervals
    for (let i = 0; i < 24 * 4; i++) {
      const slotTime = addMinutes(startOfDay, i * 15);
      timeSlots.push({
        value: slotTime,
        label: format(slotTime, "h:mm a")
      });
    }
    
    // Reference to the scrollable viewport
    const viewportRef = useRef<HTMLDivElement>(null);
    
    // Scroll to the selected time when the component mounts
    useEffect(() => {
      if (!viewportRef.current || !selectedTimeProp) return;
      
      // Format the selected time to match the data-time attribute
      const selectedTimeStr = format(selectedTimeProp, "HH:mm");

      // Find the element matching the selected time
      const selectedElement = viewportRef.current.querySelector(`[data-time="${selectedTimeStr}"]`);
      
      // Allow time for the component to render before scrolling
      if (selectedElement) {
        // Use standard scrollIntoView for robustness
        setTimeout(() => {
          selectedElement.scrollIntoView({
            block: 'center', // Centers the element vertically
            behavior: 'auto' // Use 'smooth' for smooth scrolling, 'auto' for instant
          });
        }, 50); // Keep the short delay
      }
    }, [selectedTimeProp]); // Depend only on selectedTimeProp
    
    return (
      <ScrollArea className="h-[200px] w-full">
        {/* Apply ref directly to the content div */}
        <div ref={viewportRef} className="h-full w-full"> {/* Ensure div fills height */}
          {timeSlots.map((slot) => {
            // Check if this slot is the selected one
            const isSelected = selectedTimeProp && 
                               selectedTimeProp.getHours() === slot.value.getHours() && 
                               Math.floor(selectedTimeProp.getMinutes() / 15) * 15 === slot.value.getMinutes();
            // Format time for the data attribute (e.g., "14:30")
            const timeStr = format(slot.value, "HH:mm");

            return (
              <div 
                key={slot.label}
                // Add data-time attribute for easy selection
                data-time={timeStr}
                className={`px-3 py-1.5 cursor-pointer hover:bg-gray-100 ${
                  isSelected
                    ? "bg-primary text-primary-foreground" 
                    : ""
                }`}
                onClick={() => {
                  const newDate = new Date(selectedTimeProp || baseDate);
                  newDate.setHours(slot.value.getHours(), slot.value.getMinutes());
                  onChange(newDate);
                }}
              >
                {slot.label}
              </div>
            );
          })}
        </div>
        {/* ScrollBar is now handled internally by the ScrollArea component */}
      </ScrollArea>
    );
  };
  
  // DateTimePicker component that combines Calendar and TimePicker
  const DateTimePicker = ({ 
    date: dateProp, 
    onDateChange, 
    errorMessage,
    label: labelProp, 
    description
  }: { 
    date: Date | undefined; 
    onDateChange: (date: Date | undefined) => void;
    errorMessage?: string;
    label: string;
    description?: string;
  }) => {
    return (
      <div className="grid gap-2">
        <Label>{labelProp}</Label> 
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full ${errorMessage ? "border-red-500" : ""}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateProp ? format(dateProp, "PPP") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateProp}
                onSelect={(date: Date | null) => {
                  if (date) {
                    const newDate = date;
                    if (date && date instanceof Date) {
                      // Preserve time when changing date
                      if (date && date instanceof Date) {
                        newDate.setHours(
                          dateProp?.getHours() || 0,
                          dateProp?.getMinutes() || 0
                        );
                      }
                    }
                    onDateChange(newDate);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={"outline"}
                className={`w-full ${errorMessage ? "border-red-500" : ""}`}
              >
                <Clock className="mr-2 h-4 w-4" />
                {dateProp ? format(dateProp, "h:mm a") : <span>Select time</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <TimePicker
                selectedTime={dateProp}
                onChange={(selectedTime) => onDateChange(selectedTime)}
              />
            </PopoverContent>
          </Popover>
        </div>
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[100vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {effectiveMode === 'edit' ? 
              `Edit ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` :
              `Create New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={itemType} onValueChange={handleTypeChange} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="task" disabled={effectiveMode === 'edit'}>Task</TabsTrigger>
            <TabsTrigger value="event" disabled={effectiveMode === 'edit'}>Event</TabsTrigger>
            <TabsTrigger value="session" disabled={effectiveMode === 'edit'}>Session</TabsTrigger>
            <TabsTrigger value="reminder" disabled={effectiveMode === 'edit'}>Reminder</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] pr-4 overflow-y-auto">
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

              {/* Priority selector moved to item-specific sections */}
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

              <DateTimePicker
                label="Deadline"
                date={startDate}
                onDateChange={handleStartTimeChange}
                errorMessage={startTimeError}
              />
              
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
                              onChange={(e) => {
                                const value = e.target.value;
                                updateTimeSlot(index, 'startDate', value);
                                
                                // Validate end time is after start time
                                if (slot.endDate && new Date(value) > new Date(slot.endDate)) {
                                  const newEndDate = new Date(value);
                                  newEndDate.setHours(newEndDate.getHours() + 1);
                                  updateTimeSlot(index, 'endDate', format(newEndDate, "yyyy-MM-dd'T'HH:mm"));
                                }
                              }}
                              step={600}
                            />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label>End Time</Label>
                            <Input
                              type="datetime-local"
                              value={slot.endDate}
                              onChange={(e) => {
                                const value = e.target.value;
                                
                                // Validate end time is after start time
                                if (slot.startDate && new Date(value) <= new Date(slot.startDate)) {
                                  toast({
                                    variant: "destructive",
                                    title: "Invalid time",
                                    description: "End time must be after start time",
                                  });
                                  return;
                                }
                                
                                updateTimeSlot(index, 'endDate', value);
                              }}
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
                        const datePart = format(new Date(startTime), 'yyyy-MM-dd');
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full"
                          id="event-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date: Date | null) => {
                            if (date) {
                              setStartDate(date);
                              setStartTime(format(date, "yyyy-MM-dd"));
                              setEndDate(date);
                              setEndTime(format(date, "yyyy-MM-dd"));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <>
                    {/* Start Time input for regular events */}
                    <DateTimePicker
                      label="Start Time"
                      date={startDate}
                      onDateChange={handleStartTimeChange}
                      errorMessage={startTimeError}
                    />
                    
                    {/* End Time input for regular events */}
                    <DateTimePicker
                      label="End Time"
                      date={endDate}
                      onDateChange={handleEndTimeChange}
                      errorMessage={endTimeError}
                    />
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

              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Smart Study Scheduling</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-1 h-6 w-6 p-0">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Study scheduling info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="text-sm">
                            TidalTasks AI will analyze your calendar and preferences to break this study time into 
                            optimal sessions leading up to your deadline. You can still modify or delete these sessions later.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="auto-schedule"
                      checked={autoSchedule} 
                      onCheckedChange={(checked) => {
                        setAutoSchedule(checked === true);
                      }}
                    />
                    <label
                      htmlFor="auto-schedule"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Auto-Schedule
                    </label>
                  </div>
                </div>
                
                {autoSchedule && (
                  <>
                    <div className="grid gap-3 items-start md:grid-cols-2 mt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Total Required Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="600"
                          value={duration || ''}
                          onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : 0)}
                          placeholder="e.g. 60"
                        />
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
                    
                    <div className="grid gap-2 mt-3">
                      <Label htmlFor="deadline">Deadline</Label>
                      <DateTimePicker
                        date={startDate}
                        onDateChange={handleStartTimeChange}
                        label="" 
                        description="When does this need to be completed by?"
                        errorMessage={startTimeError}
                      />
                    </div>
                  </>
                )}
              </div>

              {!autoSchedule && (
                <>
                  <DateTimePicker
                    label="Start Time"
                    date={startDate}
                    onDateChange={handleStartTimeChange}
                    errorMessage={startTimeError}
                  />

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
                    <DateTimePicker
                      label="Reminder Time"
                      date={startDate}
                      onDateChange={handleStartTimeChange}
                      errorMessage={startTimeError}
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
                           onSelect={(date: Date | null) => setRecurrenceEndDate(date || undefined)}
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

        <DialogFooter className="pt-2">
          {effectiveMode === "edit" && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                if (initialItem?.id) {
                  onDelete(initialItem.id);
                  onOpenChange(false);
                }
              }}
            >
              Delete
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isAutoScheduling}
            onClick={handleSubmit}
          >
            {isAutoScheduling ? "Auto-Scheduling..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}