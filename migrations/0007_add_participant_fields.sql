-- Add category and age_group fields to participants table
ALTER TABLE participants ADD COLUMN category VARCHAR(255);
ALTER TABLE participants ADD COLUMN age_group VARCHAR(255);
