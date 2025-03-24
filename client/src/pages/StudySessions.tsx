import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudySession } from "@/types";
import { format } from "date-fns";
import {
  Timer,
  Plus,
  Check,
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

type SessionFilter = "all" | "ongoing" | "upcoming" | "completed";

export function StudySessions() {
  const {
    sessions: allSessions,
    addSession,
    updateSession,
    deleteSession,
    startSession,
    endSession
  } = useData();

  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [postponeSessionOpen, setPostponeSessionOpen] = useState(false);
  const [_sessionToPostpone, setSessionToPostpone] = useState<string | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<StudySession | null>(null);
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [isActiveOpen, setIsActiveOpen] = useState(true);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [rescheduleSessionOpen, setRescheduleSessionOpen] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] = useState<StudySession | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Define a function to clean localStorage
    const cleanLocalStorage = () => {
      localStorage.removeItem("currentPhase");
      localStorage.removeItem("phaseStartTime");
      localStorage.removeItem("phaseEndTime");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("progress");
      localStorage.removeItem("isPaused");
      localStorage.removeItem("lastSavedTime");
      localStorage.removeItem("actualStartTime");
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
        
        // If session just started, we might need to initialize localStorage
        const freshStart = elapsedMs < 10000;
        
        // Set the active session in state
        setActiveSession(activeSession);
        
        // Initialize session notes if they exist
        if (activeSession.notes) {
          setSessionNotes(prev => ({
            ...prev,
            [activeSession.id]: activeSession.notes || ''
          }));
        }
        
        // If this is a fresh start or localStorage is missing key data, initialize it
        if (freshStart || !localStorage.getItem("currentPhase")) {
          console.log('Initializing localStorage for active session');
          localStorage.setItem("currentPhase", "study");
          localStorage.setItem("progress", String(activeSession.completion || 0));
          localStorage.setItem("isPaused", "false");
          localStorage.setItem("lastSavedTime", new Date().toISOString());
          localStorage.setItem("actualStartTime", activeSession.startTime);
        }
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
  }, [allSessions]);

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
        "timeLeft", "progress", "isPaused", "lastSavedTime"
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
      
      // Ensure we have break interval and duration set
      const breakInterval = sessionToStart.breakInterval || 25;
      const breakDuration = sessionToStart.breakDuration || 5;
      
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
      
      console.log('Active session set with current time:', activeSessionData);
      
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

  // Component to render active session section
  const renderActiveSession = () => {
    if (!activeSession) return null;
    
    return (
      <Card className="border-t-4 border-t-blue-500 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 md:px-6 pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Active Study Session
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsActiveOpen(!isActiveOpen)}
            className="hover:bg-blue-200/20"
          >
            {isActiveOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </CardHeader>
        <Collapsible open={isActiveOpen}>
          <CollapsibleContent>
            <CardContent className="px-4 md:px-6 pt-4">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">{activeSession.subject}</h3>
                    <p className="text-sm text-blue-700/70 dark:text-blue-400/70 mt-1">{activeSession.goal}</p>
                  </div>
                  <Badge
                    variant={
                      activeSession.priority === "High"
                        ? "outline"
                        : activeSession.priority === "Medium"
                        ? "outline"
                        : "outline"
                    }
                    className={cn(
                      "rounded-md py-1.5",
                      activeSession.priority === "High" && "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
                      activeSession.priority === "Medium" && "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
                      activeSession.priority === "Low" && "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                    )}
                  >
                    {activeSession.priority} Priority
                  </Badge>
                </div>

                <StudySessionTimer
                  startTime={activeSession.startTime || activeSession.scheduledFor}
                  duration={activeSession.duration}
                  breakInterval={activeSession.breakInterval || 25}
                  breakDuration={activeSession.breakDuration || 5}
                  onPhaseChange={handlePhaseChange}
                  onComplete={() => handleEndSession(activeSession.id)}
                  onPause={(progress) => {
                    console.log('Session paused at progress:', progress);
                    updateSession(activeSession.id, { 
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
                  initialProgress={activeSession.completion || 0}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950"
                    onClick={() => {
                      setSessionToEdit(activeSession);
                      setCreateSessionOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Session Settings
                  </Button>
                  <Button
                    variant="default"
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
                    onClick={() => handleEndSession(activeSession.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Study Sessions</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select value={filter} onValueChange={(value: SessionFilter) => setFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background border-primary/20">
              <Filter className="w-4 h-4 mr-2 text-primary/70" />
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
            className="w-full sm:w-auto bg-primary hover:bg-primary/90" 
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
          {(filter === "all" || filter === "upcoming") && upcomingSessions.length > 0 && (
            <Card className="border-t-4 border-t-blue-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                  Upcoming Sessions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
                  className="hover:bg-muted/50"
                >
                  {isUpcomingOpen ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </CardHeader>
              <Collapsible open={isUpcomingOpen}>
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "p-5 rounded-lg border transition-all hover:shadow-md",
                            session.isAIRecommended
                              ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30"
                              : "bg-card hover:bg-accent/5",
                            session.priority === "High" && "border-l-4 border-l-red-400 dark:border-l-red-600"
                          )}
                        >
                          <div className="flex flex-col space-y-5">
                            {/* Session Header */}
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{session.subject}</h3>
                                  {session.isAIRecommended && (
                                    <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                                      <Sparkles className="h-3 w-3" />
                                      AI Recommended
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
                                  "rounded-md",
                                  session.priority === "High" && "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-200",
                                  session.priority === "Medium" && "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200",
                                  session.priority === "Low" && "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-200"
                                )}
                              >
                                {session.priority} Priority
                              </Badge>
                            </div>
                            
                            {/* Session Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span>{format(new Date(session.scheduledFor), "MMM d, h:mm a")}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                <Timer className="h-4 w-4 text-blue-500" />
                                <span>{session.duration} minutes</span>
                              </div>
                              {session.technique && (
                                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                  <Settings className="h-4 w-4 text-blue-500" />
                                  <span>{session.technique}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Session Actions */}
                            <div className="flex gap-3 justify-end items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-muted-foreground/20">
                                    <MoreVertical className="h-4 w-4 mr-2" />
                                    Options
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSessionToEdit(session);
                                      setCreateSessionOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Session
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSessionToPostpone(session.id);
                                      setPostponeSessionOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Postpone Session
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400 cursor-pointer"
                                    onClick={() => {
                                      setSessionToDelete(session.id);
                                      setDeleteSessionOpen(true);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Delete Session
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              
                              <Button
                                onClick={() => handleStartSession(session.id)}
                                variant="default"
                                size="sm"
                                className="min-w-[140px] bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <Timer className="h-4 w-4 mr-2" />
                                Start Session
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
          )}

          {/* Completed Sessions Section */}
          {(filter === "all" || filter === "completed") && completedSessions.length > 0 && (
            <Card className="border-t-4 border-t-green-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Completed Sessions
                </CardTitle>
                <div className="flex items-center gap-2">
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
                    className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                    className="hover:bg-muted/50"
                  >
                    {isCompletedOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <Collapsible open={isCompletedOpen}>
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {completedSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col p-5 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">{session.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {session.goal}
                              </p>
                            </div>
                            <Badge variant="outline" className="self-start md:self-center gap-1 bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-200 py-1.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                              <CalendarDays className="h-4 w-4 text-blue-500" />
                              {format(new Date(session.scheduledFor), "MMM d, h:mm a")}
                            </div>
                            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                              <Timer className="h-4 w-4 text-blue-500" />
                              {session.duration} minutes
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 mb-4">
                            <p className="text-sm font-medium">Session Notes:</p>
                            <Textarea
                              placeholder="Add session notes..."
                              value={sessionNotes[session.id] || session.notes || ""}
                              onChange={(e) => {
                                const newNotes = e.target.value;
                                setSessionNotes({
                                  ...sessionNotes,
                                  [session.id]: newNotes,
                                });
                                // Auto-save notes after a short delay
                                updateSession(session.id, { notes: newNotes });
                              }}
                              className="min-h-[100px] resize-none bg-background/50 border-muted"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950"
                              onClick={() => {
                                setSessionToDelete(session.id);
                                setDeleteSessionOpen(true);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                            <Button
                              variant="outline"
                              className="border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950"
                              onClick={() => {
                                setSessionToReschedule(session);
                                setRescheduleSessionOpen(true);
                              }}
                            >
                              <CalendarDays className="h-4 w-4 mr-2" />
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
          )}
        </div>
      </ScrollArea>

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
          startTime: sessionToEdit.scheduledFor,
          scheduledFor: sessionToEdit.scheduledFor,
          priority: sessionToEdit.priority || 'Medium',
          notes: sessionToEdit.notes,
          itemType: 'session',
          breakInterval: sessionToEdit.breakInterval,
          breakDuration: sessionToEdit.breakDuration,
          materials: sessionToEdit.materials,
          isFlexible: sessionToEdit.isFlexible,
          userId: 'current-user',
          createdAt: new Date().toISOString()
        } as UnifiedStudySession : undefined}
        mode={sessionToEdit ? "edit" : "create"}
        onSave={(item) => {
          const sessionData = convertFromUnified(item as SchedulableItem) as StudySession;
          if (sessionToEdit) {
            updateSession(sessionToEdit.id, sessionData);
          } else {
            addSession(sessionData);
          }
        }}
      />

      <DeleteStudySessionDialog
        open={deleteSessionOpen}
        onOpenChange={setDeleteSessionOpen}
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete);
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
    </div>
  );
}