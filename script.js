const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNZjHJ0FaQqEyl11WjwxOq0eDGWgtEi2_aSp9o7DGLYRpiiN33QL6maQD4G6OkcioJ/exec";
let ubicacionEncontrada = null;
let nombreRegistrado = null;

document.getElementById("registrarNombre").addEventListener("click", () => {
  const nombreUsuario = document.getElementById("usuarioInput").value;
  if (nombreUsuario) {
    nombreRegistrado = nombreUsuario;
    alert("Nombre registrado: " + nombreUsuario);
  } else {
    alert("Por favor, ingrese el nombre del usuario.");
  }
});

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
  fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
    .then(response => response.json())
    .then(ubicaciones => {
      let ubicacion = ubicaciones.find(u => u.id === codigoQR);
      if (ubicacion) {
        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion}`;
        ubicacionEncontrada = ubicacion.direccion;
      } else {
        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
        ubicacionEncontrada = null;
      }
    })
    .catch(error => console.error("Error obteniendo ubicaciones:", error));
});

function registrar(tipo) {
  if (nombreRegistrado && ubicacionEncontrada) {
    fetch(`${URL_DEL_SCRIPT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usuario: nombreRegistrado, ubicacion: ubicacionEncontrada, tipo: tipo })
    })
    .then(response => response.json())
    .then(data => {
      if (data.result === "success") {
        alert("Registro exitoso.");
        document.getElementById("usuarioInput").value = "";
        document.getElementById("qrResult").textContent = "";
        ubicacionEncontrada = null;
        nombreRegistrado = null;
      } else {
        alert("Error al registrar.");
      }
    })
    .catch(error => console.error("Error al registrar:", error));
  } else {
    alert("Por favor, registre el nombre del usuario y escanee el código QR de la ubicación.");
  }
}
