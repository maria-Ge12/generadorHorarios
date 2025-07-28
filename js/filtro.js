document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("input", () => {
    const filtro = searchInput.value.toLowerCase();
    const lista = document.querySelectorAll("#profesorList li");

    lista.forEach(item => {
      const texto = item.textContent.toLowerCase();
      if (texto.includes(filtro)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  });
});
