function doGet(e) {
  var params = e.parameter || {};
  if (params.action === "obtenerUbicaciones") {
    return sendJsonResponse(obtenerUbicaciones());
  } else if (params.action === "register") {
    return sendJsonResponse({ result: "success" });
  }
  return sendJsonResponse({ result: "error", message: "Acción no válida" });
}

function doPost(e) {
  try {
    Logger.log("Raw POST data: " + e.postData.contents);
    
    if (!e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos en la solicitud.");
    }

    var params = JSON.parse(e.postData.contents);
    Logger.log("Parsed params: " + JSON.stringify(params));

    var usuario = params.usuario || "";
    var ubicacion = params.ubicacion || "";
    var tipo = params.tipo || "";
    var timestamp = params.timestamp || new Date().toISOString();

    if (!usuario || !ubicacion || !tipo) {
      throw new Error("Faltan datos obligatorios");
    }

    registrarCheck(usuario, ubicacion, tipo, timestamp);
    return sendJsonResponse({ result: "success" });
  } catch (error) {
    Logger.log("Error en doPost: " + error.message);
    return sendJsonResponse({ result: "error", message: error.message });
  }
}

function registrarCheck(usuario, ubicacion, tipo, timestamp) {
  var ss = SpreadsheetApp.openById("1gUsvdfkkEKd5tJwogO9VjM7zg0xMRfwq88ekNp3onlw"); // Google Sheet ID
  var sheet = ss.getSheetByName("Sheet1") || ss.insertSheet("Sheet1");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID de Registro", "Usuario", "Ubicacion", "Fecha", "Hora", "Tipo"]);
  }

  var lastId = sheet.getLastRow() > 1 ? sheet.getRange(sheet.getLastRow(), 1).getValue() : 0;
  var newId = Number(lastId) + 1;
  var fechaHora = new Date(timestamp);
  var fecha = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var hora = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "HH:mm:ss");

  sheet.appendRow([newId, usuario, ubicacion, fecha, hora, tipo]);
}

function obtenerUbicaciones() {
  var ss = SpreadsheetApp.openById("1gUsvdfkkEKd5tJwogO9VjM7zg0xMRfwq88ekNp3onlw"); // Google Sheet ID
  var sheet = ss.getSheetByName("Ubicaciones") || ss.insertSheet("Ubicaciones");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Dirección"]);
    sheet.appendRow(["QR001", "Oficina Central"]);
    sheet.appendRow(["QR002", "Sucursal Norte"]);
  }

  var data = sheet.getDataRange().getValues();
  return data.slice(1).map(row => ({ id: row[0], direccion: row[1] }));
}

function sendJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
