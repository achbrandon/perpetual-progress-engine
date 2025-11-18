-- Create table for support topic analytics
CREATE TABLE IF NOT EXISTS public.support_topic_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  detected_topic TEXT NOT NULL,
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_topic_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can view all analytics
CREATE POLICY "Admins view all topic analytics"
  ON public.support_topic_analytics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert analytics
CREATE POLICY "System can insert topic analytics"
  ON public.support_topic_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_support_topic_analytics_topic ON public.support_topic_analytics(detected_topic);
CREATE INDEX idx_support_topic_analytics_created_at ON public.support_topic_analytics(created_at DESC);