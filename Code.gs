function doGet(e) {
  if (e.parameter.action == "obtenerUsuarios") {
    return obtenerUsuarios();
  } else if (e.parameter.action == "obtenerUbicaciones") {
    return obtenerUbicaciones();
  } else if (e.parameter.action == "generarCodigosQR") {
    // Obtener el tamaño del código QR del parámetro opcional
    var tamaño = e.parameter.tamaño;
    return generarCodigosQR(tamaño);
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
  sheet.appendRow([newId, usuario, ubicacion.id, ubicacion.direccion, fecha, hora, tipo]);
}

function generarCodigosQR(tamaño) {
  if (!tamaño) {
    tamaño = "150x150"; // Tamaño predeterminado si no se especifica
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ubicaciones");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var accountBuildingId = data[i][0];
    var qrCodeUrl = "https://quickchart.io/qr?size=" + tamaño + "&text=" + encodeURIComponent(accountBuildingId);
    sheet.getRange(i + 1, 3).setValue(qrCodeUrl); // Columna 3: URL del Código QR
  }
  return ContentService.createTextOutput(JSON.stringify({ "message": "Códigos QR generados y URLs guardadas en la hoja 'Ubicaciones'." })).setMimeType(ContentService.MimeType.JSON);
}

function obtenerUbicaciones() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ubicaciones");
  var data = sheet.getDataRange().getValues();
  var ubicaciones = [];
  for (var i = 1; i < data.length; i++) {
    ubicaciones.push({
      id: data[i][0], // Account Building ID
      direccion: data[i][1], // Dirección
      qrCodeUrl: data[i][2] // URL del Código QR
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
