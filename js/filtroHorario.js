document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", () => {
    const filtro = searchInput.value.toLowerCase();

    // Selecciona todos los contenedores de tarjeta (col-md-6)
    const tarjetas = document.querySelectorAll("#profesorList .col-md-6");

    tarjetas.forEach(tarjeta => {
      const nombre = tarjeta.querySelector(".card-title")?.textContent.toLowerCase() || "";

      tarjeta.style.display = nombre.includes(filtro) ? "" : "none";
    });
  });
});
