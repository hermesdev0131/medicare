-- Add activity log table for tracking user actions
CREATE TABLE public.user_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity log
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Admin can view all activity logs
CREATE POLICY "Admins can view all activity logs" 
ON public.user_activity_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" 
ON public.user_activity_log 
FOR SELECT 
USING (user_id = auth.uid());

-- System can insert activity logs
CREATE POLICY "System can insert activity logs" 
ON public.user_activity_log 
FOR INSERT 
WITH CHECK (true);

-- Add verification status columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verification_badges JSONB DEFAULT '[]'::jsonb;

-- Update profile completion trigger to check verification status
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate profile completion
  NEW.profile_completion_percentage = (
    SELECT public.calculate_profile_completion(
      NEW.first_name,
      NEW.last_name, 
      NEW.phone_number,
      NEW.company_name,
      NEW.position_title,
      NEW.license_state,
      NEW.avatar_url,
      NEW.bio
    )
  );
  
  -- Check if profile is completed (80% or more)
  NEW.profile_completed = (NEW.profile_completion_percentage >= 80);
  
  -- Update verification badges
  NEW.verification_badges = jsonb_build_array(
    CASE WHEN NEW.email_verified THEN 'email_verified' ELSE NULL END,
    CASE WHEN NEW.phone_verified THEN 'phone_verified' ELSE NULL END,
    CASE WHEN NEW.npn_verified THEN 'npn_verified' ELSE NULL END,
    CASE WHEN NEW.profile_completed THEN 'profile_completed' ELSE NULL END,
    CASE WHEN NEW.avatar_url IS NOT NULL THEN 'avatar_uploaded' ELSE NULL END
  ) - '[null]'::jsonb;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile completion updates
DROP TRIGGER IF EXISTS update_profiles_completion ON public.profiles;
CREATE TRIGGER update_profiles_completion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_completion();

-- Create indexes for better performance
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_profiles_verification ON public.profiles(email_verified, phone_verified, profile_completed);