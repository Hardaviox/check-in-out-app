const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec";
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let codeReader = null;
let tiempoCheckIn = null;
let timerInterval = null;

// Registrar nombre
document.getElementById("registrarNombre").addEventListener("click", () => {
    const nombreUsuario = document.getElementById("usuarioInput").value.trim();
    if (nombreUsuario) {
        nombreRegistrado = nombreUsuario;
        alert("Nombre registrado: " + nombreUsuario);
        document.getElementById("usuarioInput").disabled = true;
        document.getElementById("registrarNombre").disabled = true;
    } else {
        alert("Por favor, ingrese el nombre del usuario.");
    }
});

// Escanear QR
document.getElementById("scanQR").addEventListener("click", () => {
    if (!codeReader) codeReader = new ZXing.BrowserQRCodeReader();
    else codeReader.reset();

    document.getElementById("scanner-container").style.display = "block";
    codeReader.decodeFromInputVideoDevice(undefined, 'scanner-container').then(result => {
        console.log("Código QR leído:", result.text);
        fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
            .then(response => response.json())
            .then(ubicaciones => {
                const ubicacion = ubicaciones.find(u => u.id === result.text);
                if (ubicacion) {
                    ubicacionEncontrada = ubicacion;
                    document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                    codeReader.reset();
                    mostrarImagenQR(result.text);
                    document.getElementById("scanQR").disabled = true;
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

// Mostrar imagen QR
function mostrarImagenQR(texto) {
    const qrImageUrl = `https://quickchart.io/qr?size=150x150&text=${encodeURIComponent(texto)}`;
    const container = document.getElementById("scanner-container");
    container.innerHTML = "";
    const qrImage = document.createElement("img");
    qrImage.src = qrImageUrl;
    qrImage.alt = "Código QR";
    container.appendChild(qrImage);
}

// Iniciar temporizador
function startTimer() {
    const startTime = new Date();
    timerInterval = setInterval(() => {
        const now = new Date();
        const tiempoTranscurrido = now - startTime;
        document.getElementById("timerDisplay").textContent = `Tiempo transcurrido: ${formatTiempoTranscurrido(tiempoTranscurrido)}`;
    }, 1000);
}

// Registrar check-in/check-out
function registrar(tipo) {
    if (!nombreRegistrado || !ubicacionEncontrada) {
        alert("Registre su nombre y escanee un QR primero.");
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
        document.getElementById("checkInBtn").disabled = true;
        startTimer();
    } else if (tipo === "Check-out") {
        if (!tiempoCheckIn) {
            alert("Primero debe realizar un Check-in.");
            return;
        }
        clearInterval(timerInterval);
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
            if (tipo === "Check-out") resetApp();
        } else {
            alert("Error al registrar: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al conectar con el servidor.");
    });
}

// Formatear tiempo
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Reiniciar app
function resetApp() {
    nombreRegistrado = null;
    ubicacionEncontrada = null;
    tiempoCheckIn = null;
    clearInterval(timerInterval);
    document.getElementById("usuarioInput").value = "";
    document.getElementById("usuarioInput").disabled = false;
    document.getElementById("registrarNombre").disabled = false;
    document.getElementById("scanQR").disabled = false;
    document.getElementById("checkInBtn").disabled = false;
    document.getElementById("checkOutBtn").disabled = false;
    document.getElementById("qrResult").textContent = "";
    document.getElementById("timerDisplay").textContent = "";
    document.getElementById("scanner-container").innerHTML = "<video></video>";
    if (codeReader) codeReader.reset();
}

// Asignar eventos
document.getElementById("checkInBtn").addEventListener("click", () => registrar("Check-in"));
document.getElementById("checkOutBtn").addEventListener("click", () => registrar("Check-out"));
