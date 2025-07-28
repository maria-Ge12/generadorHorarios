/*
  Este script envía una solicitud para generar horarios vía la API '/generar-horarios'.
  Muestra un modal animado mientras se procesa y reporta éxito o error visualmente.

  Visual: modal con íconos animados (cargando, éxito o error) y mensaje con totales de profesores y horarios generados.
*/

import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';

const modal = new bootstrap.Modal(document.getElementById('modalGenerando'));
const textoEstado = document.getElementById('textoEstado');
const iconoEstado = document.getElementById('iconoEstado');

const botonGenerar = document.querySelector('.btn-success');

if (botonGenerar) {
  botonGenerar.addEventListener('click', async () => {
    // Mostrar modal con icono de carga usando FontAwesome
    textoEstado.textContent = 'Generando horarios...';
    iconoEstado.innerHTML = `
      <i class="fa-regular fa-hourglass-half fa-spin-pulse" style="font-size: 3rem; color: #0d6efd;"></i>
    `;

    modal.show();

    try {
      const startTime = Date.now();
      const response = await fetch("http://74.208.77.56:5482/generar-horarios", {
        method: "POST"
      });

      const endTime = Date.now();
      const responseDuration = endTime - startTime;
      const delayExtra = 2000;

      if (!response.ok) throw new Error("Error en la generación");

      const data = await response.json();
      const totalProfesores = data.total_profesores || 0;
      const totalHorarios = data.horarios_generados || 0;

      // Esperar un poco más para dar sensación de carga real
      setTimeout(() => {
        textoEstado.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: bold;">Horarios generados con éxito</div>
        <div style="font-size: 0.85rem; color: #666;">
          Profesores asignados: ${totalProfesores}<br>
          Horarios generados: ${totalHorarios}
        </div>`;
        iconoEstado.innerHTML = `
          <lord-icon
            src="https://cdn.lordicon.com/lupuorrc.json"
            trigger="loop"
            colors="primary:#28a745"
            style="width:80px;height:80px">
          </lord-icon>`;

        setTimeout(() => {
          modal.hide();
        }, 2500);
      }, delayExtra);

    } catch (error) {
      textoEstado.textContent = 'Error al generar horarios';
      iconoEstado.innerHTML = `
        <lord-icon
          src="https://cdn.lordicon.com/ygvjgdmk.json"
          trigger="loop"
          colors="primary:#dc3545"
          style="width:80px;height:80px">
        </lord-icon>`;
      setTimeout(() => modal.hide(), 3000);
      console.error(error);
    }
  });
}
