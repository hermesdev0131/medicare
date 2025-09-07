-- Phase 2: Performance Optimization
-- Add essential indexes for frequently queried columns

-- Course-related indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);

-- Enrollment and progress indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course ON public.course_enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_module ON public.module_progress(user_id, module_id);

-- User roles and subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);

-- Course structure indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course_order ON public.course_modules(course_id, module_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_order ON public.course_lessons(module_id, lesson_order);

-- Analytics and activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created ON public.user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_timestamp ON public.learning_analytics(user_id, timestamp DESC);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON public.assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_order ON public.assessment_questions(assessment_id, question_order);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_course_enrollments_progress ON public.course_enrollments(user_id, progress_percentage) WHERE progress_percentage < 100;