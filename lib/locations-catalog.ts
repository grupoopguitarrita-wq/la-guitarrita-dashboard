import type { Location } from '@/types/database'

/**
 * ============================================================================
 *  CATÁLOGO DE LOCALES — La Guitarrita
 * ============================================================================
 *  Lista fija de locales de la red. Es la fuente de verdad para el desplegable
 *  de "Seleccionar local" al iniciar una auditoría. No depende de Supabase.
 *
 *  Para agregar o quitar un local, editá el array LOCATIONS de abajo.
 *  El `id` es un slug estable: NO lo cambies una vez que hay auditorías
 *  guardadas con ese id, o se romperá el enlace en la planilla.
 * ============================================================================
 */

export interface LocationEntry extends Location {
  /** Nombres alternativos con los que también se conoce a este local. */
  aliases?: string[]
}

const CREATED_AT = '2026-01-01T00:00:00.000Z'

export const LOCATIONS: LocationEntry[] = [
  { id: 'belgrano', name: 'Belgrano', created_at: CREATED_AT },
  { id: 'caballito', name: 'Caballito', created_at: CREATED_AT },
  { id: 'canitas', name: 'Cañitas', created_at: CREATED_AT },
  { id: 'colegiales', name: 'Colegiales', created_at: CREATED_AT },
  {
    id: 'dardo-rocha',
    name: 'Dardo Rocha',
    created_at: CREATED_AT,
    aliases: ['San Isidro', 'Martínez', 'Martinez'],
  },
  { id: 'devoto', name: 'Devoto', created_at: CREATED_AT },
  { id: 'euskal', name: 'Euskal', created_at: CREATED_AT },
  { id: 'lomitas', name: 'Lomitas', created_at: CREATED_AT },
  { id: 'maschwitz', name: 'Maschwitz', created_at: CREATED_AT },
  { id: 'nordelta', name: 'Nordelta', created_at: CREATED_AT },
  { id: 'nunez', name: 'Núñez', created_at: CREATED_AT },
  { id: 'olivos', name: 'Olivos', created_at: CREATED_AT },
  { id: 'palermo', name: 'Palermo', created_at: CREATED_AT },
  { id: 'pilar', name: 'Pilar', created_at: CREATED_AT },
  { id: 'tigre', name: 'Tigre', created_at: CREATED_AT },
  { id: 'villa-crespo', name: 'Villa Crespo', created_at: CREATED_AT },
  { id: 'villa-del-parque', name: 'Villa del Parque', created_at: CREATED_AT },
  { id: 'villa-urquiza', name: 'Villa Urquiza', created_at: CREATED_AT },
  { id: 'lanus', name: 'Lanús', created_at: CREATED_AT },
]

/** Devuelve el catálogo ordenado alfabéticamente por nombre. */
export function getLocationsCatalog(): Location[] {
  return [...LOCATIONS]
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(({ id, name, created_at }) => ({ id, name, created_at }))
}
