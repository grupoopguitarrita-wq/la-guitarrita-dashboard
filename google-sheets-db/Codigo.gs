/**
 * ============================================================================
 *  LA GUITARRITA — Base de datos de auditorías en Google Sheets
 * ============================================================================
 *  Este script convierte tu planilla en la base de datos del sistema de
 *  auditorías. Reemplaza a Supabase para GUARDAR auditorías.
 *
 *  Cómo publicarlo (una sola vez): ver README.md de esta carpeta.
 *
 *  Pestañas que administra (las crea solas si no existen):
 *    - audits            (una fila por auditoría)
 *    - audit_responses   (una fila por ítem respondido)
 *    - audit_scores      (una fila por puntaje: área / categoría / global)
 *    - locations         (catálogo de locales; opcional, para leer)
 *
 *  Seguridad: todas las llamadas deben traer el mismo token que guardes en
 *  Propiedades del script como WEBHOOK_TOKEN.
 * ============================================================================
 */

// --- Configuración de columnas por pestaña (orden = orden de columnas) --------
var SCHEMA = {
  audits: [
    'id', 'location_id', 'location_name', 'auditor_name', 'auditor_names',
    'audit_date', 'audit_quarter', 'status',
    'salon_score', 'cocina_score', 'calidad_score', 'global_score', 'global_label',
    'created_at', 'updated_at', 'submitted_at',
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
  locations: ['id', 'name', 'created_at'],
}

// Carpeta de Drive donde se guardan las fotos de las auditorías.
var PHOTO_FOLDER_NAME = 'Auditorias - Fotos'

// ============================================================================
//  PUNTO DE ENTRADA
// ============================================================================
function doPost(e) {
  try {
    var body = {}
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents)
    }

    var expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN')
    var got = body.token || (e && e.parameter ? e.parameter.token : null)
    if (expected && got !== expected) {
      return json({ ok: false, error: 'Token inválido' })
    }

    var action = body.action
    var payload = body.payload || {}

    switch (action) {
      case 'createAudit':   return json(createAudit(payload))
      case 'saveResponse':  return json(saveResponse(payload))
      case 'saveAreaScore': return json(saveAreaScore(payload))
      case 'submitAudit':   return json(submitAudit(payload))
      case 'uploadPhoto':   return json(uploadPhoto(payload))
      case 'listLocations': return json({ ok: true, data: listLocations() })
      case 'ping':          return json({ ok: true, pong: true })
      default:              return json({ ok: false, error: 'Acción desconocida: ' + action })
    }
  } catch (err) {
    return json({ ok: false, error: String(err) })
  }
}

function doGet(e) {
  // Endpoint de verificación simple en el navegador.
  return json({ ok: true, service: 'la-guitarrita-db', ts: new Date().toISOString() })
}

// ============================================================================
//  ACCIONES
// ============================================================================

/** Crea (o reescribe) la fila de una auditoría. Idempotente por id. */
function createAudit(p) {
  var now = new Date().toISOString()
  var row = {
    id: p.id,
    location_id: p.locationId || '',
    location_name: p.locationName || '',
    auditor_name: p.auditorName || '',
    auditor_names: JSON.stringify(p.auditorNames || []),
    audit_date: p.auditDate || '',
    audit_quarter: p.auditQuarter || '',
    status: 'in_progress',
    salon_score: '', cocina_score: '', calidad_score: '',
    global_score: '', global_label: '',
    created_at: now, updated_at: now, submitted_at: '',
  }
  upsertRow('audits', 'id', p.id, row)
  return { ok: true, id: p.id }
}

