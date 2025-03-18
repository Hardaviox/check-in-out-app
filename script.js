{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNZjHJ0FaQqEyl11WjwxOq0eDGWgtEi2_aSp9o7DGLYRpiiN33QL6maQD4G6OkcioJ/exec";\
\
document.addEventListener("DOMContentLoaded", () => \{\
  cargarUsuarios();\
  cargarUbicaciones();\
\});\
\
function cargarUsuarios() {
  fetch(`${URL_DEL_SCRIPT}?action=obtenerUsuarios`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const select = document.getElementById("usuarioSelect");
      select.innerHTML = '<option value="">Selecciona un usuario</option>';
      data.forEach(usuario => {
        let option = document.createElement("option");
        option.value = usuario;
        option.textContent = usuario;
        select.appendChild(option);
      });
    })
    .catch(error => console.error("Error cargando usuarios:", error));
}

function cargarUbicaciones() {
  fetch(`${URL_DEL_SCRIPT}?action=obtenerUbicaciones`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const select = document.getElementById("ubicacionSelect");
      select.innerHTML = '<option value="">Selecciona una ubicación</option>';
      data.forEach(ubicacion => {
        let option = document.createElement("option");
        option.value = JSON.stringify(ubicacion);
        option.textContent = `${ubicacion.id} - ${ubicacion.direccion}`;
        select.appendChild(option);
      });
    })
    .catch(error => console.error("Error cargando ubicaciones:", error));
}
