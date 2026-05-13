-- Add completed_at column to track actual completion dates
ALTER TABLE public.tasks ADD COLUMN completed_at TIMESTAMPTZ;

-- Update existing completed tasks to have a completion date (set to updated_at as estimate)
UPDATE public.tasks 
SET completed_at = updated_at 
WHERE status = 'done' AND completed_at IS NULL;

-- Create a trigger to automatically set completed_at when status changes to 'done'
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();
