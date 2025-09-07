-- Assign admin roles to your user
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('ee293f48-ca2c-4031-9b0b-f22a561e8963', 'admin'),
  ('ee293f48-ca2c-4031-9b0b-f22a561e8963', 'instructional_designer'),
  ('ee293f48-ca2c-4031-9b0b-f22a561e8963', 'facilitator')
ON CONFLICT (user_id, role) DO NOTHING;