/** Upsert de una respuesta por (audit_id, item_id). */
function saveResponse(p) {
  var sheet = getSheet('audit_responses')
  var key = findRowByTwoKeys(sheet, 'audit_id', p.auditId, 'item_id', p.itemId)
  var now = new Date().toISOString()

  var row = {
    id: key ? key.id : Utilities.getUuid(),
    audit_id: p.auditId,
    area_id: p.areaId || '', area_label: p.areaLabel || '',
    category_id: p.categoryId || '', category_label: p.categoryLabel || '',
    item_id: p.itemId, item_label: p.itemLabel || '',
    item_description: p.itemDescription || '',
    rating_value: p.ratingValue === null || p.ratingValue === undefined ? '' : p.ratingValue,
    rating_label: p.ratingLabel || '',
    observation: p.observation || '',
    photo_url: p.photoUrl || '',
    photo_urls: JSON.stringify(p.photoUrls || []),
    custom_label: p.customLabel || '',
    text_value: p.textValue || '',
    is_text_field: !!p.isTextField,
    is_custom_label: !!p.isCustomLabel,
    created_at: key ? key.created_at : now,
    updated_at: now,
  }

  if (key) {
    writeRow(sheet, key.rowIndex, 'audit_responses', row)
  } else {
    appendRow(sheet, 'audit_responses', row)
  }
  return { ok: true, id: row.id }
}

/** Guarda el puntaje de un área y recalcula el global de la auditoría. */
function saveAreaScore(p) {
  var sheet = getSheet('audits')
  var loc = findRowByKey(sheet, 'id', p.auditId)
  if (!loc) return { ok: false, error: 'Auditoría no encontrada' }

  var col = { salon: 'salon_score', cocina: 'cocina_score', calidad: 'calidad_score' }[p.areaId]
  if (!col) return { ok: false, error: 'Área desconocida: ' + p.areaId }

  var current = loc.data
  current[col] = p.areaScore

  var vals = ['salon_score', 'cocina_score', 'calidad_score']
    .map(function (c) { return current[c] })
    .filter(function (v) { return v !== '' && v !== null && v !== undefined })
    .map(Number)

  var global = vals.length
    ? Math.round(vals.reduce(function (a, b) { return a + b }, 0) / vals.length)
    : 0

  current.global_score = global
  current.global_label = p.globalLabel || globalLabelFor(global)
  current.updated_at = new Date().toISOString()

  writeRow(sheet, loc.rowIndex, 'audits', current)
  return { ok: true, areaScore: p.areaScore, globalScore: global }
}

/** Cierra la auditoría: puntajes finales, estado submitted y desglose. */
function submitAudit(p) {
  var sheet = getSheet('audits')
  var loc = findRowByKey(sheet, 'id', p.auditId)
  if (!loc) return { ok: false, error: 'Auditoría no encontrada' }

  var now = new Date().toISOString()
  var row = loc.data
  row.status = 'submitted'
  row.salon_score = numOrBlank(p.salonScore)
  row.cocina_score = numOrBlank(p.cocinaScore)
  row.calidad_score = numOrBlank(p.calidadScore)
  row.global_score = numOrBlank(p.globalScore)
  row.global_label = p.globalLabel || ''
  row.submitted_at = now
  row.updated_at = now
  writeRow(sheet, loc.rowIndex, 'audits', row)

  // Reemplazar el desglose de puntajes de esta auditoría.
  var scores = getSheet('audit_scores')
  deleteRowsByKey(scores, 'audit_id', p.auditId)
  var list = p.scores || []
  for (var i = 0; i < list.length; i++) {
    var s = list[i]
    appendRow(scores, 'audit_scores', {
      id: Utilities.getUuid(),
      audit_id: p.auditId,
      score_type: s.scoreType || '',
      area_id: s.areaId || '',
      category_id: s.categoryId || '',
      weight: s.weight === null || s.weight === undefined ? '' : s.weight,
      score_value: s.scoreValue,
      score_label: s.scoreLabel || '',
      created_at: now,
    })
  }
  return { ok: true }
}

/** Guarda una foto (base64) en Drive y devuelve un link público. */
function uploadPhoto(p) {
  var folder = getPhotoFolder()
  var bytes = Utilities.base64Decode(p.base64, Utilities.Charset.UTF_8)
  var blob = Utilities.newBlob(bytes, p.mimeType || 'image/jpeg', p.filename || 'foto.jpg')
  var file = folder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  var id = file.getId()
  return { ok: true, url: 'https://drive.google.com/uc?export=view&id=' + id }
}

function listLocations() {
  var sheet = getSheet('locations')
  var data = sheet.getDataRange().getValues()
  var out = []
  for (var r = 1; r < data.length; r++) {
    if (!data[r][0]) continue
    out.push({ id: data[r][0], name: data[r][1], created_at: data[r][2] })
  }
  return out
}

// ============================================================================
//  UTILIDADES DE PLANILLA
// ============================================================================
function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.appendRow(SCHEMA[name])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, SCHEMA[name].length).setFontWeight('bold')
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(SCHEMA[name])
    sheet.setFrozenRows(1)
  }
  return sheet
}

function rowObjectToArray(name, obj) {
  return SCHEMA[name].map(function (col) {
    var v = obj[col]
    return v === undefined || v === null ? '' : v
  })
}

function appendRow(sheet, name, obj) {
  sheet.appendRow(rowObjectToArray(name, obj))
}

function writeRow(sheet, rowIndex, name, obj) {
  var arr = rowObjectToArray(name, obj)
  sheet.getRange(rowIndex, 1, 1, arr.length).setValues([arr])
}

/** Upsert por una sola clave. Crea si no existe. */
function upsertRow(name, keyCol, keyVal, obj) {
  var sheet = getSheet(name)
  var loc = findRowByKey(sheet, keyCol, keyVal)
  if (loc) {
    // Conservar created_at original.
    if (loc.data.created_at) obj.created_at = loc.data.created_at
    writeRow(sheet, loc.rowIndex, name, obj)
  } else {
    appendRow(sheet, name, obj)
  }
}

function headerIndex(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  var map = {}
  for (var i = 0; i < headers.length; i++) map[headers[i]] = i
  return { headers: headers, map: map }
}

function findRowByKey(sheet, keyCol, keyVal) {
  var last = sheet.getLastRow()
  if (last < 2) return null
  var hi = headerIndex(sheet)
  var colIdx = hi.map[keyCol]
  var values = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues()
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][colIdx]) === String(keyVal)) {
      var obj = {}
      for (var c = 0; c < hi.headers.length; c++) obj[hi.headers[c]] = values[r][c]
      return { rowIndex: r + 2, data: obj, id: obj.id, created_at: obj.created_at }
    }
  }
  return null
}

function findRowByTwoKeys(sheet, colA, valA, colB, valB) {
  var last = sheet.getLastRow()
  if (last < 2) return null
  var hi = headerIndex(sheet)
  var ia = hi.map[colA], ib = hi.map[colB]
  var values = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues()
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][ia]) === String(valA) && String(values[r][ib]) === String(valB)) {
      var obj = {}
      for (var c = 0; c < hi.headers.length; c++) obj[hi.headers[c]] = values[r][c]
      return { rowIndex: r + 2, data: obj, id: obj.id, created_at: obj.created_at }
    }
  }
  return null
}

function deleteRowsByKey(sheet, keyCol, keyVal) {
  var last = sheet.getLastRow()
  if (last < 2) return
  var hi = headerIndex(sheet)
  var colIdx = hi.map[keyCol]
  var values = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues()
  // Borrar de abajo hacia arriba para no correr los índices.
  for (var r = values.length - 1; r >= 0; r--) {
    if (String(values[r][colIdx]) === String(keyVal)) {
      sheet.deleteRow(r + 2)
    }
  }
}

function getPhotoFolder() {
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME)
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME)
}

function numOrBlank(v) {
  return v === null || v === undefined || v === '' ? '' : Number(v)
}

function globalLabelFor(score) {
  if (score >= 94) return 'Excelencia operativa'
  if (score >= 85) return 'Satisfactorio'
  if (score >= 76) return 'En alerta'
  return 'Crítico'
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
