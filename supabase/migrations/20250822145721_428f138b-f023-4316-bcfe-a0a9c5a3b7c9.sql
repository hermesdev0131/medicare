-- Enhanced E-Learning Platform Schema Updates
-- Adding support for interactive content, gamification, and enhanced assessments

-- 1. Add new content types and interactive elements to lessons
ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS interactive_content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accessibility_features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_metadata JSONB DEFAULT '{}';

-- 2. Create gamification tables
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create user points/progress tracking
CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level_name TEXT DEFAULT 'Beginner',
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. Enhanced assessment questions with multimedia support
ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS interaction_type TEXT DEFAULT 'standard';

-- 5. Create certificates tracking with enhanced metadata
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS badge_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skill_level TEXT,
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- 6. Create learning analytics table
CREATE TABLE IF NOT EXISTS public.learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Enable RLS on new tables
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for gamification tables
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own points" ON public.user_points
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own analytics" ON public.learning_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create analytics" ON public.learning_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9. Create function to update user points and achievements
CREATE OR REPLACE FUNCTION public.award_points_and_achievements(
  p_user_id UUID,
  p_points INTEGER,
  p_achievement_type TEXT,
  p_achievement_data JSONB DEFAULT '{}',
  p_course_id UUID DEFAULT NULL,
  p_lesson_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user points
  INSERT INTO public.user_points (user_id, total_points, last_activity_date, updated_at)
  VALUES (p_user_id, p_points, CURRENT_DATE, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + p_points,
    last_activity_date = CURRENT_DATE,
    updated_at = now(),
    streak_days = CASE 
      WHEN user_points.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_points.streak_days + 1
      WHEN user_points.last_activity_date = CURRENT_DATE 
      THEN user_points.streak_days
      ELSE 1
    END;

  -- Award achievement
  INSERT INTO public.user_achievements (
    user_id, achievement_type, achievement_data, points_earned, course_id, lesson_id
  ) VALUES (
    p_user_id, p_achievement_type, p_achievement_data, p_points, p_course_id, p_lesson_id
  );
END;
$$;

-- 10. Create trigger to automatically award points for lesson completion
CREATE OR REPLACE FUNCTION public.auto_award_lesson_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award points for lesson completion
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM public.award_points_and_achievements(
      NEW.user_id,
      10, -- Base points for lesson completion
      'lesson_completed',
      jsonb_build_object('lesson_id', NEW.lesson_id, 'time_spent', NEW.time_spent_minutes),
      NEW.course_id,
      NEW.lesson_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lesson completion points
DROP TRIGGER IF EXISTS lesson_completion_points ON public.lesson_progress;
CREATE TRIGGER lesson_completion_points
  AFTER UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.auto_award_lesson_completion();

-- 11. Update timestamps trigger for user_points
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();