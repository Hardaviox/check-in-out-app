const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwQXDwSMXisYvKRrkdeW013Y3990pJ3W1g4hX-VBBb038bUKdCg1W3GSSuTlO1aAMOI/exec";

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
                fetch(`<span class="math-inline">\{URL\_DEL\_SCRIPT\}?action\=register&username\=</span>{encodeURIComponent(username)}`, {
                    method: "GET",
                    mode: "cors",
                    redirect: "follow"
                })
                .then(response => {
                    console.log("Register fetch status:", response.status);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log("Register fetch data:", data);
                    if (data.result === "success") {
                        nombreRegistrado = username;
                        document.getElementById("regMessage").textContent = "Nombre registrado";
                        document.getElementById("nameSection").style.display = "none";
                        document.getElementById("appSection").style.display = "block";
                        document.getElementById("welcomeMessage").textContent = `Bienvenido, ${username}`;
                    } else {
                        document.getElementById("regMessage").textContent = "Error al registrar";
                    }
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
                        fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`, { mode: "cors" })
                            .then(response => {
                                console.log("Ubicaciones fetch response:", response);
                                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                                return response.json();
                            })
                            .then(ubicaciones => {
                                console.log("Ubicaciones recibidas:", ubicaciones);
                                if (ubicaciones && ubicaciones.result && Array.isArray(ubicaciones.result)) {
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
                                } else {
                                    console.error("Error: ubicaciones.result is not valid:", ubicaciones);
                                    document.getElementById("qrResult").textContent = "Error: Datos de ubicaciones inválidos.";
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
    console.log("registrar function called");
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
    console.log("Sending POST request:", payload);
    console.log("Fetch options:", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

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

    fetch(URL_DEL_SCRIPT, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log(`${tipo} fetch status:`, response.status);
        console.log(`${tipo} fetch headers:`, [...response.headers]);
        if (!response.ok) throw
