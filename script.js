{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Reemplaza URL_DEL_SCRIPT con la URL de tu script de Google Apps.\
const URL_DEL_SCRIPT = "URL_AQUI";\
\
window.onload = function() \{\
  cargarUsuarios();\
  cargarUbicaciones();\
\};\
\
function cargarUsuarios()\{\
  fetch(https://docs.google.com/document/d/e/2PACX-1vSt31ISjS4Iqyq4RKRGXiE-dM2QaNIhAffmVytyhn8KHFt-aztWLe6ePkMAxLP6AgxAaN9keX001hyG/pub + "?action=obtenerUsuarios")\
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
function cargarUbicaciones()\{\
  fetch(URL_DEL_SCRIPT + "?action=obtenerUbicaciones")\
  .then(response => response.json())\
  .then(data => \{\
    var select = document.getElementById("ubicacion");\
    data.forEach(ubicacion => \{\
      var option = document.createElement("option");\
      option.value = ubicacion;\
      option.text = ubicacion;\
      select.appendChild(option);\
    \});\
  \});\
\}\
\
function registrar(tipo) \{\
  var usuario = document.getElementById("usuario").value;\
  var ubicacion = document.getElementById("ubicacion").value;\
\
  var data = \{\
    usuario: usuario,\
    ubicacion: ubicacion,\
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