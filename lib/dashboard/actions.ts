// Deterministic suggested-action engine. Maps area/category context to a
// concrete corrective action. No AI, no random text: every suggestion is
// derived from the area and the severity observed.

const AREA_ACTIONS: Record<string, string> = {
  Cocina: "Reforzar BPM y control de equipamiento; verificar cadena de frío y registros de temperatura.",
  Calidad: "Revisar la ejecución del producto contra la ficha técnica; recalibrar porciones y presentación.",
  "Salón": "Estandarizar el servicio y el orden operativo; reforzar checklist de apertura y atención.",
}

const CATEGORY_HINTS: { match: RegExp; action: string }[] = [
  { match: /bpm|manufactura|higiene|limpieza/i, action: "Auditar BPM: higiene de superficies, manipulación y registros sanitarios." },
  { match: /temperatura|fr[ií]o|cadena/i, action: "Verificar cadena de frío: termómetros calibrados y planillas de control al día." },
  { match: /producto|mayor venta|presentaci[oó]n|ficha/i, action: "Recalibrar el producto contra ficha técnica: porción, montaje y presentación." },
  { match: /equipamiento|mantenimiento|infraestructura/i, action: "Programar mantenimiento del equipamiento observado y registrar el cierre." },
  { match: /servicio|atenci[oó]n|experiencia|sal[oó]n/i, action: "Reforzar el protocolo de servicio y tiempos de atención en salón." },
  { match: /stock|insumo|proveedor/i, action: "Revisar gestión de insumos y rotación de stock para evitar quiebres." },
  { match: /personal|capacitaci[oó]n|uniforme/i, action: "Capacitar al equipo en el estándar y verificar uniformidad de criterios." },
]

export function suggestAction(areaLabel: string, categoryLabel: string, criticalCount: number): string {
  const hint = CATEGORY_HINTS.find((h) => h.match.test(categoryLabel) || h.match.test(areaLabel))
  const base = hint?.action ?? AREA_ACTIONS[areaLabel] ?? "Definir plan de acción con responsable, plazo y evidencia de cierre."
  if (criticalCount >= 3) return `Prioridad alta — ${base}`
  return base
}

// Severity weight for ordering findings.
export function severityWeight(ratingValue: number | null): number {
  if (ratingValue === -2) return 3
  if (ratingValue !== null && ratingValue < 0) return 2
  return 1
}

export function ratingTone(ratingValue: number | null): { label: string; bg: string; text: string; border: string } {
  if (ratingValue === 2) return { label: "Excepcional", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" }
  if (ratingValue === 1) return { label: "Cumple", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }
  if (ratingValue === -1) return { label: "No cumple", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" }
  if (ratingValue === -2) return { label: "Crítico", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
  return { label: "Observación", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }
}
