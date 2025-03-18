function doGet(e) {
  var params = e.parameter || {};
  if (params.action === "obtenerUbicaciones") {
    return ContentService.createTextOutput(JSON.stringify(obtenerUbicaciones()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === "login") {
    return ContentService.createTextOutput(JSON.stringify(loginUsuario(params.username, params.password, params.ip)))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === "register") {
    return ContentService.createTextOutput(JSON.stringify(registrarUsuario(params.username, params.password, params.ip)))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (params.action === "checkIp") {
    return ContentService.createTextOutput(JSON.stringify(checkIp(params.ip)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Acción no válida" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var usuario = params.usuario || "";
    var ubicacion = params.ubicacion || "";
    var tipo = params.tipo || "";
    var timestamp = params.timestamp || new Date().toISOString();

    if (!usuario || !ubicacion || !tipo) throw new Error("Faltan datos obligatorios");

    registrarCheck(usuario, ubicacion, tipo, timestamp);
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error en doPost: " + error);
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function registrarCheck(usuario, ubicacion, tipo, timestamp) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Ubicaciones") || ss.insertSheet("Ubicaciones");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Dirección"]);
    sheet.appendRow(["QR001", "Oficina Central"]);
    sheet.appendRow(["QR002", "Sucursal Norte"]);
  }
  var data = sheet.getDataRange().getValues();
  return data.slice(1).map(row => ({ id: row[0], direccion: row[1] }));
}

function registrarUsuario(username, password, ip) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("User") || ss.insertSheet("User");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Username", "Password", "IP"]);
  }
  var data = sheet.getDataRange().getValues();
  var existingUser = data.slice(1).find(row => row[0] === username);
  if (existingUser) {
    return { result: "error", message: "El usuario ya está registrado" };
  }
  sheet.appendRow([username, password, ip]);
  return { result: "success" };
}

function loginUsuario(username, password, ip) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("User") || ss.insertSheet("User");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Username", "Password", "IP"]);
  }
  var data = sheet.getDataRange().getValues();
  var userRow = data.slice(1).find(row => row[0] === username && row[1] === password);
  if (userRow) {
    var rowIndex = data.indexOf(userRow) + 1;
    sheet.getRange(rowIndex, 3).setValue(ip); // Update IP
    return { result: "success" };
  }
  return { result: "error", message: "Usuario o contraseña incorrectos" };
}

function checkIp(ip) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("User") || ss.insertSheet("User");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Username", "Password", "IP"]);
    return { result: "error" };
  }
  var data = sheet.getDataRange().getValues();
  var userRow = data.slice(1).find(row => row[2] === ip);
  if (userRow) {
    return { result: "success", username: userRow[0] };
  }
  return { result: "error" };
}
