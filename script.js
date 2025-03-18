const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec";
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let codeReader = null;
let tiempoCheckIn = null;

// Registrar nombre del usuario
document.getElementById("registrarNombre").addEventListener("click", () => {
    const nombreUsuario = document.getElementById("usuarioInput").value.trim();
    if (nombreUsuario) {
        nombreRegistrado = nombreUsuario;
        alert("Nombre registrado: " + nombreUsuario);
    } else {
        alert("Por favor, ingrese el nombre del usuario.");
    }
});

// Escanear QR
document.getElementById("scanQR").addEventListener("click", () => {
    if (!codeReader) {
        codeReader = new ZXing.BrowserQRCodeReader();
    } else {
        codeReader.reset(); // Reiniciar el lector si ya existe
    }

    codeReader.decodeFromInputVideoDevice(undefined, 'scanner-container').then((result) => {
        console.log("Código QR leído:", result.text);
        fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
            .then(response => response.json())
            .then(ubicaciones => {
                console.log("Lista de ubicaciones:", ubicaciones);
                const ubicacion = ubicaciones.find(u => u.id === result.text);
                if (ubicacion) {
                    document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                    ubicacionEncontrada = ubicacion;
                    codeReader.reset(); // Detener la cámara
                    document.getElementById("scanner-container").style.display = "none"; // Ocultar contenedor de cámara
                    mostrarImagenQR(result.text); // Mostrar imagen del QR
                } else {
                    document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
                    ubicacionEncontrada = null;
                }
            })
            .catch(error => {
                console.error("Error obteniendo ubicaciones:", error);
                document.getElementById("qrResult").textContent = "Error al obtener ubicaciones.";
            });
    }).catch(err => {
        console.error("Error al escanear QR:", err);
        document.getElementById("qrResult").textContent = "Error al escanear el QR.";
    });
});

// Mostrar imagen del QR en lugar de la cámara
function mostrarImagenQR(texto) {
    const qrImageUrl = `https://quickchart.io/qr?size=150x150&text=${encodeURIComponent(texto)}`;
    const qrImageContainer = document.getElementById("scanner-container");
    qrImageContainer.innerHTML = ""; // Limpiar el contenedor
    const qrImage = document.createElement("img");
    qrImage.src = qrImageUrl;
    qrImage.style.width = "150px";
    qrImage.style.height = "150px";
    qrImageContainer.appendChild(qrImage);
}

// Registrar check-in o check-out
function registrar(tipo) {
    if (!nombreRegistrado || !ubicacionEncontrada) {
        alert("Por favor, registre el nombre del usuario y escanee el código QR de la ubicación.");
        return;
    }

    const tiempoActual = new Date();
    let payload = {
        usuario: nombreRegistrado,
        ubicacion: ubicacionEncontrada,
        tipo: tipo,
        timestamp: tiempoActual.toISOString()
    };

    if (tipo === "Check-in") {
        tiempoCheckIn = tiempoActual;
        alert("Check-in iniciado en: " + tiempoCheckIn.toLocaleTimeString());
    } else if (tipo === "Check-out") {
        if (!tiempoCheckIn) {
            alert("Primero debe realizar un Check-in.");
            return;
        }
        const tiempoCheckOut = tiempoActual;
        const tiempoTranscurrido = tiempoCheckOut - tiempoCheckIn;
        payload.tiempoTranscurrido = formatTiempoTranscurrido(tiempoTranscurrido);
        alert("Check-out finalizado en: " + tiempoCheckOut.toLocaleTimeString() + "\nTiempo transcurrido: " + payload.tiempoTranscurrido);
    }

    fetch(URL_DEL_SCRIPT, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === "success") {
            alert("Registro exitoso.");
            if (tipo === "Check-out") {
                resetApp(); // Reiniciar la aplicación tras check-out
            }
        } else {
            alert("Error al registrar: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        alert("Error al conectar con el servidor.");
    });
}

// Formatear tiempo transcurrido
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Reiniciar la aplicación
function resetApp() {
    nombreRegistrado = null;
    ubicacionEncontrada = null;
    tiempoCheckIn = null;
    document.getElementById("usuarioInput").value = "";
    document.getElementById("qrResult").textContent = "";
    document.getElementById("scanner-container").innerHTML = "";
    document.getElementById("scanner-container").style.display = "block";
    if (codeReader) {
        codeReader.reset();
    }
}

// Asignar eventos a botones de check-in/check-out (asegúrate de tener estos IDs en tu HTML)
document.getElementById("checkInBtn")?.addEventListener("click", () => registrar("Check-in"));
document.getElementById("checkOutBtn")?.addEventListener("click", () => registrar("Check-out"));
