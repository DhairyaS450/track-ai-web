import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Mail, Moon } from "lucide-react";

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true,
    sessions: true,
  });

  const [theme, setTheme] = useState("system");
  const [calendar, setCalendar] = useState("google");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6">
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
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, email: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={notifications.push}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, push: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="task-reminders">Task Reminders</Label>
              <Switch
                id="task-reminders"
                checked={notifications.tasks}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, tasks: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="session-reminders">Study Session Reminders</Label>
              <Switch
                id="session-reminders"
                checked={notifications.sessions}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, sessions: checked }))
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
              onValueChange={setTheme}
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
            <Button className="w-full">
              Connect Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}