-- Accuracy & product improvement fields
-- Run in Supabase SQL editor

alter table formulations
  add column if not exists target_population text,
  add column if not exists excipients jsonb not null default '[]'::jsonb,
  add column if not exists product_type text;
