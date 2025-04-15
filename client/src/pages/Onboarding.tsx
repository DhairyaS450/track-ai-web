import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/api/settings";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";

export function Onboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboardingStatus = async () => {
      try {
        if (!user) {
          navigate("/login");
          return;
        }
        
        const { userProfile } = await getUserProfile();
        
        // If user has already completed onboarding, redirect to dashboard
        if (userProfile?.onboardingCompleted) {
          setHasCompletedOnboarding(true);
          navigate("/dashboard");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsLoading(false);
      }
    };
    
    checkOnboardingStatus();
  }, [user, navigate]);
  
  // Show loading spinner while checking onboarding status
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }
  
  // If user has already completed onboarding, they will be redirected
  // This is just a fallback in case the redirect doesn't happen immediately
  if (hasCompletedOnboarding) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Show the onboarding flow
  return <OnboardingFlow />;
} 