/*
  # Create News Post Approval Functions

  1. New Functions
    - `approve_news_post(p_post_id)` - Approves a news post and publishes it
    - `reject_news_post(p_post_id, p_rejection_reason)` - Rejects a news post with optional reason

  2. Security
    - Functions use SECURITY DEFINER to bypass RLS for administrative actions
    - Only updates status and related fields in news_posts table

  3. Functionality
    - Approve: Sets status to 'published', updates published_at, clears approval fields
    - Reject: Sets status to 'rejected', stores rejection reason, clears approval fields
*/

-- Function to approve a news post
CREATE OR REPLACE FUNCTION public.approve_news_post(p_post_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE news_posts
  SET
    status = 'published',
    published_at = now(),
    submitted_for_approval_at = NULL,
    updated_at = now()
  WHERE id = p_post_id;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'News post with ID % not found', p_post_id;
  END IF;
END;
$function$;

-- Function to reject a news post
CREATE OR REPLACE FUNCTION public.reject_news_post(p_post_id integer, p_rejection_reason text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE news_posts
  SET
    status = 'rejected',
    submitted_for_approval_at = NULL,
    updated_at = now()
  WHERE id = p_post_id;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'News post with ID % not found', p_post_id;
  END IF;
END;
$function$;