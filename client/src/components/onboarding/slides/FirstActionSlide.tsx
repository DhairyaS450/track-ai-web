import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Clock, BookOpen, Check, Brain, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";

interface FirstActionSlideProps {
  onNext: () => void;
  onSkip: () => void;
}

export function FirstActionSlide({ onNext, onSkip }: FirstActionSlideProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Handle submission of first task/event
  const handleCreateStudyPlan = async () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a title for your task or event.",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Simulating API call to create a study plan
      // In a real implementation, this would call your API to create the task/event
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      
      toast({
        title: "Success!",
        description: "Your first study plan has been created.",
      });
      
      // Give some time for the success state to be visible
      setTimeout(() => {
        onNext();
      }, 1500);
    } catch (error) {
      console.error("Error creating study plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create study plan. Please try again.",
      });
    } finally {
      setIsGenerating(false);
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
        <h1 className="text-3xl font-bold mb-2">Let's Create Your First Study Plan</h1>
        <p className="text-muted-foreground">
          Input a task, event, or assignment to get started with your AI-assisted schedule.
        </p>
      </div>
      
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Study Plan Created!</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Your study plan has been generated. You'll find it in your dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <Alert className="bg-primary/10 border-primary/20">
              <Brain className="h-4 w-4 text-primary" />
              <AlertTitle>AI-Assisted Scheduling</AlertTitle>
              <AlertDescription>
                Our AI will analyze this information and create a tailored study plan for you.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Title or Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="E.g., Math Final Exam, History Paper"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any details about this task or event"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date" className="text-base font-medium">
                  Due Date (optional)
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Info Section */}
          <div className="space-y-6">
            <div className="rounded-lg border p-6 space-y-6 bg-card">
              <h3 className="text-lg font-semibold">What happens next?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Smart Scheduling</h4>
                    <p className="text-xs text-muted-foreground">
                      The AI will find the best times for you to study based on your preferences.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Session Planning</h4>
                    <p className="text-xs text-muted-foreground">
                      Optimal study sessions will be created with appropriate breaks.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Resource Suggestions</h4>
                    <p className="text-xs text-muted-foreground">
                      Kai might suggest helpful resources based on your subject.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-dashed p-6 flex flex-col items-center justify-center space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                You can always add more tasks and events later from your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={onSkip} disabled={isGenerating || isSuccess}>
          Skip for now
        </Button>
        <Button 
          onClick={handleCreateStudyPlan}
          disabled={!title || isGenerating || isSuccess}
          className="min-w-[120px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : isSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Created!
            </>
          ) : (
            "Create Study Plan"
          )}
        </Button>
      </div>
    </motion.div>
  );
} 