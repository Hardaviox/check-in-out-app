const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwv5E1pX2ZhPOPFqANrdGc7HzGW2UjvFIzLLETO9Mm4bshXIsezcDb_pbW2mwN5z-Td/exec";

let ubicacionEncontrada = null;
let nombreRegistrado = null;
let tiempoCheckIn = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded - App starting");

    // Register
    const registerBtn = document.getElementById("registerBtn");
    if (registerBtn) {
        console.log("Register button found");
        registerBtn.addEventListener("click", () => {
            alert("Register button clicked - Starting registration");
            console.log("Register button clicked");
            const username = document.getElementById("usernameInput").value.trim();
            if (username) {
                console.log("Attempting to register user:", username);
                fetch(`${URL_DEL_SCRIPT}?action=register&username=${encodeURIComponent(username)}`, {
                    method: "GET",
                    mode: "cors",
                    redirect: "follow" // Ensure redirects are handled
                })
                .then(response => {
                    console.log("Register fetch response status:", response.status);
                    console.log("Register fetch response headers:", [...response.headers]);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log("Register fetch data:", data);
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
                    document.getElementById("regMessage").textContent = "Error al conectar con el servidor: " + error.message;
                });
            } else {
                document.getElementById("regMessage").textContent = "Ingrese su nombre";
                console.log("No username entered");
            }
        });
    } else {
        console.error("Register button not found in DOM");
    }

    // Escanear QR
    const scanQRBtn = document.getElementById("scanQR");
    if (scanQRBtn) {
        scanQRBtn.addEventListener("click", () => {
            alert("Scan QR button clicked");
            console.log("Scan QR button clicked");
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
                console.log("Quagga initialized successfully");
                Quagga.start();
            });

            Quagga.onDetected((result) => {
                const code = result.codeResult.code;
                console.log("Código QR leído:", code);
                Quagga.stop();
                scannerContainer.style.display = "none";
                fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`, { mode: "cors" })
                    .then(response => {
                        console.log("Ubicaciones fetch response status:", response.status);
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.json();
                    })
                    .then(ubicaciones => {
                        console.log("Ubicaciones data:", ubicaciones);
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
    }

    // Check-in
    const checkInBtn = document.getElementById("checkInBtn");
    if (checkInBtn) {
        checkInBtn.addEventListener("click", () => {
            alert("Check-in button clicked");
            console.log("Check-in button clicked");
            registrar("Check-in");
        });
    }

    // Check-out
    const checkOutBtn = document.getElementById("checkOutBtn");
    if (checkOutBtn) {
        checkOutBtn.addEventListener("click", () => {
            alert("Check-out button clicked");
            console.log("Check-out button clicked");
            registrar("Check-out");
        });
    }
});

// Mostrar imagen QR
function mostrarImagenQR(texto) {
    console.log("Generating QR image for:", texto);
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
        console.log("Missing name or location");
        return;
    }

    const tiempoActual = new Date();
    let payload = {
        usuario: nombreRegistrado,
        ubicacion: ubicacionEncontrada.id,
        tipo: tipo,
        timestamp: tiempoActual.toISOString()
    };
    console.log("Payload for", tipo, ":", payload);

    if (tipo === "Check-in") {
        if (tiempoCheckIn) {
            document.getElementById("actionMessage").textContent = "Ya ha realizado un Check-in en esta ubicación. Complete el Check-out primero.";
            console.log("Check-in already exists");
            return;
        }
        tiempoCheckIn = tiempoActual;
        document.getElementById("actionMessage").textContent = `Check-in registrado para ${nombreRegistrado} en ${ubicacionEncontrada.direccion} a las ${tiempoCheckIn.toLocaleTimeString()}`;
    } else if (tipo === "Check-out") {
        if (!tiempoCheckIn) {
            document.getElementById("actionMessage").textContent = "Primero debe realizar un Check-in.";
            console.log("No prior check-in");
            return;
        }
        const tiempoCheckOut = tiempoActual;
        const tiempoTranscurrido = tiempoCheckOut - tiempoCheckIn;
        document.getElementById("actionMessage").textContent = `Check-out registrado para ${nombreRegistrado} en ${ubicacionEncontrada.direccion} a las ${tiempoCheckOut.toLocaleTimeString()}. Duración: ${formatTiempoTranscurrido(tiempoTranscurrido)}`;

        fetch(URL_DEL
