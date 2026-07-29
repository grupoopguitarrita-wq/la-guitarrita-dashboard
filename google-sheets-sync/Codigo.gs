/**
 * ============================================================================
 *  ESPEJO DE SUPABASE EN GOOGLE SHEETS  —  La Guitarrita
 * ============================================================================
 *
 *  Este script convierte tu Google Sheet en un espejo automático de la base de
 *  datos de Supabase. Cada tabla de Supabase se vuelca en su propia pestaña, y
 *  además se generan pestañas "legibles" en español para trabajar cómodo.
 *
 *  Se actualiza de dos formas:
 *    1) Automáticamente cada X minutos (disparador de tiempo).
 *    2) Al instante cuando se completa una auditoría, si configurás el webhook
 *       de Supabase apuntando a la URL de este script (ver README, paso 5).
 *
 *  IMPORTANTE: nunca escribas datos "a mano" en las pestañas que empiezan con
 *  "db_" — se sobrescriben en cada sincronización. Para notas propias usá la
 *  pestaña "Notas" (esa nunca se toca).
 * ============================================================================
 */

/** Orden de columnas por tabla (coincide con el esquema real de Supabase). */
var TABLES = {
  locations: [
    'id', 'name', 'created_at',
  ],
  audits: [
    'id', 'location_id', 'auditor_name', 'auditor_names', 'audit_date',
    'audit_quarter', 'status', 'salon_score', 'cocina_score', 'calidad_score',
    'global_score', 'global_label', 'submitted_at', 'created_at', 'updated_at',
  ],
  audit_responses: [
    'id', 'audit_id', 'area_id', 'area_label', 'category_id', 'category_label',
    'item_id', 'item_label', 'item_description', 'rating_value', 'rating_label',
    'observation', 'photo_url', 'photo_urls', 'custom_label', 'text_value',
    'is_text_field', 'is_custom_label', 'created_at', 'updated_at',
  ],
  audit_scores: [
    'id', 'audit_id', 'score_type', 'area_id', 'category_id', 'weight',
    'score_value', 'score_label', 'created_at',
  ],
};

/** Tabla -> nombre de pestaña cruda. */
function rawSheetName(table) {
  return 'db_' + table;
}

// ---------------------------------------------------------------------------
//  CONFIGURACIÓN (se lee de las Propiedades del Script — ver README paso 3)
// ---------------------------------------------------------------------------
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL');
  var key = props.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key) {
    throw new Error(
      'Falta configurar SUPABASE_URL y/o SUPABASE_ANON_KEY en ' +
      'Configuración del proyecto > Propiedades del script.'
    );
  }
  // Normaliza: sin barra final.
  url = url.replace(/\/+$/, '');
  return { url: url, key: key };
}

