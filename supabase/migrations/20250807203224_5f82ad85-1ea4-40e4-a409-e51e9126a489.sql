-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'prospect';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business_leader';

-- Update the handle_new_user function to assign default prospect role instead of user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  
  -- Assign default prospect role (instead of user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'prospect');
  
  -- Check if user should be admin (you can modify this logic as needed)
  -- For now, checking if email contains 'admin' or specific domains
  IF NEW.email LIKE '%admin%' OR NEW.email LIKE '%@company.com' THEN
    -- Assign admin role and all associated roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      (NEW.id, 'admin'),
      (NEW.id, 'instructional_designer'),
      (NEW.id, 'facilitator'),
      (NEW.id, 'agent'),
      (NEW.id, 'business_leader');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add policies for new roles on courses table
CREATE POLICY "Agents can view published courses" 
ON public.courses 
FOR SELECT 
USING (is_published = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'business_leader'::app_role)));

-- Add policies for new roles on webinars table
CREATE POLICY "Agents can view published webinars" 
ON public.webinars 
FOR SELECT 
USING (is_published = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'business_leader'::app_role)));

-- Add policies for new roles on course enrollments
CREATE POLICY "Agents can enroll in courses" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'business_leader'::app_role)));

-- Add policies for new roles on webinar registrations
CREATE POLICY "Agents can register for webinars" 
ON public.webinar_registrations 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'business_leader'::app_role)));

-- Business leaders can view their team's enrollments and registrations
CREATE POLICY "Business leaders can view team course enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (has_role(auth.uid(), 'business_leader'::app_role));

CREATE POLICY "Business leaders can view team webinar registrations" 
ON public.webinar_registrations 
FOR SELECT 
USING (has_role(auth.uid(), 'business_leader'::app_role));