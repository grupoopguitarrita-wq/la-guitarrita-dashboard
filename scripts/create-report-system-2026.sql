-- ============================================================================
-- SISTEMA DE GENERACIÓN DE INFORMES DOCX — Auditorías Trimestrales
-- Migración idempotente. Crea tablas de estado, eventos y configuración de
-- cuestionario, más índices y un bucket de Storage para los DOCX generados.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. audit_generated_reports
--    Una fila por (audit_id) representando el último informe generado y su
--    estado. source_hash detecta desactualización: si los datos cambian, el
--    hash cambia y el informe queda "stale".
-- ----------------------------------------------------------------------------
create table if not exists public.audit_generated_reports (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  quarter text not null,
  -- Estado del ciclo de vida del informe.
  status text not null default 'pending'
    check (status in ('pending','queued','generating','available','failed','stale')),
  -- Hash determinístico del payload de origen (datos + versión de template/config).
  source_hash text,
  -- Versión del template y del generador usadas (trazabilidad).
  template_version text,
  generator_version text,
  -- Ubicación del archivo en Storage y metadatos.
  storage_path text,
  file_name text,
  file_size bigint,
  -- Diagnóstico de errores del servicio generador.
  error_message text,
  error_detail jsonb,
  -- Conteo de regeneraciones para auditoría.
  generation_count integer not null default 0,
  requested_by text,
  requested_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audit_id)
);

create index if not exists idx_generated_reports_audit on public.audit_generated_reports(audit_id);
create index if not exists idx_generated_reports_status on public.audit_generated_reports(status);
create index if not exists idx_generated_reports_quarter on public.audit_generated_reports(quarter);

-- ----------------------------------------------------------------------------
-- 2. report_events
--    Bitácora append-only de cada transición/acción sobre un informe.
-- ----------------------------------------------------------------------------
create table if not exists public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.audit_generated_reports(id) on delete cascade,
  audit_id uuid,
  event_type text not null
    check (event_type in ('requested','validated','queued','generation_started',
                          'generation_succeeded','generation_failed','downloaded',
                          'marked_stale','regenerated','validation_failed')),
  message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_events_report on public.report_events(report_id);
create index if not exists idx_report_events_audit on public.report_events(audit_id);
create index if not exists idx_report_events_type on public.report_events(event_type);
create index if not exists idx_report_events_created on public.report_events(created_at desc);

-- ----------------------------------------------------------------------------
-- 3. questionnaire_config
--    Versionado del cuestionario maestro (áreas, categorías, ítems y pesos).
--    Permite que el payload del informe declare contra qué versión se evaluó.
-- ----------------------------------------------------------------------------
create table if not exists public.questionnaire_config (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  is_active boolean not null default false,
  -- Estructura completa: áreas -> categorías -> ítems con pesos y umbrales.
  config jsonb not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_questionnaire_active on public.questionnaire_config(is_active);

-- ----------------------------------------------------------------------------
-- 4. updated_at trigger para audit_generated_reports
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generated_reports_updated_at on public.audit_generated_reports;
create trigger trg_generated_reports_updated_at
  before update on public.audit_generated_reports
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Storage bucket para los DOCX generados (privado).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audit-reports', 'audit-reports', false)
on conflict (id) do nothing;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
