-- Add missing notification_type column to admin_notifications
ALTER TABLE public.admin_notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'system';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at 
ON public.admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read 
ON public.admin_notifications(is_read);