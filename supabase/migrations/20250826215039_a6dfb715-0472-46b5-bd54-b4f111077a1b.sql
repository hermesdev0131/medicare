-- Fix security definer view issues by adding proper RLS policies for views
-- Drop the views and recreate them with proper security context

DROP VIEW IF EXISTS public.course_statistics;
DROP VIEW IF EXISTS public.user_learning_overview;
DROP VIEW IF EXISTS public.instructor_course_overview;

-- Recreate views without SECURITY DEFINER
CREATE VIEW public.course_statistics AS
SELECT 
  c.id,
  c.title,
  c.category,
  c.instructor_id,
  c.is_published,
  c.enrollment_count,
  COALESCE(AVG(ce.progress_percentage), 0) as avg_progress,
  COUNT(CASE WHEN ce.progress_percentage = 100 THEN 1 END) as completions,
  ROUND(
    CASE WHEN c.enrollment_count > 0 
    THEN (COUNT(CASE WHEN ce.progress_percentage = 100 THEN 1 END)::decimal / c.enrollment_count) * 100
    ELSE 0 END, 2
  ) as completion_rate
FROM public.courses c
LEFT JOIN public.course_enrollments ce ON c.id = ce.course_id
WHERE c.is_published = true
GROUP BY c.id, c.title, c.category, c.instructor_id, c.is_published, c.enrollment_count;

CREATE VIEW public.user_learning_overview AS
SELECT 
  p.user_id,
  p.first_name,
  p.last_name,
  COUNT(DISTINCT ce.course_id) as enrolled_courses,
  COUNT(CASE WHEN ce.progress_percentage = 100 THEN 1 END) as completed_courses,
  COALESCE(AVG(ce.progress_percentage), 0) as avg_progress,
  COALESCE(SUM(lp.time_spent_minutes), 0) as total_study_time,
  COALESCE(up.total_points, 0) as total_points,
  COALESCE(up.streak_days, 0) as streak_days
FROM public.profiles p
LEFT JOIN public.course_enrollments ce ON p.user_id = ce.user_id
LEFT JOIN public.lesson_progress lp ON p.user_id = lp.user_id
LEFT JOIN public.user_points up ON p.user_id = up.user_id
GROUP BY p.user_id, p.first_name, p.last_name, up.total_points, up.streak_days;

CREATE VIEW public.instructor_course_overview AS
SELECT 
  c.instructor_id,
  c.id as course_id,
  c.title,
  c.enrollment_count,
  COUNT(DISTINCT ce.user_id) as active_learners,
  COUNT(CASE WHEN ce.progress_percentage = 100 THEN 1 END) as completions,
  ROUND(AVG(ce.progress_percentage), 1) as avg_progress,
  SUM(lp.time_spent_minutes) as total_engagement_minutes
FROM public.courses c
LEFT JOIN public.course_enrollments ce ON c.id = ce.course_id
LEFT JOIN public.lesson_progress lp ON c.id = lp.course_id
WHERE c.is_published = true
GROUP BY c.instructor_id, c.id, c.title, c.enrollment_count;

-- Enable RLS on views (will inherit from underlying tables)
ALTER VIEW public.course_statistics ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.user_learning_overview ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.instructor_course_overview ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for views
CREATE POLICY "Anyone can view course statistics"
ON public.course_statistics
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can view their own learning overview"
ON public.user_learning_overview
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Instructors can view their course overviews"
ON public.instructor_course_overview
FOR SELECT
TO authenticated
USING (instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));