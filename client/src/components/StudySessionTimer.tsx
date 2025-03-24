/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CircularProgress } from "./CircularProgress";
import { format } from "date-fns";
import { Timer, Play, SkipForward, Pause, MessageSquare, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const breakSuggestions = [
  "Stretch for 5 minutes to reduce muscle tension",
  "Drink water and take deep breaths - stay hydrated!",
  "Did you know? Short breaks improve focus and productivity!",
  "Stand up and walk around to boost circulation",
  "Look at something 20 feet away for 20 seconds to reduce eye strain",
  "Do some quick desk exercises to stay energized",
  "Practice mindful breathing to reduce stress",
  "Give your eyes a rest from the screen",
  "Try some shoulder and neck stretches",
  "Hydrate and have a healthy snack if needed",
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
  initialProgress?: number;
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
  initialProgress = 0,
}: StudySessionTimerProps) {
  // Get the starting state from local storage if available
  const savedPhase = localStorage.getItem("currentPhase");
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isBreak, setIsBreak] = useState(() => savedPhase === "break");
  const [isPaused, setIsPaused] = useState(localStorage.getItem("isPaused") === "true");
  const setPhaseStartTime = useState<Date>(new Date())[1];
  const [phaseEndTime, setPhaseEndTime] = useState<Date>(new Date());
  const [progress, setProgress] = useState(initialProgress);
  const [currentBreakSuggestion, setCurrentBreakSuggestion] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");

  // const calculatePhaseEndTime = useCallback(
  //   (startDate: Date, isBreakPhase: boolean) => {
  //     const phaseLength = isBreakPhase ? breakDuration : breakInterval;
  //     return new Date(startDate.getTime() + phaseLength * 60000);
  //   },
  //   [breakDuration, breakInterval]
  // );

  // Function to initialize phase
  function initializePhase(isBreakPhase: boolean) {
    console.log("Initializing phase:", isBreakPhase ? "break" : "study");
    const now = new Date();
    setPhaseStartTime(now);
    
    // Calculate how long this phase should be (in milliseconds)
    const phaseLength = isBreakPhase ? breakDuration : breakInterval;
    const phaseLengthMs = phaseLength * 60 * 1000; // Convert minutes to milliseconds
    
    // Set the end time and time left
    const endTime = new Date(now.getTime() + phaseLengthMs);
    setPhaseEndTime(endTime);
    setTimeLeft(phaseLengthMs);
    
    // Save to localStorage
    localStorage.setItem("phaseStartTime", now.toISOString());
    localStorage.setItem("phaseEndTime", endTime.toISOString());
    localStorage.setItem("currentPhase", isBreakPhase ? "break" : "study");
    localStorage.setItem("timeLeft", phaseLengthMs.toString());
    localStorage.setItem("lastSavedTime", now.toISOString());
    
    if (isBreakPhase) {
      onPhaseChange?.("break");
      // Set break suggestion from original suggestions array
      setCurrentBreakSuggestion(
        breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)]
      );
    } else {
      onPhaseChange?.("study");
    }
    
    console.log("Phase initialized with timeLeft:", phaseLengthMs, "ms");
  }

  // Function to load saved state from localStorage
  const loadSavedState = useCallback(() => {
    try {
      const savedTimeLeft = localStorage.getItem("timeLeft");
      const savedProgress = localStorage.getItem("progress");
      const savedPhase = localStorage.getItem("currentPhase");
      const savedIsPaused = localStorage.getItem("isPaused") === "true";
      const savedPhaseStartTime = localStorage.getItem("phaseStartTime");
      const savedPhaseEndTime = localStorage.getItem("phaseEndTime");
      const savedLastTime = localStorage.getItem("lastSavedTime");
      
      // Only process if we have a valid saved state
      if (savedTimeLeft && savedPhase && savedPhaseStartTime && savedPhaseEndTime) {
        let adjustedTimeLeft = parseInt(savedTimeLeft);
        
        // If we have a last saved time, adjust the timeLeft based on elapsed time
        if (savedLastTime && !savedIsPaused) {
          const lastSavedTime = new Date(savedLastTime);
          const now = new Date();
          const elapsedSinceLastSave = now.getTime() - lastSavedTime.getTime();
          
          // Adjust if time elapsed
          if (elapsedSinceLastSave > 0) {
            adjustedTimeLeft = Math.max(0, adjustedTimeLeft - elapsedSinceLastSave);
          }
        }
        
        // Set states from saved values
        setTimeLeft(adjustedTimeLeft);
        if (savedProgress) {
          setProgress(parseFloat(savedProgress));
        } else {
          // If no saved progress, use initialProgress
          setProgress(initialProgress || 0);
        }
        setIsBreak(savedPhase === "break");
        setIsPaused(savedIsPaused);
        
        if (savedPhaseStartTime) {
          setPhaseStartTime(new Date(savedPhaseStartTime));
        }
        
        if (savedPhaseEndTime) {
          setPhaseEndTime(new Date(savedPhaseEndTime));
        }
        
        // Save the current time as last saved time
        localStorage.setItem("lastSavedTime", new Date().toISOString());
        
        console.log("Loaded saved state with timeLeft:", adjustedTimeLeft, "ms, progress:", savedProgress || initialProgress);
        return true;
      } 
      
      // No saved state but we have session data - initialize fresh
      if (duration > 0 && breakInterval > 0) {
        console.log("No valid saved state. Creating fresh session with duration:", duration, "min");
        
        // Start with a study phase (not break)
        setIsBreak(false);
        // Set initial progress from props
        setProgress(initialProgress || 0);
        setIsPaused(false);
        
        // Initialize the first study phase
        const now = new Date();
        setPhaseStartTime(now);
        
        // Initial phase is study phase with duration of the breakInterval
        const initialPhaseMs = breakInterval * 60 * 1000;
        setTimeLeft(initialPhaseMs);
        
        const endTime = new Date(now.getTime() + initialPhaseMs);
        setPhaseEndTime(endTime);
        
        // Save to localStorage
        localStorage.setItem("currentPhase", "study");
        localStorage.setItem("phaseStartTime", now.toISOString());
        localStorage.setItem("phaseEndTime", endTime.toISOString());
        localStorage.setItem("timeLeft", initialPhaseMs.toString());
        localStorage.setItem("progress", initialProgress?.toString() || "0");
        localStorage.setItem("isPaused", "false");
        localStorage.setItem("lastSavedTime", now.toISOString());
        
        console.log("Initialized fresh session with first phase timeLeft:", initialPhaseMs, "ms, initial progress:", initialProgress || 0);
        return true;
      }
      
      console.log("No saved state and insufficient session data");
      return false;
    } catch (error) {
      console.error("Error loading saved state:", error);
      return false;
    }
  }, [duration, breakInterval, initialProgress, breakSuggestions]);

  // Add initialization useEffect to prevent immediate race conditions
  useEffect(() => {
    console.log("Session props:", { startTime, duration, breakInterval, breakDuration });
    if (!isInitialized) {
      const stateLoaded = loadSavedState();
      console.log("Loaded state?", stateLoaded);
      
      // If no state was loaded, initialize a fresh study phase
      if (!stateLoaded) {
        console.log("No saved state found, initializing fresh study phase");
        initializePhase(false);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, loadSavedState, startTime, duration, breakInterval, breakDuration]);
  
  // Update remaining useEffect calls to depend on isInitialized
  useEffect(() => {
    if (!isInitialized) return;
    
    // Add event listener for beforeunload
    const handleBeforeUnload = () => {
      if (timeLeft > 0) {
        localStorage.setItem("timeLeft", timeLeft.toString());
        localStorage.setItem("progress", progress.toString());
        localStorage.setItem("currentPhase", isBreak ? "break" : "study");
        localStorage.setItem("isPaused", isPaused ? "true" : "false");
        localStorage.setItem("lastSavedTime", new Date().toISOString());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Also add event for visibility change to handle tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User has returned to the tab, reload state
        loadSavedState();
      } else {
        // User is leaving the tab, save state
        handleBeforeUnload();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadSavedState, timeLeft, progress, isBreak, isPaused, isInitialized]);

  // Timer effect
  useEffect(() => {
    if (!isInitialized) {
      console.log("Timer not started: not initialized");
      return;
    }
    
    if (isPaused) {
      console.log("Timer paused");
      return;
    }
    
    console.log("Starting timer with timeLeft:", timeLeft, "ms");
    
    const timer = setInterval(() => {
      setTimeLeft((prevTimeLeft) => {
        if (prevTimeLeft <= 1000) { // Less than 1 second left
          console.log("Phase ending, transitioning to next phase");
          
          // Schedule phase transition asynchronously
          setTimeout(() => {
            if (isBreak) {
              console.log("Break phase ended, switching to study phase");
              setIsBreak(false);
              initializePhase(false);
            } else if (breakInterval > 0) {
              console.log("Study phase ended, switching to break phase");
              setIsBreak(true);
              initializePhase(true);
            }
          }, 0);
          
          return 0;
        }
        
        // Decrement by 1 second (1000ms)
        const newTimeLeft = prevTimeLeft - 1000;
        
        // Save to localStorage
        localStorage.setItem("timeLeft", newTimeLeft.toString());
        localStorage.setItem("lastSavedTime", new Date().toISOString());
        
        // Calculate overall session progress
        if (duration > 0) {
          try {
            // Calculate the phase duration in milliseconds
            const phaseMs = isBreak 
              ? breakDuration * 60 * 1000 
              : breakInterval * 60 * 1000;
            
            // Calculate how much of this phase is complete
            const phaseElapsedMs = phaseMs - newTimeLeft;
            const phaseProgressPercent = (phaseElapsedMs / phaseMs) * 100;
            
            // Calculate accurate session metrics
            const totalSessionDurationMs = duration * 60 * 1000; // Total session in ms
            
            // Calculate total study phases and break phases
            const totalStudyPhasesMs = totalSessionDurationMs;
            const numBreaks = Math.floor(totalStudyPhasesMs / (breakInterval * 60 * 1000));
            const totalBreakPhasesMs = numBreaks * breakDuration * 60 * 1000;
            
            // Total duration including breaks
            const totalDurationWithBreaksMs = totalStudyPhasesMs + totalBreakPhasesMs;
            
            // Calculate what percentage of the total this phase represents
            const phasePercentage = isBreak
              ? (breakDuration * 60 * 1000) / totalDurationWithBreaksMs * 100
              : (breakInterval * 60 * 1000) / totalDurationWithBreaksMs * 100;
            
            // How much does this current phase contribute to the progress
            const phaseContribution = (phaseProgressPercent / 100) * (phasePercentage / 100) * 100;
            
            // For accuracy, track how much of the session we've completed before this phase
            // This comes from the initialProgress parameter
            let newProgress = initialProgress || 0;
            
            // Add the progress from the current phase
            newProgress += phaseContribution;
            
            // Ensure progress doesn't exceed 100% or go below initial value
            newProgress = Math.min(100, Math.max(initialProgress || 0, newProgress));
            
            // Round to 2 decimal places for consistency
            newProgress = Math.round(newProgress * 100) / 100;
            
            setProgress(newProgress);
            localStorage.setItem("progress", newProgress.toString());
            
            // Check if session is complete
            if (newProgress >= 99.5) {
              console.log("Session complete! Final progress:", newProgress);
              clearInterval(timer);
              
              // Clean up localStorage
              localStorage.removeItem("timeLeft");
              localStorage.removeItem("progress");
              localStorage.removeItem("currentPhase");
              localStorage.removeItem("phaseStartTime");
              localStorage.removeItem("phaseEndTime");
              localStorage.removeItem("isPaused");
              localStorage.removeItem("lastSavedTime");
              
              // Notify parent component
              onComplete();
              return 0;
            }
          } catch (error) {
            console.error("Error calculating progress:", error);
          }
        }
        
        return newTimeLeft;
      });
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, [isPaused, isBreak, breakInterval, breakDuration, duration, initialProgress, onComplete, initializePhase, isInitialized]);

  const handlePause = () => {
    setIsPaused(true);
    localStorage.setItem("isPaused", "true");
    localStorage.setItem("lastSavedTime", new Date().toISOString());
    onPause?.(progress);
  };

  const handleResume = () => {
    setIsPaused(false);
    localStorage.setItem("isPaused", "false");
    localStorage.setItem("lastSavedTime", new Date().toISOString());
    onResume?.();
  };

  const handleSkipPhase = () => {
    const newIsBreak = !isBreak;
    setIsBreak(newIsBreak);
    initializePhase(newIsBreak);
    onPhaseChange(newIsBreak ? "break" : "study");
  };

  const formatTimeLeft = (ms: number) => {
    // Convert milliseconds to seconds
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    
    // Calculate hours, minutes, seconds
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    // Format with leading zeros
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const calculateNextPhaseTime = () => {
    const nextPhaseIn = Math.floor(timeLeft / 1000 / 60);
    const nextPhaseType = isBreak ? "Focused Study" : "Break";
    return `Next: ${nextPhaseType} in ${nextPhaseIn} minute${
      nextPhaseIn !== 1 ? "s" : ""
    }`;
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-background to-muted/20 dark:from-background dark:to-blue-950/10 shadow-md overflow-hidden relative border border-blue-100 dark:border-blue-900">
      {/* Decoration element */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-100/30 dark:bg-blue-900/20 blur-2xl"></div>
      
      <div className={`flex ${
        isMobile ? "flex-col gap-6" : "items-center justify-between gap-8 mb-6"
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
            <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Time Remaining</h3>
            <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
              {formatTimeLeft(timeLeft)}
            </p>
          </div>
        </div>
        <Badge
          variant={isBreak ? "outline" : "default"}
          className={`animate-pulse self-start text-sm py-1.5 px-3 ${
            isBreak 
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800" 
              : "bg-blue-500 text-white"
          }`}
        >
          {isBreak ? "Break Time" : "Study Time"}
        </Badge>
      </div>

      <div className={`${
        isMobile ? "space-y-6" : "flex items-center justify-between mb-8"
      }`}>
        <div className="flex flex-col gap-3 max-w-md">
          <div className="text-sm bg-muted/50 p-3 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Current phase ends at: {format(phaseEndTime, "hh:mm a")}</span>
            </div>
            <div className="font-medium text-primary">
              {calculateNextPhaseTime()}
            </div>
          </div>
          {isBreak && (
            <div className="text-sm italic p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 text-green-700 dark:text-green-400">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Break Suggestion</span>
              </div>
              {currentBreakSuggestion}
            </div>
          )}
        </div>
        <div className="relative">
          <CircularProgress 
            value={progress} 
            max={100} 
            size={isMobile ? 80 : 100} 
            strokeWidth={8}
            progressColor={isBreak ? "rgb(34, 197, 94)" : "rgb(59, 130, 246)"}
            bgColor={isBreak ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)"}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold">{Math.round(progress)}%</span>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${
        isMobile ? "space-y-4" : "flex justify-between items-center"
      }`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/chatbot")}
          className="gap-2 w-full sm:w-auto border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950"
        >
          <MessageSquare className="h-4 w-4" />
          Need help? Chat with Kai!
        </Button>

        <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipPhase}
            className="w-full sm:w-auto"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip {isBreak ? "Break" : "Study"} Phase
          </Button>
          <Button
            variant={isPaused ? "default" : "secondary"}
            size="sm"
            onClick={isPaused ? handleResume : handlePause}
            className={`w-full sm:w-auto ${
              isPaused 
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Session
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Session
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Progress bar at the bottom */}
      <div className="mt-6 pt-4 border-t border-border/40">
        <div className="text-xs text-muted-foreground mb-2 flex justify-between">
          <span>Session Progress</span>
          <span>
            <span className="font-medium text-primary">{Math.round(progress)}%</span> Complete
          </span>
        </div>
        <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden border border-border/30">
          <div 
            className={`h-full transition-all duration-500 ease-in-out ${
              isBreak 
                ? "bg-gradient-to-r from-green-400 to-green-500" 
                : "bg-gradient-to-r from-blue-400 to-blue-500"
            }`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
}
