document.addEventListener("DOMContentLoaded", async () => {
  const listaProfesores = document.getElementById("profesorList");
  const h6 = document.querySelector("#cardHeader h6");

  const periodosSeleccionados = JSON.parse(localStorage.getItem("periodosSeleccionados")) || [];

  try {
    // Obtener lista de profesores desde la API
    const response = await fetch("https://cabadath.duckdns.org/api/archivos/profesores");
    if (!response.ok) throw new Error("No se pudo obtener los profesores");

    const profesores = await response.json();
    console.log("Periodos seleccionados:", periodosSeleccionados);
    // Filtrar profesores por los periodos seleccionados
    const profesoresFiltrados = profesores.filter(profesor =>
      periodosSeleccionados.some(p =>
        p.trim().toUpperCase() === profesor.periodo.trim().toUpperCase()
      )
    );

    // Mostrar resumen en el h6
    if (h6) {
      h6.textContent = `Total de profesores: ${profesoresFiltrados.length} | Periodos activos: ${periodosSeleccionados.length}`;
    }

    // Limpiar lista previa
    listaProfesores.innerHTML = "";

    // Mostrar mensaje si no hay profesores filtrados
    if (profesoresFiltrados.length === 0) {
      listaProfesores.innerHTML = `
        <li class="list-group-item text-muted">
          No hay profesores en los periodos seleccionados.
        </li>`;
      return;
    }

    // Agregar cada profesor a la lista
    profesoresFiltrados.forEach(profesor => {
      const nombre = profesor.nombre;
      const urlNombre = encodeURIComponent(nombre);

      const item = document.createElement("li");
      item.className = "list-group-item";

      const link = document.createElement("a");
      link.href = `horario.html?nombre=${urlNombre}`;
      link.className = "text-black";
      link.textContent = nombre;

      item.appendChild(link);
      listaProfesores.appendChild(item);
    });
  } catch (error) {
    console.error("Error al cargar profesores:", error);
    if (listaProfesores) {
      listaProfesores.innerHTML = `
        <li class="list-group-item text-danger">
          No se pudo cargar la lista de profesores.
        </li>`;
    }
    if (h6) {
      h6.textContent = "Error al cargar datos";
    }
  }
});