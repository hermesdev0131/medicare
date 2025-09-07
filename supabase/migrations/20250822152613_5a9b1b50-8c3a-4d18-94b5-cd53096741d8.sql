-- Add AI-powered features tables
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'course', 'lesson', 'assessment', 'explanation'
  prompt TEXT NOT NULL,
  generated_content JSONB NOT NULL,
  model_used TEXT DEFAULT 'gpt-4',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'next_lesson', 'review_topic', 'skill_gap', 'learning_path'
  content JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days')
);

CREATE TABLE IF NOT EXISTS public.ai_tutoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ai_response JSONB NOT NULL,
  response_rating INTEGER CHECK (response_rating >= 1 AND response_rating <= 5),
  follow_up_questions TEXT[],
  session_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prediction_type TEXT NOT NULL, -- 'completion_likelihood', 'performance_forecast', 'difficulty_prediction', 'time_estimate'
  target_id UUID, -- course_id, lesson_id, or assessment_id
  target_type TEXT NOT NULL, -- 'course', 'lesson', 'assessment'
  prediction_data JSONB NOT NULL,
  accuracy_score DECIMAL(3,2),
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own AI content" 
ON public.ai_generated_content 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendations" 
ON public.learning_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.learning_recommendations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tutoring sessions" 
ON public.ai_tutoring_sessions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own predictions" 
ON public.learning_predictions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_content_user_type ON public.ai_generated_content(user_id, content_type);
CREATE INDEX idx_recommendations_user_course ON public.learning_recommendations(user_id, course_id, expires_at);
CREATE INDEX idx_tutoring_user_lesson ON public.ai_tutoring_sessions(user_id, lesson_id);
CREATE INDEX idx_predictions_user_target ON public.learning_predictions(user_id, target_type, expires_at);

-- Create updated_at trigger for ai_generated_content
CREATE TRIGGER update_ai_generated_content_updated_at
BEFORE UPDATE ON public.ai_generated_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for AI features
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
$$ LANGUAGE plpgsql SECURITY DEFINER;