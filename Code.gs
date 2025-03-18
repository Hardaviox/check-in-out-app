// Handle GET requests (e.g., fetching locations)
function doGet(e) {
  try {
    var params = e.parameter;
    var action = params.action;

    if (action === "obtenerUbicaciones") {
      var ubicaciones = obtenerUbicaciones();
      return ContentService.createTextOutput(JSON.stringify(ubicaciones))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Acción no válida" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log("Error en doGet: " + error);
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests (e.g., registering check-in/check-out)
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var usuario = params.usuario;
    var ubicacion = params.ubicacion;
    var tipo = params.tipo;
    var timestamp = params.timestamp || new Date().toISOString(); // Fallback si no se envía
    var tiempoTranscurrido = params.tiempoTranscurrido || ""; // Para check-out

    Logger.log("Params recibidos: " + JSON.stringify(params));
    Logger.log("Ubicacion: " + JSON.stringify(ubicacion));

    registrarCheck(usuario, ubicacion, tipo, timestamp, tiempoTranscurrido);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error en doPost: " + error);
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Registrar datos en la hoja de cálculo
function registrarCheck(usuario, ubicacion, tipo, timestamp, tiempoTranscurrido) {
  if (!ubicacion || !ubicacion.id || !ubicacion.direccion) {
    Logger.log("Ubicación no válida: " + JSON.stringify(ubicacion));
    throw new Error("Ubicación no válida");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1") || ss.insertSheet("Sheet1"); // Crear Sheet1 si no existe

  // Configurar encabezados si la hoja está vacía
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Usuario", "Ubicación ID", "Dirección", "Fecha", "Hora", "Tipo", "Tiempo Transcurrido"]);
  }

  // Obtener el último ID
  var lastRow = sheet.getLastRow();
  var lastId = (lastRow > 1) ? sheet.getRange(lastRow, 1).getValue() : 0;
  var newId = lastId + 1;

  // Formatear fecha y hora desde el timestamp
  var fechaHora = new Date(timestamp);
  var fecha = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var hora = Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), "HH:mm:ss");

  // Registrar los datos
  sheet.appendRow([newId, usuario, ubicacion.id, ubicacion.direccion, fecha, hora, tipo, tiempoTranscurrido]);
}

// Obtener lista de ubicaciones (ejemplo, ajusta según tu estructura)
function obtenerUbicaciones() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ubicaciones") || ss.insertSheet("Ubicaciones");

  // Configurar encabezados si la hoja está vacía
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Dirección"]);
    // Ejemplo de datos iniciales (ajusta según necesites)
    sheet.appendRow(["QR001", "Oficina Central"]);
    sheet.appendRow(["QR002", "Sucursal Norte"]);
  }

  var data = sheet.getDataRange().getValues();
  var ubicaciones = [];
  for (var i = 1; i < data.length; i++) { // Saltar encabezados
    ubicaciones.push({
      id: data[i][0],
      direccion: data[i][1]
    });
  }
  return ubicaciones;
}
