-- Update profiles table to separate first_name and last_name
ALTER TABLE public.profiles 
DROP COLUMN full_name,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update the trigger function to handle separate name fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
    license_state
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
    NEW.raw_user_meta_data ->> 'license_state'
  );
  RETURN NEW;
END;
$$;