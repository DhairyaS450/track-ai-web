import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudySession } from "@/types";
import { format } from "date-fns";
import {
  Timer,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit,
  X,
  Clock,
  CalendarDays,
  CheckCircle2,
  Filter,
  MoreVertical,
  Sparkles,
  Settings,
  Play,
  Maximize2,
  SendHorizontal as SendIcon,
  Minimize2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { PostponeSessionDialog } from "@/components/PostponeSessionDialog";
import { DeleteStudySessionDialog } from "@/components/DeleteStudySessionDialog";
import { useToast } from "@/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RescheduleSessionDialog } from "@/components/RescheduleSessionDialog";
import { StudySessionTimer } from "@/components/StudySessionTimer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/DataProvider";
import { UnifiedItemDialog } from "@/components/UnifiedItemDialog";
import { SchedulableItem, UnifiedStudySession, convertFromUnified } from "@/types/unified";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Input } from "@/components/ui/input";

type SessionFilter = "all" | "ongoing" | "upcoming" | "completed";

export function StudySessions() {
  const isMobile = useMediaQuery("(max-width: 640px)");

  const {
    sessions: allSessions,
    addSession,
    updateSession,
    deleteSession,
    startSession,
    endSession,
    updateSessionSection
  } = useData();

  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [postponeSessionOpen, setPostponeSessionOpen] = useState(false);
  const [_sessionToPostpone, setSessionToPostpone] = useState<string | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [rescheduleSessionOpen, setRescheduleSessionOpen] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] = useState<StudySession | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed">(
    activeSession ? "active" : "upcoming"
  );
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    sender: "user" | "ai";
    timestamp: Date;
  }>>([
    {
      id: "initial",
      text: "How can I help with your study session today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [showChatExpanded, setShowChatExpanded] = useState(false);

  const { toast } = useToast();

  const [noteUpdateTimeout, setNoteUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleNoteChange = (sessionId: string, newNotes: string) => {
    // Update the local state immediately for responsive UI
    setSessionNotes(prev => ({
      ...prev,
      [sessionId]: newNotes
    }));

    // Clear any existing timeout to avoid multiple rapid updates
    if (noteUpdateTimeout) {
      clearTimeout(noteUpdateTimeout);
    }

    // Set a new timeout to update the database after 500ms of inactivity
    const timeout = setTimeout(() => {
      updateSession(sessionId, { notes: newNotes });
    }, 500);

    setNoteUpdateTimeout(timeout);
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (noteUpdateTimeout) {
        clearTimeout(noteUpdateTimeout);
      }
    };
  }, [noteUpdateTimeout]);

  const handleEndSession = async (sessionId: string) => {
    try {
      console.log('Ending session:', sessionId);
      
      // Collect notes from state if they exist
      const notes = sessionNotes[sessionId] || '';
      
      // Find the session in allSessions
      const session = allSessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Get current time
      const now = new Date();
      
      // If there's a startTime, calculate the actual endTime based on it
      // If no startTime (shouldn't happen), use now as the endTime
      const endTime = session.startTime
        ? new Date(new Date(session.startTime).getTime() + (session.duration * 60 * 1000))
        : now;
      
      console.log('Session started at:', session.startTime || 'unknown');
      console.log('Session duration:', session.duration, 'minutes');
      console.log('Calculated end time:', endTime.toISOString());
      
      // Mark the session as 100% complete
      await endSession(sessionId, notes);
      setActiveSession(null);
      
      // Clear localStorage when session ends
      localStorage.removeItem("currentPhase");
      localStorage.removeItem("phaseStartTime");
      localStorage.removeItem("phaseEndTime");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("progress");
      localStorage.removeItem("isPaused");
      localStorage.removeItem("lastSavedTime");
      localStorage.removeItem("actualStartTime");
      localStorage.removeItem("isFirstPhase");
      localStorage.removeItem("totalPausedTime");
      localStorage.removeItem("pauseStartTime");
      
      toast({
        title: "Success",
        description: "Study session ended successfully",
      });
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session",
      });
    }
  };

  useEffect(() => {
    // Define a function to clean localStorage
    const cleanLocalStorage = () => {
      const keysToRemove = [
        "currentPhase", "phaseStartTime", "phaseEndTime", 
        "timeLeft", "progress", "isPaused", "lastSavedTime",
        "isFirstPhase", "totalPausedTime", "pauseStartTime", 
        "actualStartTime"
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared session data from localStorage');
    };
  
    // Try to find an in-progress session
    const activeSession = allSessions.find(s => s.status === 'in-progress');
    
    // If we have an active session
    if (activeSession) {
      console.log('Found an active session', activeSession);
      
      // Only set as active if it has a valid start time
      if (activeSession.startTime) {
        const startTime = new Date(activeSession.startTime);
        const currentTime = new Date();
        const elapsedMs = currentTime.getTime() - startTime.getTime();
        
        // Get session duration in milliseconds
        const sessionDurationMs = activeSession.duration * 60 * 1000;
        
        console.log('Active session elapsed time:', elapsedMs, 'of total:', sessionDurationMs);
        console.log('Session started at:', startTime.toISOString(), 'and should run for', activeSession.duration, 'minutes');
        
        // If session has been running longer than its duration + 5 minutes (grace period)
        // and it's been running for at least 10 seconds (to prevent premature endings)
        if (elapsedMs > (sessionDurationMs + 300000) && elapsedMs > 10000) {
          console.log('Session exceeded max duration, ending now');
          handleEndSession(activeSession.id);
          return;
        }
        
        // Set the active session in state
        setActiveSession(activeSession);
        
        // Initialize session notes if they exist
        if (activeSession.notes) {
          setSessionNotes(prev => ({
            ...prev,
            [activeSession.id]: activeSession.notes || ''
          }));
        }
        
        // Ensure localStorage has all the data needed, preserving existing state if valid
        const savedPhase = localStorage.getItem("currentPhase");
        const savedProgress = localStorage.getItem("progress");
        
        if (!savedPhase || !savedProgress) {
          console.log('Initializing localStorage for active session');
          // Only initialize what's missing
          if (!savedPhase) localStorage.setItem("currentPhase", "study");
          if (!savedProgress) localStorage.setItem("progress", String(activeSession.completion || 0));
          
          // These should always be updated
          localStorage.setItem("isPaused", "false");
          localStorage.setItem("lastSavedTime", new Date().toISOString());
          localStorage.setItem("actualStartTime", activeSession.startTime);
          localStorage.setItem("isFirstPhase", "true"); // Mark as first phase
          localStorage.setItem("totalPausedTime", "0"); // Reset paused time
        }
        
        // Make sure active tab shows the session
        setActiveTab("active");
      } else {
        // If no start time, end the session
        console.log('Active session has no start time, ending session');
        handleEndSession(activeSession.id);
      }
    } else {
      // No active session in the database
      console.log('No active session found in database');
      
      // Check if there's stale data in localStorage
      const savedPhase = localStorage.getItem("currentPhase");
      
      if (savedPhase) {
        console.log('Found stale data in localStorage, cleaning up');
        cleanLocalStorage();
      }
      
      // Ensure active session state is null
      setActiveSession(null);
    }
  }, [allSessions, handleEndSession, setSessionNotes]);

  const handleRescheduleSession = async (startTime: string, duration: number) => {
    if (!sessionToReschedule) return;

    try {
      // Create a clean copy of the session without undefined fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, startTime: oldStartTime, endTime, status, completion, ...sessionData } = sessionToReschedule;
      
      const newSession = {
        ...sessionData,
        scheduledFor: startTime,
        duration: duration,
        status: 'scheduled' as const,
        completion: 0,
        notes: ''  // Initialize with empty notes
      };

      await addSession(newSession);
      toast({
        title: "Success",
        description: "Study session rescheduled",
      });
    } catch (error) {
      console.error("Error rescheduling session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reschedule session",
      });
    }
    setSessionToReschedule(null);
    setRescheduleSessionOpen(false);
  };

  const handlePhaseChange = (phase: 'study' | 'break') => {
    toast({
      title: phase === 'study' ? "Study Time!" : "Break Time!",
      description: phase === 'study'
        ? "Focus on your tasks for this session"
        : "Take a short break to recharge",
    });
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      console.log('Starting session:', sessionId);
      
      // Clear all localStorage data to ensure a clean start
      const keysToRemove = [
        "currentPhase", "phaseStartTime", "phaseEndTime", 
        "timeLeft", "progress", "isPaused", "lastSavedTime",
        "baseProgress", "isFirstPhase", "totalPausedTime", 
        "pauseStartTime", "actualStartTime"
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared local storage for clean session start');
      
      // Find the session we want to start
      const sessionToStart = allSessions.find(s => s.id === sessionId);
      if (!sessionToStart) {
        console.error('Session not found:', sessionId);
        throw new Error('Session not found');
      }
      
      // Create a current timestamp for the actual start time - this is when the user clicks start
      const now = new Date();
      const currentTimestamp = now.toISOString();
      
      // Ensure we have break interval and duration set - ensure they're proportional to session length
      const breakInterval = sessionToStart.breakInterval || Math.min(
        sessionToStart.duration, // Never exceed total duration
        Math.max(1, Math.floor(sessionToStart.duration * 0.5))
      );
      const breakDuration = sessionToStart.breakDuration || Math.min(
        Math.floor(sessionToStart.duration * 0.2),
        Math.max(1, Math.floor(sessionToStart.duration * 0.1))
      );
      
      // Start the session in the database with the current time
      console.log('Starting session in database with current time:', currentTimestamp);
      const result = await startSession(sessionId);
      console.log('Session started in DB:', result);
      
      // Create active session object with current time as startTime
      // IMPORTANT: We use the current time, NOT the scheduled time
      const activeSessionData = {
        ...sessionToStart,
        status: 'in-progress' as const,
        startTime: currentTimestamp, // Using current timestamp as the start time
        scheduledStartTime: sessionToStart.scheduledFor, // Keep track of original scheduled time
        completion: 0, // Reset completion to zero
        breakInterval, 
        breakDuration,
        // Ensure we have valid values for all required fields
        notes: sessionToStart.notes || '',
        currentPhase: 'study' as const
      };
      
      // Set as active session immediately (don't wait for effect)
      setActiveSession(activeSessionData);
      
      // Initialize notes for this session
      setSessionNotes(prev => ({
        ...prev,
        [sessionId]: sessionToStart.notes || ''
      }));
      
      // Initialize basic localStorage values for timer initialization
      localStorage.setItem("currentPhase", "study");
      localStorage.setItem("progress", "0");
      localStorage.setItem("isPaused", "false");
      localStorage.setItem("lastSavedTime", currentTimestamp);
      localStorage.setItem("actualStartTime", currentTimestamp); // Critical for progress calculation
      localStorage.setItem("isFirstPhase", "true"); // Mark as first phase
      localStorage.setItem("totalPausedTime", "0"); // Reset paused time
      
      console.log('LocalStorage initialized for new session:', {
        currentPhase: "study",
        progress: "0",
        actualStartTime: currentTimestamp,
        isFirstPhase: true,
        totalPausedTime: 0
      });
      
      toast({
        title: "Success",
        description: "Session started successfully",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start session",
      });
    }
  };

  const handleCreateSessionClick = () => {
    setSessionToEdit(null);
    setCreateSessionOpen(true);
  };

  const filteredSessions = allSessions.filter(session => {
    switch (filter) {
      case "ongoing":
        return session.status === "in-progress";
      case "upcoming":
        return session.status === "scheduled";
      case "completed":
        return session.status === "completed";
      default:
        return true;
    }
  });

  const upcomingSessions = filteredSessions.filter(s => s.status === "scheduled");
  const completedSessions = filteredSessions.filter(s => s.status === "completed");

  // Handle section change in the active session
  const handleSectionChange = async (sessionId: string, sectionIndex: number) => {
    try {
      await updateSessionSection(sessionId, sectionIndex);
      
      toast({
        title: "Section changed",
        description: "Successfully moved to the next section of this study session.",
      });
    } catch (error) {
      console.error("Error changing session section:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change session section",
      });
    }
  };
  
  // Modify the renderActiveSession function to handle sections
  const renderActiveSession = () => {
    if (!activeSession) return null;
    
    // Check if the session is using sections mode
    const usingMultipleSections = 
      activeSession.sessionMode === 'sections' && 
      activeSession.sections && 
      activeSession.sections.length > 0;
    
    // Set currentSection if appropriate
    const currentSection = usingMultipleSections && activeSession.currentSectionIndex !== undefined 
      ? activeSession.sections[activeSession.currentSectionIndex] 
      : null;
    
    const startTimeObj = activeSession.startTime 
      ? new Date(activeSession.startTime) 
      : new Date();
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-md">
            <div className="flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Active Study Session
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="font-normal text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Started {format(startTimeObj, "h:mm a")}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <StudySessionTimer
            startTime={activeSession.startTime || new Date().toISOString()}
            duration={activeSession.duration}
            breakInterval={activeSession.breakInterval || 25}
            breakDuration={activeSession.breakDuration || 5}
            subjectName={usingMultipleSections ? currentSection?.subject : activeSession.subject}
            priority={activeSession.priority}
            onPhaseChange={(phase) => {
              console.log("Phase changed to:", phase);
              updateSession(activeSession.id, { currentPhase: phase });
            }}
            onComplete={() => handleEndSession(activeSession.id)}
            onPause={(progress) => {
              console.log("Session paused at:", progress);
              updateSession(activeSession.id, { 
                completion: progress, 
                pausedAt: Date.now()
              });
            }}
            onResume={() => {
              console.log("Session resumed");
              updateSession(activeSession.id, { 
                resumedAt: Date.now()
              });
            }}
            onSettings={() => {
              setSessionToEdit(activeSession);
            }}
            onPostpone={() => {
              setSessionToPostpone(activeSession.id);
              setPostponeSessionOpen(true);
            }}
            onDelete={() => {
              setSessionToDelete(activeSession.id);
              setDeleteSessionOpen(true);
            }}
            onSectionChange={usingMultipleSections ? 
              (sectionIndex) => handleSectionChange(activeSession.id, sectionIndex) : 
              undefined
            }
            sections={activeSession.sections}
            currentSectionIndex={activeSession.currentSectionIndex}
            sessionMode={activeSession.sessionMode}
          />
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Session notes</label>
            </div>
            <Textarea
              value={sessionNotes[activeSession.id] || ""}
              onChange={(e) => handleNoteChange(activeSession.id, e.target.value)}
              placeholder="Add notes about your progress, questions, or ideas..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render the upcoming sessions section - optimized for mobile
  const renderUpcomingSessions = () => {
    if (upcomingSessions.length === 0) return null;
    
    return (
      <Card className="border-t-4 border-t-blue-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Upcoming Sessions
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
            className="h-8 w-8 p-0"
          >
            {isUpcomingOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <Collapsible open={isUpcomingOpen}>
          <CollapsibleContent>
            <CardContent className="pt-3">
              <div className="space-y-3 md:space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "p-3 md:p-4 rounded-lg border transition-all hover:shadow-md",
                      session.isAIRecommended
                        ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30"
                        : "bg-card hover:bg-accent/5 dark:hover:bg-accent/5",
                      session.priority === "High" && "border-l-4 border-l-red-400 dark:border-l-red-600",
                      session.priority === "Low" && "border-l-4 border-l-green-400 dark:border-l-green-600"
                    )}
                  >
                    <div className="flex flex-col space-y-3 md:space-y-5">
                      {/* Session Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1 md:gap-2">
                            <h3 className="font-semibold text-base md:text-lg line-clamp-1">{session.subject}</h3>
                            {session.isAIRecommended && (
                              <Badge variant="secondary" className="text-xs gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                                <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1 md:line-clamp-2">
                            {session.goal}
                          </p>
                        </div>
                        <Badge
                          variant={
                            session.priority === "High"
                              ? "destructive"
                              : session.priority === "Medium"
                              ? "default"
                              : "secondary"
                          }
                          className={cn(
                            "rounded-md text-xs py-0.5 px-1.5",
                            session.priority === "High" && "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-200",
                            session.priority === "Medium" && "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200",
                            session.priority === "Low" && "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-200"
                          )}
                        >
                          {session.priority}
                        </Badge>
                      </div>
                      
                      {/* Session Details */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs md:text-sm">
                        <div className="flex items-center gap-1 md:gap-2 bg-muted/30 p-1.5 md:p-2 rounded-md">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                          <span className="truncate">{
                            (() => {
                              try {
                                const scheduledDate = new Date(session.scheduledFor);
                                // Check if the date is valid
                                if (isNaN(scheduledDate.getTime())) {
                                  return "Invalid Date";
                                }
                                return format(scheduledDate, "MMM d, h:mm a");
                              } catch (error) {
                                console.error("Error formatting date:", error, "for session:", session);
                                return "Invalid Date";
                              }
                            })()
                          }</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 bg-muted/30 p-1.5 md:p-2 rounded-md">
                          <Timer className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                          <span>{session.duration} min</span>
                        </div>
                        {session.technique && (
                          <div className="flex items-center col-span-2 md:col-span-1 gap-1 md:gap-2 bg-muted/30 p-1.5 md:p-2 rounded-md">
                            <Settings className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{session.technique}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Session Actions - Simplified for mobile */}
                      <div className="flex justify-between items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs p-2 md:p-2.5 border-muted-foreground/20"
                            >
                              <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="ml-1 md:ml-2">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              console.log("Opening edit dialog for session:", session.id);
                              setSessionToEdit(session);
                              setCreateSessionOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSessionToPostpone(session.id);
                              setPostponeSessionOpen(true);
                            }}>
                              <CalendarDays className="h-4 w-4 mr-2" />
                              <span>Postpone Session</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400"
                              onClick={() => {
                                setSessionToDelete(session.id);
                                setDeleteSessionOpen(true);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              <span>Delete Session</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button
                          onClick={() => handleStartSession(session.id)}
                          variant="default"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Start
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Render the completed sessions section - optimized for mobile
  const renderCompletedSessions = () => {
    if (completedSessions.length === 0) return null;
    
    return (
      <Card className="border-t-4 border-t-green-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Completed Sessions
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  // Delete all completed sessions
                  for (const session of completedSessions) {
                    await deleteSession(session.id);
                  }
                  toast({
                    title: "Success",
                    description: `Cleared ${completedSessions.length} completed sessions`,
                  });
                } catch (error) {
                  console.error("Error clearing completed sessions:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to clear completed sessions",
                  });
                }
              }}
              className="text-xs border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompletedOpen(!isCompletedOpen)}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              {isCompletedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <Collapsible open={isCompletedOpen}>
          <CollapsibleContent>
            <CardContent className="pt-3">
              <div className="space-y-3 md:space-y-4">
                {completedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col p-3 md:p-5 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 md:mb-4 gap-2 md:gap-4">
                      <div className="space-y-0.5 md:space-y-1">
                        <h3 className="font-semibold text-base md:text-lg">{session.subject}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
                          {session.goal}
                        </p>
                      </div>
                      <Badge variant="outline" className="self-start md:self-center gap-1 text-xs bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-200 py-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                      <div className="flex items-center gap-1 md:gap-2 bg-muted/30 p-1.5 md:p-2 rounded-md">
                        <CalendarDays className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                        {format(new Date(session.scheduledFor), "MMM d, h:mm a")}
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 bg-muted/30 p-1.5 md:p-2 rounded-md">
                        <Timer className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                        {session.duration} minutes
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 md:space-y-2 mb-3 md:mb-4">
                      <p className="text-xs md:text-sm font-medium">Session Notes:</p>
                      <Textarea
                        placeholder="Add session notes..."
                        value={sessionNotes[session.id] || session.notes || ""}
                        onChange={(e) => {
                          const newNotes = e.target.value;
                          handleNoteChange(session.id, newNotes);
                        }}
                        className="min-h-[80px] text-xs resize-none bg-muted/20 border-muted"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs py-1 h-8 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600"
                        onClick={() => {
                          setSessionToDelete(session.id);
                          setDeleteSessionOpen(true);
                        }}
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs py-1 h-8 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600"
                        onClick={() => {
                          setSessionToReschedule(session);
                          setRescheduleSessionOpen(true);
                        }}
                      >
                        <CalendarDays className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Schedule Again
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Render mobile view with tabs
  const renderMobileView = () => {
    const tabs = [
      { id: "active", label: "Current", count: activeSession ? 1 : 0, icon: <Timer className="h-3.5 w-3.5" /> },
      { id: "upcoming", label: "Upcoming", count: upcomingSessions.length, icon: <CalendarDays className="h-3.5 w-3.5" /> },
      { id: "completed", label: "Completed", count: completedSessions.length, icon: <CheckCircle2 className="h-3.5 w-3.5" /> }
    ] as const;
    
    return (
      <div className="flex flex-col h-[100vh] pt-safe">
        {/* Fixed header */}
        <div className="border-b px-3 py-2 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-semibold">Study Sessions</h1>
          <Button 
            variant="ghost"
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleCreateSessionClick}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Tab bar */}
        <div className="bg-muted/40 border-b p-1 flex sticky top-[48px] z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 flex-1 py-1.5 px-1 rounded-md text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-1">
                {tab.icon}
                {tab.label}
              </span>
              {tab.count > 0 && (
                <span className={cn(
                  "rounded-full w-4 h-4 flex items-center justify-center text-[10px] ml-0.5",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-3 pb-safe">
          {/* Empty state */}
          {((activeTab === "active" && !activeSession) ||
            (activeTab === "upcoming" && upcomingSessions.length === 0) ||
            (activeTab === "completed" && completedSessions.length === 0)) && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="p-3 bg-muted/30 rounded-full mb-3">
                {activeTab === "active" ? (
                  <Timer className="h-6 w-6 text-muted-foreground/60" />
                ) : activeTab === "upcoming" ? (
                  <CalendarDays className="h-6 w-6 text-muted-foreground/60" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground/60" />
                )}
              </div>
              <h3 className="text-base font-medium mb-1">No {activeTab} sessions</h3>
              <p className="text-xs text-muted-foreground max-w-[250px] mb-4">
                {activeTab === "active"
                  ? "Start a session from your upcoming list to see it here"
                  : activeTab === "upcoming"
                  ? "Create a new study session to get started"
                  : "Completed sessions will appear here"}
              </p>
              {activeTab === "upcoming" && (
                <Button
                  size="sm"
                  onClick={handleCreateSessionClick}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Session
                </Button>
              )}
            </div>
          )}
          
          {/* Session lists based on active tab */}
          {activeTab === "active" && activeSession && renderMobileSessionCard(activeSession)}
          
          {activeTab === "upcoming" && upcomingSessions.length > 0 && (
            <>
              {upcomingSessions.map(session => renderMobileSessionCard(session))}
            </>
          )}
          
          {activeTab === "completed" && completedSessions.length > 0 && (
            <>
              {completedSessions.map(session => renderMobileSessionCard(session))}
              
              {/* Clear all button for completed */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    for (const session of completedSessions) {
                      await deleteSession(session.id);
                    }
                    toast({
                      title: "Success",
                      description: `Cleared ${completedSessions.length} completed sessions`,
                    });
                  } catch (error) {
                    console.error("Error clearing completed sessions:", error);
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to clear completed sessions",
                    });
                  }
                }}
                className="w-full text-xs border-red-200 hover:bg-red-50 text-red-600 mt-4"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear All Completed Sessions
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Fix for the linter error in renderMobileSessionCard function
  const getStatusColor = (session: StudySession) => {
    const isActive = session.status === "in-progress";
    const isCompleted = session.status === "completed";
    
    if (isActive) return "bg-green-500 dark:bg-green-500";
      if (isCompleted) return "bg-green-500 dark:bg-green-500";
      if (session.priority === "High") return "bg-red-500 dark:bg-red-500";
    if (session.priority === "Medium") return "bg-[#F49D1A] dark:bg-[#F49D1A]";
    if (session.priority === "Low") return "bg-green-500 dark:bg-green-500";
      return "bg-slate-500 dark:bg-slate-500";
    };
    
  // Render each study session card for mobile view
  const renderMobileSessionCard = (session: StudySession) => {
    const isActive = activeSession?.id === session.id;
    const isCompleted = session.status === "completed";
    const isExpanded = expandedSessionId === session.id;

    return (
      <div 
        key={session.id}
        className="mb-3 border rounded-lg overflow-hidden shadow-sm"
      >
        {/* Card header with basic info */}
        <div
          className={cn(
            "flex items-center p-3 gap-3 cursor-pointer"
          )}
          onClick={() => {
            if (isActive) {
              // Always keep active session expanded
              return;
            }
            setExpandedSessionId(expandedSessionId === session.id ? null : session.id);
          }}
        >
          {/* Status dot */}
          <div className={cn("w-3 h-3 rounded-full flex-shrink-0", getStatusColor(session))}></div>
          
          {/* Subject and time */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{session.subject}</h3>
            <p className="text-xs text-muted-foreground">
              {isActive ? (
                <span>In progress</span>
              ) : isCompleted ? (
                <span className="text-green-600">Completed</span>
              ) : (
                <span>{format(new Date(session.scheduledFor), "MMM d, h:mm a")}</span>
              )}
            </p>
          </div>
          
          {/* Duration and icon */}
          <div className="flex items-center gap-1.5">
            <div className="text-xs text-muted-foreground">
              {session.duration}m
            </div>
            {!isActive && (
              <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Expanded content */}
        {(isExpanded || isActive) && (
          <div className={cn(
            "px-0 pb-0",
            isActive ? "" : "border-t border-border/30"
          )}>
            {/* If active session, show timer */}
            {isActive ? (
              <div>
                <div className="px-3 pt-2">
                  <p className="text-xs text-muted-foreground mb-2">{session.goal}</p>
                </div>
                
                <StudySessionTimer
                  startTime={session.startTime || session.scheduledFor}
                  duration={session.duration}
                  breakInterval={session.breakInterval || Math.min(25, Math.max(5, Math.floor(session.duration * 0.8)))}
                  breakDuration={session.breakDuration || Math.min(5, Math.max(1, Math.floor(session.duration * 0.2)))}
                  onPhaseChange={handlePhaseChange}
                  onComplete={() => handleEndSession(session.id)}
                  onSettings={() => {
                    console.log("Opening edit dialog for mobile active session:", session.id);
                    setSessionToEdit(session);
                    setCreateSessionOpen(true);
                  }}
                  onPostpone={() => {
                    console.log("Opening postpone dialog for mobile active session:", session.id);
                    setSessionToPostpone(session.id);
                    setPostponeSessionOpen(true);
                  }}
                  onDelete={() => {
                    console.log("Opening delete dialog for mobile active session:", session.id);
                    setSessionToDelete(session.id);
                    setDeleteSessionOpen(true);
                  }}
                  onPause={(progress) => {
                    updateSession(session.id, { 
                      completion: progress,
                      status: 'in-progress' 
                    });
                    toast({
                      title: "Session Paused",
                      description: `Progress saved: ${Math.round(progress)}%`,
                    });
                  }}
                  onResume={() => {
                    toast({
                      title: "Session Resumed",
                      description: "Keep up the good work!",
                    });
                  }}
                  initialProgress={session.completion || 0}
                  subjectName={session.subject}
                  priority={session.priority || "Medium"}
                />
              </div>
            ) :
              <div className="space-y-3 p-3">
                <p className="text-xs text-muted-foreground">{session.goal}</p>
                
                {isCompleted ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-md">
                        <CalendarDays className="h-3 w-3 text-green-500" />
                        <span>{format(new Date(session.scheduledFor), "MMM d, h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-md">
                        <Timer className="h-3 w-3 text-green-500" />
                        <span>{session.duration} min</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-medium">Session Notes:</p>
                      <Textarea
                        placeholder="Add session notes..."
                        value={sessionNotes[session.id] || session.notes || ""}
                        onChange={(e) => {
                          const newNotes = e.target.value;
                          handleNoteChange(session.id, newNotes);
                        }}
                        className="min-h-[80px] text-xs resize-none bg-muted/20 border-muted"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs border-red-200 hover:bg-red-50 text-red-600"
                        onClick={() => {
                          setSessionToDelete(session.id);
                          setDeleteSessionOpen(true);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs border-blue-200 hover:bg-blue-50 text-blue-600"
                        onClick={() => {
                          setSessionToReschedule(session);
                          setRescheduleSessionOpen(true);
                        }}
                      >
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Schedule Again
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-md">
                        <CalendarDays className="h-3 w-3 text-blue-500" />
                        <span>{format(new Date(session.scheduledFor), "MMM d, h:mm a")}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-muted/30 p-1.5 rounded-md">
                        <Timer className="h-3 w-3 text-blue-500" />
                        <span>{session.duration} min</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs p-2 md:p-2.5 border-muted-foreground/20"
                          >
                            <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="ml-1 md:ml-2">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onClick={() => {
                            console.log("Opening edit dialog for session:", session.id);
                            setSessionToEdit(session);
                            setCreateSessionOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSessionToPostpone(session.id);
                            setPostponeSessionOpen(true);
                          }}>
                            <CalendarDays className="h-4 w-4 mr-2" />
                            <span>Postpone Session</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => {
                              setSessionToDelete(session.id);
                              setDeleteSessionOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            <span>Delete Session</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button
                        onClick={() => handleStartSession(session.id)}
                        variant="default"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Start
                      </Button>
                    </div>
                  </>
                )}
              </div>
            }
          </div>
        )}
      </div>
    );
  };

  // Use the existing render functions for desktop
  const renderDesktopView = () => {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Study Sessions</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Select value={filter} onValueChange={(value: SessionFilter) => setFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="w-full sm:w-auto" 
              onClick={handleCreateSessionClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-8">
            {/* Active Session Section */}
            {(filter === "all" || filter === "ongoing") && renderActiveSession()}

            {/* Empty state when no sessions match filter */}
            {filteredSessions.length === 0 && (
              <div className="text-center py-16 bg-muted/30 rounded-lg border border-muted">
                <div className="flex flex-col items-center gap-4">
                  <Timer className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-xl font-medium">No study sessions found</h3>
                  <p className="text-muted-foreground max-w-md">
                    {filter === "all" 
                      ? "Start by creating your first study session to track your progress"
                      : filter === "ongoing"
                      ? "No ongoing sessions. Start a session from your upcoming list"
                      : filter === "upcoming"
                      ? "No upcoming sessions scheduled. Create a new session to get started"
                      : "No completed sessions. Sessions will appear here once finished"}
                  </p>
                  {filter === "all" && (
                    <Button
                      className="mt-4"
                      onClick={handleCreateSessionClick}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first session
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Sessions Section */}
            {(filter === "all" || filter === "upcoming") && renderUpcomingSessions()}

            {/* Completed Sessions Section */}
            {(filter === "all" || filter === "completed") && renderCompletedSessions()}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Now use the existing handleCreateSession function 
  const handleCreateSession = async (sessionData: StudySession) => {
    try {
      let response;
      
      if (sessionData.id) {
        // This is an update to an existing session
        response = await updateSession(sessionData.id, sessionData);
        
        // If we're updating the active session, maintain it as active
        if (activeSession && sessionData.id === activeSession.id) {
          if (sessionData.status === 'in-progress') {
            console.log('Updating active session:', sessionData);
            if (response && response.session) {
              setActiveSession(response.session);
            }
          }
        }
      } else {
        // This is a new session
        response = await addSession(sessionData);
      }
      
      setCreateSessionOpen(false);
      setSessionToEdit(null);
      
      toast({
        title: "Success",
        description: sessionData.id 
          ? "Study session updated" 
          : "Study session created",
      });
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save study session",
      });
    }
  };

  // Handle sending a message to the AI assistant
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      text: chatMessage,
      sender: "user" as const,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage(""); // Clear input
    
    // TODO: Send to AI and get response
    // For now, simulate a response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to help! What specific topic are you studying?",
        sender: "ai" as const,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const toggleChatExpanded = () => {
    setShowChatExpanded(prev => !prev);
  };

  return (
    <>
      {isMobile ? renderMobileView() : renderDesktopView()}
      
      <UnifiedItemDialog 
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        initialType="session"
        initialItem={sessionToEdit ? {
          id: sessionToEdit.id,
          title: sessionToEdit.subject,
          description: sessionToEdit.goal,
          subject: sessionToEdit.subject,
          goal: sessionToEdit.goal,
          duration: sessionToEdit.duration,
          technique: sessionToEdit.technique,
          status: sessionToEdit.status,
          startTime: sessionToEdit.startTime, // Pass active session start time
          endTime: sessionToEdit.endTime,
          scheduledFor: sessionToEdit.scheduledFor,
          priority: sessionToEdit.priority || 'Medium',
          notes: sessionToEdit.notes || '',
          itemType: 'session',
          breakInterval: sessionToEdit.breakInterval,
          breakDuration: sessionToEdit.breakDuration,
          materials: sessionToEdit.materials || '',
          isFlexible: sessionToEdit.isFlexible || false,
          completion: sessionToEdit.completion || 0,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          source: sessionToEdit.source || 'manual',
          autoScheduled: sessionToEdit.autoScheduled
        } as unknown as UnifiedStudySession : undefined}
        mode={sessionToEdit ? "edit" : "create"}
        onDelete={(itemId) => {
          // Set session to delete and open the confirmation dialog
          setSessionToDelete(itemId); // Just store the ID, not the full object
          setDeleteSessionOpen(true);
        }}
        onSave={(item: SchedulableItem) => {
          // Convert back from UnifiedStudySession to StudySession
          const sessionItem = item as UnifiedStudySession;
          
          // Determine if this is an edit of an active session
          const isActiveEdit = sessionToEdit?.status === 'in-progress';
          
          const sessionData: Partial<StudySession> = {
            ...(sessionItem.id ? { id: sessionItem.id } : {}),
            subject: sessionItem.title || '',
            goal: sessionItem.description || '',
            duration: sessionItem.duration || 60,
            technique: sessionItem.technique || 'pomodoro',
            scheduledFor: sessionItem.scheduledFor || new Date().toISOString(),
            status: isActiveEdit ? 'in-progress' : 'scheduled',
            priority: (sessionItem.priority as 'High' | 'Medium' | 'Low') || 'Medium',
            notes: sessionItem.notes || '',
            breakInterval: sessionItem.breakInterval || 25,
            breakDuration: sessionItem.breakDuration || 5,
            materials: sessionItem.materials || '',
            isFlexible: sessionItem.isFlexible || false,
          };
          
          // Add these only for active sessions
          if (isActiveEdit) {
            sessionData.startTime = sessionToEdit.startTime;
            sessionData.completion = sessionToEdit.completion || 0;
          }
          
          handleCreateSession(sessionData as StudySession);
        }}
      />

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={() => {
          if (sessionToDelete) {
            // Find the session by ID first, then delete it
            const sessionToDeleteId = sessionToDelete; // Store the ID temporarily
            deleteSession(sessionToDeleteId);
            setSessionToDelete(null);
          }
        }}
      />

      <PostponeSessionDialog
        open={postponeSessionOpen}
        onOpenChange={setPostponeSessionOpen}
        onConfirm={(_postponeAmount) => {
          // ... existing code ...
        }}
      />

      {sessionToReschedule && (
        <RescheduleSessionDialog
          open={rescheduleSessionOpen}
          onOpenChange={setRescheduleSessionOpen}
          session={sessionToReschedule}
          onReschedule={handleRescheduleSession}
        />
      )}

      {/* Chatbot popup for study assistance */}
      <Card className={cn(
        "mt-4 border shadow-md transition-all duration-200",
        showChatExpanded ? "fixed inset-4 top-auto z-50 h-[70vh]" : "h-auto"
      )}>
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center justify-between text-md font-medium">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              Study Assistant
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={toggleChatExpanded}
            >
              {showChatExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-card p-3 flex flex-col">
            <ScrollArea className={cn(
              "mb-3 pr-4",
              showChatExpanded ? "h-[calc(70vh-140px)]" : "max-h-[240px]"
            )}>
              <div className="space-y-3">
                {chatMessages.map(message => (
                  <div key={message.id} className={cn(
                    "flex gap-2",
                    message.sender === "user" && "justify-end"
                  )}>
                    {message.sender === "ai" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs shrink-0">
                        AI
                      </div>
                    )}
                    
                    <div className={cn(
                      "rounded-lg p-2 text-sm max-w-[80%]",
                      message.sender === "ai" 
                        ? "bg-muted text-foreground" 
                        : "bg-primary text-primary-foreground"
                    )}>
                      <p>{message.text}</p>
                    </div>
                    
                    {message.sender === "user" && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs shrink-0">
                        You
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 mt-2">
              <Input 
                placeholder="Ask a question about your study material..." 
                className="flex-1"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}