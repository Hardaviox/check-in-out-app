const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNhBxxAm4O8YbyxlE9YrJLj3pkYi2zvtOUKv67kBxkyXdlqGz72r3WfnemhM4faxrR/exec";

let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;
let qrReader = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded - App starting");

    // Register
    const registerBtn = document.getElementById("registerBtn");
    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            const username = document.getElementById("usernameInput").value.trim();
            if (username) {
                console.log("Registering user:", username);
                fetch(`${URL_DEL_SCRIPT}?action=register&username=${encodeURIComponent(username)}`, {
                    method: "GET",
                    mode: "no-cors", // Changed to no-cors
                    redirect: "follow"
                })
                .then(response => {
                    console.log("Register fetch status:", response.status); // 0 with no-cors
                    // Assume success since we can't read the response
                    nombreRegistrado = username;
                    document.getElementById("regMessage").textContent = "Nombre registrado";
                    document.getElementById("nameSection").style.display = "none";
                    document.getElementById("appSection").style.display = "block";
                    document.getElementById("welcomeMessage").textContent = `Bienvenido, ${username}`;
                })
                .catch(error => {
                    console.error("Error en registro:", error);
                    document.getElementById("regMessage").textContent = "Error al conectar con el servidor: " + error.message;
                });
            } else {
                document.getElementById("regMessage").textContent = "Ingrese su nombre";
            }
        });
    }

    // Escanear QR
    const scanQRBtn = document.getElementById("scanQR");
    if (scanQRBtn) {
        scanQRBtn.addEventListener("click", () => {
            console.log("Starting QR scan");
            const scannerContainer = document.getElementById("scanner-container");
            scannerContainer.style.display = "block";
            scannerContainer.innerHTML = "";

            qrReader = new Html5Qrcode("scanner-container");
            qrReader.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    console.log("Código QR leído:", decodedText);
                    qrReader.stop().then(() => {
                        fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`, { mode: "no-cors" })
                            .then(response => {
                                console.log("Ubicaciones fetch status:", response.status); // 0 with no-cors
                                // Hardcoded locations since we can't fetch with no-cors
                                const ubicaciones = {
                                    result: [
                                        { id: "1", direccion: "Direccion 1" },
                                        { id: "2", direccion: "Direccion 2" }
                                        // Replace with your actual "Ubicaciones" sheet data
                                    ]
                                };
                                console.log("Hardcoded ubicaciones:", ubicaciones);
                                const ubicacion = ubicaciones.result.find(u => u.id === decodedText);
                                if (ubicacion) {
                                    console.log("Ubicación encontrada:", ubicacion);
                                    document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion}`;
                                    ubicacionEncontrada = ubicacion;
                                    tiempoCheckIn = null;
                                    document.getElementById("actionMessage").textContent = "";
                                    mostrarImagenQR(decodedText);
                                } else {
                                    console.log("No se encontró ubicación para:", decodedText);
                                    document.getElementById("qrResult").textContent = "Ubicación no encontrada";
                                    scannerContainer.style.display = "none";
                                    ubicacionEncontrada = null;
                                }
                            })
                            .catch(error => {
                                console.error("Error obteniendo ubicaciones:", error);
                                document.getElementById("qrResult").textContent = "Error al obtener ubicaciones: " + error.message;
                                scannerContainer.style.display = "none";
                            });
                    });
                },
                (error) => {
                    console.warn("Error durante el escaneo:", error);
                }
            ).catch(error => {
                console.error("Error iniciando el escáner:", error);
                document.getElementById("qrResult").textContent = "Error al iniciar el escáner o permiso denegado";
                scannerContainer.style.display = "none";
            });
        });
    }

    // Check-in
    const checkInBtn = document.getElementById("checkInBtn");
    if (checkInBtn) {
        checkInBtn.addEventListener("click", () => {
            registrar("Check-in");
        });
    }

    // Check-out
    const checkOutBtn = document.getElementById("checkOutBtn");
    if (checkOutBtn) {
        checkOutBtn.addEventListener("click", () => {
            registrar("Check-out");
        });
    }
});

// Mostrar imagen QR
function mostrarImagenQR(texto) {
    console.log("Showing QR image for:", texto);
    const qrImageUrl = `https://quickchart.io/qr?size=300x300&text=${encodeURIComponent(texto)}`;
    const container = document.getElementById("scanner-container");
    container.innerHTML = "";
    const qrImage = document.createElement("img");
    qrImage.src = qrImageUrl;
    qrImage.alt = "Código QR escaneado";
    container.appendChild(qrImage);
}

// Registrar check-in/check-out
function registrar(tipo) {
    if (!nombreRegistrado || !ubicacionEncontrada || !ubicacionEncontrada.id) {
        document.getElementById("actionMessage").textContent = "Registre su nombre y escanee un QR válido primero.";
        console.log("Registro fallido - Datos faltantes:", { nombreRegistrado, ubicacionEncontrada });
        return;
    }

    const tiempoActual = new Date();
    const payload = {
        usuario: nombreRegistrado,
        ubicacion: ubicacionEncontrada.id,
        tipo: tipo.toLowerCase(),
        timestamp: tiempoActual.toISOString()
    };
    console.log("Sending payload for", tipo, ":", payload);

    if (tipo === "Check-in") {
        if (tiempoCheckIn) {
            document.getElementById("actionMessage").textContent = "Ya ha iniciado un Check-in en esta ubicación.";
            return;
        }
        tiempoCheckIn = tiempoActual;
        document.getElementById("actionMessage").textContent = `Check-in iniciado a las ${tiempoCheckIn.toLocaleTimeString()}`;
    } else if (tipo === "Check-out") {
        if (!tiempoCheckIn) {
            document.getElementById("actionMessage").textContent = "Primero debe realizar un Check-in.";
            return;
        }
        const tiempoCheckOut = tiempoActual;
        const tiempoTranscurrido = tiempoCheckOut - tiempoCheckIn;
        document.getElementById("actionMessage").textContent = `Check-out registrado a las ${tiempoCheckOut.toLocaleTimeString()}. Duración: ${formatTiempoTranscurrido(tiempoTranscurrido)}`;
    }

    fetch(`${URL_DEL_SCRIPT}?action=registrar`, {
        method: "POST",
        mode: "no-cors", // Changed to no-cors
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log(`${tipo} fetch status:`, response.status); // 0 with no-cors
        // Assume success
        if (tipo === "Check-out") {
            const anotherLocation = confirm("¿Desea iniciar un nuevo proceso?");
            if (anotherLocation) {
                window.location.reload();
            } else {
                document.getElementById("actionMessage").textContent += " Sesión finalizada.";
                document.getElementById("checkInBtn").disabled = true;
                document.getElementById("checkOutBtn").disabled = true;
                document.getElementById("scanQR").disabled = true;
            }
        }
    })
    .catch(error => {
        console.error(`Error en ${tipo}:`, error);
        document.getElementById("actionMessage").textContent = `Error al conectar con el servidor: ${error.message}`;
        if (tipo === "Check-in") tiempoCheckIn = null;
    });
}

// Formatear tiempo
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}
