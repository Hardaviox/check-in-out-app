function doGet(e) {
  var params = e ? e.parameter || {} : {};
  if (params.action === "obtenerUbicaciones") {
    return sendJsonResponse(obtenerUbicaciones());
  } else if (params.action === "register") {
    return registerUser(params.username);
  }
  return sendJsonResponse({ result: "error", message: "Acción no válida" });
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
    return sendJsonResponse({ result: "success" });
  } catch (error) {
    Logger.log("Error en doPost: " + error.message);
    return sendJsonResponse({ result: "error", message: error.message });
  }
}

function doOptions(e) {
  var response = ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

function registrarCheck(usuario, ubicacion, tipo, timestamp) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  sheet.appendRow([usuario, ubicacion, tipo, timestamp]);
  Logger.log(`Registered: ${usuario}, ${ubicacion}, ${tipo}, ${timestamp}`);
}

function obtenerUbicaciones() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ubicaciones");
  var data = sheet.getDataRange().getValues();
  var ubicaciones = data.slice(1).map(row => ({ id: row[0], direccion: row[1] }));
  return { result: ubicaciones };
}

function registerUser(username) {
  if (!username) {
    return sendJsonResponse({ result: "error", message: "Nombre de usuario requerido" });
  }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usuarios");
  sheet.appendRow([username]);
  Logger.log(`User registered: ${username}`);
  return sendJsonResponse({ result: "success" });
}

function sendJsonResponse(data) {
  var response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  response.setHeader('Access-Control-Allow-Origin', '*');
  return response;
}
