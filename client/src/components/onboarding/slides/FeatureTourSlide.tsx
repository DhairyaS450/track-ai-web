import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, CheckSquare, BarChart, Bookmark, MessageSquare, Brain } from "lucide-react";

interface FeatureTourSlideProps {
  onNext: () => void;
  onSkip: () => void;
}

// Define feature tour items
const featureTourItems = [
  {
    id: "dashboard",
    title: "Smart Dashboard",
    description: "Your personalized command center that adapts to your learning style and schedule.",
    icon: <BarChart className="h-16 w-16 text-primary mb-4" />,
    image: "/tour/dashboard.png"
  },
  {
    id: "calendar",
    title: "Adaptive Calendar",
    description: "Your schedule is dynamically built to work around your constraints and optimize your study time.",
    icon: <Calendar className="h-16 w-16 text-primary mb-4" />,
    image: "/tour/calendar.png"
  },
  {
    id: "sessions",
    title: "Study Sessions",
    description: "Plan effective study blocks using techniques like Pomodoro, with AI-generated recommendations.",
    icon: <Bookmark className="h-16 w-16 text-primary mb-4" />,
    image: "/tour/sessions.png"
  },
  {
    id: "kai",
    title: "Meet Kai, Your AI Assistant",
    description: "Ask questions about your subjects, get help organizing your schedule, and receive personalized tips.",
    icon: <MessageSquare className="h-16 w-16 text-primary mb-4" />,
    image: "/tour/kai.png"
  },
  {
    id: "auto-schedule",
    title: "Auto Scheduling - Coming Soon",
    description: "Let Kai fit your tasks and events into your schedule based on your preferences and constraints.",
    icon: <CheckSquare className="h-16 w-16 text-primary mb-4" />,
    image: "/tour/auto-schedule.png"
  }
];

export function FeatureTourSlide({ onNext, onSkip }: FeatureTourSlideProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Move to the next feature
  const handleNext = () => {
    if (currentFeature < featureTourItems.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      onNext();
    }
  };
  
  // Move to the previous feature
  const handlePrevious = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
    }
  };
  
  // The current feature being displayed
  const feature = featureTourItems[currentFeature];
  
  return (
    <motion.div
      className="space-y-8 py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Feature Tour</h1>
        <p className="text-muted-foreground">
          Explore the key features of TidalTasks designed to enhance your productivity.
        </p>
      </div>
      
      {/* Progress indicators */}
      <div className="flex justify-center mb-4">
        {featureTourItems.map((item, index) => (
          <div
            key={item.id}
            className={`h-2 w-10 mx-1 rounded-full ${
              index === currentFeature ? "bg-primary" : "bg-muted"
            }`}
            onClick={() => setCurrentFeature(index)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>
      
      {/* Feature content with animation */}
      <div className="relative flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={feature.id}
            className="max-w-xl"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              {/* Feature image */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {feature.image ? (
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                )}
              </div>
              
              {/* Feature content */}
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation buttons */}
      <div className="pt-8 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentFeature === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {currentFeature + 1} of {featureTourItems.length}
        </div>
        
        <div className="flex space-x-4">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button
            onClick={handleNext}
            className="flex items-center space-x-2"
          >
            <span>{currentFeature === featureTourItems.length - 1 ? "Finish" : "Next"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 