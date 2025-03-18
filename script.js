const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNZjHJ0FaQqEyl11WjwxOq0eDGWgtEi2_aSp9o7DGLYRpiiN33QL6maQD4G6OkcioJ/exec";

function buscarUsuario() {
  const nombreUsuario = document.getElementById("usuarioInput").value;
  console.log("Nombre del usuario ingresado:", nombreUsuario);
  fetch(`${URL_DEL_SCRIPT}?action=buscarUsuario&nombre=${encodeURIComponent(nombreUsuario)}`)
    .then(response => response.json())
    .then(data => {
      console.log("Respuesta del servidor:", data);
      if (data.usuario) {
        alert(`Usuario encontrado: ${data.usuario}`);
        // Aquí puedes agregar lógica para mostrar más información del usuario
      } else {
        alert("Usuario no encontrado.");
      }
    })
    .catch(error => console.error("Error buscando usuario:", error));
}

document.getElementById("scanQR").addEventListener("click", () => {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector("#scanner-container")
    },
    decoder: {
      readers: ["qr_code_reader"]
    }
  }, function(err) {
    if (err) {
      console.error(err);
      return;
    }
    Quagga.start();
  });
});

Quagga.onDetected(function(data) {
  Quagga.stop();
  const codigoQR = data.codeResult.code;
  fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicacionQR&codigo=${encodeURIComponent(codigoQR)}`)
    .then(response => response.json())
    .then(data => {
      if (data.ubicacion) {
        document.getElementById("qrResult").textContent = `Ubicación: ${data.ubicacion.Address}`;
        // Aquí puedes agregar lógica para usar la información de la ubicación
      } else {
        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
      }
    })
    .catch(error => console.error("Error obteniendo ubicación:", error));
});

function registrar(tipo) {
  // Aquí puedes agregar la lógica para registrar el check-in/check-out.
  console.log("Registrar:", tipo);
}
