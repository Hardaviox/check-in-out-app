const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec"; // Update with your Web App URL
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;

document.addEventListener("DOMContentLoaded", () => {
    // Initial choice buttons
    document.getElementById("chooseRegisterBtn").addEventListener("click", () => {
        document.getElementById("choiceSection").style.display = "none";
        document.getElementById("registerSection").style.display = "block";
    });

    document.getElementById("chooseLoginBtn").addEventListener("click", () => {
        document.getElementById("choiceSection").style.display = "none";
        document.getElementById("loginSection").style.display = "block";
        checkIpForAutoLogin(); // Check IP for auto-login
    });

    // Back to choice from registration
    document.getElementById("backToChoiceFromRegBtn").addEventListener("click", () => {
        document.getElementById("registerSection").style.display = "none";
        document.getElementById("choiceSection").style.display = "block";
        document.getElementById("regMessage").textContent = "";
        document.getElementById("regUsernameInput").value = "";
        document.getElementById("regPasswordInput").value = "";
    });

    // Back to choice from login
    document.getElementById("backToChoiceFromLoginBtn").addEventListener("click", () => {
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("choiceSection").style.display = "block";
        document.getElementById("loginMessage").textContent = "";
        document.getElementById("loginUsernameInput").value = "";
        document.getElementById("loginPasswordInput").value = "";
    });

    // Register
    document.getElementById("registerBtn").addEventListener("click", () => {
        const username = document.getElementById("regUsernameInput").value.trim();
        const password = document.getElementById("regPasswordInput").value.trim();
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
                            document.getElementById("regMessage").textContent = `Usuario ${username} registrado exitosamente. Ahora puede iniciar sesión.`;
                            document.getElementById("regUsernameInput").value = "";
                            document.getElementById("regPasswordInput").value = "";
                        } else {
                            document.getElementById("regMessage").textContent = data.message || "Error al registrar";
                        }
                    })
                    .catch(error => {
                        console.error("Error en registro:", error);
                        document.getElementById("regMessage").textContent = "Error al conectar con el servidor";
                    });
                })
                .catch(error => {
                    console.error("Error obteniendo IP:", error);
                    document.getElementById("regMessage").textContent = "Error al obtener IP";
                });
        } else {
            document.getElementById("regMessage").textContent = "Ingrese nombre y 4 dígitos numéricos como contraseña";
        }
    });

    // Login
    document.getElementById("loginBtn").addEventListener("click", () => {
        const username = document.getElementById("loginUsernameInput").value.trim();
        const password = document.getElementById("loginPasswordInput").value.trim();
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
                            document.getElementById("loginSection").style.display = "none";
                            document.getElementById("appSection").style.display = "block";
                            document.getElementById("welcomeMessage").textContent = `Bienvenido, ${username}`;
                            document.getElementById("loginMessage").textContent = "";
                        } else {
                            document.getElementById("loginMessage").textContent = data.message || "Error de inicio de sesión";
                        }
                    })
                    .catch(error => {
                        console.error("Error en login:", error);
                        document.getElementById("loginMessage").textContent = "Error al conectar con el servidor";
                    });
                })
                .catch(error => {
                    console.error("Error obteniendo IP:", error);
                    document.getElementById("loginMessage").textContent = "Error al obtener IP";
                });
        } else {
            document.getElementById("loginMessage").textContent = "Ingrese nombre y contraseña";
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

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        nombreRegistrado = null;
        ubicacionEncontrada = null;
        tiempoCheckIn = null;
        document.getElementById("appSection").style.display = "none";
        document.getElementById("choiceSection").style.display = "block";
        document.getElementById("qrResult").textContent = "";
        document.getElementById("actionMessage").textContent = "";
        document.getElementById("scanner-container").innerHTML = "";
    });
});

// Auto-login based on IP
function checkIpForAutoLogin() {
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => {
            const ip = data.ip;
            fetch(`${URL_DEL_SCRIPT}?action=checkIp&ip=${encodeURIComponent(ip)}`, { mode: "cors" })
                .then(response => response.json())
                .then(data => {
                    if (data.result === "success" && data.username) {
                        nombreRegistrado = data.username;
                        document.getElementById("loginSection").style.display = "none";
                        document.getElementById("appSection").style.display = "block";
                        document.getElementById("welcomeMessage").textContent = `Bienvenido, ${data.username} (inicio automático)`;
                    }
                })
                .catch(error => console.error("Error verificando IP:", error));
        })
        .catch(error => console.error("Error obteniendo IP:", error));
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
        document.getElementById("actionMessage").textContent = `Check-out registrado para ${nombreRegistrado} en ${ubicacionEncontrada.direccion} a las ${tiempoCheckOut.toLocaleTimeString()}. Tiempo transcurrido: ${formatTiempoTranscurrido(tiempoTranscurrido)}`;
    }

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
            if (tipo === "Check-out") resetQR();
        } else {
            document.getElementById("actionMessage").textContent = "Error al registrar: " + (data.message || "Desconocido");
        }
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

// Reset QR-specific data
function resetQR() {
    ubicacionEncontrada = null;
    tiempoCheckIn = null;
    document.getElementById("qrResult").textContent = "";
    document.getElementById("actionMessage").textContent = "";
    document.getElementById("scanner-container").innerHTML = "";
    document.getElementById("scanner-container").style.display = "none";
}
