// filtroMateria.js

document.addEventListener("DOMContentLoaded", () => {
  const inputBusqueda = document.getElementById("searchInput");
  const tabla = document.getElementById("tabla-asignaturas");

  inputBusqueda.addEventListener("input", () => {
    const texto = inputBusqueda.value.toLowerCase();
    const filas = tabla.querySelectorAll("tbody tr");

    filas.forEach(fila => {
      const celdaAsignatura = fila.querySelector("td"); // primera columna
      if (!celdaAsignatura) return;

      const nombreAsignatura = celdaAsignatura.textContent.toLowerCase();
      const coincide = nombreAsignatura.includes(texto);

      fila.style.display = coincide ? "" : "none";
    });
  });
});
