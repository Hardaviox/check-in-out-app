function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index');
}

function buscarUsuario(e) {
  var nombre = decodeURIComponent(e.parameter.nombre);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usuariosSheet = ss.getSheetByName("Usuarios");
  var usuarios = usuariosSheet.getRange(1, 1, usuariosSheet.getLastRow(), 1).getValues();
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i][0] === nombre) {
      return ContentService.createTextOutput(JSON.stringify({ usuario: nombre })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ usuario: null })).setMimeType(ContentService.MimeType.JSON);
}

function obtenerUbicacionQR(e) {
  var codigo = decodeURIComponent(e.parameter.codigo);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ubicacionesSheet = ss.getSheetByName("Ubicaciones");
  var ubicaciones = ubicacionesSheet.getRange(1, 1, ubicacionesSheet.getLastRow(), 2).getValues();
  for (var i = 0; i < ubicaciones.length; i++) {
    if (ubicaciones[i][0] === codigo) {
      return ContentService.createTextOutput(JSON.stringify({ ubicacion: { "Account Building ID": codigo, "Address": ubicaciones[i][1] } })).setMimeType(ContentService.MimeType.JSON);
    }
  }
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
