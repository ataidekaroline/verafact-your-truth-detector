-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create verified_news table
CREATE TABLE IF NOT EXISTS public.verified_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  snippet TEXT,
  content TEXT,
  category_id UUID REFERENCES public.categories(id),
  source_name TEXT NOT NULL DEFAULT 'CNN Brasil',
  source_url TEXT NOT NULL,
  image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  confidence_score DECIMAL(5,4),
  published_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create verification_history table
CREATE TABLE IF NOT EXISTS public.verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  input_text TEXT NOT NULL,
  ml_result BOOLEAN NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  true_fact_summary TEXT,
  reference_sites TEXT[],
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, slug) VALUES
  ('Politics', 'politics'),
  ('Science', 'science'),
  ('Tech', 'tech'),
  ('Health', 'health')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

-- RLS Policies for verified_news (public read)
CREATE POLICY "Verified news are viewable by everyone"
  ON public.verified_news FOR SELECT
  USING (true);

-- RLS Policies for verification_history (users can view their own)
CREATE POLICY "Users can view their own verification history"
  ON public.verification_history FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification history"
  ON public.verification_history FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verified_news_category ON public.verified_news(category_id);
CREATE INDEX IF NOT EXISTS idx_verified_news_verified_at ON public.verified_news(verified_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_history_user ON public.verification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_verified_at ON public.verification_history(verified_at DESC);