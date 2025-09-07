-- Update the handle_new_user function to automatically assign admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    user_id, 
    first_name, 
    last_name, 
    email, 
    phone_number, 
    company_name, 
    position_title, 
    npn, 
    license_state,
    is_active
  )
  VALUES (
    gen_random_uuid(),
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'position_title',
    NEW.raw_user_meta_data ->> 'npn',
    NEW.raw_user_meta_data ->> 'license_state',
    true
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Check if user should be admin (you can modify this logic as needed)
  -- For now, checking if email contains 'admin' or specific domains
  IF NEW.email LIKE '%admin%' OR NEW.email LIKE '%@company.com' THEN
    -- Assign admin role and all associated roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      (NEW.id, 'admin'),
      (NEW.id, 'instructional_designer'),
      (NEW.id, 'facilitator');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add RLS policies for instructional designers and facilitators on courses
CREATE POLICY "Instructional designers can manage courses" 
ON public.courses 
FOR ALL 
USING (
  has_role(auth.uid(), 'instructional_designer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add RLS policies for facilitators on webinars
CREATE POLICY "Facilitators can manage webinars" 
ON public.webinars 
FOR ALL 
USING (
  has_role(auth.uid(), 'facilitator'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update webinars table to include meeting_url (fixing the existing schema issue)
ALTER TABLE public.webinars 
ADD COLUMN IF NOT EXISTS meeting_url text,
ADD COLUMN IF NOT EXISTS instructor_name text;

-- Update webinars table to rename webinar_url to meeting_url if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webinars' AND column_name = 'webinar_url') THEN
    UPDATE public.webinars SET meeting_url = webinar_url WHERE meeting_url IS NULL;
    ALTER TABLE public.webinars DROP COLUMN webinar_url;
  END IF;
END $$;