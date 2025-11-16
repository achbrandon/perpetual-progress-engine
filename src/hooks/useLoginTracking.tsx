import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createNotification, NotificationTemplates } from '@/lib/notifications';

export function useLoginTracking() {
  useEffect(() => {
    const trackLogin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get device info
        const userAgent = navigator.userAgent;
        const device = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent) 
          ? 'Mobile Device' 
          : /Tablet/.test(userAgent) 
          ? 'Tablet' 
          : 'Desktop Computer';

        // Get location (approximate from timezone)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const location = timezone.split('/')[1]?.replace(/_/g, ' ') || 'Unknown';

        // Check if this is a new device by comparing with last login
        const lastLoginKey = `last_login_${user.id}`;
        const lastLoginData = localStorage.getItem(lastLoginKey);
        
        const currentLoginData = JSON.stringify({ device, location, userAgent });
        
        if (lastLoginData !== currentLoginData) {
          // New device/location detected - send notification
          const notification = NotificationTemplates.loginDetected(location, device);
          await createNotification({
            userId: user.id,
            ...notification,
          });
          
          // Update last login data
          localStorage.setItem(lastLoginKey, currentLoginData);
        }
      } catch (error) {
        console.error('Error tracking login:', error);
      }
    };

    trackLogin();
  }, []);
}
