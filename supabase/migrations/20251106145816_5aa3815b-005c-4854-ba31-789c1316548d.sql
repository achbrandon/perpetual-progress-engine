-- Enable realtime for account_applications table
ALTER TABLE account_applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE account_applications;