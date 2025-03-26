/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { Play, SkipForward, Pause, Clock, Check, Settings } from "lucide-react";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const breakSuggestions = [
  "Stretch for 5 minutes to reduce muscle tension",
  "Drink water and take deep breaths - stay hydrated!",
  "Did you know? Short breaks improve focus and productivity!",
  "Stand up and walk around to boost circulation",
  "Look at something 20 feet away for 20 seconds to reduce eye strain",
  "Practice mindful breathing to reduce stress",
];

interface StudySessionTimerProps {
  startTime: string;       
  duration: number;        
  breakInterval: number;   
  breakDuration: number;   
  onPhaseChange: (phase: "study" | "break") => void;
  onComplete: () => void;
  onPause: (progress: number) => void;
  onResume: () => void;
  onSettings?: () => void;
  initialProgress?: number;
  subjectName?: string;
  priority?: "High" | "Medium" | "Low";
}

export function StudySessionTimer({
  startTime,
  duration,
  breakInterval,
  breakDuration,
  onPhaseChange,
  onComplete,
  onPause,
  onResume,
  onSettings,
  initialProgress = 0,
  subjectName,
  priority,
}: StudySessionTimerProps) {
  // Get the starting state from local storage if available
  const savedPhase = localStorage.getItem("currentPhase");
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isBreak, setIsBreak] = useState(() => savedPhase === "break");
  const [isPaused, setIsPaused] = useState(localStorage.getItem("isPaused") === "true");
  const [phaseEndTime, setPhaseEndTime] = useState<Date>(new Date());
  const [progress, setProgress] = useState(initialProgress);
  const [_currentBreakSuggestion, setCurrentBreakSuggestion] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [actualStartTime, setActualStartTime] = useState<Date>(() => {
    return startTime ? new Date(startTime) : new Date();
  });
  const _navigate = useNavigate();
  const _isMobile = useMediaQuery("(max-width: 640px)");

  // Function to initialize phase
  function initializePhase(isBreakPhase: boolean) {
    console.log("Initializing phase:", isBreakPhase ? "break" : "study", {
      duration,
      breakInterval,
      breakDuration,
      currentProgress: Math.round(progress)
    });
    
    const now = new Date();
    
    // Calculate how long this phase should be (in milliseconds)
    const phaseLength = isBreakPhase ? breakDuration : breakInterval;
    
    // For the first study phase, ensure we use the full duration if no breakInterval is specified
    const isFirstPhase = localStorage.getItem("isFirstPhase") === "true" || !localStorage.getItem("isFirstPhase");
    
    let phaseLengthMs;
    
    if (!isBreakPhase && isFirstPhase) {
      // First study phase should use the full duration or breakInterval if explicitly set
      phaseLengthMs = (breakInterval !== duration) ? breakInterval * 60 * 1000 : duration * 60 * 1000;
      localStorage.setItem("isFirstPhase", "false");
      console.log("First study phase, duration set to:", phaseLengthMs / 60000, "minutes");
    } else {
      // For subsequent phases, use the specified intervals
      phaseLengthMs = phaseLength * 60 * 1000;
      console.log(`Setting ${isBreakPhase ? "break" : "study"} phase length:`, phaseLengthMs / 60000, "minutes");
    }
    
    // Set the end time and time left
    const endTime = new Date(now.getTime() + phaseLengthMs);
    setPhaseEndTime(endTime);
    setTimeLeft(phaseLengthMs);
    
    // Reset progress for the new phase
    setProgress(0);
    
    // Reset pause state for new phase
    setPauseStartTime(null);
    setIsPaused(false);
    localStorage.setItem("isPaused", "false");
    
    // Save to localStorage
    localStorage.setItem("phaseStartTime", now.toISOString());
    localStorage.setItem("phaseEndTime", endTime.toISOString());
    localStorage.setItem("currentPhase", isBreakPhase ? "break" : "study");
    localStorage.setItem("timeLeft", phaseLengthMs.toString());
    localStorage.setItem("lastSavedTime", now.toISOString());
    localStorage.setItem("phaseStartPauseTime", totalPausedTime.toString());
    
    // Notify parent about phase change
    onPhaseChange?.(isBreakPhase ? "break" : "study");
    
    // Phase-specific logic
    if (isBreakPhase) {
      // Start a break phase
      setCurrentBreakSuggestion(
        breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)]
      );
    }
  }

  // Function to load saved state from localStorage
  const loadSavedState = useCallback(() => {
    try {
      const savedPhaseEndTime = localStorage.getItem("phaseEndTime");
      const savedPhaseStartTime = localStorage.getItem("phaseStartTime");
      const savedPhase = localStorage.getItem("currentPhase");
      const savedIsPaused = localStorage.getItem("isPaused") === "true";
      const savedPauseStartTime = localStorage.getItem("pauseStartTime");
      const savedTotalPausedTime = localStorage.getItem("totalPausedTime");
      const savedActualStartTime = localStorage.getItem("actualStartTime");
      const savedPhaseStartPauseTime = localStorage.getItem("phaseStartPauseTime");
      
      console.log("Loading saved state with values:", {
        savedPhase,
        initialProgress,
        savedActualStartTime
      });
      
      // Load total paused time if available
      if (savedTotalPausedTime) {
        setTotalPausedTime(parseInt(savedTotalPausedTime));
      }
      
      // Load actual start time if available - this is critical for progress calculation
      if (savedActualStartTime) {
        setActualStartTime(new Date(savedActualStartTime));
        console.log("Loaded actualStartTime from localStorage:", new Date(savedActualStartTime).toISOString());
      } else if (startTime) {
        setActualStartTime(new Date(startTime));
        console.log("No saved actualStartTime, using startTime prop:", new Date(startTime).toISOString());
      }
      
      // Load pause start time if available
      if (savedPauseStartTime) {
        setPauseStartTime(new Date(savedPauseStartTime));
      } else {
        setPauseStartTime(null);
      }
      
      // Store phase start pause time if not available
      if (!savedPhaseStartPauseTime && savedPhaseStartTime) {
        localStorage.setItem("phaseStartPauseTime", "0");
      }
      
      // Only process if we have a valid saved state
      if (savedPhaseEndTime && savedPhase && savedPhaseStartTime) {
        const endTime = new Date(savedPhaseEndTime);
        const now = new Date();
        let timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
        
        if (savedIsPaused) {
          // If paused, we want to preserve the time remaining
          const savedTimeLeft = localStorage.getItem("timeLeft");
          if (savedTimeLeft) {
            timeRemaining = parseInt(savedTimeLeft);
          }
        }
        
        // Set states from saved values
        setPhaseEndTime(endTime);
        setTimeLeft(timeRemaining);
        setIsBreak(savedPhase === "break");
        setIsPaused(savedIsPaused);
        
        // Calculate progress based on the current phase
        const phaseStartTime = new Date(savedPhaseStartTime);
        const phaseDurationMs = endTime.getTime() - phaseStartTime.getTime();
        
        if (phaseDurationMs > 0) {
          let pauseAdjustment = 0;
          if (savedTotalPausedTime && savedPhaseStartPauseTime) {
            pauseAdjustment = parseInt(savedTotalPausedTime) - parseInt(savedPhaseStartPauseTime);
          }
          
          // Calculate elapsed time in this phase (with pause adjustment)
          const elapsedSincePhaseStartMs = Math.max(0, now.getTime() - phaseStartTime.getTime() - pauseAdjustment);
          
          // Calculate phase progress percentage (0-100%)
          const phaseProgress = Math.min(100, Math.max(0, (elapsedSincePhaseStartMs / phaseDurationMs) * 100));
          setProgress(phaseProgress);
        } else {
          setProgress(0);
        }
        
        // Save the current time as last saved time
        localStorage.setItem("lastSavedTime", new Date().toISOString());
        
        return true;
      }
      
      // No saved state but we have session data - initialize fresh
      if (duration > 0 && breakInterval > 0) {
        console.log("No valid saved state. Creating fresh session with duration:", duration, "min");
        
        // Start with a study phase (not break)
        setIsBreak(false);
        setProgress(0);
        setIsPaused(false);
        setTotalPausedTime(0);
        setPauseStartTime(null);
        
        // Reset isFirstPhase flag for proper initialization
        localStorage.setItem("isFirstPhase", "true");
        
        // Initialize the first study phase
        initializePhase(false);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error loading saved state:", error);
      return false;
    }
  }, [duration, breakInterval, initialProgress, startTime]);

  // Initial setup
  useEffect(() => {
    // Clear any old session data if this is a fresh session
    if (!localStorage.getItem("sessionId") || localStorage.getItem("sessionId") !== startTime) {
      console.log("New session detected, clearing old timer data");
      localStorage.setItem("sessionId", startTime || new Date().toISOString());
      localStorage.removeItem("isPaused");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("progress");
      localStorage.removeItem("lastSavedTime");
      localStorage.removeItem("totalPausedTime");
      localStorage.removeItem("pauseStartTime");
      localStorage.removeItem("phaseEndTime");
      localStorage.removeItem("currentPhase");
      localStorage.removeItem("isFirstPhase");
    }
    
    if (startTime) {
      const parsedStartTime = new Date(startTime);
      setActualStartTime(parsedStartTime);
      localStorage.setItem("actualStartTime", parsedStartTime.toISOString());
      console.log("SessionTimer - Initialized actual start time:", parsedStartTime.toISOString());
      console.log("SessionTimer - Current start time prop:", startTime);
    } else {
      console.warn("SessionTimer - No start time provided!");
    }
    
    if (!isInitialized) {
      const stateLoaded = loadSavedState();
      if (!stateLoaded) {
        // Initialize with a clean state
        console.log("SessionTimer - Initializing fresh session");
        initializePhase(false);
      } else {
        console.log("SessionTimer - Loaded saved state");
      }
      setIsInitialized(true);
    }
    
    // Return cleanup function
    return () => {
      // Save current state when component unmounts
      localStorage.setItem("isPaused", isPaused.toString());
      localStorage.setItem("timeLeft", timeLeft.toString());
      localStorage.setItem("progress", progress.toString());
      localStorage.setItem("lastSavedTime", new Date().toISOString());
    };
  }, [isInitialized, loadSavedState, startTime]);
  
  // Simplified progress calculation - now phase-specific
  const calculateProgress = useCallback(() => {
    // If we're not initialized yet, use initial progress
    if (!isInitialized) return initialProgress || 0;
    
    // Check if we have valid phase end time
    if (!phaseEndTime) return 0;
    
    const now = new Date();
    const currentTimeMs = now.getTime();
    
    // Get the start time of the current phase
    const phaseStartTimeStr = localStorage.getItem("phaseStartTime");
    if (!phaseStartTimeStr) return 0;
    
    const phaseStartTime = new Date(phaseStartTimeStr);
    const phaseStartMs = phaseStartTime.getTime();
    const phaseEndMs = phaseEndTime.getTime();
    
    // Total duration of this phase in milliseconds
    const phaseDurationMs = phaseEndMs - phaseStartMs;
    if (phaseDurationMs <= 0) return 0;
    
    // Calculate elapsed time in this phase, accounting for pauses
    let pauseAdjustment = totalPausedTime;
    
    // If currently paused, also account for the current pause duration
    if (isPaused && pauseStartTime) {
      pauseAdjustment += currentTimeMs - pauseStartTime.getTime();
    }
    
    // Only count paused time that occurred during this phase
    const pauseStartTimeStr = localStorage.getItem("phaseStartPauseTime");
    const phaseTotalPausedTime = pauseStartTimeStr 
      ? Math.max(0, totalPausedTime - parseInt(pauseStartTimeStr))
      : totalPausedTime;
    
    // Calculate elapsed time since phase start (with pause adjustment)
    const elapsedSincePhaseStartMs = Math.max(0, currentTimeMs - phaseStartMs - phaseTotalPausedTime);
    
    // Calculate phase progress percentage (0-100%)
    const phaseProgress = Math.min(100, Math.max(0, (elapsedSincePhaseStartMs / phaseDurationMs) * 100));
    
    console.log(`Phase progress: ${phaseProgress.toFixed(1)}% (${isBreak ? 'break' : 'study'} phase)`);
    
    return phaseProgress;
  }, [isInitialized, phaseEndTime, isPaused, pauseStartTime, totalPausedTime, isBreak, initialProgress]);

  // Effect to update progress regularly
  useEffect(() => {
    // Skip if not initialized
    if (!isInitialized) return;
    
    // Update progress immediately
    const updateProgress = () => {
      const newProgress = calculateProgress();
      setProgress(newProgress);
    };
    
    // Update immediately
    updateProgress();
    
    // Then update every second (but only if not paused)
    const timer = !isPaused ? setInterval(updateProgress, 1000) : null;
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isInitialized, isPaused, calculateProgress]);

  // Main timer countdown effect
  useEffect(() => {
    if (!isInitialized || isPaused) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const endTimeMs = phaseEndTime.getTime();
      const remainingMs = Math.max(0, endTimeMs - now.getTime());
      
      setTimeLeft(remainingMs);
      
      // Phase transition logic
      if (remainingMs <= 0) {
        const wasBreak = isBreak;
        
        // Check if we should end the session
        // Only end if we've completed a study phase and the overall session progress is close to 100%
        if (!wasBreak) {
          // If this was the last study phase based on total duration, end the session
          const sessionStartTime = actualStartTime ? actualStartTime.getTime() : 0;
          const totalSessionDurationMs = duration * 60 * 1000; 
          const now = new Date().getTime();
          
          // Calculate total elapsed time accounting for pauses
          const elapsedTimeMs = now - sessionStartTime - totalPausedTime;
          const overallProgress = (elapsedTimeMs / totalSessionDurationMs) * 100;
          
          // If we've spent almost the full session duration, end the session
          if (overallProgress >= 99.5) {
            console.log("Session complete! Overall progress:", overallProgress.toFixed(1) + "%");
            onComplete?.();
            return;
          }
        }
        
        // Otherwise, switch to the next phase and reset phase-specific progress
        console.log(`Phase complete! Switching from ${wasBreak ? 'break' : 'study'} to ${wasBreak ? 'study' : 'break'}`);
        setIsBreak(!wasBreak);
        initializePhase(!wasBreak);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isInitialized, isPaused, isBreak, onComplete, phaseEndTime, actualStartTime, duration, totalPausedTime]);

  // Cleanup and persistence on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem("isPaused", isPaused.toString());
      localStorage.setItem("timeLeft", timeLeft.toString());
      localStorage.setItem("progress", progress.toString());
      localStorage.setItem("lastSavedTime", new Date().toISOString());
      localStorage.setItem("totalPausedTime", totalPausedTime.toString());
      if (pauseStartTime) {
        localStorage.setItem("pauseStartTime", pauseStartTime.toISOString());
      } else {
        localStorage.removeItem("pauseStartTime");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [isPaused, timeLeft, progress, totalPausedTime, pauseStartTime]);

  const handlePause = () => {
    if (isPaused) return;
    
    console.log("Pausing timer");
    setIsPaused(true);
    localStorage.setItem("isPaused", "true");
    
    // Store the current time when we pause
    const now = new Date();
    setPauseStartTime(now);
    localStorage.setItem("pauseStartTime", now.toISOString());
    
    // Store current remaining time in local storage
    localStorage.setItem("timeLeft", timeLeft.toString());
    
    // Update progress before pausing and save it
    const currentProgress = calculateProgress();
    setProgress(currentProgress);
    localStorage.setItem("progress", currentProgress.toString());
    
    // Notify parent component
    onPause?.(currentProgress);
  };

  const handleResume = () => {
    if (!isPaused) return;
    
    console.log("Resuming timer");
    
    // Calculate time spent in this pause session
    if (pauseStartTime) {
      const now = new Date();
      const pauseDuration = now.getTime() - pauseStartTime.getTime();
      console.log(`Paused for ${Math.round(pauseDuration / 1000)} seconds`);
      
      // Add to total paused time
      const newTotalPausedTime = totalPausedTime + pauseDuration;
      setTotalPausedTime(newTotalPausedTime);
      localStorage.setItem("totalPausedTime", newTotalPausedTime.toString());
      
      // Adjust the phase end time to account for the pause
      const newEndTime = new Date(phaseEndTime.getTime() + pauseDuration);
      setPhaseEndTime(newEndTime);
      localStorage.setItem("phaseEndTime", newEndTime.toISOString());
    }
    
    // Reset pause state
    setIsPaused(false);
    localStorage.setItem("isPaused", "false");
    setPauseStartTime(null);
    localStorage.removeItem("pauseStartTime");
    
    // Notify parent component
    onResume?.();
  };

  const handleSkipPhase = () => {
    const newIsBreak = !isBreak;
    console.log(`Manually skipping to ${newIsBreak ? 'break' : 'study'} phase`);
    
    // Save the current progress before switching phases
    if (!newIsBreak) {
      const currentProgress = calculateProgress();
      setProgress(currentProgress);
      localStorage.setItem("progress", currentProgress.toString());
    }
    
    // Switch phase
    setIsBreak(newIsBreak);
    initializePhase(newIsBreak);
  };

  // Format time display with leading zeros
  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    
    // Only display hours if they exist
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    
    // Otherwise just show minutes and seconds
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Render the progress bar with label indicating current phase
  const renderProgressBar = () => (
    <div className="px-4 py-4">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-muted-foreground">
          {isBreak ? "Break Progress" : "Study Progress"}
        </div>
        <div className="text-xs font-medium">{Math.round(progress)}%</div>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            priority === "High" && "bg-red-500",
            priority === "Medium" && "bg-[#F49D1A]",
            priority === "Low" && "bg-green-500",
            !priority && "bg-green-500" // Default to green if no priority
          )} 
          style={{ 
            width: `${Math.max(0, Math.min(100, progress))}%`,
            transition: "width 0.3s ease-out" 
          }}
        />
      </div>
    </div>
  );

  // Add debug info in development mode
  const debugInfo = process.env.NODE_ENV === 'development' ? (
    <div className="text-xs text-muted-foreground border-t p-2 bg-stone-100 dark:bg-stone-900 space-y-1">
      <div>Debug: ActualStartTime: {actualStartTime.toLocaleTimeString()}</div>
      <div>Phase: {isBreak ? 'Break' : 'Study'} ({formatTimeLeft(timeLeft)} remaining)</div>
      
      {/* Calculate overall session progress */}
      {(() => {
        const sessionStartTime = actualStartTime ? actualStartTime.getTime() : 0;
        const totalSessionDurationMs = duration * 60 * 1000;
        const now = new Date().getTime();
        const elapsedTimeMs = now - sessionStartTime - totalPausedTime;
        const overallProgress = (elapsedTimeMs / totalSessionDurationMs) * 100;
        return (
          <>
            <div>Phase Progress: {progress.toFixed(1)}%</div>
            <div>Overall Progress: {Math.min(100, Math.max(0, overallProgress)).toFixed(1)}%</div>
            <div>TotalPausedTime: {Math.round(totalPausedTime / 1000)}s</div>
            <div>IsPaused: {isPaused ? 'true' : 'false'}</div>
          </>
        );
      })()}
    </div>
  ) : null;

  // Handle the "End" button click
  const handleEndSession = () => {
    // Update progress to 100% when ending manually
    setProgress(100);
    localStorage.setItem("progress", "100");

    // Clear all session data
    localStorage.removeItem("isPaused");
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("phaseEndTime");
    localStorage.removeItem("currentPhase");
    localStorage.removeItem("pauseStartTime");
    localStorage.removeItem("isFirstPhase");
    localStorage.removeItem("sessionId");
    
    // Notify parent
    onComplete?.();
  };

  return (
    <div className={cn(
      "flex flex-col rounded-lg overflow-hidden border-t-4",
      priority === "High" && "border-t-red-500",
      priority === "Medium" && "border-t-[#F49D1A]",
      priority === "Low" && "border-t-green-500",
      !priority && "border-t-green-500" // Default to green if no priority set
    )}>
      {/* Top section with name and priority */}
      <div className="flex justify-between items-center p-4">
        <h3 className="text-base font-normal">{subjectName || "Study Session"}</h3>
        <div className={cn(
          "text-white font-medium rounded px-2 py-1 text-xs",
          priority === "High" && "bg-red-500",
          priority === "Medium" && "bg-[#F49D1A]",
          priority === "Low" && "bg-green-500"
        )}>
          {priority || "Medium"} Priority
        </div>
      </div>
      
      {/* Big centered timer */}
      <div className="text-center py-8">
        <div className="font-mono text-7xl font-bold">
          {formatTimeLeft(timeLeft)}
        </div>
        <div className="mt-4">
          <div className={cn(
            "text-white font-medium rounded-full py-1 px-4 inline-block text-xs",
            priority === "High" && "bg-red-500",
            priority === "Medium" && "bg-[#F49D1A]",
            priority === "Low" && "bg-green-500",
            !priority && "bg-green-500" // Default to green if no priority
          )}>
            {isBreak ? "Break Time" : "Study Time"}
          </div>
        </div>
      </div>
      
      {/* End time and next phase */}
      <div className="flex justify-between items-center px-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>Ends: {format(phaseEndTime, "h:mm a")}</span>
        </div>
        <div>
          Next: {isBreak ? `Study in ${Math.floor(timeLeft / 60000) || 1}m` : `Break in ${Math.ceil(timeLeft / 60000) || 1}m`}
        </div>
      </div>
      
      {/* Progress section - using the dedicated render function */}
      {renderProgressBar()}
      
      {/* Control buttons */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-2">
        <button
          className="bg-muted text-foreground border rounded text-xs py-3 flex items-center justify-center font-medium hover:bg-muted/80"
          onClick={isPaused ? handleResume : handlePause}
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-1.5" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-1.5" />
              Pause
            </>
          )}
        </button>
        
        <button
          className="bg-muted text-foreground border rounded text-xs py-3 flex items-center justify-center font-medium hover:bg-muted/80"
          onClick={handleSkipPhase}
        >
          <SkipForward className="h-4 w-4 mr-1.5" />
          Skip {isBreak ? "Break" : "Study"}
        </button>
      </div>
      
      {/* Bottom buttons */}
      <div className="flex justify-between p-4">
        <button
          className="bg-muted text-foreground border rounded py-1 px-3 flex items-center justify-center text-xs font-medium hover:bg-muted/80"
          onClick={onSettings}
        >
          <Settings className="h-3.5 w-3.5 mr-1" />
          Settings
        </button>
        
        <button
          onClick={handleEndSession}
          className={cn(
            "text-white rounded py-1 px-3 flex items-center justify-center text-xs font-medium",
            priority === "High" && "bg-red-500 hover:bg-red-600",
            priority === "Medium" && "bg-[#F49D1A] hover:bg-[#d68a17]",
            priority === "Low" && "bg-green-500 hover:bg-green-600",
            !priority && "bg-green-500 hover:bg-green-600" // Default to green if no priority
          )}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          End
        </button>
      </div>
      
      {/* Add debugging information if in development */}
      {debugInfo}
    </div>
  );
}