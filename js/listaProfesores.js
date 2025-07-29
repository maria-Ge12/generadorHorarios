document.addEventListener("DOMContentLoaded", () => {
  const listaProfesores = document.getElementById("profesorList");

  const periodosSeleccionados = JSON.parse(localStorage.getItem("periodosSeleccionados")) || [];

  fetch("https://cabadath.duckdns.org/api/profesores")
    .then(response => {
      if (!response.ok) throw new Error("Error al obtener los profesores");
      return response.json();
    })
    .then(data => {
      listaProfesores.innerHTML = "";

      const profesoresFiltrados = data.filter(profesor =>
        periodosSeleccionados.some(p =>
          p.trim().toUpperCase() === profesor.periodo.trim().toUpperCase()
        )
      );

      if (profesoresFiltrados.length === 0) {
        listaProfesores.innerHTML = `
          <li class="list-group-item text-muted">
            No hay profesores en los periodos seleccionados.
          </li>`;
        return;
      }

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
    })
    .catch(error => {
      console.error("Error al cargar profesores:", error);
      listaProfesores.innerHTML = `
        <li class="list-group-item text-danger">
          No se pudo cargar la lista de profesores.
        </li>`;
    });
});
