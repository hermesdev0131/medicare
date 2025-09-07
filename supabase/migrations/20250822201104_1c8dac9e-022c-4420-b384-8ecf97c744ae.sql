-- Create certifications table for Medicare agent licenses and certifications
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,  
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE,
  expiration_date DATE,
  credential_id TEXT,
  verification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own certifications" 
ON public.certifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certifications" 
ON public.certifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications" 
ON public.certifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications" 
ON public.certifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_certifications_updated_at
BEFORE UPDATE ON public.certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create Medicare compliance tracking table
CREATE TABLE public.medicare_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  compliance_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  ahip_certification_completed BOOLEAN DEFAULT false,
  ahip_completion_date DATE,
  annual_training_hours NUMERIC DEFAULT 0,
  required_training_hours NUMERIC DEFAULT 15,
  cms_marketing_training BOOLEAN DEFAULT false,
  fraud_waste_abuse_training BOOLEAN DEFAULT false,
  privacy_security_training BOOLEAN DEFAULT false,
  state_specific_training BOOLEAN DEFAULT false,
  compliance_score NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicare_compliance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own compliance data" 
ON public.medicare_compliance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compliance data" 
ON public.medicare_compliance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance data" 
ON public.medicare_compliance 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to calculate compliance score
CREATE OR REPLACE FUNCTION calculate_medicare_compliance_score(
  ahip_completed BOOLEAN,
  training_hours NUMERIC,
  required_hours NUMERIC,
  cms_training BOOLEAN,
  fraud_training BOOLEAN,
  privacy_training BOOLEAN,
  state_training BOOLEAN
) RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
BEGIN
  -- AHIP certification (30 points)
  IF ahip_completed THEN
    score := score + 30;
  END IF;
  
  -- Training hours (30 points max)
  IF training_hours >= required_hours THEN
    score := score + 30;
  ELSE
    score := score + (training_hours / required_hours * 30);
  END IF;
  
  -- Required trainings (10 points each)
  IF cms_training THEN score := score + 10; END IF;
  IF fraud_training THEN score := score + 10; END IF;
  IF privacy_training THEN score := score + 10; END IF;
  IF state_training THEN score := score + 10; END IF;
  
  RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;