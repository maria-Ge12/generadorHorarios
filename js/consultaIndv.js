/*
  Este muestra el horario detallado de un profesor obtenido desde la API '/asignaciones',
  usando su nombre desde la URL como parámetro.

  Visual: muestra el nombre del profesor, periodo, horas, entrada/salida, y una lista de materias con créditos.
*/

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const nombreProfesor = params.get("nombre");
  const nombreElem = document.getElementById("nombreProfesor");
  const periodoElem = document.getElementById("periodo");
  const horasElem = document.getElementById("horas");
  const entradaElem = document.getElementById("entrada");
  const salidaElem = document.getElementById("salida");
  const creditosElem = document.getElementById("creditos");
  const materiasElem = document.getElementById("materias");

  if (!nombreProfesor) {
    nombreElem.textContent = "No se proporcionó el nombre del profesor.";
    periodoElem.textContent = "-";
    horasElem.textContent = "-";
    entradaElem.textContent = "-";
    salidaElem.textContent = "-";
    creditosElem.textContent = "-";
    materiasElem.innerHTML = `<div class="list-group-item text-danger">No hay materias para mostrar.</div>`;
    return;
  }

  nombreElem.innerHTML = `${nombreProfesor}`; //Título con nombre del profesor

  fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignaciones")
    .then((response) => {
      if (!response.ok) throw new Error("Error en la respuesta de la API");
      return response.json();
    })
    .then((asignaciones) => {
      // Buscar objeto que coincida con el nombre del profesor (sin importar mayúsculas/minúsculas)
      const profesor = asignaciones.find(
        (p) => p.nombre.toLowerCase() === nombreProfesor.toLowerCase()
      );

      if (!profesor) {
        periodoElem.textContent = "-";
        horasElem.textContent = "-";
        entradaElem.textContent = "-";
        salidaElem.textContent = "-";
        creditosElem.textContent = "-";
        materiasElem.innerHTML = `<div class="list-group-item text-danger">No se encontraron materias para este profesor.</div>`;
        return;
      }

      //Tarjeta con datos del profesor
      periodoElem.textContent = profesor.periodo || "-";
      horasElem.textContent = profesor.horas_asignadas || "-";
      entradaElem.textContent = profesor.hora_entrada || "-";
      salidaElem.textContent = profesor.hora_salida || "-";
      creditosElem.textContent = profesor.creditos_asignados || "-";

      //Lista de materias asignadas
      materiasElem.innerHTML = "";

      if (Array.isArray(profesor.materias) && profesor.materias.length > 0) {
        profesor.materias.forEach((materia) => {
          const divItem = document.createElement("div");
          divItem.className = "list-group-item d-flex justify-content-between flex-wrap";

          const nombreMateria = document.createElement("div");
          nombreMateria.className = "fw-bold text-wrap";
          nombreMateria.style.flex = "1 1 70%";
          nombreMateria.textContent = materia.nombre;

          const creditos = document.createElement("div");
          creditos.className = "text-muted";
          creditos.style.flex = "1 1 30%";
          creditos.style.textAlign = "right";
          creditos.textContent = `Créditos: ${materia.creditos}`;

          divItem.appendChild(nombreMateria);
          divItem.appendChild(creditos);
          materiasElem.appendChild(divItem);
        });
      } else {
        materiasElem.innerHTML = `<div class="list-group-item text-danger">Sin materias asignadas.</div>`;
      }
    })
    .catch((error) => {
      console.error("Error al obtener asignaciones:", error);
      periodoElem.textContent = "-";
      horasElem.textContent = "-";
      entradaElem.textContent = "-";
      salidaElem.textContent = "-";
      materiasElem.innerHTML = `<div class="list-group-item text-danger">No se pudieron cargar las materias.</div>`;
    });
});
