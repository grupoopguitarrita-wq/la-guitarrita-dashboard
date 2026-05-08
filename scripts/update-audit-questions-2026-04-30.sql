-- =====================================================
-- SAFE AUDIT QUESTION UPDATE MIGRATION
-- Date: 2026-04-30
-- Purpose: Update audit question labels/descriptions
-- IMPORTANT: This script only updates labels, it does NOT delete data
-- =====================================================

-- 1) Update ext-4: "Estacionamiento en condiciones" -> "Cartelería exhibida de forma correcta?"
UPDATE audit_responses
SET 
  item_label = 'Cartelería exhibida de forma correcta?'
WHERE item_id = 'ext-4';

-- 2) Update sal-1: Merge "Mesas limpias" + "Sillas en buen estado" -> "Mesas y sillas limpias y en buen estado"
-- First update sal-1 with new label
UPDATE audit_responses
SET 
  item_label = 'Mesas y sillas limpias y en buen estado'
WHERE item_id = 'sal-1';

-- Note: sal-2 historical data is preserved as-is for historical reports
-- The old sal-2 responses will still show "Sillas en buen estado" in historical data
-- which is acceptable for audit trail purposes

-- 3) Update far-1: Keep label, update was only to description (no DB change needed)
-- No change needed - description is not stored in audit_responses

-- 4) Update far-2: "Productos con fecha vigente" -> "Vajilla completa para la operación?"
UPDATE audit_responses
SET 
  item_label = 'Vajilla completa para la operación?'
WHERE item_id = 'far-2';

-- 5) Update bpm-2: "Uso de guantes cuando corresponde" -> "Se encuentran productos fuera de fecha de vencimiento?"
UPDATE audit_responses
SET 
  item_label = 'Se encuentran productos fuera de fecha de vencimiento?'
WHERE item_id = 'bpm-2';

-- 6) Update ef-4: "Termómetros disponibles y calibrados" -> "Se encuentra cortadora de fiambre y balanza en condiciones, limpia y calibradas?"
UPDATE audit_responses
SET 
  item_label = 'Se encuentra cortadora de fiambre y balanza en condiciones, limpia y calibradas?'
WHERE item_id = 'ef-4';

-- 7) Update gen-2: "Relación calidad-precio" -> "Hay más pizzas premarcadas que el 30% de su venta o de turnos anteriores?"
UPDATE audit_responses
SET 
  item_label = 'Hay más pizzas premarcadas que el 30% de su venta o de turnos anteriores?'
WHERE item_id = 'gen-2';

-- =====================================================
-- VERIFICATION QUERIES (run these to verify the updates)
-- =====================================================

-- Check updated labels
-- SELECT DISTINCT item_id, item_label FROM audit_responses 
-- WHERE item_id IN ('ext-4', 'sal-1', 'sal-2', 'far-1', 'far-2', 'bpm-2', 'ef-4', 'gen-2')
-- ORDER BY item_id;

-- Count affected rows per item
-- SELECT item_id, COUNT(*) as count FROM audit_responses 
-- WHERE item_id IN ('ext-4', 'sal-1', 'sal-2', 'far-1', 'far-2', 'bpm-2', 'ef-4', 'gen-2')
-- GROUP BY item_id
-- ORDER BY item_id;

-- =====================================================
-- NOTES:
-- - sal-2 historical data is preserved (not deleted)
-- - Future audits will only use sal-1 (merged question)
-- - All historical audit responses remain readable
-- - No scoring data is affected (values are preserved)
-- =====================================================
