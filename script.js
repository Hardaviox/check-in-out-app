{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Reemplaza URL_DEL_SCRIPT con la URL de tu script de Google Apps.\
const URL_DEL_SCRIPT = "https://script.google.com/macros/s/AKfycbwNZjHJ0FaQqEyl11WjwxOq0eDGWgtEi2_aSp9o7DGLYRpiiN33QL6maQD4G6OkcioJ/exec";\
\
window.onload = function() \{\
  cargarUsuarios();\
  cargarUbicaciones();\
\};\
\
function cargarUsuarios() \{\
  fetch(URL_DEL_SCRIPT + "?action=obtenerUsuarios")\
    .then(response => response.json())\
    .then(data => \{\
      var select = document.getElementById("usuario");\
      data.forEach(usuario => \{\
        var option = document.createElement("option");\
        option.value = usuario;\
        option.text = usuario;\
        select.appendChild(option);\
      \});\
    \});\
\}\
\
function cargarUbicaciones() \{\
  fetch(URL_DEL_SCRIPT + "?action=obtenerUbicaciones")\
    .then(response => response.json())\
    .then(data => \{\
      var select = document.getElementById("ubicacion");\
      data.forEach(ubicacion => \{\
        var option = document.createElement("option");\
        option.value = JSON.stringify(ubicacion); // Guarda el objeto completo como valor\
        option.text = ubicacion.id + " - " + ubicacion.direccion; // Muestra ID y direcci\'f3n\
        select.appendChild(option);\
      \});\
    \});\
\}\
\
function registrar(tipo) \{\
  var usuario = document.getElementById("usuario").value;\
  var ubicacion = JSON.parse(document.getElementById("ubicacion").value); // Obtiene el objeto completo\
\
  var data = \{\
    usuario: usuario,\
    ubicacion: ubicacion, // Envia el objeto completo\
    tipo: tipo,\
  \};\
\
  fetch(URL_DEL_SCRIPT, \{\
    method: "POST",\
    headers: \{\
      "Content-Type": "application/json",\
    \},\
    body: JSON.stringify(data),\
  \})\
    .then((response) => response.json())\
    .then((data) => \{\
      console.log("Success:", data);\
      alert("Registro exitoso");\
    \})\
    .catch((error) => \{\
      console.error("Error:", error);\
      alert("Error en el registro");\
    \});\
\}}