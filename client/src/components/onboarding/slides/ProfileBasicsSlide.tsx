import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { OnboardingData } from "../OnboardingFlow";
import { motion } from "framer-motion";

interface ProfileBasicsSlideProps {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

// Predefined list of common subjects
const commonSubjects = [
  "Math", "English", "Physics", "Chemistry", "Biology",
  "History", "Computer Science", "Economics", "Psychology", "Philosophy",
  "Business", "Engineering", "Arts", "Music", "Statistics"
];

export function ProfileBasicsSlide({ data, updateData, onNext, onSkip }: ProfileBasicsSlideProps) {
  const [newSubject, setNewSubject] = useState("");
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  
  // Handle education level change
  const handleEducationLevelChange = (value: string) => {
    updateData("educationLevel", value as OnboardingData["educationLevel"]);
  };
  
  // Handle year/grade change
  const handleYearGradeChange = (value: string) => {
    updateData("yearOrGrade", value);
  };
  
  // Get appropriate year/grade options based on education level
  const getYearGradeOptions = () => {
    switch (data.educationLevel) {
      case "High School":
        return ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];
      case "College/University (Undergrad)":
        return ["Freshman", "Sophomore", "Junior", "Senior"];
      case "Grad School":
        return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th+ Year"];
      case "Vocational/Other":
        return ["1st Year", "2nd Year", "3rd+ Year"];
      default:
        return [];
    }
  };
  
  // Handle adding a subject
  const addSubject = (subject: string) => {
    if (subject && !data.subjects.includes(subject)) {
      updateData("subjects", [...data.subjects, subject]);
    }
    setNewSubject("");
    setShowCustomSubject(false);
  };
  
  // Handle removing a subject
  const removeSubject = (subject: string) => {
    updateData("subjects", data.subjects.filter(s => s !== subject));
  };
  
  // Handle adding a custom subject
  const handleAddCustomSubject = () => {
    if (newSubject.trim()) {
      addSubject(newSubject.trim());
    }
  };
  
  // Check if form is valid to proceed
  const isFormValid = () => {
    return (
      data.educationLevel !== "" && 
      data.yearOrGrade !== "" && 
      data.subjects.length > 0
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
        <h1 className="text-3xl font-bold mb-2">Profile Basics</h1>
        <p className="text-muted-foreground">Let's get to know you better academically.</p>
      </div>
      
      {/* Education Level */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Education Level</Label>
        <RadioGroup
          value={data.educationLevel}
          onValueChange={handleEducationLevelChange}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Label
            htmlFor="high-school"
            className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer transition-colors
              ${data.educationLevel === "High School" ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <RadioGroupItem value="High School" id="high-school" />
            <span>High School</span>
          </Label>
          <Label
            htmlFor="college"
            className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer transition-colors
              ${data.educationLevel === "College/University (Undergrad)" ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <RadioGroupItem value="College/University (Undergrad)" id="college" />
            <span>College/University (Undergrad)</span>
          </Label>
          <Label
            htmlFor="grad-school"
            className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer transition-colors
              ${data.educationLevel === "Grad School" ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <RadioGroupItem value="Grad School" id="grad-school" />
            <span>Grad School</span>
          </Label>
          <Label
            htmlFor="vocational"
            className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer transition-colors
              ${data.educationLevel === "Vocational/Other" ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <RadioGroupItem value="Vocational/Other" id="vocational" />
            <span>Vocational/Other</span>
          </Label>
        </RadioGroup>
      </div>
      
      {/* Year/Grade (conditional based on education level) */}
      {data.educationLevel && (
        <div className="space-y-4">
          <Label htmlFor="year-grade" className="text-base font-medium">Year/Grade</Label>
          <Select 
            value={data.yearOrGrade} 
            onValueChange={handleYearGradeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your year or grade" />
            </SelectTrigger>
            <SelectContent>
              {getYearGradeOptions().map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Major/Subjects */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Major/Subjects</Label>
        <p className="text-sm text-muted-foreground">
          Select the subjects you're studying or your major field.
        </p>
        
        {/* Display selected subjects */}
        <div className="flex flex-wrap gap-2 mb-4">
          {data.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No subjects selected yet</p>
          ) : (
            data.subjects.map(subject => (
              <Badge key={subject} variant="secondary" className="px-3 py-1 text-sm">
                {subject}
                <button
                  type="button"
                  onClick={() => removeSubject(subject)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        
        {/* Common subjects selection */}
        <div className="mb-4">
          <Label className="text-sm mb-2 block">Common Subjects</Label>
          <div className="flex flex-wrap gap-2">
            {commonSubjects.map(subject => (
              <Badge 
                key={subject}
                variant="outline" 
                className={`px-3 py-1 text-sm cursor-pointer hover:bg-secondary transition-colors
                  ${data.subjects.includes(subject) ? 'bg-primary/10 border-primary/50' : ''}`}
                onClick={() => data.subjects.includes(subject) 
                  ? removeSubject(subject) 
                  : addSubject(subject)
                }
              >
                {subject}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Custom subject input */}
        {showCustomSubject ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter custom subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomSubject();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddCustomSubject}>Add</Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setShowCustomSubject(true)}
          >
            + Add Custom Subject
          </Button>
        )}
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