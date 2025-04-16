import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Calendar, Sparkles, AlarmClock } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { ScheduledNotifications } from './ScheduledNotifications';

export const TestNotifications: React.FC = () => {
  const { createNotification, scheduleNotification } = useNotifications();

  // Standard notification types
  const createInfoNotification = () => {
    createNotification({
      title: 'Info Notification',
      message: 'This is an example info notification.',
      type: 'info',
    });
  };

  const createSuccessNotification = () => {
    createNotification({
      title: 'Success Notification',
      message: 'Your action was completed successfully!',
      type: 'success',
    });
  };

  const createWarningNotification = () => {
    createNotification({
      title: 'Warning Notification',
      message: 'Please be aware of this important information.',
      type: 'warning',
    });
  };

  const createErrorNotification = () => {
    createNotification({
      title: 'Error Notification',
      message: 'Something went wrong! Please try again.',
      type: 'error',
    });
  };

  // Specific notification categories
  const createStudySessionNotification = () => {
    createNotification({
      title: 'Study Session Starting',
      message: 'Your Chemistry study session is starting in 5 minutes.',
      type: 'study-session',
      link: '/study',
    });
  };

  const createReminderNotification = () => {
    createNotification({
      title: 'Reminder',
      message: 'Don\'t forget to prepare your notes for tomorrow\'s class.',
      type: 'reminder',
    });
  };

  const createDeadlineNotification = () => {
    createNotification({
      title: 'Assignment Due Soon',
      message: 'Your Math homework is due in 3 hours. Make sure to submit it on time.',
      type: 'deadline',
      link: '/calendar',
    });
  };

  const createOverdueNotification = () => {
    createNotification({
      title: 'Overdue Assignment',
      message: 'Your English essay was due yesterday. Please submit it as soon as possible.',
      type: 'deadline',
    });
  };

  const createAISuggestionNotification = () => {
    createNotification({
      title: 'Study Suggestion from Kai',
      message: 'You have a Chemistry exam coming up next week. I suggest creating study sessions on Tuesday at 3 PM and Thursday at 4 PM to review key concepts.',
      type: 'ai-suggestion',
      link: '/study',
    });
  };
  
  // Scheduled notification tests
  const createScheduledNotification = () => {
    // Schedule for 1 minute from now
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 1);
    
    scheduleNotification({
      title: 'Scheduled Notification Test',
      message: 'This notification was scheduled for 1 minute from now.',
      type: 'info',
      scheduledFor: Timestamp.fromDate(scheduledFor)
    });
  };
  
  const createScheduledReminderNotification = () => {
    // Schedule for 2 minutes from now
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 2);
    
    scheduleNotification({
      title: 'Study Reminder',
      message: 'Remember to review your Physics notes for tomorrow\'s class.',
      type: 'reminder',
      scheduledFor: Timestamp.fromDate(scheduledFor)
    });
  };
  
  const createRecurringNotification = () => {
    // Schedule to start 5 minutes from now and recur daily
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 5);
    
    scheduleNotification({
      title: 'Daily Task Reminder',
      message: 'Don\'t forget to update your study tracker!',
      type: 'reminder',
      scheduledFor: Timestamp.fromDate(scheduledFor),
      recurring: {
        frequency: 'daily'
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
        <CardDescription>
          Use these buttons to test different types of notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Notification Categories</TabsTrigger>
            <TabsTrigger value="types">Basic Types</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="scheduled-manager">Notification Manager</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Study Session Notifications
              </h3>
              <Button onClick={createStudySessionNotification} variant="outline" className="mr-2">
                Study Session Reminder
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Reminders
              </h3>
              <Button onClick={createReminderNotification} variant="outline" className="mr-2">
                General Reminder
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Deadline Notifications
              </h3>
              <Button onClick={createDeadlineNotification} variant="outline" className="mr-2">
                Upcoming Deadline
              </Button>
              <Button onClick={createOverdueNotification} variant="outline">
                Overdue Assignment
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Suggestions
              </h3>
              <Button onClick={createAISuggestionNotification} variant="outline">
                Suggestion from Kai
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="types" className="flex flex-wrap gap-2">
            <Button onClick={createInfoNotification} variant="outline">
              Info
            </Button>
            <Button onClick={createSuccessNotification} variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200">
              Success
            </Button>
            <Button onClick={createWarningNotification} variant="outline" className="bg-amber-50 hover:bg-amber-100 border-amber-200">
              Warning
            </Button>
            <Button onClick={createErrorNotification} variant="outline" className="bg-red-50 hover:bg-red-100 border-red-200">
              Error
            </Button>
          </TabsContent>
          
          <TabsContent value="scheduled" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-blue-500" />
                Scheduled Notifications
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Test notifications that will be delivered at a specified time in the future.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={createScheduledNotification} variant="outline">
                  In 1 Minute
                </Button>
                <Button onClick={createScheduledReminderNotification} variant="outline">
                  Study Reminder (2 min)
                </Button>
                <Button onClick={createRecurringNotification} variant="outline">
                  Daily Recurring
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scheduled-manager">
            <ScheduledNotifications />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
