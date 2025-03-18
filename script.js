const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec";
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;

document.addEventListener("DOMContentLoaded", () => {
    // Login
    document.getElementById("loginBtn").addEventListener("click", () => {
        const username = document.getElementById("usernameInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        if (username && password) {
            fetch(`${URL_DEL_SCRIPT}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.result === "success") {
                        nombreRegistrado = username;
                        document.getElementById("loginSection").style.display = "none";
                        document.getElementById("appSection").style.display = "block";
                        document.getElementById("welcomeMessage").textContent = `Bienvenido, ${username}`;
                    } else {
                        document.getElementById("loginError").textContent = data.message || "Error de inicio de sesión";
                    }
                })
                .catch(error => {
                    console.error("Error en login:", error);
                    document.getElementById("loginError").textContent = "Error al conectar con el servidor";
                });
        } else {
            document.getElementById("loginError").textContent = "Ingrese usuario y contraseña";
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
                constraints: { facingMode: "environment" } // Rear camera
            },
            decoder: { readers: ["qr_code_reader"] }
        }, (err) => {
            if (err) {
                console.error("Error inicializando Quagga:", err);
                document.getElementById("qrResult").textContent = "Error al iniciar el escáner";
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((result) => {
            const code = result.codeResult.code;
            console.log("Código QR leído:", code);
            Quagga.stop();
            scannerContainer.style.display = "none";
            fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
                .then(response => response.json())
                .then(ubicaciones => {
                    const ubicacion = ubicaciones.find(u => u.id === code);
                    if (ubicacion) {
                        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                        ubicacionEncontrada = ubicacion;
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

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        nombreRegistrado = null;
        ubicacionEncontrada = null;
        tiempoCheckIn = null;
        document.getElementById("appSection").style.display = "none";
        document.getElementById("loginSection").style.display = "block";
        document.getElementById("usernameInput").value = "";
        document.getElementById("passwordInput").value = "";
        document.getElementById("qrResult").textContent = "";
        document.getElementById("scanner-container").innerHTML = "";
    });
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
        alert("Inicie sesión y escanee un QR primero.");
        return;
    }

    const tiempoActual = new Date();
    let payload = {
        usuario: nombreRegistrado,
        ubicacion: ubicacionEncontrada.id, // Only send ID to match sheet
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
        alert("Check-out finalizado en: " + tiempoCheckOut.toLocaleTimeString() + "\nTiempo transcurrido: " + formatTiempoTranscurrido(tiempoTranscurrido));
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
            alert("Error al registrar: " + (data.message || "Desconocido"));
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al conectar con el servidor.");
    });
}

// Formatear tiempo (for display only)
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Reset app after check-out
function resetApp() {
    ubicacionEncontrada = null;
    tiempoCheckIn = null;
    document.getElementById("qrResult").textContent = "";
    document.getElementById("scanner-container").innerHTML = "";
    document.getElementById("scanner-container").style.display = "none";
}
