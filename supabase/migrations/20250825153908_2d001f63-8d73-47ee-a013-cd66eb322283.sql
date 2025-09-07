-- Phase 5: Create optimized views for common queries
-- 1. Create a view for course statistics (enrollment counts, completion rates)
CREATE OR REPLACE VIEW public.course_statistics AS
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

-- 2. Create a view for user learning dashboard
CREATE OR REPLACE VIEW public.user_learning_overview AS
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

-- 3. Create a view for instructor dashboard
CREATE OR REPLACE VIEW public.instructor_course_overview AS
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

-- 4. Add RLS policies for these views
ALTER VIEW public.course_statistics OWNER TO postgres;
ALTER VIEW public.user_learning_overview OWNER TO postgres;
ALTER VIEW public.instructor_course_overview OWNER TO postgres;

-- Grant appropriate access
GRANT SELECT ON public.course_statistics TO authenticated;
GRANT SELECT ON public.user_learning_overview TO authenticated;
GRANT SELECT ON public.instructor_course_overview TO authenticated;