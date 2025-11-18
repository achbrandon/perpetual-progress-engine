-- Add routing verification status to account_details
ALTER TABLE account_details 
ADD COLUMN routing_verified BOOLEAN DEFAULT false;

-- Set existing accounts as verified (since they already have routing numbers)
UPDATE account_details 
SET routing_verified = true 
WHERE routing_number IS NOT NULL;