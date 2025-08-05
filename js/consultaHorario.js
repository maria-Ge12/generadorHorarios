// ==========================================
// HORARIO ASIGNADO EN TABLA DE CADA PROFESOR usando la api /horarios
// ==========================================
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

  // Utilidades
  const utils = {
    normalizeString: (str) => str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim(),

    buscarMateriaPorHora: (horarioDia, hora) => {
      if (!horarioDia) return "";
      
      if (horarioDia[hora]) return horarioDia[hora];
      
      const key = Object.keys(horarioDia).find(k => 
        k.replace(/\s+/g, "") === hora.replace(/\s+/g, "")
      );
      return key ? horarioDia[key] : "";
    },

    generarHoras: (inicio, fin) => {
      const horas = [];
      let [h] = inicio.split(":").map(Number);
      const [fh] = fin.split(":").map(Number);

      while (h < fh) {
        horas.push(`${h.toString().padStart(2, "0")}:00 - ${(h + 1).toString().padStart(2, "0")}:00`);
        h++;
      }
      return horas;
    },

    hexToRgba: (hex, alpha = 0.15) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    mostrarError: (mensaje) => {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${mensaje}</td></tr>`;
    }
  };

  // Configuración
  const COLORES = [
    "#007bff", "#dc3545", "#6f42c1", "#ffc107", 
    "#198754", "#d63384", "#fd7e14"
  ];
  const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes"];

  try {
    const response = await fetch(
      "https://cabadath.duckdns.org/api/generar-horarios/horarios",
      { method: "GET" }
    );

    if (!response.ok) throw new Error("Error en la respuesta de la API");

    const { horarios = [] } = await response.json();
    const nombreBuscado = utils.normalizeString(nombreProfesor);
    
    const profesor = horarios.find(p => 
      utils.normalizeString(p.nombre) === nombreBuscado
    );

    if (!profesor) {
      utils.mostrarError("No se encontró el horario del profesor");
      return;
    }

    // Generar tabla
    const horas = utils.generarHoras(profesor.hora_entrada, profesor.hora_salida);
    const materiaColorMap = new Map();
    let colorIndex = 0;

    const fragment = document.createDocumentFragment();
    
    horas.forEach(hora => {
      const tr = document.createElement("tr");
      
      // Celda de hora
      const tdHora = document.createElement("td");
      tdHora.textContent = hora;
      tr.appendChild(tdHora);

      // Celdas de días
      DIAS.forEach(dia => {
        const td = document.createElement("td");
        const materia = utils.buscarMateriaPorHora(profesor.horario?.[dia], hora);
        
        if (materia) {
          td.textContent = materia;
          
          // Asignar color único por materia
          if (!materiaColorMap.has(materia)) {
            materiaColorMap.set(materia, COLORES[colorIndex % COLORES.length]);
            colorIndex++;
          }
          
          const color = materiaColorMap.get(materia);
          Object.assign(td.style, {
            backgroundColor: utils.hexToRgba(color),
            color: "#111",
            fontWeight: "500"
          });
          td.classList.add("materia");
        }
        
        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    tbody.innerHTML = "";
    tbody.appendChild(fragment);

  } catch (error) {
    console.error("Error al obtener horario:", error);
    utils.mostrarError("Error al cargar el horario");
  }
});