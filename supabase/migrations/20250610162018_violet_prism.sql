/*
  # Create family_members table

  1. New Tables
    - `family_members`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `parent_id` (uuid, foreign key to self)
      - `birth_date` (date)
      - `gender` (text with check constraint)
      - `phone` (text)
      - `notes` (text)
      - `is_alive` (boolean, default true)
      - `date_of_death` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `family_members` table
    - Add policies for full public access (CRUD operations)

  3. Functions
    - Drop existing `get_family_tree()` function if it exists
    - Create new `get_family_tree()` function for recursive family tree queries
    - Update trigger function for `updated_at` column

  4. Indexes
    - Add performance indexes for common queries
*/

-- Drop the existing get_family_tree function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.get_family_tree();

-- Create the family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  birth_date date,
  gender text CHECK (gender IN ('ذكر', 'أنثى')),
  phone text,
  notes text,
  is_alive boolean DEFAULT true,
  date_of_death date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching the pattern from existing tables)
CREATE POLICY "Enable insert for all users" ON public.family_members
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.family_members
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Enable update for all users" ON public.family_members
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Enable delete for all users" ON public.family_members
  FOR DELETE TO public
  USING (true);

-- Create or update the trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_parent_id ON public.family_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON public.family_members(name);
CREATE INDEX IF NOT EXISTS idx_family_members_birth_date ON public.family_members(birth_date);

-- Create a function to get family tree with levels (referenced in the service)
CREATE FUNCTION public.get_family_tree()
RETURNS TABLE (
  id uuid,
  name text,
  parent_id uuid,
  birth_date date,
  gender text,
  phone text,
  notes text,
  is_alive boolean,
  date_of_death date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  level integer
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE family_tree AS (
    -- Base case: root members (no parent)
    SELECT 
      fm.id,
      fm.name,
      fm.parent_id,
      fm.birth_date,
      fm.gender,
      fm.phone,
      fm.notes,
      fm.is_alive,
      fm.date_of_death,
      fm.created_at,
      fm.updated_at,
      0 as level
    FROM public.family_members fm
    WHERE fm.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: children of existing members
    SELECT 
      fm.id,
      fm.name,
      fm.parent_id,
      fm.birth_date,
      fm.gender,
      fm.phone,
      fm.notes,
      fm.is_alive,
      fm.date_of_death,
      fm.created_at,
      fm.updated_at,
      ft.level + 1
    FROM public.family_members fm
    INNER JOIN family_tree ft ON fm.parent_id = ft.id
  )
  SELECT * FROM family_tree
  ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;