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
  caballito:
    "https://docs.google.com/document/d/1eRqtTqt5qqSlpCmOryck7V4FLORQ8DR0/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  euskal:
    "https://docs.google.com/document/d/1mASa_zg8w7uCUopohHGCfzTkBlPcP0xu/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  nunez:
    "https://docs.google.com/document/d/15ggfrhnboTKZdMCSINXgt2UIMMNrwM90/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  olivos:
    "https://docs.google.com/document/d/1r9X1on_mUb1ATGbGd9S00Ib46cOfILOT/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  palermo:
    "https://docs.google.com/document/d/13zCJns9--uJkggG50hjlDPUL9xtdIGRv/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  nordelta:
    "https://docs.google.com/document/d/1BhcUihYRy9_bokpTzqIKaLo1II0aUc5X/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  villacrespo:
    "https://docs.google.com/document/d/1L6lValWJH0CZibT74tvyxdGe9aGuR_qw/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  tigre:
    "https://docs.google.com/document/d/1In0RkW1jQpUFm9ILrFZNLDJ4sUp8wEcc/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
  devoto:
    "https://docs.google.com/document/d/1pdwhBn1vCA2WhOUI95FXFBs84vOKTHSI/edit?usp=drive_link&ouid=115755590530852117154&rtpof=true&sd=true",
}

export type ReportFile = { label: string; url: string }

// Informes separados disponibles directamente desde la pizarra.
const REPORT_FILES: Record<string, ReportFile[]> = {
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
