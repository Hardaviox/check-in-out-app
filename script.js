const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbxRgzei-9QEb1ZlL0xxPIGSJWPdVfuA_E8STpdtU0aP2LqSxRXDnMdguppGnxILfXWn/exec";
let ubicacionEncontrada = null;
let nombreRegistrado = null;
let codeReader = null;

document.getElementById("registrarNombre").addEventListener("click", () => {
    const nombreUsuario = document.getElementById("usuarioInput").value;
    if (nombreUsuario) {
        nombreRegistrado = nombreUsuario;
        alert("Nombre registrado: " + nombreUsuario);
    } else {
        alert("Por favor, ingrese el nombre del usuario.");
    }
});

document.getElementById("scanQR").addEventListener("click", () => {
    if (codeReader) {
        codeReader.reset();
        codeReader.decodeFromInputVideoDevice(undefined, 'scanner-container').then((result) => {
            console.log(result.text);
            fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
                .then(response => response.json())
                .then(ubicaciones => {
                    let ubicacion = ubicaciones.find(u => u.id === result.text);
                    if (ubicacion) {
                        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                        ubicacionEncontrada = ubicacion;
                    } else {
                        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
                        ubicacionEncontrada = null;
                    }
                })
                .catch(error => console.error("Error obteniendo ubicaciones:", error));
        }).catch((err) => {
            console.error(err);
            document.getElementById("qrResult").textContent = err;
        });
    } else {
        codeReader = new ZXing.BrowserQRCodeReader();
        codeReader.decodeFromInputVideoDevice(undefined, 'scanner-container').then((result) => {
            console.log(result.text);
            fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
                .then(response => response.json())
                .then(ubicaciones => {
                    let ubicacion = ubicaciones.find(u => u.id === result.text);
                    if (ubicacion) {
                        document.getElementById("qrResult").textContent = `Ubicación: ${ubicacion.direccion} - ID: ${ubicacion.id}`;
                        ubicacionEncontrada = ubicacion;
                    } else {
                        document.getElementById("qrResult").textContent = "Ubicación no encontrada.";
                        ubicacionEncontrada = null;
                    }
                })
                .catch(error => console.error("Error obteniendo ubicaciones:", error));
        }).catch((err) => {
            console.error(err);
            document.getElementById("qrResult").textContent = err;
        });
    }
});

function registrar(tipo) {
    if (nombreRegistrado && ubicacionEncontrada) {
        fetch(`${URL_DEL_SCRIPT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuario: nombreRegistrado, ubicacion: ubicacionEncontrada, tipo: tipo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.result === "success") {
                alert("Registro exitoso.");
                document.getElementById("usuarioInput").value = "";
                document.getElementById("qrResult").textContent = "";
                ubicacionEncontrada = null;
                nombreRegistrado = null;
            } else {
                alert("Error al registrar.");
            }
        })
        .catch(error => console.error("Error al registrar:", error));
    } else {
        alert("Por favor, registre el nombre del usuario y escanee el código QR de la ubicación.");
    }
}
