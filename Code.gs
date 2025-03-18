function doGet(e) {
  if (e.parameter.action == "obtenerUsuarios") {
    return obtenerUsuarios();
  } else if (e.parameter.action == "obtenerUbicaciones") {
    return obtenerUbicaciones();
  } else {
    return ContentService.createTextOutput(JSON.stringify({ "message": "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
  }
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
  sheet.appendRow([newId, usuario, ubicacion, fecha, hora, tipo]);
}

function obtenerUbicaciones() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ubicaciones");
  var data = sheet.getDataRange().getValues();
  var ubicaciones = [];
  for (var i = 1; i < data.length; i++) {
    ubicaciones.push({
      id: data[i][0], // Account Building ID
      direccion: data[i][1] // Dirección
    });
  }
  return ContentService.createTextOutput(JSON.stringify(ubicaciones)).setMimeType(ContentService.MimeType.JSON);
}

function obtenerUsuarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Usuarios");
  var data = sheet.getDataRange().getValues();
  var usuarios = [];
  for (var i = 1; i < data.length; i++) {
    usuarios.push(data[i][0]);
  }
  return ContentService.createTextOutput(JSON.stringify(usuarios)).setMimeType(ContentService.MimeType.JSON);
}
