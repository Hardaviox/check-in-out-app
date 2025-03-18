const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbzWhmDvNfrtFdC3ydaB1Si6SY5tHpSk0Xc7AiqkYPhBCuJfb7n2Z8ZsOqvITqA8JMBi/exec";
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
                        codeReader.reset(); // Cerrar la cámara
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
                        codeReader.reset(); // Cerrar la cámara
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

function registrar(tipo) {
    if (nombreRegistrado && ubicacionEncontrada) {
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
                    document.getElementById("usuarioInput").value = "";
                    document.getElementById("qrResult").textContent = "";
                    ubicacionEncontrada = null;
                    nombreRegistrado = null;
                    tiempoCheckIn = null;
                }
                alert("Registro exitoso.");
            } else {
                alert("Error al registrar.");
            }
        })
        .catch(error => console.error("Error al registrar:", error));
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
