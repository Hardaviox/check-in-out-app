function doGet(e) {
  // ... (código existente)
}

function doPost(e) {
  try{
    var params = JSON.parse(e.postData.contents);
    var usuario = params.usuario;
    var ubicacion = params.ubicacion;
    var tipo = params.tipo;

    Logger.log(params); // Agregar registro para depuración

    registrarCheck(usuario, ubicacion, tipo);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error en doPost: " + error);
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }

}

function registrarCheck(usuario, ubicacion, tipo) {
  if (!ubicacion || !ubicacion.id) {
    Logger.log("Ubicación no valida: " + ubicacion);
    return;
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1");

  // Obtener el último ID de registro
  var lastRow = sheet.getLastRow();
  var lastId = (lastRow > 1) ? sheet.getRange(lastRow, 1).getValue() : 0;
  var newId = lastId + 1;

  // Obtener fecha y hora
  var fechaHora = new Date();
  var fecha = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var hora = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "HH:
