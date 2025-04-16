import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/contexts/NotificationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';
import { ScheduledNotification } from '@/services/scheduledNotificationService';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, X } from 'lucide-react';

export const ScheduledNotifications: React.FC = () => {
  const { 
    scheduledNotifications, 
    scheduleNotification, 
    cancelScheduledNotification
  } = useNotifications();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ScheduledNotification['type']>('reminder');
  const [link, setLink] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('12:00');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const handleSchedule = async () => {
    if (!title || !message || !date) {
      return;
    }

    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Ensure the date is in the future
    if (scheduledDate <= new Date()) {
      alert('Scheduled time must be in the future');
      return;
    }

    const notification: Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'> = {
      title,
      message,
      type,
      link: link || undefined,
      scheduledFor: Timestamp.fromDate(scheduledDate),
      ...(recurring ? {
        recurring: {
          frequency,
        }
      } : {})
    };

    const notificationId = await scheduleNotification(notification);
    
    if (notificationId) {
      // Reset form
      setTitle('');
      setMessage('');
      setType('reminder');
      setLink('');
      setDate(new Date());
      setTime('12:00');
      setRecurring(false);
      setFrequency('daily');
    }
  };

  const handleCancel = async (id: string) => {
    await cancelScheduledNotification(id);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Pending</span>;
      case 'delivered':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Delivered</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return null;
    }
  };
  
  const formatScheduledDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const pendingNotifications = scheduledNotifications.filter(n => n.status === 'pending');
  const pastNotifications = scheduledNotifications.filter(n => n.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Notifications</CardTitle>
        <CardDescription>
          Schedule notifications for future delivery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="mb-4">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({pendingNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({pastNotifications.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Notification title" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="study-session">Study Session</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="ai-suggestion">AI Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Notification message" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="link">Link (optional)</Label>
                <Input 
                  id="link" 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="/dashboard" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="recurring" 
                    checked={recurring} 
                    onChange={() => setRecurring(!recurring)} 
                    className="w-4 h-4"
                  />
                  <Label htmlFor="recurring">Recurring notification</Label>
                </div>
              </div>
              
              {recurring && (
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={frequency} 
                    onValueChange={(value: any) => setFrequency(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button onClick={handleSchedule} className="w-full">
                Schedule Notification
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming">
            {pendingNotifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No upcoming notifications
              </div>
            ) : (
              <div className="space-y-3">
                {pendingNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 border rounded-md relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground">{notification.message}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Scheduled for: {formatScheduledDate(notification.scheduledFor)}</span>
                          {notification.recurring && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              {notification.recurring.frequency}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 absolute top-3 right-3"
                        onClick={() => handleCancel(notification.id!)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {pastNotifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No notification history
              </div>
            ) : (
              <div className="space-y-3">
                {pastNotifications.map((notification) => (
                  <div key={notification.id} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground">{notification.message}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span>Scheduled for: {formatScheduledDate(notification.scheduledFor)}</span>
                          {getStatusBadge(notification.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
