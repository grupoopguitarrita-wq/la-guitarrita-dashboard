-- Script para eliminar las 3 auditorías de prueba del 29/04/2026
-- Ejecutar en Supabase SQL Editor

-- Primero verificamos cuáles se van a eliminar (ejecutar esto primero para confirmar)
SELECT id, location_name, auditor_names, quarter, audit_date, status
FROM audits
WHERE audit_date = '2026-04-29'
AND (
  (location_name = 'Colegiales' AND 'FACUNDO' = ANY(auditor_names))
  OR (location_name = 'Colegiales' AND 'CHRISTIAN' = ANY(auditor_names))
  OR (location_name = 'Caballito' AND 'GABRIEL' = ANY(auditor_names))
);

-- Una vez confirmado, ejecutar el DELETE:
-- (Primero elimina las respuestas asociadas, luego la auditoría)

-- Eliminar respuestas de las auditorías de prueba
DELETE FROM audit_responses
WHERE audit_id IN (
  SELECT id FROM audits
  WHERE audit_date = '2026-04-29'
  AND (
    (location_name = 'Colegiales' AND 'FACUNDO' = ANY(auditor_names))
    OR (location_name = 'Colegiales' AND 'CHRISTIAN' = ANY(auditor_names))
    OR (location_name = 'Caballito' AND 'GABRIEL' = ANY(auditor_names))
  )
);

-- Eliminar las auditorías de prueba
DELETE FROM audits
WHERE audit_date = '2026-04-29'
AND (
  (location_name = 'Colegiales' AND 'FACUNDO' = ANY(auditor_names))
  OR (location_name = 'Colegiales' AND 'CHRISTIAN' = ANY(auditor_names))
  OR (location_name = 'Caballito' AND 'GABRIEL' = ANY(auditor_names))
);
