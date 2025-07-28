// regenerarHorario.js
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const nombreProfesor = params.get("nombre");
  if (!nombreProfesor) {
    console.warn("No se proporcionó nombre de profesor en URL");
    return;
  }

  const btnRegenerar = document.querySelector("button.btn.btn-secondary");
  if (!btnRegenerar) {
    console.warn("No se encontró el botón Regenerar Horario");
    return;
  }

  btnRegenerar.addEventListener("click", async () => {
    try {
      btnRegenerar.disabled = true;
      btnRegenerar.innerHTML = `Regenerando <i class="bx bx-loader bx-spin"></i>`;

      const urlNombre = encodeURIComponent(nombreProfesor);
      const response = await fetch(`http://74.208.77.56:5482/regenerar-horario/${urlNombre}`, { method: "POST" });

      if (!response.ok) throw new Error("Error al regenerar el horario");

      // Opcional: podrías esperar un poco si la API tarda en procesar

      location.reload(); // Recarga la página para mostrar el horario nuevo
    } catch (error) {
      console.error("Error al regenerar horario:", error);
      alert("No se pudo regenerar el horario. Intenta de nuevo.");
      btnRegenerar.disabled = false;
      btnRegenerar.innerHTML = `Regenerar Horario <i class="bx bx-refresh bx-spin"></i>`;
    }
  });
});
