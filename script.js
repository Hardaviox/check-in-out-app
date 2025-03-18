const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNZjHJ0FaQqEyl11WjwxOq0eDGWgtEi2_aSp9o7DGLYRpiiN33QL6maQD4G6OkcioJ/exec";

function buscarUsuario() {
  const nombreUsuario = document.getElementById("usuarioInput").value;
  // Aquí puedes agregar lógica para buscar el usuario en tu hoja de cálculo
  // y mostrar el resultado (opcional).
  console.log("Buscar usuario:", nombreUsuario);
}

document.getElementById("scanQR").addEventListener("click", () => {
  // Aquí puedes agregar lógica para abrir la cámara y escanear el código QR.
  // Puedes usar una librería como QuaggaJS o ZXing.
  console.log("Escanear QR");
  // Ejemplo simulado:
  const ubicacionQR = { id: "QR123", direccion: "Dirección del QR" };
  document.getElementById("qrResult").textContent = `Ubicación: ${ubicacionQR.id} - ${ubicacionQR.direccion}`;
});

function registrar(tipo) {
  // Aquí puedes agregar la lógica para registrar el check-in/check-out.
  console.log("Registrar:", tipo);
}
