function doGet(e) {
  // ... (código existente)
}

function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var usuario = params.usuario;
  var ubicacion = params.ubicacion;
  var tipo = params.tipo;

  registrarCheck(usuario, ubicacion, tipo);

  return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
}

function registrarCheck(usuario, ubicacion, tipo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1");

  // Obtener el último ID de registro
  var lastRow = sheet.getLastRow();
  var lastId = (lastRow > 1) ? sheet.getRange(lastRow, 1).getValue() : 0;
  var newId = lastId + 1;

  // Obtener fecha y hora
  var fechaHora = new Date();
  var fecha = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var hora = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "HH:mm:ss");

  // Registrar los datos
  sheet.appendRow([newId, usuario, ubicacion.id, ubicacion.direccion, fecha, hora, tipo]);
}

// ... (resto del código)
