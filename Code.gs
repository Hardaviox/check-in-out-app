function doGet(e) {
  var params = e ? e.parameter || {} : {};
  if (params.action === "obtenerUbicaciones") {
    try {
      return ContentService.createTextOutput(JSON.stringify(obtenerUbicaciones()))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      Logger.log("Error in obtenerUbicaciones: " + error.message);
      return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Error fetching locations: " + error.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else if (params.action === "register") {
    return registerUser(params.username);
  }
  return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Acción no válida" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    Logger.log("doPost function was triggered!");
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log("No postData received.");
      throw new Error("No se recibieron datos en la solicitud.");
    }
    Logger.log("Raw POST data: " + e.postData.contents);
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
    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error en doPost: " + error.message);
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function registrarCheck(usuario, ubicacion, tipo, timestamp) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  sheet.appendRow([usuario, ubicacion, tipo, timestamp]);
  Logger.log(`Registered: ${usuario}, ${ubicacion}, ${tipo}, ${timestamp}`);
}

function obtenerUbicaciones() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ubicaciones");
  if (!sheet) {
    throw new Error("Sheet 'Ubicaciones' not found");
  }
  var data = sheet.getDataRange().getValues();
  Logger.log("Ubicaciones data: " + JSON.stringify(data));
  var ubicaciones = data.slice(1).map(row => ({ id: row[0], direccion: row[1] }));
  Logger.log("Parsed ubicaciones: " + JSON.stringify(ubicaciones));
  return { result: ubicaciones };
}

function registerUser(username) {
  if (!username) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Nombre de usuario requerido" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usuarios");
  sheet.appendRow([username]);
  Logger.log(`User registered: ${username}`);
  return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
