ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS completed_weeks JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS base_score INTEGER;

CREATE POLICY "Users can update own analyses"
ON public.analyses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);