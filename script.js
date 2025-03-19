const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec"; // Update with your Web App URL
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;

document.addEventListener("DOMContentLoaded", () => {
    // Register
    document.getElementById("registerBtn").addEventListener("click", () => {
        const username = document.getElementById("usernameInput").value.trim();
        if (username) {
            fetch(`${URL_DEL_SCRIPT}?action=register&username=${encodeURIComponent(username)}`, {
                method: "GET",
                mode: "cors"
            })
            .then(response => response.json())
            .then(data => {
                if (data.result === "success") {
                    nombreRegistrado = username;
                    document.getElementById("regMessage").textContent = `Usuario ${username} registrado exitosamente.`;
                    document.getElementById("nameSection").style.display = "none";
                    document.getElementById("appSection").style.display = "block";
                    document.getElementById("welcomeMessage").textContent = `Bienvenido, ${username}`;
                } else {
                    document.getElementById("regMessage").textContent = data.message || "Error al registrar";
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

    // Escanear QR
    document.getElementById("scanQR").addEventListener("click", () => {
        const scannerContainer = document.getElementById("scanner-container");
        scannerContainer.style.display = "block";
        scannerContainer.innerHTML = '<video id="videoElement"></video>';

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector("#scanner-container video"),
                constraints: { facingMode: "environment" }
            },
            decoder: { readers: ["qr_code_reader"] }
        }, (err) => {
            if (err) {
                console.error("Error inicializando Quagga:", err);
                document.getElementById("qrResult").textContent = "Error al iniciar el escáner";
                scannerContainer.style.display = "none";
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((result) => {
            const code = result.codeResult.code;
            console.log("Código QR leído:", code);
            Quagga.stop();
            scannerContainer.style.display = "none";
            fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`, { mode: "cors" })
                .then(response => response.json())
                .then(ubicaciones => {
                    const ubicacion = ubicaciones.find(u => u.id === code);
                    if (ubicacion) {
                        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                        ubicacionEncontrada = ubicacion;
                        tiempoCheckIn = null;
                        document.getElementById("actionMessage").textContent = "";
                        mostrarImagenQR(code);
                    } else {
                        document.getElementById("qrResult").textContent = "Ubicación no encontrada";
                        ubicacionEncontrada = null;
                    }
                })
                .catch(error => {
                    console.error("Error obteniendo ubicaciones:", error);
                    document.getElementById("qrResult").textContent = "Error al obtener ubicaciones";
                });
        });
    });

    // Check-in
    document.getElementById("checkInBtn").addEventListener("click", () => registrar("Check-in"));

    // Check-out
    document.getElementById("checkOutBtn").addEventListener("click", () => registrar("Check-out"));
});

// Mostrar imagen QR
function mostrarImagenQR(texto) {
    const qrImageUrl = `https://quickchart.io/qr?size=150x150&text=${encodeURIComponent(texto)}`;
    const container = document.getElementById("scanner-container");
    container.style.display = "block";
    container.innerHTML = "";
    const qrImage = document.createElement("img");
    qrImage.src = qrImageUrl;
    qrImage.style.width = "150px";
    qrImage.style.height = "150px";
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
            document.getElementById("actionMessage").textContent = "Ya ha realizado un Check-in en esta ubicación. Complete el Check-out primero.";
            return;
        }
        tiempoCheckIn = tiempoActual;
        document.getElementById("actionMessage").textContent = `Check-in registrado para ${nombreRegistrado} en ${ubicacionEncontrada.direccion} a las ${tiempoCheckIn.toLocaleTimeString()}`;
    } else if (tipo === "Check-out") {
        if (!tiempoCheckIn) {
            document.getElementById("actionMessage").textContent = "Primero debe realizar un Check-in.";
            return;
        }
        const tiempoCheckOut = tiempoActual;
        const tiempoTranscurrido = tiempoCheckOut - tiempoCheckIn;
        document.getElementById("actionMessage").textContent = `Check-out registrado para ${nombreRegistrado} en ${ubicacionEncontrada.direccion} a las ${tiempoCheckOut.toLocaleTimeString()}. Duración: ${formatTiempoTranscurrido(tiempoTranscurrido)}`;

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
                const anotherLocation = confirm("¿Desea registrar otra ubicación?");
                if (anotherLocation) {
                    window.location.reload(); // Refresh to start over
                } else {
                    document.getElementById("actionMessage").textContent += " Sesión finalizada.";
                    document.getElementById("checkInBtn").disabled = true;
                    document.getElementById("checkOutBtn").disabled = true;
                    document.getElementById("scanQR").disabled = true;
                }
            } else {
                document.getElementById("actionMessage").textContent = "Error al registrar: " + (data.message || "Desconocido");
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
            document.getElementById("actionMessage").textContent = "Error al conectar con el servidor: " + error.message;
        });
        return; // Exit early, check-out handled above
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
        return response.json();
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        document.getElementById("actionMessage").textContent = "Error al conectar con el servidor: " + error.message;
    });
}

// Formatear tiempo
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}
