function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index');
}

function buscarUsuario(e) {
  var nombre = decodeURIComponent(e.parameter.nombre);
  Logger.log("Nombre del usuario recibido: " + nombre);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usuariosSheet = ss.getSheetByName("Usuarios");
  var lastRow = usuariosSheet.getLastRow();
  var usuarios = usuariosSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  Logger.log("Usuarios encontrados: " + JSON.stringify(usuarios));
  for (var i = 0; i < usuarios.length; i++) {
    Logger.log("Usuario en fila " + (i + 2) + ": " + usuarios[i][0]);
    if (usuarios[i][0] === nombre) {
      Logger.log("Usuario encontrado: " + usuarios[i][0]);
      return ContentService.createTextOutput(JSON.stringify({ usuario: nombre })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  Logger.log("Usuario no encontrado.");
  return ContentService.createTextOutput(JSON.stringify({ usuario: null })).setMimeType(ContentService.MimeType.JSON);
}

function obtenerUbicacionQR(e) {
  var codigo = decodeURIComponent(e.parameter.codigo);
  Logger.log("Código QR recibido: " + codigo);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ubicacionesSheet = ss.getSheetByName("Ubicaciones");
  var lastRow = ubicacionesSheet.getLastRow();
  var ubicaciones = ubicacionesSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  Logger.log("Ubicaciones encontradas: " + JSON.stringify(ubicaciones));
  for (var i = 0; i < ubicaciones.length; i++) {
    if (ubicaciones[i][0] === codigo) {
      Logger.log("Ubicación encontrada: " + ubicaciones[i][1]);
      return ContentService.createTextOutput(JSON.stringify({ ubicacion: { "Account Building ID": codigo, "Address": ubicaciones[i][1] } })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  Logger.log("Ubicación no encontrada.");
  return ContentService.createTextOutput(JSON.stringify({ ubicacion: null })).setMimeType(ContentService.MimeType.JSON);
}

function registrarCheck(usuario, ubicacion, tipo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1");
  var fechaHora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([usuario, ubicacion, fechaHora, tipo]);
}

function doPost(e) {
  if (e && e.postData && e.postData.contents) {
    var params = JSON.parse(e.postData.contents);
    var usuario = params.usuario;
    var ubicacion = params.ubicacion;
    var tipo = params.tipo;

    registrarCheck(usuario, ubicacion, tipo);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({ "error": "Invalid request" })).setMimeType(ContentService.MimeType.JSON);
  }
}
