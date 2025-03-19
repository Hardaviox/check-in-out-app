const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwv5E1pX2ZhPOPFqANrdGc7HzGW2UjvFIzLLETO9Mm4bshXIsezcDb_pbW2mwN5z-Td/exec";

let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;

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
                    mode: "cors",
                    redirect: "follow"
                })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
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
                    document.getElementById("regMessage").textContent = "Error al conectar con el servidor";
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
            scannerContainer.innerHTML = '<video id="videoElement"></video>';

            // Request camera permission and initialize Quagga
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    Quagga.init({
                        inputStream: {
                            name: "Live",
                            type: "LiveStream",
                            target: document.querySelector("#scanner-container video"),
                            constraints: {
                                facingMode: "environment"
                            }
                        },
                        decoder: { readers: ["qr_code_reader"] }
                    }, (err) => {
                        if (err) {
                            console.error("Error inicializando Quagga:", err);
                            document.getElementById("qrResult").textContent = "Error al iniciar el escáner";
                            scannerContainer.style.display = "none";
                            stream.getTracks().forEach(track => track.stop());
                            return;
                        }
                        console.log("Quagga initialized");
                        Quagga.start();
                    });

                    Quagga.onDetected((result) => {
                        const code = result.codeResult.code;
                        console.log("Código QR leído:", code);
                        Quagga.stop();
                        stream.getTracks().forEach(track => track.stop());
                        fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`, { mode: "cors" })
                            .then(response => {
                                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                                return response.json();
                            })
                            .then(ubicaciones => {
                                const ubicacion = ubicaciones.find(u => u.id === code);
                                if (ubicacion) {
                                    document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion}`;
                                    ubicacionEncontrada = ubicacion;
                                    tiempoCheckIn = null;
                                    document.getElementById("actionMessage").textContent = "";
                                    mostrarImagenQR(code);
                                } else {
                                    document.getElementById("qrResult").textContent = "Ubicación no encontrada";
                                    scannerContainer.style.display = "none";
                                    ubicacionEncontrada = null;
                                }
                            })
                            .catch(error => {
                                console.error("Error obteniendo ubicaciones:", error);
                                document.getElementById("qrResult").textContent = "Error al obtener ubicaciones";
                                scannerContainer.style.display = "none";
                            });
                    });
                })
                .catch(error => {
                    console.error("Error accediendo a la cámara:", error);
                    document.getElementById("qrResult").textContent = "Permiso de cámara denegado o no disponible";
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
    const qrImageUrl = `https://quickchart.io/qr?size=300x300&text=${encodeURIComponent(texto)}`; // Match container size
    const container = document.getElementById("scanner-container");
    container.innerHTML = "";
    const qrImage = document.createElement("img");
    qrImage.src = qrImageUrl;
    qrImage.alt = "Código QR escaneado";
    container.appendChild(qrImage);
}

// Registrar check-in/check-out
function registrar(tipo) {
    if (!nombreRegistrado || !ubicacionEncontrada) {
        document.getElementById("actionMessage").textContent = "Registre su nombre y escanee un QR primero.";
        return;
    }

    const tiempoActual = new Date();
    let payload = {
        usuario: nombreRegistrado,
        ubicacion: ubicacionEncontrada.id,
        tipo: tipo,
        timestamp: tiempoActual.toISOString()
    };

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

        fetch(URL_DEL_SCRIPT, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.result === "success") {
                const anotherLocation = confirm("¿Desea iniciar un nuevo proceso?");
                if (anotherLocation) {
                    window.location.reload();
                } else {
                    document.getElementById("actionMessage").textContent += " Sesión finalizada.";
                    document.getElementById("checkInBtn").disabled = true;
                    document.getElementById("checkOutBtn").disabled = true;
                    document.getElementById("scanQR").disabled = true;
                }
            } else {
                document.getElementById("actionMessage").textContent = "Error al registrar";
            }
        })
        .catch(error => {
            console.error("Error en check-out:", error);
            document.getElementById("actionMessage").textContent = "Error al conectar con el servidor";
        });
        return;
    }

    // Save Check-in
    fetch(URL_DEL_SCRIPT, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    })
    .catch(error => {
        console.error("Error en check-in:", error);
        document.getElementById("actionMessage").textContent = "Error al conectar con el servidor";
    });
}

// Formatear tiempo
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}
