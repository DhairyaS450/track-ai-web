import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OnboardingData } from "../OnboardingFlow";
import { motion } from "framer-motion";
import { Bell, Calendar, ExternalLink, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { connectGoogleCalendar } from "@/api/calendar";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

interface PermissionsSlideProps {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: any) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function PermissionsSlide({ data, updateData, onNext, onSkip }: PermissionsSlideProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // Handle notification permission toggle
  const handleNotificationsToggle = (enabled: boolean) => {
    updateData("notificationsEnabled", enabled);
    
    // Request browser notifications permission if enabled
    if (enabled && window.Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };
  
  // Handle Google Calendar connection
  const handleConnectCalendar = async () => {
    try {
      setIsConnecting(true);
      await connectGoogleCalendar("primary");
      updateData("calendarIntegration", true);
      toast({
        title: "Success",
        description: "Google Calendar connected successfully!",
      });
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to Google Calendar. Please try again.",
      });
    } finally {
      setIsConnecting(false);
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
        <h1 className="text-3xl font-bold mb-2">Permissions Setup</h1>
        <p className="text-muted-foreground">
          Set up notifications and integrations to get the most out of TidalTasks.
        </p>
      </div>
      
      {/* Notification Permissions */}
      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive reminders about upcoming tasks, study sessions, and deadlines.
                </p>
              </div>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p>We'll send you timely reminders to help you stay on track with your studies.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="notifications"
                checked={data.notificationsEnabled}
                onCheckedChange={handleNotificationsToggle}
              />
              <Label htmlFor="notifications" className="cursor-pointer">
                {data.notificationsEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            
            {data.notificationsEnabled && (
              <p className="text-sm mt-4 p-3 bg-muted rounded-md">
                You'll be prompted to allow notifications in your browser.
                For the best experience, please click "Allow" when prompted.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Calendar Integration */}
      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-semibold">Google Calendar Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Sync your study sessions and tasks with Google Calendar.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              {data.calendarIntegration ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-md flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                  Google Calendar Connected
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="space-x-2"
                  onClick={handleConnectCalendar}
                  disabled={isConnecting}
                >
                  <Calendar className="h-4 w-4" />
                  <span>{isConnecting ? "Connecting..." : "Connect Google Calendar"}</span>
                  <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              )}
            </div>
            
            <p className="text-sm mt-4 text-muted-foreground">
              You can always connect your calendar later from the Settings page.
            </p>
          </div>
        </div>
      </div>
      
      <div className="pt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </motion.div>
  );
} 