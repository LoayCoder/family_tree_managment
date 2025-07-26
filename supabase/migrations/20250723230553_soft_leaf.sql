/*
  # Enhanced Family Platform Tables

  1. New Tables
    - `news_posts` - News articles, announcements, and stories
    - `events` - Family events, occasions, and celebrations  
    - `comments` - User comments on news posts and events
    - `media_files` - Photos, videos, and documents metadata
    - `notables` - Tribal notables and dignitaries profiles

  2. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for different user roles
    - Implement proper access controls based on user_level

  3. Features
    - Automatic timestamp management
    - Foreign key relationships with existing tables
    - Check constraints for data integrity
    - Support for threaded comments
    - Media file approval workflow
    - Event RSVP system
*/

-- Table: news_posts (أخبار ومقالات)
CREATE TABLE IF NOT EXISTS public.news_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT TRUE,
    tags TEXT[], -- Array of text for categorization
    featured_image_url TEXT, -- URL to a featured image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments and indexes for news_posts
COMMENT ON TABLE public.news_posts IS 'Table for news articles, announcements, and stories';
COMMENT ON COLUMN public.news_posts.status IS 'Status of the news post (draft, published, archived)';
COMMENT ON COLUMN public.news_posts.is_public IS 'Indicates if the news post is publicly visible';
COMMENT ON COLUMN public.news_posts.tags IS 'Keywords or categories for the news post';

CREATE INDEX IF NOT EXISTS idx_news_posts_author ON public.news_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON public.news_posts(status);
CREATE INDEX IF NOT EXISTS idx_news_posts_published ON public.news_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_tags ON public.news_posts USING gin(tags);

-- Table: events (الأحداث والمناسبات)
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME WITHOUT TIME ZONE,
    location_id INTEGER REFERENCES public."المواقع"("معرف_الموقع") ON DELETE SET NULL,
    location_text TEXT, -- For custom locations not in المواقع table
    organizer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    rsvp_required BOOLEAN DEFAULT FALSE,
    max_attendees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments and indexes for events
COMMENT ON TABLE public.events IS 'Table for family events, occasions, and celebrations';
COMMENT ON COLUMN public.events.location_text IS 'Text description for event location if not linked to المواقع table';
COMMENT ON COLUMN public.events.is_public IS 'Indicates if the event is publicly visible';
COMMENT ON COLUMN public.events.rsvp_required IS 'Indicates if RSVP is required for the event';

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_public ON public.events(is_public);

-- Table: comments (التعليقات)
CREATE TABLE IF NOT EXISTS public.comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES public.news_posts(id) ON DELETE CASCADE, -- Link to news_posts
    event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE, -- Link to events
    parent_comment_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE, -- For threaded replies
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    guest_name TEXT, -- For non-logged-in users
    comment_text TEXT NOT NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_comment_target CHECK (
        (post_id IS NOT NULL AND event_id IS NULL) OR
        (post_id IS NULL AND event_id IS NOT NULL)
    )
);

