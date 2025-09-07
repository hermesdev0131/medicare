-- Phase 1: Enhanced Database Schema for LMS Content Creation Platform

-- Add subscription tier requirements to courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS required_subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS allow_free_preview boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS preview_content_percentage integer DEFAULT 20;

-- Add subscription tier requirements to course modules
ALTER TABLE public.course_modules 
ADD COLUMN IF NOT EXISTS required_subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_preview_accessible boolean DEFAULT true;

-- Add subscription tier requirements to course lessons
ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS required_subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_preview_accessible boolean DEFAULT true;

-- Create course media files table for course-specific media management
CREATE TABLE IF NOT EXISTS public.course_media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  folder_path text DEFAULT '',
  tags text[] DEFAULT '{}',
  description text,
  is_public boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create content blocks table for flexible lesson content
CREATE TABLE IF NOT EXISTS public.lesson_content_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  block_type text NOT NULL, -- 'text', 'image', 'video', 'audio', 'document', 'interactive', 'quiz', 'page_break'
  block_order integer NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create interactive activities table
CREATE TABLE IF NOT EXISTS public.interactive_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'flip_card', 'matching_game', 'accordion', 'knowledge_check'
  title text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  points_value integer DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create enhanced quiz/survey table
CREATE TABLE IF NOT EXISTS public.course_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  survey_type text NOT NULL DEFAULT 'quiz', -- 'quiz', 'survey', 'knowledge_check'
  settings jsonb DEFAULT '{}',
  is_required boolean DEFAULT false,
  points_value integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create survey questions table
CREATE TABLE IF NOT EXISTS public.survey_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id uuid NOT NULL REFERENCES public.course_surveys(id) ON DELETE CASCADE,
  question_type text NOT NULL, -- 'multiple_choice', 'single_choice', 'text', 'rating', 'yes_no'
  question_text text NOT NULL,
  question_order integer NOT NULL,
  options jsonb DEFAULT '[]',
  correct_answers jsonb DEFAULT '[]',
  points integer DEFAULT 1,
  is_required boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user survey responses table
CREATE TABLE IF NOT EXISTS public.user_survey_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.course_surveys(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  response jsonb NOT NULL,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_media_files_course_id ON public.course_media_files(course_id);
CREATE INDEX IF NOT EXISTS idx_course_media_files_creator_id ON public.course_media_files(creator_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_blocks_lesson_id ON public.lesson_content_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_blocks_order ON public.lesson_content_blocks(lesson_id, block_order);
CREATE INDEX IF NOT EXISTS idx_interactive_activities_lesson_id ON public.interactive_activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_surveys_course_id ON public.course_surveys(course_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_user_survey_responses_user_survey ON public.user_survey_responses(user_id, survey_id);

-- Enable RLS on new tables
ALTER TABLE public.course_media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_media_files
CREATE POLICY "Creators can manage their course media"
ON public.course_media_files
FOR ALL
TO authenticated
USING (
  creator_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Users can view public course media"
ON public.course_media_files
FOR SELECT
TO authenticated
USING (
  is_public = true OR
  creator_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce 
    WHERE ce.course_id = course_media_files.course_id AND ce.user_id = auth.uid()
  )
);

-- RLS Policies for lesson_content_blocks
CREATE POLICY "Course creators can manage lesson content blocks"
ON public.lesson_content_blocks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.courses c ON cm.course_id = c.id
    WHERE cl.id = lesson_id AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Enrolled users can view lesson content blocks"
ON public.lesson_content_blocks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.course_enrollments ce ON cm.course_id = ce.course_id
    WHERE cl.id = lesson_id AND ce.user_id = auth.uid()
  )
);

-- RLS Policies for interactive_activities
CREATE POLICY "Course creators can manage interactive activities"
ON public.interactive_activities
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.courses c ON cm.course_id = c.id
    WHERE cl.id = lesson_id AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Enrolled users can view interactive activities"
ON public.interactive_activities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.course_enrollments ce ON cm.course_id = ce.course_id
    WHERE cl.id = lesson_id AND ce.user_id = auth.uid()
  )
);

-- RLS Policies for course_surveys
CREATE POLICY "Course creators can manage surveys"
ON public.course_surveys
FOR ALL
TO authenticated
USING (
  creator_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.courses c 
    WHERE c.id = course_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Enrolled users can view surveys"
ON public.course_surveys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce 
    WHERE ce.course_id = course_surveys.course_id AND ce.user_id = auth.uid()
  )
);

-- RLS Policies for survey_questions
CREATE POLICY "Survey creators can manage questions"
ON public.survey_questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_surveys cs 
    WHERE cs.id = survey_id AND (cs.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can view questions for accessible surveys"
ON public.survey_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_surveys cs
    JOIN public.course_enrollments ce ON cs.course_id = ce.course_id
    WHERE cs.id = survey_id AND ce.user_id = auth.uid()
  )
);

-- RLS Policies for user_survey_responses
CREATE POLICY "Users can manage their own survey responses"
ON public.user_survey_responses
FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Course creators can view survey responses"
ON public.user_survey_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_surveys cs 
    WHERE cs.id = survey_id AND (cs.creator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_course_media_files_updated_at
  BEFORE UPDATE ON public.course_media_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_content_blocks_updated_at
  BEFORE UPDATE ON public.lesson_content_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interactive_activities_updated_at
  BEFORE UPDATE ON public.interactive_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_surveys_updated_at
  BEFORE UPDATE ON public.course_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();