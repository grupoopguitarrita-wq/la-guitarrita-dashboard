'use client'

import { useMemo, useState } from 'react'

const categories = [
  ['Exterior', 31], ['Salón General', 65], ['Barra', 75], ['Farmacia', 50],
  ['Baños', 75], ['Personal', 55], ['Otros', 75], ['BPM', 79],
  ['Limpieza', 80], ['Equipos y Funcionamiento', 81], ['Producto de Mayor Venta', 44],
  ['Producto Frío', 31], ['Producto Caliente', 75], ['Generales', 50],
] as const

const findings = [
  { area: 'Salón', count: 7 },
  { area: 'Cocina', count: 1 },
  { area: 'Calidad', count: 7 },
]

export default function RecoveryPreview() {
  const [duplicateStatus, setDuplicateStatus] = useState<'pending' | 'clear' | 'found'>('pending')
  const [armed, setArmed] = useState(false)
  const totalFindings = useMemo(() => findings.reduce((sum, item) => sum + item.count, 0), [])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Modo preparación · sin escritura</p>
          <h1 className="text-3xl font-semibold tracking-tight">Recuperación manual de auditoría</h1>
          <p className="max-w-3xl text-slate-400">Olivos · 20/09/2026 · Q3. Esta pantalla prepara un registro idempotente desde los cuatro PDF originales, pero no llama a ninguna API ni guarda datos.</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Registro propuesto</h2>
                <p className="mt-1 text-sm text-slate-400">Payload normalizado para el adaptador actual.</p>
              </div>
              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">Borrador seguro</span>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Local / ID</dt><dd className="mt-1 font-medium">Olivos / olivos</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Fecha / trimestre</dt><dd className="mt-1 font-medium">2026-09-20 / Q3</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Auditor</dt><dd className="mt-1 font-medium">AUDITOR 1</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt><dd className="mt-1 font-medium">submitted · Requiere acción</dd></div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[['General', 63], ['Salón', 60], ['Cocina', 80], ['Calidad', 50]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
            </div>
          </article>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold">Guardas antes de escribir</h2>
            <ol className="mt-4 flex flex-col gap-4 text-sm">
              <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-rose-200">1</span><span>Buscar coincidencia exacta: <strong>location_id=olivos + audit_date=2026-09-20 + audit_quarter=Q3</strong>.</span></li>
              <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-rose-200">2</span><span>Si existe, detener la operación y mostrar el ID; nunca duplicar.</span></li>
              <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-rose-200">3</span><span>Si no existe, crear auditoría y cargar respuestas, puntajes y hallazgos en una operación controlada.</span></li>
            </ol>
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Estado de consulta</p>
              <p className="mt-1 font-medium">{duplicateStatus === 'pending' ? 'Pendiente: no se consultó ningún registro.' : duplicateStatus === 'clear' ? 'Sin coincidencia en la fuente consultada.' : 'Coincidencia encontrada: escritura bloqueada.'}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => setDuplicateStatus('clear')} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950">Simular verificación</button>
              <button type="button" onClick={() => setArmed((value) => !value)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200">{armed ? 'Desarmar recuperación' : 'Armar vista previa'}</button>
            </div>
            {armed && <p className="mt-3 text-xs text-emerald-300">Vista previa armada. La acción de escritura está intencionalmente deshabilitada en este entorno.</p>}
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-semibold">Categorías extraídas</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm"><span className="text-slate-300">{label}</span><strong>{value}</strong></div>)}</div></article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-lg font-semibold">Hallazgos y destino</h2><div className="mt-4 flex flex-col gap-2">{findings.map(({ area, count }) => <div key={area} className="flex justify-between rounded-lg bg-slate-800 px-3 py-3 text-sm"><span>{area}</span><strong>{count}</strong></div>)}</div><p className="mt-4 text-sm text-slate-400">Total: {totalFindings} hallazgos. Quedarían guardados en Google Sheets mediante <code className="text-rose-200">/api/sheets/db</code>, usando el Apps Script configurado, con fotos/documentos en Drive según esa implementación. El dashboard actualmente lee Supabase, por lo que la recuperación no aparecerá allí hasta que exista sincronización o una fuente de lectura equivalente.</p></article>
        </section>

        <footer className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-4 text-sm text-rose-100">Importante: no se ejecutó una verificación real de duplicados ni una escritura. El botón de simulación solo cambia el estado visual de esta preview.</footer>
      </div>
    </main>
  )
}
