-- Migration to add registration number (Matrícula) to vessels
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS registration_number TEXT;
