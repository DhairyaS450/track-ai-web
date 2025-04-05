import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const TestNotifications: React.FC = () => {
  const { createNotification } = useNotifications();

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

  const createLinkNotification = () => {
    createNotification({
      title: 'Link Notification',
      message: 'Click to view more details about this notification.',
      type: 'info',
      link: '/dashboard',
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
      <CardContent className="flex flex-wrap gap-2">
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
        <Button onClick={createLinkNotification} variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
          With Link
        </Button>
      </CardContent>
    </Card>
  );
};