// ---------------------------------------------------------------------------
//  LECTURA DE SUPABASE (REST) con paginación
// ---------------------------------------------------------------------------
function fetchTable(table) {
  var cfg = getConfig();
  var pageSize = 1000; // límite por request de Supabase
  var offset = 0;
  var all = [];

  while (true) {
    var endpoint = cfg.url + '/rest/v1/' + table +
      '?select=*&order=created_at.asc&limit=' + pageSize + '&offset=' + offset;

    var res = UrlFetchApp.fetch(endpoint, {
      method: 'get',
      headers: {
        apikey: cfg.key,
        Authorization: 'Bearer ' + cfg.key,
        Accept: 'application/json',
      },
      muteHttpExceptions: true,
    });

    var code = res.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('Error leyendo "' + table + '" (HTTP ' + code + '): ' +
        res.getContentText().slice(0, 500));
    }

    var batch = JSON.parse(res.getContentText());
    all = all.concat(batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/** Convierte un valor de celda a algo que Sheets muestre bien. */
function cellValue(v) {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

// ---------------------------------------------------------------------------
//  ESCRITURA EN LA PESTAÑA
// ---------------------------------------------------------------------------
function writeSheet(sheetName, headers, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  sh.clearContents();

  var matrix = [headers];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var line = [];
    for (var j = 0; j < headers.length; j++) {
      line.push(cellValue(r[headers[j]]));
    }
    matrix.push(line);
  }

  sh.getRange(1, 1, matrix.length, headers.length).setValues(matrix);

  // Formato de encabezado.
  var head = sh.getRange(1, 1, 1, headers.length);
  head.setFontWeight('bold').setBackground('#B5123F').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, headers.length);
}

// ---------------------------------------------------------------------------
//  PESTAÑAS LEGIBLES (en español, listas para trabajar)
// ---------------------------------------------------------------------------
function buildReadable(data) {
  var locById = {};
  data.locations.forEach(function (l) { locById[l.id] = l.name; });

  // --- Auditorías (una fila por auditoría) ---
  var audHeaders = [
    'Local', 'Auditores', 'Fecha', 'Trimestre', 'Estado',
    'Salón', 'Cocina', 'Calidad', 'Global', 'Etiqueta', 'Enviada', 'ID auditoría',
  ];
  var audRows = data.audits.map(function (a) {
    var auditores = (a.auditor_names && a.auditor_names.length)
      ? a.auditor_names.join(', ')
      : (a.auditor_name || '');
    return {
      'Local': locById[a.location_id] || a.location_id,
      'Auditores': auditores,
      'Fecha': a.audit_date || '',
      'Trimestre': a.audit_quarter || '',
      'Estado': a.status === 'submitted' ? 'Enviada' : 'En curso',
      'Salón': a.salon_score,
      'Cocina': a.cocina_score,
      'Calidad': a.calidad_score,
      'Global': a.global_score,
      'Etiqueta': a.global_label || '',
      'Enviada': a.submitted_at || '',
      'ID auditoría': a.id,
    };
  });
  writeSheet('Auditorías', audHeaders, audRows);

  // --- Respuestas (una fila por ítem evaluado) ---
  var audMeta = {};
  data.audits.forEach(function (a) {
    audMeta[a.id] = {
      local: locById[a.location_id] || a.location_id,
      fecha: a.audit_date || '',
      trimestre: a.audit_quarter || '',
    };
  });
  var respHeaders = [
    'Local', 'Trimestre', 'Fecha', 'Área', 'Categoría', 'Ítem',
    'Puntaje', 'Calificación', 'Observación', 'Foto', 'ID auditoría',
  ];
  var respRows = data.audit_responses.map(function (r) {
    var meta = audMeta[r.audit_id] || {};
    var foto = r.photo_url || (r.photo_urls && r.photo_urls.length ? r.photo_urls[0] : '');
    return {
      'Local': meta.local || '',
      'Trimestre': meta.trimestre || '',
      'Fecha': meta.fecha || '',
      'Área': r.area_label || '',
      'Categoría': r.category_label || '',
      'Ítem': r.item_label || '',
      'Puntaje': r.rating_value,
      'Calificación': r.rating_label || '',
      'Observación': r.observation || r.text_value || '',
      'Foto': foto,
      'ID auditoría': r.audit_id,
    };
  });
  writeSheet('Respuestas', respHeaders, respRows);
}

// ---------------------------------------------------------------------------
//  SINCRONIZACIÓN PRINCIPAL
// ---------------------------------------------------------------------------
function syncAll() {
  var data = {};
  Object.keys(TABLES).forEach(function (table) {
    var rows = fetchTable(table);
    data[table] = rows;
    writeSheet(rawSheetName(table), TABLES[table], rows);
  });

  buildReadable(data);
  ensureNotesSheet_();
  stampStatus_('OK — ' + new Date().toLocaleString('es-AR'));
  return data;
}

/** Marca la última sincronización en la pestaña "Estado". */
function stampStatus_(msg) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Estado');
  if (!sh) sh = ss.insertSheet('Estado', 0);
  sh.clearContents();
  sh.getRange(1, 1, 4, 2).setValues([
    ['Espejo de Supabase — La Guitarrita', ''],
    ['Última sincronización', msg],
    ['Locales', ss.getSheetByName('db_locations') ? (ss.getSheetByName('db_locations').getLastRow() - 1) : 0],
    ['Auditorías', ss.getSheetByName('db_audits') ? (ss.getSheetByName('db_audits').getLastRow() - 1) : 0],
  ]);
  sh.getRange(1, 1, 1, 2).merge().setFontWeight('bold')
    .setBackground('#B5123F').setFontColor('#FFFFFF').setHorizontalAlignment('center');
  sh.autoResizeColumns(1, 2);
}

/** Crea (si no existe) una pestaña de notas libres que el sync nunca toca. */
function ensureNotesSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Notas')) {
    var sh = ss.insertSheet('Notas');
    sh.getRange(1, 1).setValue('Notas libres — esta pestaña NO se sobreescribe con la sincronización.')
      .setFontWeight('bold');
  }
}

// ---------------------------------------------------------------------------
//  DISPARADOR AUTOMÁTICO (cada 10 minutos)
// ---------------------------------------------------------------------------
function crearDisparador() {
  // Elimina disparadores previos de syncAll para no duplicar.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncAll').timeBased().everyMinutes(10).create();
  SpreadsheetApp.getActiveSpreadsheet().toast('Disparador creado: sincroniza cada 10 minutos.', 'Listo', 5);
}

// ---------------------------------------------------------------------------
//  WEBHOOK (opcional): Supabase llama esta URL al completar una auditoría
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    // Token compartido. Se acepta tanto en la query (?token=...) como en el
    // cuerpo JSON ({ "token": "..." }), para que funcionen por igual el webhook
    // de Supabase y el aviso directo de la app (/api/sheets/notify).
    var expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN');
    var got = e && e.parameter ? e.parameter.token : null;
    if (!got && e && e.postData && e.postData.contents) {
      try {
        var body = JSON.parse(e.postData.contents);
        got = body && body.token ? body.token : null;
      } catch (parseErr) {
        got = null;
      }
    }
    if (expected && got !== expected) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'token inválido' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    syncAll();
    return ContentService.createTextOutput(JSON.stringify({ ok: true, synced_at: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------------------------------------------------------------------------
//  MENÚ EN LA HOJA
// ---------------------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 Supabase')
    .addItem('Sincronizar ahora', 'syncAll')
    .addSeparator()
    .addItem('Activar sincronización automática (cada 10 min)', 'crearDisparador')
    .addToUi();
}
