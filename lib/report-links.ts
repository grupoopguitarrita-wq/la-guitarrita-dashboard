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
