document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const nombreProfesor = params.get("nombre");

  if (!nombreProfesor) {
    console.warn("No se proporcionó nombre de profesor en URL");
    return;
  }

  const tbody = document.getElementById("tablaHorarioBody");
  if (!tbody) {
    console.error("No se encontró <tbody> con id 'tablaHorarioBody'");
    return;
  }

  function normalizeString(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buscarMateriaPorHora(horarioDia, hora) {
    if (!horarioDia) return "";

    if (horarioDia[hora]) return horarioDia[hora];

    const key = Object.keys(horarioDia).find(k => k.replace(/\s+/g, "") === hora.replace(/\s+/g, ""));
    return key ? horarioDia[key] : "";
  }

  // Colores para materias (sin repetir)
  const colores = [
    "#007bff", // azul
    "#dc3545", // rojo
    "#fd7e14", // naranja
    "#198754", // verde
    "#d63384", // rosa
    "#6f42c1", // morado
    "#ffc107", // amarillo
  ];

  try {
    const response = await fetch("http://74.208.77.56:5482/horarios", {
      method: "GET"
    });

    if (!response.ok) throw new Error("Error en la respuesta de la API");

    const data = await response.json();
    console.log("Datos recibidos de la API:", data);

    const profesores = data.horarios || [];

    const nombreBuscado = normalizeString(nombreProfesor);

    const profesor = profesores.find(p => normalizeString(p.nombre) === nombreBuscado);

    if (!profesor) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">No se encontró el horario del profesor</td></tr>`;
      return;
    }

    const horas = generarHoras(profesor.hora_entrada, profesor.hora_salida);
    const dias = ["lunes", "martes", "miércoles", "jueves", "viernes"];

    tbody.innerHTML = "";

    const materiaColorMap = new Map();
    let colorIndex = 0;

    horas.forEach(hora => {
      const tr = document.createElement("tr");

      const tdHora = document.createElement("td");
      tdHora.textContent = hora;
      tr.appendChild(tdHora);

      dias.forEach(dia => {
        const td = document.createElement("td");
        const materia = buscarMateriaPorHora(profesor.horario?.[dia], hora) || "";
        td.textContent = materia;

        if (materia) {
          // Asignar color a la materia si no tiene
          if (!materiaColorMap.has(materia)) {
            materiaColorMap.set(materia, colores[colorIndex % colores.length]);
            colorIndex++;
          }
          const color = materiaColorMap.get(materia);

          td.classList.add("materia");
          td.style.backgroundColor = hexToRgba(color, 0.15);
          td.style.color = "#111";
          td.style.fontWeight = "500";
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error al obtener horario:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar el horario</td></tr>`;
  }
});

function generarHoras(inicio, fin) {
  const horas = [];
  let [h, m] = inicio.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);

  while (h < fh || (h === fh && m < fm)) {
    const siguienteHora = h + 1;
    const rango = `${formatearHora(h)}:00 - ${formatearHora(siguienteHora)}:00`;
    horas.push(rango);
    h++;
  }

  return horas;
}

function formatearHora(hora) {
  return hora.toString().padStart(2, "0");
}

function hexToRgba(hex, alpha = 1) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

