# Espejo de Supabase en Google Sheets — La Guitarrita

Convierte un Google Sheet de tu Drive en un **espejo automático** de la base de
datos de Supabase. Cada tabla se vuelca en su propia pestaña y además se generan
pestañas legibles en español para trabajar las auditorías cómodamente.

No necesitás ningún servidor: todo corre dentro del propio Google Sheet con
Google Apps Script.

---

## Qué pestañas crea

**Crudas (espejo exacto de Supabase — no editar a mano, se sobrescriben):**
- `db_locations`
- `db_audits`
- `db_audit_responses`
- `db_audit_scores`

**Legibles (para trabajar):**
- `Auditorías` → una fila por auditoría (local, auditores, fecha, trimestre, estado, puntajes).
- `Respuestas` → una fila por ítem evaluado (local, área, categoría, ítem, puntaje, observación, foto).

**Otras:**
- `Estado` → muestra la fecha de la última sincronización y totales.
- `Notas` → espacio libre tuyo; la sincronización **nunca** la toca.

---

## Instalación (una sola vez)

### Paso 1 — Crear el Google Sheet
1. Entrá a [sheets.new](https://sheets.new) para crear una planilla nueva en tu Drive.
2. Ponele un nombre, por ejemplo **"Auditorías La Guitarrita — Base de datos"**.

### Paso 2 — Pegar el script
1. En el Sheet: menú **Extensiones → Apps Script**.
2. Borrá el contenido de ejemplo del archivo `Código.gs`.
3. Copiá **todo** el contenido de `Codigo.gs` (de esta carpeta) y pegalo.
4. Guardá (ícono de disquete o Ctrl/Cmd+S).

### Paso 3 — Cargar las credenciales de Supabase
1. En Apps Script, ícono de engranaje **⚙ Configuración del proyecto**.
2. Bajá hasta **Propiedades del script → Agregar propiedad de script**.
3. Agregá estas dos propiedades:

   | Propiedad | Valor |
   |---|---|
   | `SUPABASE_URL` | La URL de tu proyecto, ej. `https://xxxxxxxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | La *anon public key* de tu proyecto Supabase |

   > Las encontrás en Supabase → **Project Settings → API**.

4. Guardá.

### Paso 4 — Primera sincronización
1. Volvé a la planilla (recargá la pestaña del navegador).
2. Va a aparecer un menú nuevo: **🔄 Supabase**.
3. Clic en **🔄 Supabase → Sincronizar ahora**.
4. La primera vez Google pide **autorización**: aceptá con tu cuenta
   (elegí tu cuenta → "Configuración avanzada" → "Ir a … (no seguro)" → Permitir).
   Es normal: le estás dando permiso a *tu propio* script.
5. En segundos se llenan todas las pestañas. Listo. ✅

### Paso 5 — Sincronización automática cada 10 minutos
1. Clic en **🔄 Supabase → Activar sincronización automática (cada 10 min)**.
2. Con esto la planilla se refresca sola, aunque no la tengas abierta.

---

## (Opcional) Actualización instantánea al completar una auditoría

El paso 5 ya refresca cada 10 minutos. Si querés que se actualice **en el mismo
momento** en que se cierra una auditoría, configurá un webhook de Supabase:

### A) Publicar el script como Web App
1. En Apps Script: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. "Ejecutar como": **Yo**. "Quién tiene acceso": **Cualquier persona**.
4. **Implementar** y copiá la **URL de la aplicación web** (`https://script.google.com/macros/s/.../exec`).

### B) (Recomendado) Poner un token de seguridad
1. En **Propiedades del script**, agregá `WEBHOOK_TOKEN` con un valor secreto tuyo
   (ej. `guita-2026-xk29`).
2. La URL del webhook será entonces: `TU_URL_WEB_APP?token=guita-2026-xk29`.

### C) Crear el webhook en Supabase
1. En Supabase → **Database → Webhooks → Create a new hook**.
2. Tabla: `audits`. Eventos: **Update** (y opcionalmente Insert).
3. Tipo: **HTTP Request**, método **POST**, URL = la del paso B.
4. Guardá. Cada vez que una auditoría cambia a `submitted`, el Sheet se
   sincroniza al instante.

> Nota: el webhook dispara una sincronización completa (es rápida). No hace
> falta configurar nada más en la planilla.

### D) (Alternativa) Que la app avise directo, sin webhook de Supabase
La app ya intenta avisarle al Sheet apenas se envía una auditoría. Para
activarlo, cargá estas dos variables en el proyecto (menú **Vars** de v0):

- `SHEETS_WEBHOOK_URL` = la URL de la Web App del paso A (`.../exec`).
- `SHEETS_WEBHOOK_TOKEN` = el mismo valor que pusiste en `WEBHOOK_TOKEN`.

Con eso, al terminar una auditoría la app llama al script y el Sheet se
sincroniza al instante. Si no las cargás, no pasa nada malo: el disparador
automático de 10 minutos igual mantiene la planilla al día.

---

## Uso diario

- Abrí el Sheet y trabajá sobre las pestañas `Auditorías` y `Respuestas`.
- Si querés forzar una actualización manual: **🔄 Supabase → Sincronizar ahora**.
- Para tus anotaciones usá la pestaña `Notas` (no se borra nunca).

## Preguntas frecuentes

**¿Puedo editar los datos en el Sheet y que suban a Supabase?**
No. Este puente es de **solo lectura** (Supabase → Sheet), pensado para consultar
y trabajar informes. Las auditorías se siguen cargando desde la app; el Sheet es
el reflejo. (Si más adelante querés edición bidireccional, se puede sumar, pero
requiere permisos de escritura y validaciones extra.)

**¿Es seguro poner la anon key?**
La *anon key* es la clave pública del proyecto; respeta las políticas RLS de tu
Supabase. No pongas nunca la *service_role key* acá.

**Se llenó todo mal / quiero empezar de cero.**
Borrá las pestañas `db_*`, `Auditorías` y `Respuestas`, y corré
**🔄 Supabase → Sincronizar ahora** de nuevo.
