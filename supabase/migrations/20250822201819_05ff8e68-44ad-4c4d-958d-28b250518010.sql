-- Harden function with explicit search_path and security definer
CREATE OR REPLACE FUNCTION public.calculate_medicare_compliance_score(
  ahip_completed BOOLEAN,
  training_hours NUMERIC,
  required_hours NUMERIC,
  cms_training BOOLEAN,
  fraud_training BOOLEAN,
  privacy_training BOOLEAN,
  state_training BOOLEAN
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  score NUMERIC := 0;
BEGIN
  IF ahip_completed THEN
    score := score + 30;
  END IF;

  IF training_hours >= required_hours THEN
    score := score + 30;
  ELSE
    score := score + (training_hours / required_hours * 30);
  END IF;

  IF cms_training THEN score := score + 10; END IF;
  IF fraud_training THEN score := score + 10; END IF;
  IF privacy_training THEN score := score + 10; END IF;
  IF state_training THEN score := score + 10; END IF;

  RETURN ROUND(score, 2);
END;
$$;