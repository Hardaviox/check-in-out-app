const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNZjHJ0FaQqEyl11WjwxOq0eDGWgtEi2_aSp9o7DGLYRpiiN33QL6maQD4G6OkcioJ/exec";
let ubicacionEncontrada = null;

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
        ubicacionEncontrada = data.ubicacion.Address;
      } else {
        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
        ubicacionEncontrada = null;
      }
    })
    .catch(error => console.error("Error obteniendo ubicación:", error));
});

function registrar(tipo) {
  const nombreUsuario = document.getElementById("usuarioInput").value;
  if (nombreUsuario && ubicacionEncontrada) {
    fetch(`${URL_DEL_SCRIPT}?action=registrarCheck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario: nombreUsuario, ubicacion: ubicacionEncontrada, tipo: tipo })
    })
    .then(response => response.json())
    .then(data => {
      if (data.result === "success") {
        alert("Registro exitoso.");
        document.getElementById("usuarioInput").value = "";
        document.getElementById("qrResult").textContent = "";
        ubicacionEncontrada = null;
      } else {
        alert("Error al registrar.");
      }
    })
    .catch(error => console.error("Error al registrar:", error));
  } else {
    alert("Por favor, ingrese el nombre del usuario y escanee el código QR de la ubicación.");
  }
}
