-- Enhanced Course Management System - Phase 1 Database Schema

-- Course Lessons table for detailed lesson content within modules
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'text', -- 'video', 'text', 'quiz', 'assignment', 'interactive'
  content_text TEXT,
  content_url TEXT,
  video_url TEXT,
  estimated_duration_minutes INTEGER DEFAULT 30,
  lesson_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning Paths table for structured learning journeys
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  category TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_total_hours INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link courses to learning paths with ordering
CREATE TABLE public.path_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL,
  course_id UUID NOT NULL,
  course_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User enrollment in learning paths
CREATE TABLE public.path_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  path_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, path_id)
);

-- Detailed lesson progress tracking
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  module_id UUID NOT NULL,
  course_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Assessments/Quiz definitions
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID,
  module_id UUID,
  lesson_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'quiz', -- 'quiz', 'assignment', 'survey'
  passing_score NUMERIC DEFAULT 70.00,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assessment questions bank
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'short_answer', 'essay'
  options JSONB, -- For multiple choice options
  correct_answers JSONB, -- Store correct answer(s)
  points NUMERIC DEFAULT 1.00,
  question_order INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User assessment attempts and scores
CREATE TABLE public.user_assessment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  passed BOOLEAN DEFAULT false,
  answers JSONB, -- Store user's answers
  time_taken_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated completion certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID,
  path_id UUID,
  certificate_type TEXT NOT NULL DEFAULT 'course_completion', -- 'course_completion', 'path_completion'
  title TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT, -- URL to generated PDF
  verification_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User learning goals
CREATE TABLE public.learning_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused'
  associated_courses UUID[],
  associated_paths UUID[],
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_lessons
CREATE POLICY "Users can view lessons of enrolled courses" 
ON public.course_lessons FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments ce 
    JOIN course_modules cm ON cm.course_id = ce.course_id 
    WHERE cm.id = course_lessons.module_id AND ce.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM courses c 
    JOIN course_modules cm ON c.id = cm.course_id 
    WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors can manage their course lessons" 
ON public.course_lessons FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    JOIN course_modules cm ON c.id = cm.course_id 
    WHERE cm.id = course_lessons.module_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'instructional_designer'::app_role)
);

-- RLS Policies for learning_paths
CREATE POLICY "Anyone can view published learning paths" 
ON public.learning_paths FOR SELECT 
USING (is_published = true OR creator_id = auth.uid());

CREATE POLICY "Instructional designers can manage learning paths" 
ON public.learning_paths FOR ALL 
USING (
  creator_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'instructional_designer'::app_role)
);

-- RLS Policies for path_courses
CREATE POLICY "Users can view path courses for enrolled/published paths" 
ON public.path_courses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM learning_paths lp 
    WHERE lp.id = path_courses.path_id AND (lp.is_published = true OR lp.creator_id = auth.uid())
  )
);

CREATE POLICY "Path creators can manage path courses" 
ON public.path_courses FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM learning_paths lp 
    WHERE lp.id = path_courses.path_id AND lp.creator_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for path_enrollments
CREATE POLICY "Users can view their own path enrollments" 
ON public.path_enrollments FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in published paths" 
ON public.path_enrollments FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM learning_paths WHERE id = path_id AND is_published = true)
);

CREATE POLICY "Users can update their own path enrollments" 
ON public.path_enrollments FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for lesson_progress
CREATE POLICY "Users can view their own lesson progress" 
ON public.lesson_progress FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own lesson progress" 
ON public.lesson_progress FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Instructors can view lesson progress for their courses" 
ON public.lesson_progress FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = lesson_progress.course_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for assessments
CREATE POLICY "Users can view assessments for enrolled courses" 
ON public.assessments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM course_enrollments ce 
    WHERE ce.course_id = assessments.course_id AND ce.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = assessments.course_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors can manage assessments for their courses" 
ON public.assessments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = assessments.course_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'instructional_designer'::app_role)
);

-- RLS Policies for assessment_questions
CREATE POLICY "Users can view questions for accessible assessments" 
ON public.assessment_questions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM assessments a 
    JOIN course_enrollments ce ON a.course_id = ce.course_id 
    WHERE a.id = assessment_questions.assessment_id AND ce.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM assessments a 
    JOIN courses c ON a.course_id = c.id 
    WHERE a.id = assessment_questions.assessment_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors can manage questions for their assessments" 
ON public.assessment_questions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM assessments a 
    JOIN courses c ON a.course_id = c.id 
    WHERE a.id = assessment_questions.assessment_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'instructional_designer'::app_role)
);

-- RLS Policies for user_assessment_attempts
CREATE POLICY "Users can view their own assessment attempts" 
ON public.user_assessment_attempts FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own assessment attempts" 
ON public.user_assessment_attempts FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own assessment attempts" 
ON public.user_assessment_attempts FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Instructors can view attempts for their course assessments" 
ON public.user_assessment_attempts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM assessments a 
    JOIN courses c ON a.course_id = c.id 
    WHERE a.id = user_assessment_attempts.assessment_id AND c.instructor_id = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates" 
ON public.certificates FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can issue certificates" 
ON public.certificates FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all certificates" 
ON public.certificates FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for learning_goals
CREATE POLICY "Users can manage their own learning goals" 
ON public.learning_goals FOR ALL 
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX idx_course_lessons_lesson_order ON public.course_lessons(module_id, lesson_order);
CREATE INDEX idx_path_courses_path_id ON public.path_courses(path_id);
CREATE INDEX idx_path_courses_course_order ON public.path_courses(path_id, course_order);
CREATE INDEX idx_path_enrollments_user_id ON public.path_enrollments(user_id);
CREATE INDEX idx_lesson_progress_user_course ON public.lesson_progress(user_id, course_id);
CREATE INDEX idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id);
CREATE INDEX idx_user_assessment_attempts_user_assessment ON public.user_assessment_attempts(user_id, assessment_id);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_goals_updated_at
  BEFORE UPDATE ON public.learning_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();