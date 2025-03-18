const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec";
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let codeReader = null;
let tiempoCheckIn = null; // Variable para almacenar el tiempo de check-in

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
    if (codeReader) {
        codeReader.reset();
        codeReader.decodeFromInputVideoDevice(undefined, 'scanner-container').then((result) => {
            console.log(result.text);
            fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
                .then(response => response.json())
                .then(ubicaciones => {
                    let ubicacion = ubicaciones.find(u => u.id === result.text);
                    if (ubicacion) {
                        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                        ubicacionEncontrada = ubicacion;
                        document.getElementById("scanner-container").style.display = "none"; // Ocultar la cámara
                        mostrarImagenQR(result.text); // Mostrar la imagen del código QR
                    } else {
                        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
                        ubicacionEncontrada = null;
                    }
                })
                .catch(error => console.error("Error obteniendo ubicaciones:", error));
        }).catch((err) => {
            console.error(err);
            document.getElementById("qrResult").textContent = err;
        });
    } else {
        codeReader = new ZXing.BrowserQRCodeReader();
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.QR_CODE]);
        codeReader.decodeFromInputVideoDevice(undefined, 'scanner-container', hints).then((result) => {
            console.log(result.text);
            fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
                .then(response => response.json())
                .then(ubicaciones => {
                    let ubicacion = ubicaciones.find(u => u.id === result.text);
                    if (ubicacion) {
                        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                        ubicacionEncontrada = ubicacion;
                        document.getElementById("scanner-container").style.display = "none"; // Ocultar la cámara
                        mostrarImagenQR(result.text); // Mostrar la imagen del código QR
                    } else {
                        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
                        ubicacionEncontrada = null;
                    }
                })
                .catch(error => console.error("Error obteniendo ubicaciones:", error));
        }).catch((err) => {
            console.error(err);
            document.getElementById("qrResult").textContent = err;
        });
    }
});

function mostrarImagenQR(texto) {
    const qrImageUrl = `https://quickchart.io/qr?size=150x150&text=${encodeURIComponent(texto)}`;
    const qrImage = document.createElement("img");
    qrImage.src = qrImageUrl;
    qrImage.style.width = "150px";
    qrImage.style.height = "150px";
    document.getElementById("scanner-container").parentNode.insertBefore(qrImage, document.getElementById("scanner-container"));
}

function registrar(tipo) {
    console.log("Botón clickeado:", tipo); // Depuración

    if (nombreRegistrado && ubicacionEncontrada) {
        console.log("ubicacionEncontrada:", ubicacionEncontrada); // Depuración

        // Validación adicional
        if (!ubicacionEncontrada || !ubicacionEncontrada.id) {
            console.error("Error: ubicacionEncontrada no tiene la propiedad 'id'.", ubicacionEncontrada);
            alert("Error: Ubicación no válida.");
            return; // Detener la ejecución si la ubicación no es válida
        }

        console.log("UbicacionEncontrada antes de enviar:", ubicacionEncontrada); // Registro en JavaScript

        if (tipo === "Check-in") {
            tiempoCheckIn = new Date();
            alert("Check-in iniciado en: " + tiempoCheckIn.toLocaleTimeString());
        } else if (tipo === "Check-out") {
            const tiempoCheckOut = new Date();
            const tiempoTranscurrido = tiempoCheckOut - tiempoCheckIn;
            alert("Check-out finalizado en: " + tiempoCheckOut.toLocaleTimeString() + "\nTiempo transcurrido: " + formatTiempoTranscurrido(tiempoTranscurrido));
        }

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
                if (tipo === "Check-out") {
                    location.reload(); // Actualizar la página después del check-out
                }
                alert("Registro exitoso.");
            } else {
                alert("Error al registrar.");
            }
        })
        .catch(error => console.error("Error en la solicitud:", error)); // Depuración
    } else {
        alert("Por favor, registre el nombre del usuario y escanee el código QR de la ubicación.");
    }
}

function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}
