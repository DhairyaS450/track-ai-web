import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { OnboardingData } from "../OnboardingFlow";
import { motion } from "framer-motion";

interface PersonalizationSlideProps {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

// Predefined extracurricular activities
const extracurricularOptions = [
  "Sports", "Music", "Art", "Drama/Theater", "Debate", "Academic Clubs",
  "Student Government", "Volunteering", "Religious Activities", "Internship",
  "Part-time Job", "Family Responsibilities", "Gaming", "Reading", "Writing"
];

// Study time preference options
const studyTimeOptions = [
  { id: "mornings", label: "Mornings (Before School/Work)" },
  { id: "afternoons", label: "Afternoons" },
  { id: "evenings", label: "Evenings" },
  { id: "night", label: "Night" },
  { id: "flexible", label: "Flexible" },
];

export function PersonalizationSlide({ data, updateData, onNext, onSkip }: PersonalizationSlideProps) {
  const [newActivity, setNewActivity] = useState("");
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  
  // Handle adding an extracurricular activity
  const addExtracurricular = (activity: string) => {
    if (!data.extracurricularActivities.includes(activity)) {
      updateData("extracurricularActivities", [...data.extracurricularActivities, activity]);
    }
  };
  
  // Handle removing an extracurricular activity
  const removeExtracurricular = (activity: string) => {
    updateData("extracurricularActivities", data.extracurricularActivities.filter(a => a !== activity));
  };
  
  // Handle adding a custom activity
  const handleAddCustomActivity = () => {
    if (newActivity.trim() && !data.customExtracurriculars.includes(newActivity.trim())) {
      updateData("customExtracurriculars", [...data.customExtracurriculars, newActivity.trim()]);
      setNewActivity("");
      setShowCustomActivity(false);
    }
  };
  
  // Handle removing a custom activity
  const removeCustomActivity = (activity: string) => {
    updateData("customExtracurriculars", data.customExtracurriculars.filter(a => a !== activity));
  };
  
  // Handle study time preference change
  const handleStudyTimeChange = (time: string, checked: boolean) => {
    if (checked) {
      updateData("studyTimePreference", [
        ...data.studyTimePreference, 
        time as "Mornings" | "Afternoons" | "Evenings" | "Night" | "Flexible"
      ]);
    } else {
      updateData("studyTimePreference", 
        data.studyTimePreference.filter(t => t !== time)
      );
    }
  };
  
  return (
    <motion.div
      className="space-y-8 py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Personalization</h1>
        <p className="text-muted-foreground">Help us tailor your experience to your academic profile.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Academic Strengths */}
        <div className="space-y-3">
          <Label htmlFor="strengths" className="text-base font-medium">Academic Strengths (optional)</Label>
          <Textarea
            id="strengths"
            placeholder="What subjects or skills are you good at?"
            value={data.academicStrengths}
            onChange={(e) => updateData("academicStrengths", e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        {/* Areas for Improvement */}
        <div className="space-y-3">
          <Label htmlFor="improvements" className="text-base font-medium">Areas for Improvement (optional)</Label>
          <Textarea
            id="improvements"
            placeholder="What areas would you like to improve?"
            value={data.areasForImprovement}
            onChange={(e) => updateData("areasForImprovement", e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>
      
      {/* Academic Goals */}
      <div className="space-y-3">
        <Label htmlFor="goals" className="text-base font-medium">Academic & Personal Goals</Label>
        <Textarea
          id="goals"
          placeholder="What's one goal you want to accomplish this term?"
          value={data.academicGoals}
          onChange={(e) => updateData("academicGoals", e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      {/* Extracurricular Activities */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Extracurricular Activities</Label>
        <p className="text-sm text-muted-foreground">
          Select activities you're involved in outside of school.
        </p>
        
        {/* Display selected activities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {data.extracurricularActivities.length === 0 && data.customExtracurriculars.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No activities selected yet</p>
          ) : (
            <>
              {data.extracurricularActivities.map(activity => (
                <Badge key={activity} variant="secondary" className="px-3 py-1 text-sm">
                  {activity}
                  <button
                    type="button"
                    onClick={() => removeExtracurricular(activity)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {data.customExtracurriculars.map(activity => (
                <Badge key={activity} variant="secondary" className="px-3 py-1 text-sm">
                  {activity}
                  <button
                    type="button"
                    onClick={() => removeCustomActivity(activity)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </>
          )}
        </div>
        
        {/* Common activities selection */}
        <div className="mb-4">
          <Label className="text-sm mb-2 block">Common Activities</Label>
          <div className="flex flex-wrap gap-2">
            {extracurricularOptions.map(activity => (
              <Badge 
                key={activity}
                variant="outline" 
                className={`px-3 py-1 text-sm cursor-pointer hover:bg-secondary transition-colors
                  ${data.extracurricularActivities.includes(activity) ? 'bg-primary/10 border-primary/50' : ''}`}
                onClick={() => data.extracurricularActivities.includes(activity) 
                  ? removeExtracurricular(activity) 
                  : addExtracurricular(activity)
                }
              >
                {activity}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Custom activity input */}
        {showCustomActivity ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter custom activity"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomActivity();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddCustomActivity}>Add</Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setShowCustomActivity(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Your Own
          </Button>
        )}
      </div>
      
      {/* Study Time Preferences */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">When do you prefer to study?</Label>
          <p className="text-sm text-muted-foreground mb-3">
            This helps us auto-schedule study sessions at your preferred times.
          </p>
          
          <div className="space-y-2 mb-6">
            {studyTimeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={option.id} 
                  checked={data.studyTimePreference.includes(option.label as any)}
                  onCheckedChange={(checked) => 
                    handleStudyTimeChange(option.label, checked as boolean)
                  }
                />
                <label
                  htmlFor={option.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* School Start/End Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="school-start" className="text-base font-medium">
              What time does your school/day start?
            </Label>
            <Input
              id="school-start"
              type="time"
              value={data.schoolStartTime}
              onChange={(e) => updateData("schoolStartTime", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="school-end" className="text-base font-medium">
              What time does your school/day end?
            </Label>
            <Input
              id="school-end"
              type="time"
              value={data.schoolEndTime}
              onChange={(e) => updateData("schoolEndTime", e.target.value)}
            />
          </div>
        </div>
        
        {/* Bedtime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="bedtime-weekday" className="text-base font-medium">
              When do you go to bed on weekdays?
            </Label>
            <Input
              id="bedtime-weekday"
              type="time"
              value={data.bedtime.weekday}
              onChange={(e) => updateData("bedtime", {
                ...data.bedtime,
                weekday: e.target.value
              })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bedtime-weekend" className="text-base font-medium">
              When do you go to bed on weekends?
            </Label>
            <Input
              id="bedtime-weekend"
              type="time"
              value={data.bedtime.weekend}
              onChange={(e) => updateData("bedtime", {
                ...data.bedtime,
                weekend: e.target.value
              })}
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
          disabled={data.studyTimePreference.length === 0}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
} 