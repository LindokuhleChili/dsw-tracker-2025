-- Add assigned_to column to tasks table
ALTER TABLE public.tasks ADD COLUMN assigned_to TEXT;

-- Update existing tasks to assign them to stream owners
UPDATE public.tasks t
SET assigned_to = s.owner
FROM public.streams s
WHERE t.stream_id = s.id;
