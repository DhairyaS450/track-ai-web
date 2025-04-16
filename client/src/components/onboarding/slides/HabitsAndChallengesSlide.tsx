import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { OnboardingData } from "../OnboardingFlow";
import { motion } from "framer-motion";

interface HabitsAndChallengesSlideProps {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function HabitsAndChallengesSlide({ data, updateData, onNext, onSkip }: HabitsAndChallengesSlideProps) {
  // Function to get descriptive text for time management rating
  const getRatingDescription = (rating: number) => {
    switch (rating) {
      case 1:
        return "I struggle a lot with time management";
      case 2:
        return "I need significant improvement";
      case 3:
        return "I'm average at managing my time";
      case 4:
        return "I'm good, but could be better";
      case 5:
        return "I'm excellent at time management";
      default:
        return "Select your rating";
    }
  };
  
  // Check if form is valid to proceed
  const isFormValid = () => {
    return (
      data.biggestProblem.trim() !== "" &&
      data.whyImportant.trim() !== ""
    );
  };
  
  return (
    <motion.div
      className="space-y-8 py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Current Habits and Challenges</h1>
        <p className="text-muted-foreground">
          Let's reflect on how you currently manage your time and studies.
        </p>
      </div>
      
      {/* Time Management Self-Assessment */}
      <div className="space-y-6 bg-muted/30 p-6 rounded-lg">
        <div>
          <Label className="text-base font-medium">Time Management Self-Assessment</Label>
          <p className="text-sm text-muted-foreground mb-6">
            On a scale from 1-5, how would you rate your time management skills?
          </p>
          
          <div className="space-y-6">
            <Slider
              value={[data.timeManagementRating]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => updateData("timeManagementRating", value[0])}
            />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
            
            <div className="text-center font-medium">
              {getRatingDescription(data.timeManagementRating)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Reflection Prompts */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Reflection Prompts</h2>
        <p className="text-sm text-muted-foreground">
          Taking a moment to reflect on these questions can help us better understand your needs.
        </p>
        
        <div className="space-y-6">
          {/* Biggest Problem */}
          <div className="space-y-3">
            <Label htmlFor="biggest-problem" className="text-base font-medium">
              What is the #1 problem you face with managing your time?
            </Label>
            <Textarea
              id="biggest-problem"
              placeholder="E.g., Procrastination, getting distracted, too many commitments..."
              value={data.biggestProblem}
              onChange={(e) => updateData("biggestProblem", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {/* Why Important */}
          <div className="space-y-3">
            <Label htmlFor="why-important" className="text-base font-medium">
              Why is taking control of your schedule important to you?
            </Label>
            <Textarea
              id="why-important"
              placeholder="E.g., To reduce stress, achieve better grades, have more free time..."
              value={data.whyImportant}
              onChange={(e) => updateData("whyImportant", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={onSkip}>
          Skip
        </Button>
        <Button 
          onClick={onNext}
          disabled={!isFormValid()}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
} 