-- Add comments and indexes for comments
COMMENT ON TABLE public.comments IS 'Table for user comments on news posts and events';
COMMENT ON COLUMN public.comments.approval_status IS 'Approval status of the comment (pending, approved, rejected)';
COMMENT ON CONSTRAINT chk_comment_target ON public.comments IS 'Ensures a comment is linked to either a news post or an event, but not both';

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_event ON public.comments(event_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_approval ON public.comments(approval_status);

-- Table: media_files (الملفات الإعلامية)
CREATE TABLE IF NOT EXISTS public.media_files (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- URL to the file in Supabase Storage
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
    mime_type TEXT,
    file_size BIGINT,
    description TEXT,
    uploaded_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    event_id INTEGER REFERENCES public.events(id) ON DELETE SET NULL,
    person_id BIGINT REFERENCES public."الأشخاص"(id) ON DELETE SET NULL,
    woman_id INTEGER REFERENCES public."النساء"(id) ON DELETE SET NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments and indexes for media_files
COMMENT ON TABLE public.media_files IS 'Table for storing metadata about uploaded media files (photos, videos, documents)';
COMMENT ON COLUMN public.media_files.file_url IS 'Public URL of the media file in Supabase Storage';
COMMENT ON COLUMN public.media_files.file_type IS 'Type of media file (image, video, document)';
COMMENT ON COLUMN public.media_files.is_public IS 'Indicates if the media file is publicly accessible';
COMMENT ON COLUMN public.media_files.approval_status IS 'Approval status of the media file (pending, approved, rejected)';

CREATE INDEX IF NOT EXISTS idx_media_files_type ON public.media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_uploader ON public.media_files(uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_event ON public.media_files(event_id);
CREATE INDEX IF NOT EXISTS idx_media_files_person ON public.media_files(person_id);
CREATE INDEX IF NOT EXISTS idx_media_files_woman ON public.media_files(woman_id);
CREATE INDEX IF NOT EXISTS idx_media_files_approval ON public.media_files(approval_status);
CREATE INDEX IF NOT EXISTS idx_media_files_tags ON public.media_files USING gin(tags);

-- Table: notables (الشخصيات البارزة)
CREATE TABLE IF NOT EXISTS public.notables (
    id SERIAL PRIMARY KEY,
    person_id BIGINT REFERENCES public."الأشخاص"(id) ON DELETE SET NULL, -- Link to male person in family tree
    woman_id INTEGER REFERENCES public."النساء"(id) ON DELETE SET NULL, -- Link to female person in family tree
    full_name TEXT, -- Can be used if not linked to existing person/woman
    category TEXT NOT NULL CHECK (category IN (
        'Current Tribal Leaders', 'Judges and Legal Experts', 'Business Leaders',
        'Scholars and Academics', 'Poets and Artists', 'Historical Figures'
    )),
    biography TEXT,
    education TEXT,
    positions TEXT,
    publications TEXT,
    contact_info TEXT,
    legacy TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_notable_person_or_name CHECK (
        (person_id IS NOT NULL AND woman_id IS NULL) OR
        (person_id IS NULL AND woman_id IS NOT NULL) OR
        (full_name IS NOT NULL)
    )
);

-- Add comments and indexes for notables
COMMENT ON TABLE public.notables IS 'Table for showcasing tribal notables and dignitaries';
COMMENT ON COLUMN public.notables.category IS 'Category of the notable figure (e.g., leader, scholar, artist)';
COMMENT ON CONSTRAINT chk_notable_person_or_name ON public.notables IS 'Ensures a notable is linked to a person/woman or has a full name';

CREATE INDEX IF NOT EXISTS idx_notables_person ON public.notables(person_id);
CREATE INDEX IF NOT EXISTS idx_notables_woman ON public.notables(woman_id);
CREATE INDEX IF NOT EXISTS idx_notables_category ON public.notables(category);

-- Enable RLS on all new tables
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notables ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user level (if not exists)
CREATE OR REPLACE FUNCTION public.get_user_level(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT user_level 
    FROM public.user_profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for news_posts
CREATE POLICY "Allow all users to read published news posts"
ON public.news_posts
FOR SELECT
USING (
  status = 'published' AND is_public = true 
  OR get_user_level(auth.uid()) IN ('admin', 'editor')
);

CREATE POLICY "Allow admins and editors to create news posts"
ON public.news_posts
FOR INSERT
WITH CHECK (get_user_level(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Allow admins and editors to update news posts"
ON public.news_posts
FOR UPDATE
USING (get_user_level(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Allow admins to delete news posts"
ON public.news_posts
FOR DELETE
USING (get_user_level(auth.uid()) = 'admin');

-- RLS Policies for events
CREATE POLICY "Allow all users to read public events"
ON public.events
FOR SELECT
USING (
  is_public = true 
  OR get_user_level(auth.uid()) IN ('admin', 'editor')
);

CREATE POLICY "Allow admins and editors to create events"
ON public.events
FOR INSERT
WITH CHECK (get_user_level(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Allow admins and editors to update events"
ON public.events
FOR UPDATE
USING (get_user_level(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Allow admins to delete events"
ON public.events
FOR DELETE
USING (get_user_level(auth.uid()) = 'admin');

-- RLS Policies for comments
CREATE POLICY "Allow public to read approved comments, admins to read all"
ON public.comments
FOR SELECT
USING (
  approval_status = 'approved' 
  OR get_user_level(auth.uid()) = 'admin'
);

CREATE POLICY "Allow authenticated users to create comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admins to update any comment, users to update their own"
ON public.comments
FOR UPDATE
USING (
  get_user_level(auth.uid()) = 'admin' 
  OR user_id = auth.uid()
);

CREATE POLICY "Allow admins to delete any comment, users to delete their own"
ON public.comments
FOR DELETE
USING (
  get_user_level(auth.uid()) = 'admin' 
  OR user_id = auth.uid()
);

-- RLS Policies for media_files
CREATE POLICY "Allow public to read approved public media, authenticated to read family media"
ON public.media_files
FOR SELECT
USING (
  (is_public = true AND approval_status = 'approved')
  OR get_user_level(auth.uid()) IN ('admin', 'editor')
);

CREATE POLICY "Allow authenticated users to upload media files"
ON public.media_files
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admins to update any media file, users to update their own"
ON public.media_files
FOR UPDATE
USING (
  get_user_level(auth.uid()) = 'admin' 
  OR uploaded_by_user_id = auth.uid()
);

CREATE POLICY "Allow admins to delete any media file, users to delete their own"
ON public.media_files
FOR DELETE
USING (
  get_user_level(auth.uid()) = 'admin' 
  OR uploaded_by_user_id = auth.uid()
);

-- RLS Policies for notables
CREATE POLICY "Allow all users to read notable profiles"
ON public.notables
FOR SELECT
USING (true);

CREATE POLICY "Allow admins and editors to create notable profiles"
ON public.notables
FOR INSERT
WITH CHECK (get_user_level(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Allow admins and editors to update notable profiles"
ON public.notables
FOR UPDATE
USING (get_user_level(auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Allow admins to delete notable profiles"
ON public.notables
FOR DELETE
USING (get_user_level(auth.uid()) = 'admin');

-- Create triggers for automatic updated_at column updates
CREATE TRIGGER update_news_posts_updated_at
BEFORE UPDATE ON public.news_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_files_updated_at
BEFORE UPDATE ON public.media_files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notables_updated_at
BEFORE UPDATE ON public.notables
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();