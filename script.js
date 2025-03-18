const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbyq1bRRwEFD81U4OiIArX995N8sHmGPUshVgNxovhgcHos_liyCczh_GqSfEi3eVyyz/exec"; // Update with your Web App URL
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;

document.addEventListener("DOMContentLoaded", () => {
    // Get user IP for auto-login
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(data => {
            const userIp = data.ip;
            checkIpForAutoLogin(userIp);
        })
        .catch(error => console.error("Error obteniendo IP:", error));

    // Show registration form
    document.getElementById("showRegisterBtn").addEventListener("click", () => {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("registerForm").style.display = "block";
    });

    // Show login form
    document.getElementById("showLoginBtn").addEventListener("click", () => {
        document.getElementById("registerForm").style.display = "none";
        document.getElementById("loginForm").style.display = "block";
    });

    // Register
    document.getElementById("registerBtn").addEventListener("click", () => {
        const username = document.getElementById("regUsernameInput").value.trim();
        const phone = document.getElementById("regPhoneInput").value.trim();
        const password = phone.slice(-4); // Last 4 digits
        if (username && phone.length >= 4) {
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
                            alert("Registro exitoso. Ahora puede iniciar sesión.");
                            document.getElementById("registerForm").style.display = "none";
                            document.getElementById("loginForm").style.display = "block";
                        } else {
                            document.getElementById("regError").textContent = data.message || "Error al registrar";
                        }
                    })
                    .catch(error => {
                        console.error("Error en registro:", error);
                        document.getElementById("regError").textContent = "Error al conectar con el servidor";
                    });
                });
        } else {
            document.getElementById("regError").textContent = "Ingrese nombre y número de teléfono válido (mínimo 4 dígitos)";
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
                        } else {
                            document.getElementById("authError").textContent = data.message || "Error de inicio de sesión";
                        }
                    })
                    .catch(error => {
                        console.error("Error en login:", error);
                        document.getElementById("authError").textContent = "Error al conectar con el servidor";
                    });
                });
        } else {
            document.getElementById("authError").textContent = "Ingrese nombre y contraseña";
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
        alert("Inicie sesión y escanee un QR primero.");
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
            alert("Registro exitoso.");
            if (tipo === "Check-out") resetApp();
        } else {
            alert("Error al registrar: " + (data.message || "Desconocido"));
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
        alert("Error al conectar con el servidor: " + error.message);
    });
}

// Formatear tiempo
function formatTiempoTranscurrido(tiempo) {
    const segundos = Math.floor(tiempo / 1000) % 60;
    const minutos = Math.floor(tiempo / (1000 * 60)) % 60;
    const horas = Math.floor(tiempo / (1000 * 60 * 60));
    return `${horas}h ${minutos}m ${segundos}s`;
}

// Reset app
function resetApp() {
    ubicacionEncontrada = null;
    tiempoCheckIn = null;
    document.getElementById("qrResult").textContent = "";
    document.getElementById("scanner-container").innerHTML = "";
    document.getElementById("scanner-container").style.display = "none";
}
