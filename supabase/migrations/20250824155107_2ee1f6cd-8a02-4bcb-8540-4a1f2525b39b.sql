-- Phase 4: Realtime enablement for key tables
-- Ensure complete row data on updates/deletes
ALTER TABLE public.lesson_progress REPLICA IDENTITY FULL;
ALTER TABLE public.module_progress REPLICA IDENTITY FULL;
ALTER TABLE public.course_enrollments REPLICA IDENTITY FULL;
ALTER TABLE public.content_posts REPLICA IDENTITY FULL;

-- Add to supabase_realtime publication if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lesson_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_progress;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'module_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.module_progress;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'course_enrollments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.course_enrollments;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'content_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content_posts;
  END IF;
END $$;