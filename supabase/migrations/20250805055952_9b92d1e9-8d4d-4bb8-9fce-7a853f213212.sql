-- Create courses table for e-learning platform
CREATE TABLE public.courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_name TEXT,
    duration_minutes INTEGER DEFAULT 0,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    category TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course modules table
CREATE TABLE public.course_modules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(course_id, user_id)
);

-- Create module progress table
CREATE TABLE public.module_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    UNIQUE(enrollment_id, module_id)
);

-- Create webinars table
CREATE TABLE public.webinars (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_name TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_attendees INTEGER,
    meeting_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webinar registrations table
CREATE TABLE public.webinar_registrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    webinar_id UUID NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    attended BOOLEAN DEFAULT false,
    UNIQUE(webinar_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Published courses are viewable by everyone" 
ON public.courses 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all courses" 
ON public.courses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses" 
ON public.courses 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses" 
ON public.courses 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for course modules
CREATE POLICY "Published course modules are viewable by everyone" 
ON public.course_modules 
FOR SELECT 
USING (is_published = true AND EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = course_modules.course_id AND is_published = true
));

CREATE POLICY "Admins can view all course modules" 
ON public.course_modules 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create course modules" 
ON public.course_modules 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update course modules" 
ON public.course_modules 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete course modules" 
ON public.course_modules 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for course enrollments
CREATE POLICY "Users can view their own enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own enrollments" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments" 
ON public.course_enrollments 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for module progress
CREATE POLICY "Users can view their own module progress" 
ON public.module_progress 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE id = module_progress.enrollment_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create their own module progress" 
ON public.module_progress 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE id = module_progress.enrollment_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own module progress" 
ON public.module_progress 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE id = module_progress.enrollment_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all module progress" 
ON public.module_progress 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for webinars
CREATE POLICY "Published webinars are viewable by everyone" 
ON public.webinars 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all webinars" 
ON public.webinars 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create webinars" 
ON public.webinars 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webinars" 
ON public.webinars 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete webinars" 
ON public.webinars 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for webinar registrations
CREATE POLICY "Users can view their own webinar registrations" 
ON public.webinar_registrations 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own webinar registrations" 
ON public.webinar_registrations 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own webinar registrations" 
ON public.webinar_registrations 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all webinar registrations" 
ON public.webinar_registrations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_modules_order ON public.course_modules(course_id, order_index);
CREATE INDEX idx_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX idx_module_progress_enrollment ON public.module_progress(enrollment_id);
CREATE INDEX idx_webinars_scheduled_at ON public.webinars(scheduled_at);
CREATE INDEX idx_webinar_registrations_user_id ON public.webinar_registrations(user_id);
CREATE INDEX idx_webinar_registrations_webinar_id ON public.webinar_registrations(webinar_id);

-- Create function to calculate course progress
CREATE OR REPLACE FUNCTION public.calculate_course_progress(enrollment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_modules INTEGER;
    completed_modules INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Get total modules for the course
    SELECT COUNT(*) INTO total_modules
    FROM public.course_modules cm
    JOIN public.course_enrollments ce ON cm.course_id = ce.course_id
    WHERE ce.id = enrollment_id AND cm.is_published = true;
    
    -- Get completed modules
    SELECT COUNT(*) INTO completed_modules
    FROM public.module_progress mp
    WHERE mp.enrollment_id = enrollment_id AND mp.completed_at IS NOT NULL;
    
    -- Calculate percentage
    IF total_modules = 0 THEN
        progress_percentage := 0;
    ELSE
        progress_percentage := ROUND((completed_modules::DECIMAL / total_modules::DECIMAL) * 100);
    END IF;
    
    -- Update the enrollment progress
    UPDATE public.course_enrollments 
    SET progress_percentage = calculate_course_progress.progress_percentage,
        last_accessed_at = now()
    WHERE id = enrollment_id;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update course progress when module progress changes
CREATE OR REPLACE FUNCTION public.update_course_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and update course progress
    PERFORM public.calculate_course_progress(NEW.enrollment_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_progress
    AFTER INSERT OR UPDATE ON public.module_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_progress_trigger();

-- Create triggers for updated_at timestamps
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