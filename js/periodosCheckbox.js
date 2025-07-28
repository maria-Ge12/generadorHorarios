document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById("archivoSelectorContainer");

  try {
    const response = await fetch("http://74.208.77.56:5480/periodos");
    if (!response.ok) throw new Error("No se pudo obtener la lista de periodos");

    const data = await response.json();
    const periodos = data.periodos;
    const periodoActual = data.periodo_actual;

    // Recuperar selección previa (sin incluir el actual si no estaba)
    let seleccionadosPrevios = JSON.parse(localStorage.getItem("periodosSeleccionados")) || [];

    // Asegurar que el periodo actual SIEMPRE esté seleccionado
    if (!seleccionadosPrevios.includes(periodoActual)) {
      seleccionadosPrevios.push(periodoActual);
    }

    if (!Array.isArray(periodos) || periodos.length === 0) {
      contenedor.innerHTML = `<p class="text-muted text-center">No hay periodos disponibles</p>`;
      return;
    }

    const divFlex = document.createElement("div");
    divFlex.className = "d-flex flex-wrap gap-2 justify-content-center";

    periodos.forEach(periodo => {
      const div = document.createElement("div");
      div.className = "form-check";

      const input = document.createElement("input");
      input.className = "form-check-input";
      input.type = "checkbox";
      input.name = "archivos";
      input.value = periodo;
      input.id = periodo;

      const label = document.createElement("label");
      label.className = "form-check-label";
      label.htmlFor = periodo;
      label.textContent = periodo;

      // Seleccionar y deshabilitar el periodo actual
      if (periodo === periodoActual) {
        input.checked = true;
        input.disabled = true;

        const badge = document.createElement("span");
        badge.className = "badge bg-success ms-2";
        badge.textContent = "Actual";
        label.appendChild(badge);
      } else {
        // Restaurar selección previa para otros periodos
        if (seleccionadosPrevios.includes(periodo)) {
          input.checked = true;
        }
      }

      input.addEventListener("change", () => {
        // Tomar todos los checkbox marcados, añadir el periodo actual obligatoriamente
        const seleccionados = Array.from(document.querySelectorAll('input[name="archivos"]:checked'))
          .map(cb => cb.value);

        if (!seleccionados.includes(periodoActual)) {
          seleccionados.push(periodoActual);
        }

        localStorage.setItem("periodosSeleccionados", JSON.stringify(seleccionados));
      });

      div.appendChild(input);
      div.appendChild(label);
      divFlex.appendChild(div);
    });

    contenedor.innerHTML = "";
    contenedor.appendChild(divFlex);

    // Guardar la selección actual en localStorage para mantener sincronizado
    localStorage.setItem("periodosSeleccionados", JSON.stringify(seleccionadosPrevios));

  } catch (error) {
    console.error("Error al cargar periodos desde la API:", error);
    contenedor.innerHTML = `<p class="text-danger text-center">Error al cargar los periodos.</p>`;
  }
});
