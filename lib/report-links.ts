// Enlaces a los informes PDF/DOCX alojados en Google Drive, por local.
// IMPORTANTE: estos links pueden actualizarse. Para cambiar o agregar uno,
// editá únicamente el objeto REPORT_LINKS de abajo. La clave es el nombre del
// local normalizado (sin acentos, minúsculas, solo letras y números).
//
// Los enlaces tienen acceso libre para cualquiera y se abren en Google Drive.

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

// Mapa: nombre de local (normalizado) -> URL del informe en Drive.
const REPORT_LINKS: Record<string, string> = {
  martinez: "/informes/Auditoria-Total-Martinez-Q3.pdf",
  villaurquiza: "/informes/Auditoria-Total-Villa-Urquiza-Q3.pdf",
  belgrano: "/informes/Auditoria-Total-Belgrano-Q3.pdf",
  canitas: "/informes/Auditoria-Total-Canitas-Q3.pdf",
  lomitas: "/informes/Auditoria-Total-Lomitas-Q3.pdf",
  colegiales: "/informes/Auditoria-Total-Colegiales-Q3.pdf",
  pilar: "/informes/Auditoria-Total-Pilar-Q3.pdf",
  caballito: "/informes/Auditoria-Total-Caballito-Q3.pdf",
  euskal: "/informes/Auditoria-Total-Euskal-Q3.pdf",
  nunez: "/informes/Auditoria-Total-Nunez-Q3.pdf",
  olivos: "/informes/Auditoria-Total-Olivos-Q3.pdf",
  palermo: "/informes/Auditoria-Total-Palermo-Q3.pdf",
  nordelta: "/informes/Auditoria-Total-Nordelta-Q3.pdf",
  villacrespo: "/informes/Auditoria-Total-Villa-Crespo-Q3.pdf",
  tigre: "/informes/Auditoria-Total-Tigre-Q3.pdf",
  devoto: "/informes/Auditoria-Total-Devoto-Q3.pdf",
}

export type ReportFile = { label: string; url: string }

// Informes separados disponibles directamente desde la pizarra.
const REPORT_FILES: Record<string, ReportFile[]> = {
  caballito: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Caballito-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Caballito-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Caballito-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Caballito-Q3.pdf" },
  ],
  devoto: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Devoto-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Devoto-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Devoto-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Devoto-Q3.pdf" },
  ],
  euskal: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Euskal-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Euskal-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Euskal-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Euskal-Q3.pdf" },
  ],
  nordelta: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Nordelta-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Nordelta-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Nordelta-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Nordelta-Q3.pdf" },
  ],
  nunez: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Nunez-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Nunez-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Nunez-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Nunez-Q3.pdf" },
  ],
  olivos: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Olivos-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Olivos-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Olivos-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Olivos-Q3.pdf" },
  ],
  palermo: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Palermo-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Palermo-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Palermo-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Palermo-Q3.pdf" },
  ],
  tigre: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Tigre-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Tigre-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Tigre-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Tigre-Q3.pdf" },
  ],
  villacrespo: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Villa-Crespo-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Villa-Crespo-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Villa-Crespo-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Villa-Crespo-Q3.pdf" },
  ],
  martinez: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Martinez-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Martinez-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Martinez-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Martinez-Q3.pdf" },
  ],
  villaurquiza: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Villa-Urquiza-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Villa-Urquiza-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Villa-Urquiza-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Villa-Urquiza-Q3.pdf" },
  ],
  belgrano: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Belgrano-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Belgrano-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Belgrano-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Belgrano-Q3.pdf" },
  ],
  canitas: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Canitas-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Canitas-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Canitas-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Canitas-Q3.pdf" },
  ],
  lomitas: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Lomitas-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Lomitas-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Lomitas-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Lomitas-Q3.pdf" },
  ],
  colegiales: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Colegiales-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Colegiales-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Colegiales-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Colegiales-Q3.pdf" },
  ],
  pilar: [
    { label: "Informe Total", url: "/informes/Auditoria-Total-Pilar-Q3.pdf" },
    { label: "Informe de Salón", url: "/informes/Auditoria-Salon-Pilar-Q3.pdf" },
    { label: "Informe de Cocina", url: "/informes/Auditoria-Cocina-Pilar-Q3.pdf" },
    { label: "Informe de Calidad", url: "/informes/Auditoria-Calidad-Pilar-Q3.pdf" },
  ],
}

// Algunos locales usan nombres alternativos en la base. Mapeamos esos alias
// al nombre canónico que figura como clave en REPORT_LINKS.
const NAME_ALIASES: Record<string, string> = {
  euskalerria: "euskal",
  euskaletxea: "euskal",
}

/** Devuelve la URL del informe para un local, o null si todavía no se cargó. */
export function getReportLink(locationName: string): string | null {
  const key = normalizeName(locationName)
  const canonical = NAME_ALIASES[key] ?? key
  return REPORT_LINKS[canonical] ?? null
}

/** Devuelve todos los PDF separados disponibles para el local. */
export function getReportFiles(locationName: string): ReportFile[] {
  const key = normalizeName(locationName)
  const canonical = NAME_ALIASES[key] ?? key
  return REPORT_FILES[canonical] ?? []
}
