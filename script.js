const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec"; // Update with your Web App URL
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null; // Tracks check-in time for the current QR

document.addEventListener("DOMContentLoaded", () => {
    // Get user IP for auto-login
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => checkIpForAutoLogin(data.ip))
        .catch(error => console.error("Error obteniendo IP:", error));

    // Register
    document.getElementById("registerBtn").addEventListener("click", () => {
        const username = document.getElementById("usernameInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        if (username && password.length === 4 && /^\d{4}$/.test(password)) {
            fetch("https://api.ipify.org?format=json")
                .then(response => response.json())
                .then(data => {
                    const ip = data.ip;
                    fetch(`${URL_DEL_SCRIPT}?action=register&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&ip=${encodeURIComponent(ip)}`, {
                        method: "GET",
                        mode: "cors"
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.result === "success") {
                            document.getElementById("authMessage").textContent = `Usuario ${username} registrado exitosamente. Ahora puede iniciar sesión.`;
                            document.getElementById("usernameInput").value = "";
                            document.getElementById("passwordInput").value = "";
                        } else {
                            document.getElementById("authMessage").textContent = data.message || "Error al registrar";
                        }
                    })
                    .catch(error => {
                        console.error("Error en registro:", error);
                        document.getElementById("authMessage").textContent = "Error al conectar con el servidor";
                    });
                });
        } else {
            document.getElementById("authMessage").textContent = "Ingrese nombre y 4 dígitos numéricos como contraseña";
        }
    });

    // Login
    document.getElementById("loginBtn").addEventListener("click", () => {
        const username = document.getElementById("usernameInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        if (username && password) {
            fetch("https://api.ipify.org?format=json")
                .then(response => response.json())
                .then(data => {
                    const ip = data.ip;
                    fetch(`${URL_DEL_SCRIPT}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&ip=${encodeURIComponent(ip)}`, {
                        method: "GET",
                        mode: "cors"
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.result === "success") {
                            nombreRegistrado = username;
                            document.getElementById("authSection").style.display = "none";
                            document.getElementById("appSection").style.display = "block";
                            document.getElementById("welcomeMessage").textContent = `Bienvenido, ${username}`;
                            document.getElementById("authMessage").textContent = "";
                        } else {
                            document.getElementById("authMessage").textContent = data.message || "Error de inicio de sesión";
                        }
                    })
                    .catch(error => {
                        console.error("Error en login:", error);
                        document.getElementById("authMessage").textContent = "Error al conectar con el servidor";
                    });
                });
        } else {
            document.getElementById("authMessage").textContent = "Ingrese nombre y contraseña";
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
                        tiempoCheckIn = null; // Reset check-in time for new QR
                        document.getElementById("actionMessage").textContent = ""; // Clear previous message
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
        document.getElementById("authSection").style.display = "block";
        document.getElementById("usernameInput").value = "";
        document.getElementById("passwordInput").value = "";
        document.getElementById("qrResult").textContent = "";
        document.getElementById("actionMessage").textContent = "";
        document.getElementById("scanner-container").innerHTML = "";
    });
});

// Auto-login based on IP
function checkIpForAutoLogin(ip) {
    fetch(`${URL_DEL_SCRIPT}?action=checkIp&ip=${encodeURIComponent(ip)}`, { mode: "cors" })
        .then(response => response.json())
        .then(data => {
            if (data.result === "success" && data.username) {
                nombreRegistrado = data.username;
                document.getElementById("authSection").style.display = "none";
                document.getElementById("appSection").style.display = "block";
                document.getElementById("welcomeMessage").textContent = `Bienvenido, ${data.username} (inicio automático)`;
            }
        })
        .catch(error => console.error("Error verificando IP:", error));
}

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
        document.getElementById("actionMessage").textContent = "Inicie sesión y escanee un QR primero.";
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
        document.getElementById("actionMessage").textContent = `Check-out registrado para ${nombreRegistr
