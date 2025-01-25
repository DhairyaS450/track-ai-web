import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Calendar, Moon, User } from "lucide-react";
import { connectGoogleCalendar, getGoogleCalendarStatus } from "@/api/calendar";
import { useToast } from "@/hooks/useToast";
import api from "@/api/Api";
import { listenToSettings, saveSettings } from "@/api/settings";

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true,
    sessions: true,
  });

  const [theme, setTheme] = useState("system");
  const [calendar, setCalendar] = useState("google");
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const setLoading = useState(true)[1]; // Add loading state
  const { toast } = useToast();

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
  
  const handleThemeChange = (value: string) => {
    setTheme(value);
    saveSettings({}, { theme: value });
  };

  const handleSaveProfile = async () => {
    try {
      setProfile(tempProfile);
      await saveSettings({ userProfile: tempProfile }, {});
      toast({ title: "Success", description: "Profile saved successfully" });
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={notifications?.email}
                onCheckedChange={(checked) =>
                  handleNotificationChange("email", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={notifications?.push}
                onCheckedChange={(checked) =>
                  handleNotificationChange("push", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="task-reminders">Task Reminders</Label>
              <Switch
                id="task-reminders"
                checked={notifications?.tasks}
                onCheckedChange={(checked) =>
                  handleNotificationChange("tasks", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="session-reminders">Study Session Reminders</Label>
              <Switch
                id="session-reminders"
                checked={notifications?.sessions}
                onCheckedChange={(checked) =>
                  handleNotificationChange("sessions", checked)
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
              onValueChange={(value) => handleThemeChange(value)}
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
      </div>
    </div>
  );
}