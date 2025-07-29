/*
  Este script muestra el total de profesores asignados, primero desde localStorage 
  y luego lo actualiza desde la API '/estadisticas'.

  Visual: actualiza un <h6> con el conteo total de profesores asignados en tiempo real.
*/
export async function actualizarTotalProfesores() {
  const h6 = document.getElementById("totalProfesores");

  try {
    const response = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/estadisticas");
    if (!response.ok) throw new Error("No se pudo obtener estadísticas");

    const data = await response.json();

    if (data && typeof data.profesores_asignados === "number") {
      h6.textContent = `Profesores asignados: ${data.profesores_asignados}`;

      // Guarda en localStorage
      localStorage.setItem("totalProfesoresAsignados", data.profesores_asignados);
    } else {
      h6.textContent = "No se pudo cargar el total de profesores";
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    h6.textContent = "Error al cargar datos";
  }
}

export function mostrarProfesoresDesdeStorage() {
  const h6 = document.getElementById("totalProfesores");
  const valorGuardado = localStorage.getItem("totalProfesoresAsignados");

  if (valorGuardado !== null) {
    h6.textContent = `Profesores asignados: ${valorGuardado}`;
  } else {
    h6.textContent = "Profesores asignados: -";
  }
}

// ✅ Al recargar o abrir la página: mostrar desde storage y luego actualizar desde el servidor
document.addEventListener("DOMContentLoaded", () => {
  mostrarProfesoresDesdeStorage();      // Carga rápido desde localStorage
  actualizarTotalProfesores();          // Luego intenta actualizar desde servidor
});
