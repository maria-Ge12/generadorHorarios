document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const tabla = document.getElementById("tabla-profesores").getElementsByTagName("tbody")[0];

    // Evento input para buscar mientras el usuario escribe
    searchInput.addEventListener("input", () => {
        const filtro = searchInput.value.toLowerCase();

        const filas = tabla.querySelectorAll("tr");

        filas.forEach(fila => {
            const textoFila = fila.textContent.toLowerCase();

            if (textoFila.includes(filtro)) {
                fila.style.display = "";
            } else {
                fila.style.display = "none";
            }
        });
    });
});
