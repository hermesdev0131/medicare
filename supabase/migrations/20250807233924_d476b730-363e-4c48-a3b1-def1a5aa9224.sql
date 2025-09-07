-- Phase 2: Progress trigger and certificate issuance (idempotent)

-- 1) Ensure functions exist or are updated
CREATE OR REPLACE FUNCTION public.update_course_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_progress INTEGER;
BEGIN
  -- Calculate new progress
  new_progress := public.calculate_course_progress(NEW.user_id, NEW.course_id);
  
  -- Update enrollment progress
  UPDATE public.course_enrollments
  SET 
    progress_percentage = new_progress,
    completed_at = CASE WHEN new_progress = 100 THEN now() ELSE NULL END,
    last_accessed_at = now()
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_certificate_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Avoid reprocessing rows already marked
  IF TG_OP = 'UPDATE' AND NEW.certificate_issued IS TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.progress_percentage = 100 
     AND NEW.completed_at IS NOT NULL 
     AND COALESCE(NEW.certificate_issued, false) = false THEN

    -- Insert certificate for course completion
    INSERT INTO public.certificates (
      user_id, course_id, path_id, title, certificate_type, issued_at, verification_code
    ) VALUES (
      NEW.user_id, NEW.course_id, NULL, 'Course Completion', 'course_completion', now(), replace(gen_random_uuid()::text,'-','')
    );

    -- Mark as issued to prevent duplicates
    UPDATE public.course_enrollments
    SET certificate_issued = true
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_path_certificate_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.progress_percentage = 100 
     AND NEW.completed_at IS NOT NULL THEN

    -- Insert certificate for path completion
    INSERT INTO public.certificates (
      user_id, course_id, path_id, title, certificate_type, issued_at, verification_code
    ) VALUES (
      NEW.user_id, NULL, NEW.path_id, 'Learning Path Completion', 'path_completion', now(), replace(gen_random_uuid()::text,'-','')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Triggers (drop if exist to be idempotent)
DROP TRIGGER IF EXISTS trg_update_course_progress ON public.module_progress;
CREATE TRIGGER trg_update_course_progress
AFTER INSERT OR UPDATE OF completed
ON public.module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_course_progress();

DROP TRIGGER IF EXISTS trg_issue_certificate_on_course ON public.course_enrollments;
CREATE TRIGGER trg_issue_certificate_on_course
AFTER UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.issue_certificate_on_completion();

DROP TRIGGER IF EXISTS trg_issue_certificate_on_path ON public.path_enrollments;
CREATE TRIGGER trg_issue_certificate_on_path
AFTER UPDATE ON public.path_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.issue_path_certificate_on_completion();