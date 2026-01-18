-- Migration to add DIRECTEMAR compliance fields to vessels
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS operator_name TEXT;
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS call_sign TEXT;
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'CHILENA';
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS registration_port TEXT;
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS vessel_class TEXT DEFAULT 'LANCHA MOTOR';

COMMENT ON COLUMN vessels.operator_name IS 'Nombre del Armador / Operador responsable';
COMMENT ON COLUMN vessels.call_sign IS 'Distintivo de Llamada';
COMMENT ON COLUMN vessels.nationality IS 'Nacionalidad de la embarcación';
COMMENT ON COLUMN vessels.registration_port IS 'Puerto de Matrícula';
COMMENT ON COLUMN vessels.vessel_class IS 'Clase de la embarcación (L/M, Barcaza, etc)';
