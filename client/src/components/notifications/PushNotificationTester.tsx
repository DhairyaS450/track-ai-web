import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useNotifications } from '@/contexts/NotificationContext';

export function PushNotificationTester() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { isPushSupported, pushPermissionStatus, isPushEnabled, createNotification } = useNotifications();

  useEffect(() => {
    async function fetchToken() {
      setIsLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const tokens = userData.fcmTokens || {};
            const tokenValue = Object.keys(tokens)[0] || null;
            setFcmToken(tokenValue);
          } else {
            setFcmToken(null);
          }
        }
      } catch (error) {
        console.error('Error fetching FCM token:', error);
        setFcmToken(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchToken();
  }, [isPushEnabled]);

  const sendTestNotification = async () => {
    if (!fcmToken) return;
    
    setIsSending(true);
    setTestResult(null);
    
    try {
      // For testing purposes
      await createNotification({
        title: 'Test Push Notification',
        message: 'This is a test push notification.',
        type: 'info',
      });
      
      setTestResult({
        success: true,
        message: 'Test notification sent! Check if you received a push notification.',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Push Notifications</CardTitle>
        <CardDescription>
          Verify that push notifications are working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p>Status: {!isPushSupported ? 'Not supported' : 
                     pushPermissionStatus === 'denied' ? 'Blocked in browser' :
                     !isPushEnabled ? 'Not enabled' :
                     !fcmToken ? 'No token found' : 'Ready'}</p>
          {fcmToken && (
            <p className="mt-2 font-mono text-xs bg-muted p-2 rounded overflow-x-auto">
              Token: {fcmToken.slice(0, 12)}...{fcmToken.slice(-8)}
            </p>
          )}
        </div>
        
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={sendTestNotification}
          disabled={!fcmToken || isSending || !isPushEnabled}
          className="w-full"
        >
          {isSending ? 'Sending...' : 'Send Test Notification'}
        </Button>
        
        <div className="text-xs text-muted-foreground mt-4">
          <p className="font-medium">Troubleshooting Tips:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Ensure notifications are allowed in browser settings</li>
            <li>Try refreshing the page</li>
            <li>Some browsers require HTTPS for notifications</li>
            <li>On mobile, add the app to home screen for best results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}