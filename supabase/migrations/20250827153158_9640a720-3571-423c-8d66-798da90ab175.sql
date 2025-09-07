-- Phase 1b: Strengthen creator ownership and add storage for course media

-- Add creator_id to lesson_content_blocks for ownership tracking
ALTER TABLE public.lesson_content_blocks 
ADD COLUMN IF NOT EXISTS creator_id uuid NOT NULL;

-- Drop previous broad policies to replace with granular ones
DROP POLICY IF EXISTS "Course creators can manage lesson content blocks" ON public.lesson_content_blocks;
DROP POLICY IF EXISTS "Enrolled users can view lesson content blocks" ON public.lesson_content_blocks;

-- INSERT: Only creators (their own user) with proper role or instructors/admins can create blocks
CREATE POLICY "Creators/instructors can insert lesson blocks" 
ON public.lesson_content_blocks
FOR INSERT
TO authenticated
WITH CHECK (
  creator_id = auth.uid() AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'instructional_designer'::app_role) OR 
    EXISTS (
      SELECT 1 FROM public.course_lessons cl
      JOIN public.course_modules cm ON cl.module_id = cm.id
      JOIN public.courses c ON cm.course_id = c.id
      WHERE cl.id = lesson_id AND c.instructor_id = auth.uid()
    )
  )
);

-- UPDATE: Only the creator can edit, unless instructor/admin
CREATE POLICY "Only creator or instructor/admin can update blocks" 
ON public.lesson_content_blocks
FOR UPDATE
TO authenticated
USING (
  creator_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.courses c ON cm.course_id = c.id
    WHERE cl.id = lesson_id AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- DELETE: Only the creator or instructor/admin
CREATE POLICY "Only creator or instructor/admin can delete blocks" 
ON public.lesson_content_blocks
FOR DELETE
TO authenticated
USING (
  creator_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.courses c ON cm.course_id = c.id
    WHERE cl.id = lesson_id AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- SELECT: Enrolled learners, creator, instructor, or admin can view blocks
CREATE POLICY "Learners and creators can view blocks" 
ON public.lesson_content_blocks
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.course_enrollments ce ON cm.course_id = ce.course_id
    WHERE cl.id = lesson_id AND ce.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cl.module_id = cm.id
    JOIN public.courses c ON cm.course_id = c.id
    WHERE cl.id = lesson_id AND (c.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Storage: Create private bucket for course media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-media', 'course-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-media bucket
-- Allow creators to upload to paths like: {course_id}/{user_id}/...
CREATE POLICY "Creators can upload course media" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-media' 
  AND (auth.uid()::text = (storage.foldername(name))[2])
);

-- Allow read access to enrolled learners, creator, instructor, or admin
CREATE POLICY "Course media readable to enrolled and staff" 
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-media' AND (
    -- Creator of the file can read
    (auth.uid()::text = (storage.foldername(name))[2])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = ((storage.foldername(name))[1])::uuid AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = ((storage.foldername(name))[1])::uuid AND ce.user_id = auth.uid()
    )
  )
);

-- Allow creators to update/delete their own uploads; instructors/admins too
CREATE POLICY "Creators and staff can modify course media" 
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-media' AND (
    (auth.uid()::text = (storage.foldername(name))[2])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = ((storage.foldername(name))[1])::uuid AND c.instructor_id = auth.uid()
    )
  )
);

CREATE POLICY "Creators and staff can delete course media" 
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'course-media' AND (
    (auth.uid()::text = (storage.foldername(name))[2])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = ((storage.foldername(name))[1])::uuid AND c.instructor_id = auth.uid()
    )
  )
);
