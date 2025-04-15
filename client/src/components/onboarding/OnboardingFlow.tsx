import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { saveSettings } from "@/api/settings";
import { WelcomeSlide } from "./slides/WelcomeSlide";
import { ProfileBasicsSlide } from "./slides/ProfileBasicsSlide";
import { PersonalizationSlide } from "./slides/PersonalizationSlide";
import { HabitsAndChallengesSlide } from "./slides/HabitsAndChallengesSlide";
import { PermissionsSlide } from "./slides/PermissionsSlide";
import { FeatureTourSlide } from "./slides/FeatureTourSlide";
import { FirstActionSlide } from "./slides/FirstActionSlide";
import { useToast } from "@/hooks/useToast";

// Define the type for onboarding data
export interface OnboardingData {
  // Profile Basics
  educationLevel: "High School" | "College/University (Undergrad)" | "Grad School" | "Vocational/Other" | "";
  yearOrGrade: string;
  subjects: string[];
  
  // Personalization
  academicStrengths: string;
  areasForImprovement: string;
  academicGoals: string;
  extracurricularActivities: string[];
  customExtracurriculars: string[];
  studyTimePreference: ("Mornings" | "Afternoons" | "Evenings" | "Night" | "Flexible")[];
  schoolStartTime: string;
  schoolEndTime: string;
  bedtime: { weekday: string; weekend: string; };
  
  // Habits and Challenges
  timeManagementRating: number;
  biggestProblem: string;
  whyImportant: string;
  perfectStudyWeek: string;
  
  // Permissions
  notificationsEnabled: boolean;
  calendarIntegration: boolean;
}

// Default/initial values for onboarding data
const initialOnboardingData: OnboardingData = {
  educationLevel: "",
  yearOrGrade: "",
  subjects: [],
  
  academicStrengths: "",
  areasForImprovement: "",
  academicGoals: "",
  extracurricularActivities: [],
  customExtracurriculars: [],
  studyTimePreference: [],
  schoolStartTime: "08:00",
  schoolEndTime: "15:00", 
  bedtime: { weekday: "22:00", weekend: "23:00" },
  
  timeManagementRating: 3,
  biggestProblem: "",
  whyImportant: "",
  perfectStudyWeek: "",
  
  notificationsEnabled: true,
  calendarIntegration: false
};

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialOnboardingData);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Total number of steps in the onboarding flow
  const totalSteps = 7;
  
  // Update the progress bar whenever the current step changes
  useEffect(() => {
    setProgress(((currentStep + 1) / totalSteps) * 100);
  }, [currentStep]);
  
  // Function to move to the next step
  const handleNextStep = async (saveData = true) => {
    if (saveData) {
      await saveOnboardingData();
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Complete onboarding and redirect to dashboard
      await finishOnboarding();
    }
  };
  
  // Function to go back to the previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Function to skip the current step
  const handleSkip = () => {
    handleNextStep(false);
  };
  
  // Function to save the onboarding data
  const saveOnboardingData = async () => {
    try {
      setIsSaving(true);
      
      // Format the data to be saved in Firestore
      const userProfile = {
        // Educational info
        educationLevel: onboardingData.educationLevel,
        yearOrGrade: onboardingData.yearOrGrade,
        subjects: onboardingData.subjects,
        
        // Personal info
        academicStrengths: onboardingData.academicStrengths,
        areasForImprovement: onboardingData.areasForImprovement,
        academicGoals: onboardingData.academicGoals,
        extracurricularActivities: [
          ...onboardingData.extracurricularActivities, 
          ...onboardingData.customExtracurriculars
        ],
        
        // Study preferences
        studyTimePreference: onboardingData.studyTimePreference,
        timeConstraints: {
          schoolHours: {
            startTime: onboardingData.schoolStartTime,
            endTime: onboardingData.schoolEndTime
          },
          bedtime: onboardingData.bedtime
        },
        
        // Habits and motivations
        timeManagementRating: onboardingData.timeManagementRating,
        biggestProblem: onboardingData.biggestProblem,
        whyImportant: onboardingData.whyImportant,
        perfectStudyWeek: onboardingData.perfectStudyWeek,
        
        // Track that onboarding has been completed
        onboardingCompleted: true,
        onboardingStep: currentStep + 1
      };
      
      // Save to Firestore
      await saveSettings({ userProfile }, {
        notifications: { 
          pushEnabled: onboardingData.notificationsEnabled 
        }
      });
      
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your preferences. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to complete the onboarding process
  const finishOnboarding = async () => {
    try {
      setIsSaving(true);
      
      // Save final data
      await saveOnboardingData();
      
      // Show success message
      toast({
        title: "Setup Complete!",
        description: "Your personalized learning experience is ready.",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Error finishing onboarding:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete setup. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update onboarding data for a specific field
  const updateData = (fieldName: keyof OnboardingData, value: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };
  
  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeSlide onNext={handleNextStep} />;
      case 1:
        return (
          <ProfileBasicsSlide 
            data={onboardingData} 
            updateData={updateData} 
            onNext={handleNextStep} 
            onSkip={handleSkip}
          />
        );
      case 2:
        return (
          <PersonalizationSlide 
            data={onboardingData} 
            updateData={updateData} 
            onNext={handleNextStep} 
            onSkip={handleSkip}
          />
        );
      case 3:
        return (
          <HabitsAndChallengesSlide 
            data={onboardingData} 
            updateData={updateData} 
            onNext={handleNextStep} 
            onSkip={handleSkip}
          />
        );
      case 4:
        return (
          <PermissionsSlide 
            data={onboardingData} 
            updateData={updateData} 
            onNext={handleNextStep} 
            onSkip={handleSkip}
          />
        );
      case 5:
        return (
          <FeatureTourSlide 
            onNext={handleNextStep} 
            onSkip={handleSkip}
          />
        );
      case 6:
        return (
          <FirstActionSlide 
            onNext={handleNextStep} 
            onSkip={handleSkip}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background">
        <Progress value={progress} className="w-full h-2" />
      </div>
      
      {/* Main content area */}
      <div className="container max-w-4xl mx-auto px-4 py-8 pt-10">
        {renderCurrentStep()}
        
        {/* Navigation buttons */}
        {currentStep > 0 && (
          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePreviousStep}
              disabled={isSaving}
            >
              Back
            </Button>
            
            {currentStep < totalSteps - 1 && (
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                disabled={isSaving}
              >
                Skip for now
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 