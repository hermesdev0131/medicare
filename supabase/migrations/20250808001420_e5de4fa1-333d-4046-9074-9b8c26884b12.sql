-- Update admin user to have premium subscription
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2025-12-31 23:59:59+00',
  updated_at = now()
WHERE email = 'jahsiems@gmail.com';