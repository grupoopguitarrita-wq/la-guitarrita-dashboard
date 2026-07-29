# Google Sheets como base de datos de auditorías

Este script convierte tu planilla de Google en la **base de datos** del sistema
de auditorías. Cada auditoría que se completa en la app se guarda acá (reemplaza
a Supabase para **guardar**).

Planilla objetivo: `docs.google.com/spreadsheets/d/1hv0GA538nS3KRjRwzARP47mFv3mV2Y6zB3SRux_DiIw`

---

## Qué guarda (pestañas que crea solas)

- **audits** — una fila por auditoría (local, auditores, fecha, trimestre,
  estado, puntajes por área y global).
- **audit_responses** — una fila por ítem respondido (puntaje, observación,
  fotos, etc.).
- **audit_scores** — desglose de puntajes (área / categoría / global).
- **locations** — catálogo de locales (opcional).

Las fotos se guardan en una carpeta de Drive llamada **"Auditorias - Fotos"** y
en la planilla queda el link.

---

## Paso a paso (una sola vez, ~5 minutos)

### 1) Abrir el editor de Apps Script
1. Abrí la planilla en Google Sheets.
2. Menú **Extensiones → Apps Script**.
3. Borrá el contenido de `Código.gs` y pegá TODO el contenido de
   `google-sheets-db/Codigo.gs` de este proyecto.
4. Guardá (ícono del disquete o Ctrl/Cmd + S).

### 2) Definir el token de seguridad
1. En el editor, engranaje **Configuración del proyecto** (izquierda).
2. Bajá hasta **Propiedades del script → Agregar propiedad**.
3. Propiedad: `WEBHOOK_TOKEN`  ·  Valor: una clave larga inventada por vos
   (ej. `guitarrita-2026-xY9k...`). Guardá.
4. **Anotá ese token**, lo vas a necesitar en el paso 4.

### 3) Publicar como aplicación web
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje de tipo, elegí **Aplicación web**.
3. Configurá:
   - **Descripción**: `DB auditorias`
   - **Ejecutar como**: *Yo (tu cuenta)*
   - **Quién tiene acceso**: **Cualquier usuario**
4. **Implementar**. Google te va a pedir autorizar los permisos: aceptá
   (Drive + Hojas de cálculo).
5. Copiá la **URL de la aplicación web** (termina en `/exec`).

> Si cambiás el código después, tenés que hacer **Implementar → Administrar
> implementaciones → editar (lápiz) → Nueva versión** para que tome los cambios.

### 4) Conectar la app de v0 con la planilla
En v0, abrí el menú **Vars** (variables de entorno del proyecto) y cargá:

- `SHEETS_WEBHOOK_URL` = la URL `.../exec` del paso 3.
- `SHEETS_WEBHOOK_TOKEN` = el token del paso 2 (idéntico).

Listo. A partir de ahí, **cada auditoría que se complete en la app se guarda en
tu Google Sheet automáticamente.**

---

## Probar que funciona

1. Pegá la URL `.../exec` en el navegador: debería responder
   `{"ok":true,"service":"la-guitarrita-db",...}`.
2. En la app, cargá una auditoría de prueba y enviala.
3. Mirá la planilla: deberían aparecer filas nuevas en `audits`,
   `audit_responses` y `audit_scores`.

Si algo no aparece:
- Revisá que `SHEETS_WEBHOOK_URL` termine en `/exec` (no en `/dev`).
- Revisá que el token de las Vars sea EXACTAMENTE igual al del script.
- Reabrí **Administrar implementaciones** y confirmá "Quién tiene acceso:
  Cualquier usuario".

---

## Notas

- El script es **idempotente**: cada auditoría tiene un `id` único, así que
  reintentos no duplican filas (hace *upsert*).
- Por ahora esto cubre **guardar** auditorías. La lectura del dashboard
  (Pizarra, ranking, etc.) sigue en Supabase. Cuando quieras migrar también la
  lectura, avisame y lo conectamos.
- Nunca se borra la pestaña `locations` ni tus datos manuales.
