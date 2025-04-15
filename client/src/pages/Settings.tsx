/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Calendar, Moon, User, Clock, Edit, Trash2 } from "lucide-react";
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

  const [profile, setProfile] = useState({
    studyLevel: "highschool",
    major: "",
    extracurriculars: "",
    strengths: "",
    weaknesses: "",
    goals: "",
    preferredStudyTimes: "",
  });
  const [tempProfile, setTempProfile] = useState(profile);

  const [timeConstraints, setTimeConstraints] = useState<TimeConstraint[]>([]);
  const [isTimeConstraintDialogOpen, setIsTimeConstraintDialogOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<TimeConstraint | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete dialog
  const [isDeleting, setIsDeleting] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleTempProfileChange = (field: string, value: string) => {
    setTempProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    const updatedNotifications = { ...notifications, [type]: value };
    setNotifications(updatedNotifications);
    saveSettings({}, { notifications: updatedNotifications });
  };
  
  // const handleProfileChange = (field: string, value: string) => {
  //   const updatedProfile = { ...profile, [field]: value };
  //   setProfile(updatedProfile);
  //   saveSettings({ userProfile: updatedProfile }, {});
  // };
  
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
          setProfile(settings.userProfile);
          setTempProfile(settings.userProfile);
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex justify-between p-4 border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Profile
            </CardTitle>
            <Button 
              onClick={handleSaveProfile} 
              className="ml-auto"
              disabled={JSON.stringify(tempProfile) === JSON.stringify(profile)}
            >
              Save Profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Level of Study</Label>
              <RadioGroup
                value={tempProfile?.studyLevel || 'highschool'}
                onValueChange={(value) =>
                  handleTempProfileChange('studyLevel', value)
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="highschool" id="study-highschool" />
                  <Label htmlFor="study-highschool">High School</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="postsecondary" id="study-postsecondary" />
                  <Label htmlFor="study-postsecondary">Post-Secondary</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Subjects/Major</Label>
              <Input
                id="major"
                value={tempProfile?.major || ''}
                onChange={(e) =>
                  handleTempProfileChange('major', e.target.value)
                }
                placeholder="e.g., Computer Science, Biology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extracurriculars">Extracurricular Activities</Label>
              <Textarea
                id="extracurriculars"
                value={tempProfile?.extracurriculars || ''}
                onChange={(e) =>
                  handleTempProfileChange('extracurriculars', e.target.value)
                }
                placeholder="List your extracurricular activities"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">Academic Strengths</Label>
              <Textarea
                id="strengths"
                value={tempProfile?.strengths || ''}
                onChange={(e) =>
                  handleTempProfileChange('strengths', e.target.value)
                }
                placeholder="What are your academic strengths?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaknesses">Areas for Improvement</Label>
              <Textarea
                id="weaknesses"
                value={tempProfile?.weaknesses || ''}
                onChange={(e) =>
                  handleTempProfileChange('weaknesses', e.target.value)
                }
                placeholder="What areas would you like to improve?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Academic Goals</Label>
              <Textarea
                id="goals"
                value={tempProfile?.goals || ''}
                onChange={(e) =>
                  handleTempProfileChange('goals', e.target.value)
                }
                placeholder="What are your academic goals?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyTimes">Preferred Study Times</Label>
              <Input
                id="studyTimes"
                value={tempProfile?.preferredStudyTimes || ''}
                onChange={(e) =>
                  handleTempProfileChange('preferredStudyTimes', e.target.value)
                }
                placeholder="e.g., Mornings 9-11 AM, Evenings 6-8 PM"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
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
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{constraint.title}</h4>
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
                  <div className="flex gap-2">
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