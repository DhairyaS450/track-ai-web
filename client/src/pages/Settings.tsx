/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  User, 
  Clock,
  Moon,
  Bell,
  Edit,
  Trash2
} from "lucide-react";
import { connectGoogleCalendar, getGoogleCalendarStatus } from "@/api/calendar";
import { useToast } from "@/hooks/useToast";
import api from "@/api/Api";
import { listenToSettings, saveSettings } from "@/api/settings";
import { useTheme } from "@/components/ui/theme-provider";
import { TimeConstraintDialog } from "@/components/TimeConstraintDialog";
import { TimeConstraint } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationContext";
import { TestNotifications } from "@/components/notifications/TestNotifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { PushNotificationTester } from "@/components/notifications/PushNotificationTester";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCurrentUserAccount, logout } from "@/api/auth";
import { useNavigate } from "react-router-dom";

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true,
    sessions: true,
    system: true,
  });

  const { theme, setTheme } = useTheme();
  const [calendar, setCalendar] = useState("google");
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const setLoading = useState(true)[1]; // Add loading state
  const { toast } = useToast();
  const { 
    createNotification, 
    isPushSupported, 
    pushPermissionStatus, 
    isPushEnabled,
    enablePushNotifications,
    disablePushNotifications 
  } = useNotifications();

  // Updated profile structure to match OnboardingData interface
  type StudyTimeOptions = "Mornings" | "Afternoons" | "Evenings" | "Night" | "Flexible";
  
  const [profile, setProfile] = useState({
    educationLevel: "High School" as "High School" | "College/University (Undergrad)" | "Grad School" | "Vocational/Other" | "",
    yearOrGrade: "",
    subjects: [] as string[],
    
    academicStrengths: "",
    areasForImprovement: "",
    academicGoals: "",
    extracurricularActivities: [] as string[],
    customExtracurriculars: [] as string[],
    studyTimePreference: [] as StudyTimeOptions[],
    schoolStartTime: "08:00",
    schoolEndTime: "15:00",
    bedtime: { weekday: "22:00", weekend: "23:00" },
    
    timeManagementRating: 3,
    biggestProblem: "",
    whyImportant: "",
    perfectStudyWeek: "",
    
    notificationsEnabled: true,
    calendarIntegration: false
  });
  
  const [tempProfile, setTempProfile] = useState(profile);

  const [timeConstraints, setTimeConstraints] = useState<TimeConstraint[]>([]);
  const [isTimeConstraintDialogOpen, setIsTimeConstraintDialogOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<TimeConstraint | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete dialog
  const [isDeleting, setIsDeleting] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleTempProfileChange = (field: string, value: string | string[] | number) => {
    if (field.includes('.')) {
      // Handle nested objects (like bedtime.weekday)
      const keys = field.split('.');
      setTempProfile((prev) => {
        const updated = { ...prev };
        let current: any = updated;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the value
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      // Handle top-level fields
      setTempProfile((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    const updatedNotifications = { ...notifications, [type]: value };
    setNotifications(updatedNotifications);
    saveSettings({}, { notifications: updatedNotifications });
  };
  
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    saveSettings({}, { theme: value });
  };

  const handleSaveProfile = async () => {
    try {
      setProfile(tempProfile);
      await saveSettings({ userProfile: tempProfile }, {});
      toast({ title: "Success", description: "Profile saved successfully" });
      
      // Create a notification to demonstrate the notification system
      await createNotification({
        title: "Profile Updated",
        message: "Your profile information has been successfully updated.",
        type: "success",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = listenToSettings((settings: any) => {
      if (isMounted) {
        if (settings.preferences?.notifications) {
          setNotifications(settings.preferences.notifications);
        }
        if (settings.userProfile) {
          // Ensure all array fields exist to prevent "Cannot read properties of undefined (reading 'join')"
          const safeUserProfile = {
            ...profile, // Keep default values
            ...settings.userProfile, // Override with stored values
            // Ensure arrays are never undefined
            subjects: settings.userProfile.subjects || [],
            extracurricularActivities: settings.userProfile.extracurricularActivities || [],
            customExtracurriculars: settings.userProfile.customExtracurriculars || [],
            studyTimePreference: settings.userProfile.studyTimePreference || [],
            // Ensure nested objects are never undefined
            bedtime: settings.userProfile.bedtime || { weekday: "22:00", weekend: "23:00" }
          };
          
          setProfile(safeUserProfile);
          setTempProfile(safeUserProfile);
        }
        if (settings.preferences?.theme) {
          setTheme(settings.preferences.theme);
        }
        if (settings.timeConstraints) {
          setTimeConstraints(settings.timeConstraints);
        }
        setLoading(false);
      }
    });
  
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const checkCalendarStatus = async () => {
    try {
      const { connected } = await getGoogleCalendarStatus();
      setIsCalendarConnected(connected);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConnectCalendar = async () => {
    try {
      setIsConnecting(true);
      const response = await api.get('/api/calendar/auth-url');
      const { url } = response.data;
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      (async () => {
        try {
          await connectGoogleCalendar(code);
          await checkCalendarStatus();
          toast({
            title: "Success",
            description: "Calendar connected successfully",
          });
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      })();
    } else {
      checkCalendarStatus()
    }
  }, []);

  const handleSaveTimeConstraint = async (constraint: Omit<TimeConstraint, 'id'>) => {
    try {
      if (editingConstraint) {
        // Update existing constraint
        const updatedConstraints = timeConstraints.map(c => 
          c.id === editingConstraint.id ? { ...constraint, id: c.id } : c
        );
        setTimeConstraints(updatedConstraints);
        await saveSettings({ timeConstraints: updatedConstraints });
      } else {
        // Add new constraint
        const newConstraint = {
          ...constraint,
          id: crypto.randomUUID()
        };
        const updatedConstraints = [...timeConstraints, newConstraint];
        setTimeConstraints(updatedConstraints);
        await saveSettings({ timeConstraints: updatedConstraints });
      }
      toast({ title: "Success", description: "Time constraint saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTimeConstraint = async (id: string) => {
    try {
      const updatedConstraints = timeConstraints.filter(c => c.id !== id);
      setTimeConstraints(updatedConstraints);
      await saveSettings({ timeConstraints: updatedConstraints });
      toast({ title: "Success", description: "Time constraint deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCurrentUserAccount();
      toast({ title: "Account Deleted", description: "Your account has been successfully deleted." });
      // Perform logout after deletion
      await logout(); 
      navigate("/auth"); // Redirect to login/auth page
    } catch (error: any) {
      toast({ 
        title: "Deletion Failed", 
        description: error.message || "Could not delete account. Please try logging out and back in.", 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false); // Close dialog regardless of outcome
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex justify-between p-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <Button 
              onClick={handleSaveProfile} 
              className="w-full md:w-auto"
              disabled={JSON.stringify(tempProfile) === JSON.stringify(profile)}
            >
              Save Profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Education Level</Label>
              <RadioGroup
                value={tempProfile.educationLevel}
                onValueChange={(value) =>
                  handleTempProfileChange('educationLevel', value)
                }
                className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="High School" id="education-high-school" />
                  <Label htmlFor="education-high-school">High School</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Post-Secondary" id="education-post-secondary" />
                  <Label htmlFor="education-post-secondary">Post-Secondary</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearOrGrade">Year or Grade</Label>
              <Input
                id="yearOrGrade"
                value={tempProfile.yearOrGrade || ''}
                onChange={(e) =>
                  handleTempProfileChange('yearOrGrade', e.target.value)
                }
                placeholder="e.g., 12, 2nd year"
              />
            </div>

            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Mathematics",
                  "Science",
                  "English",
                  "History",
                  "Foreign Language",
                  "Other"
                ].map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`subject-${subject.toLowerCase()}`} 
                      checked={tempProfile.subjects?.includes(subject)}
                      onCheckedChange={(checked) => {
                        const currentSubjects = tempProfile.subjects || [];
                        if (checked) {
                          handleTempProfileChange(
                            'subjects', 
                            [...currentSubjects, subject]
                          );
                        } else {
                          handleTempProfileChange(
                            'subjects', 
                            currentSubjects.filter(s => s !== subject)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`subject-${subject.toLowerCase()}`}>{subject}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicStrengths">Academic Strengths</Label>
              <Textarea
                id="academicStrengths"
                value={tempProfile.academicStrengths || ''}
                onChange={(e) =>
                  handleTempProfileChange('academicStrengths', e.target.value)
                }
                placeholder="What are your academic strengths?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="areasForImprovement">Areas for Improvement</Label>
              <Textarea
                id="areasForImprovement"
                value={tempProfile.areasForImprovement || ''}
                onChange={(e) =>
                  handleTempProfileChange('areasForImprovement', e.target.value)
                }
                placeholder="What areas would you like to improve?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicGoals">Academic Goals</Label>
              <Textarea
                id="academicGoals"
                value={tempProfile.academicGoals || ''}
                onChange={(e) =>
                  handleTempProfileChange('academicGoals', e.target.value)
                }
                placeholder="What are your academic goals?"
              />
            </div>

            <div className="space-y-2">
              <Label>Extracurricular Activities</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Sports",
                  "Music",
                  "Art",
                  "Volunteering",
                  "Other"
                ].map((activity) => (
                  <div key={activity} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`activity-${activity.toLowerCase()}`} 
                      checked={tempProfile.extracurricularActivities?.includes(activity)}
                      onCheckedChange={(checked) => {
                        const currentActivities = tempProfile.extracurricularActivities || [];
                        if (checked) {
                          handleTempProfileChange(
                            'extracurricularActivities', 
                            [...currentActivities, activity]
                          );
                        } else {
                          handleTempProfileChange(
                            'extracurricularActivities', 
                            currentActivities.filter(a => a !== activity)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`activity-${activity.toLowerCase()}`}>{activity}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Extracurricular Activities</Label>
              <Textarea
                id="customExtracurriculars"
                value={(tempProfile.customExtracurriculars || []).join(', ')}
                onChange={(e) =>
                  handleTempProfileChange('customExtracurriculars', e.target.value.split(',').map(item => item.trim()).filter(item => item !== ''))
                }
                placeholder="List your custom extracurricular activities"
              />
            </div>

            <div className="space-y-2">
              <Label>Study Time Preference</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Mornings" as StudyTimeOptions,
                  "Afternoons" as StudyTimeOptions,
                  "Evenings" as StudyTimeOptions,
                  "Night" as StudyTimeOptions,
                  "Flexible" as StudyTimeOptions
                ].map((preference) => (
                  <div key={preference} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`study-pref-${preference.toLowerCase()}`} 
                      checked={tempProfile.studyTimePreference?.includes(preference)}
                      onCheckedChange={(checked) => {
                        const currentPrefs = [...(tempProfile.studyTimePreference || [])];
                        if (checked) {
                          setTempProfile(prev => ({
                            ...prev,
                            studyTimePreference: [...currentPrefs, preference]
                          }));
                        } else {
                          setTempProfile(prev => ({
                            ...prev,
                            studyTimePreference: currentPrefs.filter(p => p !== preference)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`study-pref-${preference.toLowerCase()}`}>{preference}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolStartTime">School Start Time</Label>
                <Input
                  id="schoolStartTime"
                  type="time"
                  value={tempProfile.schoolStartTime || '08:00'}
                  onChange={(e) =>
                    handleTempProfileChange('schoolStartTime', e.target.value)
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolEndTime">School End Time</Label>
                <Input
                  id="schoolEndTime"
                  type="time"
                  value={tempProfile.schoolEndTime || '15:00'}
                  onChange={(e) =>
                    handleTempProfileChange('schoolEndTime', e.target.value)
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-medium">Bedtime</Label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { day: "Weekday", key: "weekday" as keyof typeof tempProfile.bedtime },
                  { day: "Weekend", key: "weekend" as keyof typeof tempProfile.bedtime }
                ].map((dayObj) => (
                  <Card key={dayObj.key} className="border shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm">{dayObj.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${dayObj.key}Bedtime`} className="text-xs text-muted-foreground flex items-center">
                          <Moon className="h-4 w-4 mr-1.5" /> Bedtime
                        </Label>
                        <Input
                          id={`${dayObj.key}Bedtime`}
                          type="time"
                          value={tempProfile.bedtime[dayObj.key] || '22:00'}
                          onChange={(e) =>
                            handleTempProfileChange(`bedtime.${dayObj.key}`, e.target.value)
                          }
                          className="w-24 h-8 text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Time Management Rating</Label>
              <RadioGroup
                value={String(tempProfile.timeManagementRating)}
                onValueChange={(value) => {
                  const numValue = parseInt(value, 10);
                  setTempProfile(prev => ({
                    ...prev,
                    timeManagementRating: numValue
                  }));
                }}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="time-management-1" />
                  <Label htmlFor="time-management-1">1 (Poor)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="time-management-2" />
                  <Label htmlFor="time-management-2">2 (Fair)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="time-management-3" />
                  <Label htmlFor="time-management-3">3 (Good)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="time-management-4" />
                  <Label htmlFor="time-management-4">4 (Very Good)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="time-management-5" />
                  <Label htmlFor="time-management-5">5 (Excellent)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biggestProblem">Biggest Problem</Label>
              <Textarea
                id="biggestProblem"
                value={tempProfile.biggestProblem || ''}
                onChange={(e) =>
                  handleTempProfileChange('biggestProblem', e.target.value)
                }
                placeholder="What is your biggest problem?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whyImportant">Why is it Important?</Label>
              <Textarea
                id="whyImportant"
                value={tempProfile.whyImportant || ''}
                onChange={(e) =>
                  handleTempProfileChange('whyImportant', e.target.value)
                }
                placeholder="Why is it important to you?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfectStudyWeek">Perfect Study Week</Label>
              <Textarea
                id="perfectStudyWeek"
                value={tempProfile.perfectStudyWeek || ''}
                onChange={(e) =>
                  handleTempProfileChange('perfectStudyWeek', e.target.value)
                }
                placeholder="What would be your perfect study week?"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <Bell className="mr-2 h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email}
                onCheckedChange={(value) =>
                  handleNotificationChange("email", value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in-app and on browser
                </p>
              </div>
              {isPushSupported ? (
                <Switch
                  id="push-notifications"
                  checked={isPushEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enablePushNotifications();
                      handleNotificationChange("push", true);
                    } else {
                      disablePushNotifications();
                      handleNotificationChange("push", false);
                    }
                  }}
                  disabled={pushPermissionStatus === 'denied'}
                />
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not supported
                </Badge>
              )}
            </div>

            {isPushSupported && pushPermissionStatus === 'denied' && (
              <Alert variant="destructive" className="mt-2">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Notifications blocked</AlertTitle>
                <AlertDescription>
                  You've blocked notifications in your browser. Please update your browser settings to enable push notifications.
                </AlertDescription>
              </Alert>
            )}

            {isPushSupported && !isPushEnabled && pushPermissionStatus !== 'denied' && (
              <Alert className="mt-2">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Enable notifications</AlertTitle>
                <AlertDescription>
                  Enable push notifications to receive important updates even when you're not using the app.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="task-notifications" className="font-medium">
                  Task Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming and overdue tasks
                </p>
              </div>
              <Switch
                id="task-notifications"
                checked={notifications.tasks}
                onCheckedChange={(value) =>
                  handleNotificationChange("tasks", value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session-notifications" className="font-medium">
                  Study Session Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming study sessions
                </p>
              </div>
              <Switch
                id="session-notifications"
                checked={notifications.sessions}
                onCheckedChange={(value) =>
                  handleNotificationChange("sessions", value)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-notifications" className="font-medium">
                  System Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new features and updates
                </p>
              </div>
              <Switch
                id="system-notifications"
                checked={notifications.system}
                onCheckedChange={(value) =>
                  handleNotificationChange("system", value)
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system">System</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between p-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Constraints
            </CardTitle>
            <Button 
              onClick={() => {
                setEditingConstraint(undefined);
                setIsTimeConstraintDialogOpen(true);
              }}
            >
              Add Time Block
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeConstraints.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No time constraints set. Add some to block out your regular commitments.
              </p>
            ) : (
              timeConstraints.map((constraint) => (
                <div
                  key={constraint.id}
                  className="flex items-center justify-between gap-2 border p-3 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{constraint.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {constraint.daysOfWeek.map(day => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {constraint.startTime} - {constraint.endTime}
                    </p>
                    <Badge variant={
                      constraint.priority === 'High' ? 'destructive' :
                      constraint.priority === 'Medium' ? 'default' :
                      'secondary'
                    }>
                      {constraint.priority}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingConstraint(constraint);
                        setIsTimeConstraintDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTimeConstraint(constraint.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={calendar}
              onValueChange={setCalendar}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="google" id="calendar-google" />
                <Label htmlFor="calendar-google">Google Calendar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="outlook" id="calendar-outlook" />
                <Label htmlFor="calendar-outlook">Outlook Calendar</Label>
              </div>
            </RadioGroup>
            <Button
              className="w-full"
              onClick={handleConnectCalendar}
              disabled={isConnecting}
            >
              {isCalendarConnected
                ? "Calendar Connected"
                : isConnecting
                  ? "Connecting..."
                  : "Connect Calendar"}
            </Button>
          </CardContent>
        </Card>

        {/* For development and testing purposes */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Development & Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <TestNotifications />
              <PushNotificationTester />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="mt-12 pt-8 border-t border-destructive/20">
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive/80">
              Deleting your account is permanent and cannot be undone. All your data, including tasks, sessions, events, and settings, will be irrevocably lost.
            </p>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={isDeleting} // Disable button while deleting
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your 
                    account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleConfirmDelete} 
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <TimeConstraintDialog
        open={isTimeConstraintDialogOpen}
        onOpenChange={setIsTimeConstraintDialogOpen}
        onSave={handleSaveTimeConstraint}
        initialConstraint={editingConstraint}
      />
    </div>
  );
}