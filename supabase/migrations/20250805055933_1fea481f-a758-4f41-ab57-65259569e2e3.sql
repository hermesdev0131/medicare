-- Create courses table for e-learning platform
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_hours INTEGER,
  instructor_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  enrollment_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'text', 'quiz', 'document')),
  content_url TEXT,
  content_text TEXT,
  module_order INTEGER NOT NULL,
  estimated_duration_minutes INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, course_id)
);

-- Create module progress table
CREATE TABLE public.module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  time_spent_minutes INTEGER DEFAULT 0,
  score DECIMAL(5,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Create webinars table
CREATE TABLE public.webinars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  presenter_name TEXT,
  presenter_bio TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  webinar_url TEXT,
  meeting_id TEXT,
  passcode TEXT,
  max_attendees INTEGER,
  registration_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webinar registrations table
CREATE TABLE public.webinar_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  webinar_id UUID NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attended BOOLEAN NOT NULL DEFAULT false,
  attended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, webinar_id)
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true OR auth.uid() = instructor_id);

CREATE POLICY "Instructors can manage their courses" ON public.courses
  FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for course modules
CREATE POLICY "Users can view modules of enrolled courses" ON public.course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce 
      WHERE ce.course_id = course_modules.course_id 
      AND ce.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = course_modules.course_id 
      AND c.instructor_id = auth.uid()
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Instructors can manage their course modules" ON public.course_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = course_modules.course_id 
      AND c.instructor_id = auth.uid()
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create RLS policies for course enrollments
CREATE POLICY "Users can view their own enrollments" ON public.course_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments" ON public.course_enrollments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses" ON public.course_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = course_enrollments.course_id 
      AND c.instructor_id = auth.uid()
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create RLS policies for module progress
CREATE POLICY "Users can view their own progress" ON public.module_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON public.module_progress
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Instructors can view progress for their courses" ON public.module_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = module_progress.course_id 
      AND c.instructor_id = auth.uid()
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create RLS policies for webinars
CREATE POLICY "Anyone can view published webinars" ON public.webinars
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all webinars" ON public.webinars
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for webinar registrations
CREATE POLICY "Users can view their own webinar registrations" ON public.webinar_registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can register for webinars" ON public.webinar_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registrations" ON public.webinar_registrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all webinar registrations" ON public.webinar_registrations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_course_modules_course ON public.course_modules(course_id);
CREATE INDEX idx_course_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX idx_module_progress_user ON public.module_progress(user_id);
CREATE INDEX idx_module_progress_course ON public.module_progress(course_id);
CREATE INDEX idx_webinars_scheduled ON public.webinars(scheduled_at);
CREATE INDEX idx_webinar_registrations_user ON public.webinar_registrations(user_id);

-- Create function to calculate course progress
CREATE OR REPLACE FUNCTION public.calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Get total number of required modules
  SELECT COUNT(*) INTO total_modules
  FROM public.course_modules
  WHERE course_id = p_course_id AND is_required = true;
  
  -- Get number of completed required modules
  SELECT COUNT(*) INTO completed_modules
  FROM public.module_progress mp
  JOIN public.course_modules cm ON mp.module_id = cm.id
  WHERE mp.user_id = p_user_id 
    AND mp.course_id = p_course_id 
    AND mp.completed = true
    AND cm.is_required = true;
  
  -- Calculate percentage
  IF total_modules = 0 THEN
    progress_percentage := 100;
  ELSE
    progress_percentage := ROUND((completed_modules::FLOAT / total_modules::FLOAT) * 100);
  END IF;
  
  RETURN progress_percentage;
END;
$$;

-- Create function to update course enrollment progress
CREATE OR REPLACE FUNCTION public.update_course_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_progress INTEGER;
BEGIN
  -- Calculate new progress
  new_progress := public.calculate_course_progress(NEW.user_id, NEW.course_id);
  
  -- Update enrollment progress
  UPDATE public.course_enrollments
  SET 
    progress_percentage = new_progress,
    completed_at = CASE WHEN new_progress = 100 THEN now() ELSE NULL END,
    last_accessed_at = now()
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update course progress when module progress changes
CREATE TRIGGER trigger_update_course_progress
  AFTER INSERT OR UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_progress();

-- Create trigger for updated_at columns
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webinars_updated_at
  BEFORE UPDATE ON public.webinars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();