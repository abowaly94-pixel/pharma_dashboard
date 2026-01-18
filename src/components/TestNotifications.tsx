import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/notifications';

export function TestNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Test Notification',
    body: 'This is a test notification from the admin panel',
    type: 'general' as const,
  });

  const handleTestNotification = async () => {
    if (!formData.title || !formData.body) {
      toast.error('Please fill in both title and body');
      return;
    }

    setIsLoading(true);
    try {
      await sendNotification({
        title: formData.title,
        body: formData.body,
        type: formData.type,
      });
      toast.success('Test notification sent successfully!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-title">Title</Label>
          <Input
            id="test-title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Notification title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-body">Body</Label>
          <Textarea
            id="test-body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Notification body"
            rows={3}
          />
        </div>
        <Button 
          onClick={handleTestNotification} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}