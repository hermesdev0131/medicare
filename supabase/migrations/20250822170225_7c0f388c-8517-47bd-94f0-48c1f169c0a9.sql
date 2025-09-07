-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.get_user_learning_pattern(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  pattern JSONB;
BEGIN
  SELECT jsonb_build_object(
    'avg_lesson_duration', COALESCE(AVG(time_spent_minutes), 0),
    'completion_rate', COALESCE(
      (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0)) * 100, 
      0
    ),
    'preferred_lesson_types', (
      SELECT jsonb_agg(DISTINCT lesson_type)
      FROM course_lessons cl
      JOIN lesson_progress lp ON cl.id = lp.lesson_id
      WHERE lp.user_id = user_uuid AND lp.completed = true
    ),
    'avg_attempts_per_assessment', COALESCE(
      (SELECT AVG(attempt_count) FROM assessment_attempts WHERE user_id = user_uuid), 
      0
    ),
    'peak_learning_hours', (
      SELECT jsonb_agg(DISTINCT EXTRACT(HOUR FROM completed_at))
      FROM lesson_progress 
      WHERE user_id = user_uuid AND completed = true
    )
  ) INTO pattern;
  
  RETURN pattern;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';