-- Trigger to auto-create a notification when an admin sends a chat message
-- Run this in Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.handle_admin_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_type = 'admin' THEN
    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    VALUES (
      NEW.user_id,
      'New Concierge Message',
      NEW.content,
      'chat',
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_admin_message_inserted ON public.messages;
CREATE TRIGGER on_admin_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_message_notification();
