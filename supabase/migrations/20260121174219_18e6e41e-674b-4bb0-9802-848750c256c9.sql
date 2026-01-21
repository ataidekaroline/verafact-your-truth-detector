-- Fix PUBLIC_DATA_EXPOSURE: Remove anonymous access to verification_history
-- Since the app is now auth-free, we should prevent any public access to user verification history

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own verification history" ON public.verification_history;
DROP POLICY IF EXISTS "Users can insert their own verification history" ON public.verification_history;

-- Create restrictive SELECT policy - no public access
-- Since app is auth-free, verification history should not be publicly readable
CREATE POLICY "No public read access to verification history" 
ON public.verification_history 
FOR SELECT 
USING (false);

-- Create restrictive INSERT policy - no public inserts
-- Edge functions with service role key can still insert
CREATE POLICY "No public insert to verification history" 
ON public.verification_history 
FOR INSERT 
WITH CHECK (false);