/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CircularProgress } from "./CircularProgress";
import { format } from "date-fns";
import { Timer, Play, SkipForward, Pause, MessageSquare, Clock, Check, Settings } from "lucide-react";
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
  const [baseProgress, setBaseProgress] = useState(() => 
    parseFloat(localStorage.getItem("baseProgress") || initialProgress.toString())
  );
  const [currentBreakSuggestion, setCurrentBreakSuggestion] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [actualStartTime, setActualStartTime] = useState<Date>(() => {
    return startTime ? new Date(startTime) : new Date();
  });
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Function to initialize phase
  function initializePhase(isBreakPhase: boolean) {
    console.log("Initializing phase:", isBreakPhase ? "break" : "study", {
      duration,
      breakInterval,
      breakDuration,
      progress,
      baseProgress
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
    
    // Reset pause state for new phase
    setPauseStartTime(null);
    
    // Save to localStorage
    localStorage.setItem("phaseStartTime", now.toISOString());
    localStorage.setItem("phaseEndTime", endTime.toISOString());
    localStorage.setItem("currentPhase", isBreakPhase ? "break" : "study");
    localStorage.setItem("timeLeft", phaseLengthMs.toString());
    localStorage.setItem("lastSavedTime", now.toISOString());
    
    // If starting a break phase, make sure we preserve the current progress
    if (isBreakPhase) {
      // In breaks we should maintain the progress from the previous study phase
      const currentSavedProgress = localStorage.getItem("baseProgress");
      console.log("Starting break phase, preserving progress:", currentSavedProgress);
      onPhaseChange?.("break");
      setCurrentBreakSuggestion(
        breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)]
      );
    } else {
      // If starting a study phase, we can update base progress with current progress
      // This is important for resuming after a break
      console.log("Starting study phase with base progress:", progress);
      localStorage.setItem("baseProgress", progress.toString());
      setBaseProgress(progress);
      onPhaseChange?.("study");
    }
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
      const savedPauseStartTime = localStorage.getItem("pauseStartTime");
      const savedTotalPausedTime = localStorage.getItem("totalPausedTime");
      const savedBaseProgress = localStorage.getItem("baseProgress");
      const savedActualStartTime = localStorage.getItem("actualStartTime");
      
      console.log("Loading saved state with values:", {
        savedProgress,
        savedBaseProgress,
        savedPhase,
        initialProgress
      });
      
      // Load total paused time if available
      if (savedTotalPausedTime) {
        setTotalPausedTime(parseInt(savedTotalPausedTime));
      }
      
      // Load base progress with proper fallbacks
      if (savedBaseProgress) {
        const parsedBaseProgress = parseFloat(savedBaseProgress);
        if (!isNaN(parsedBaseProgress)) {
          setBaseProgress(parsedBaseProgress);
        } else if (initialProgress) {
          setBaseProgress(initialProgress);
        } else {
          setBaseProgress(0);
        }
      } else if (initialProgress) {
        setBaseProgress(initialProgress);
      }
      
      // Load actual start time if available
      if (savedActualStartTime) {
        setActualStartTime(new Date(savedActualStartTime));
      } else if (startTime) {
        setActualStartTime(new Date(startTime));
      }
      
      // Load pause start time if available
      if (savedPauseStartTime) {
        setPauseStartTime(new Date(savedPauseStartTime));
      } else {
        setPauseStartTime(null);
      }
      
      // Only process if we have a valid saved state
      if (savedTimeLeft && savedPhase) {
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
          const parsedProgress = parseFloat(savedProgress);
          setProgress(isNaN(parsedProgress) ? (initialProgress || 0) : parsedProgress);
        } else {
          setProgress(initialProgress || 0);
        }
        setIsBreak(savedPhase === "break");
        setIsPaused(savedIsPaused);
        
        if (savedPhaseEndTime) {
          setPhaseEndTime(new Date(savedPhaseEndTime));
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
        setProgress(initialProgress || 0);
        setBaseProgress(initialProgress || 0);
        setIsPaused(false);
        setTotalPausedTime(0);
        setPauseStartTime(null);
        
        // Reset isFirstPhase flag for proper initialization
        localStorage.setItem("isFirstPhase", "true");
        
        // Initialize the first study phase
        initializePhase(false);
        
        // Initialize progress tracking values
        localStorage.setItem("baseProgress", initialProgress ? initialProgress.toString() : "0");
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error loading saved state:", error);
      return false;
    }
  }, [duration, breakInterval, initialProgress]);

  // Initial setup
  useEffect(() => {
    if (startTime) {
      const parsedStartTime = new Date(startTime);
      setActualStartTime(parsedStartTime);
      localStorage.setItem("actualStartTime", parsedStartTime.toISOString());
      console.log("SessionTimer - Initialized actual start time:", parsedStartTime);
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
  }, [isInitialized, loadSavedState, startTime]);
  
  // Progress calculation function to use consistently
  const calculateSessionProgress = useCallback(() => {
    // Calculate progress based on total elapsed time relative to total session duration
    const sessionDurationMs = duration * 60 * 1000;
    const startTimeMs = actualStartTime.getTime();
    const currentTimeMs = new Date().getTime();
    const elapsedMs = currentTimeMs - startTimeMs - totalPausedTime;
    
    // Ensure progress is always between 0-100%
    const calculatedProgress = Math.min(100, Math.max(0, (elapsedMs / sessionDurationMs) * 100));
    
    console.log("Progress calculation:", {
      currentTime: new Date().toISOString(),
      actualStartTime: actualStartTime.toISOString(),
      elapsedMs,
      sessionDurationMs,
      totalPausedTime,
      calculatedProgress: Math.round(calculatedProgress)
    });
    
    return calculatedProgress;
  }, [actualStartTime, duration, totalPausedTime]);
  
  // Timer effect - Use the consistent calculation function
  useEffect(() => {
    if (!isInitialized || isPaused) {
      return;
    }
    
    // Save current browser time for accurate timing
    localStorage.setItem("lastSavedTime", new Date().toISOString());
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = Math.max(0, prev - 1000);
        
        // Save time left to localStorage
        localStorage.setItem("timeLeft", newTimeLeft.toString());
        localStorage.setItem("lastSavedTime", new Date().toISOString());
        
        if (newTimeLeft === 0) {
          // Phase is completed
          const wasBreak = isBreak;
          
          // If this was a break phase, we need to resume with study phase
          if (wasBreak) {
            console.log("Break phase complete, transitioning to study phase");
            setIsBreak(false);
            initializePhase(false);
          } else {
            // This was a study phase
            const calculatedProgress = calculateSessionProgress();
            
            // If we're at 100% progress, end the session
            if (calculatedProgress >= 99.5) {
              // Complete session
              console.log("Session complete (100% progress reached)");
              setProgress(100); // Ensure we show exactly 100%
              localStorage.setItem("progress", "100");
              onComplete?.();
              return 0;
            }
            
            // Store the current progress before starting break
            const progressToSave = Math.round(calculatedProgress * 100) / 100; // Round to 2 decimal places
            console.log("Saving progress before break phase:", progressToSave);
            localStorage.setItem("baseProgress", progressToSave.toString());
            setBaseProgress(progressToSave);
            setProgress(progressToSave); // Update visible progress immediately
            
            // Start a break phase
            console.log("Study phase complete, transitioning to break phase");
            setIsBreak(true);
            initializePhase(true);
          }
        }
        
        return newTimeLeft;
      });
      
      // Update progress in study phases only, maintain during breaks
      if (!isBreak) {
        const calculatedProgress = calculateSessionProgress();
        setProgress(calculatedProgress);
        localStorage.setItem("progress", calculatedProgress.toString());
      } else {
        // During breaks, maintain the progress from the last study phase
        const storedBaseProgress = parseFloat(localStorage.getItem("baseProgress") || baseProgress.toString());
        if (!isNaN(storedBaseProgress)) {
          setProgress(storedBaseProgress);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isInitialized, isPaused, isBreak, onComplete, calculateSessionProgress, baseProgress]);

  // Cleanup and persistence on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem("isPaused", isPaused.toString());
      localStorage.setItem("timeLeft", timeLeft.toString());
      localStorage.setItem("progress", progress.toString());
      localStorage.setItem("baseProgress", baseProgress.toString());
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
  }, [isPaused, timeLeft, progress, totalPausedTime, pauseStartTime, baseProgress]);

  const handlePause = () => {
    if (isPaused) return; // Already paused
    
    setIsPaused(true);
    setPauseStartTime(new Date());
    
    // Save to localStorage
    localStorage.setItem("isPaused", "true");
    localStorage.setItem("pauseStartTime", new Date().toISOString());
    localStorage.setItem("lastSavedTime", new Date().toISOString());
    
    // Call the onPause callback with current progress
    onPause?.(progress);
  };

  const handleResume = () => {
    if (!isPaused) return; // Already running
    
    // Calculate time spent paused
    if (pauseStartTime) {
      const now = new Date();
      const additionalPausedTime = now.getTime() - pauseStartTime.getTime();
      const newTotalPausedTime = totalPausedTime + additionalPausedTime;
      
      setTotalPausedTime(newTotalPausedTime);
      localStorage.setItem("totalPausedTime", newTotalPausedTime.toString());
    }
    
    // Reset pause state
    setIsPaused(false);
    setPauseStartTime(null);
    
    // Update localStorage
    localStorage.setItem("isPaused", "false");
    localStorage.removeItem("pauseStartTime");
    localStorage.setItem("lastSavedTime", new Date().toISOString());
    
    // Notify parent component
    onResume?.();
  };

  const handleSkipPhase = () => {
    const newIsBreak = !isBreak;
    console.log(`Manually skipping to ${newIsBreak ? 'break' : 'study'} phase`);
    
    if (isBreak) {
      // Transitioning from break to study
      // Just keep the current progress as we move back to study
      console.log("Maintaining progress at transition from break to study:", progress);
    } else {
      // Transitioning from study to break - use our consistent calculation function
      const calculatedProgress = calculateSessionProgress();
      
      // Store calculated progress before entering break
      const progressToSave = Math.round(calculatedProgress * 100) / 100;
      console.log("Saving current progress before manually entering break:", progressToSave);
      localStorage.setItem("baseProgress", progressToSave.toString());
      setBaseProgress(progressToSave);
      setProgress(progressToSave);
    }
    
    // Change the phase
    setIsBreak(newIsBreak);
    initializePhase(newIsBreak);
    onPhaseChange(newIsBreak ? "break" : "study");
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

  // Better next phase text
  const calculateNextPhaseTime = () => {
    const nextPhaseIn = Math.floor(timeLeft / 1000 / 60);
    const nextPhaseType = isBreak ? "Study" : "Break";
    
    if (nextPhaseIn === 0) {
      const secondsLeft = Math.floor(timeLeft / 1000);
      return `Next: ${nextPhaseType} in ${secondsLeft}s`;
    }
    
    return `Next: ${nextPhaseType} in ${nextPhaseIn}m`;
  };

  return (
    <div className="bg-white dark:bg-blue-950 text-slate-800 dark:text-white rounded-lg shadow-md overflow-hidden p-6 border dark:border-0">
      {/* Top row with subject and priority badge */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium">{subjectName || "Study Session"}</h3>
        <Badge className="bg-amber-500 dark:bg-amber-600/90 text-white border-0 rounded-md py-1 px-3">
          {priority || "Medium"} Priority
        </Badge>
      </div>
      
      {/* Big centered timer */}
      <div className="text-center mb-8">
        <div className="font-mono text-7xl font-bold text-slate-800 dark:text-white mb-4">
          {formatTimeLeft(timeLeft)}
        </div>
        <Badge className="bg-blue-500 dark:bg-blue-500 text-white border-0 rounded-full py-1.5 px-5">
          {isBreak ? "Break" : "Study Time"}
        </Badge>
      </div>
      
      {/* End time and next phase */}
      <div className="flex justify-between items-center mb-4 text-sm text-slate-700 dark:text-white">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>Ends: {format(phaseEndTime, "h:mm a")}</span>
        </div>
        <div>
          Next: {isBreak ? `Study in ${Math.floor(timeLeft / 60000) || 1}m` : `Break in ${Math.ceil(timeLeft / 60000) || 1}m`}
        </div>
      </div>
      
      {/* Progress section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1.5">
          <div className="text-sm text-slate-700 dark:text-white">Progress</div>
          <div className="text-sm font-medium text-slate-700 dark:text-white">{Math.round(progress)}%</div>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 dark:bg-blue-500 rounded-full transition-all duration-300" 
            style={{ width: `${Math.max(0, Math.min(100, Math.round(progress)))}%` }}
          ></div>
        </div>
      </div>
      
      {/* Main control buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant="outline"
          className="bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-black/30 text-slate-800 dark:text-white border border-slate-200 dark:border-0 rounded-md h-12"
          onClick={isPaused ? handleResume : handlePause}
        >
          {isPaused ? (
            <>
              <Play className="h-5 w-5 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          className="bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-black/30 text-slate-800 dark:text-white border border-slate-200 dark:border-0 rounded-md h-12"
          onClick={handleSkipPhase}
        >
          <SkipForward className="h-5 w-5 mr-2" />
          Skip {isBreak ? "Break" : "Study"}
        </Button>
      </div>
      
      {/* Bottom buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-100 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-black/30 text-slate-800 dark:text-white border border-slate-200 dark:border-0 rounded-md"
          onClick={onSettings}
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Settings
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => onComplete?.()}
          className="bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 text-white rounded-md"
        >
          <Check className="h-4 w-4 mr-1.5" />
          End
        </Button>
      </div>
    </div>
  );
}