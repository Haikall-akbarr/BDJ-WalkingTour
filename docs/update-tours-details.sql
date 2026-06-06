-- SQL Migration: Add detailed fields to tours table
-- Run this in your Supabase SQL Editor (or MySQL client if using MySQL) to add the new fields.

-- For PostgreSQL / Supabase:
ALTER TABLE tours ADD COLUMN IF NOT EXISTS description_full TEXT NULL;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS history_culture TEXT NULL;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS history_highlights TEXT NULL; -- stores JSON array: [{"title": "Highlight Title", "desc": "Highlight Description"}]
ALTER TABLE tours ADD COLUMN IF NOT EXISTS route_detail TEXT NULL;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS route_map_url TEXT NULL;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS poi_list TEXT NULL; -- stores JSON array of strings: ["POI 1", "POI 2", ...]
