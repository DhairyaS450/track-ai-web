import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Calendar, Moon, User } from "lucide-react";

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true,
    sessions: true,
  });

  const [theme, setTheme] = useState("system");
  const [calendar, setCalendar] = useState("google");
  const [profile, setProfile] = useState({
    studyLevel: "highschool",
    major: "",
    extracurriculars: "",
    strengths: "",
    weaknesses: "",
    goals: "",
    preferredStudyTimes: "",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Level of Study</Label>
              <RadioGroup
                value={profile.studyLevel}
                onValueChange={(value) =>
                  setProfile((prev) => ({ ...prev, studyLevel: value }))
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
                value={profile.major}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, major: e.target.value }))
                }
                placeholder="e.g., Computer Science, Biology"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extracurriculars">Extracurricular Activities</Label>
              <Textarea
                id="extracurriculars"
                value={profile.extracurriculars}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    extracurriculars: e.target.value,
                  }))
                }
                placeholder="List your extracurricular activities"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">Academic Strengths</Label>
              <Textarea
                id="strengths"
                value={profile.strengths}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, strengths: e.target.value }))
                }
                placeholder="What are your academic strengths?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaknesses">Areas for Improvement</Label>
              <Textarea
                id="weaknesses"
                value={profile.weaknesses}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, weaknesses: e.target.value }))
                }
                placeholder="What areas would you like to improve?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Academic Goals</Label>
              <Textarea
                id="goals"
                value={profile.goals}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, goals: e.target.value }))
                }
                placeholder="What are your academic goals?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyTimes">Preferred Study Times</Label>
              <Input
                id="studyTimes"
                value={profile.preferredStudyTimes}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    preferredStudyTimes: e.target.value,
                  }))
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
            <Button className="w-full">Connect Calendar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}