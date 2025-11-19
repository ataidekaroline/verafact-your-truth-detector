-- Add unique constraint on source_url for verified_news table
ALTER TABLE verified_news ADD CONSTRAINT verified_news_source_url_key UNIQUE (source_url);