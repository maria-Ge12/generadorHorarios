document.addEventListener("DOMContentLoaded", () => {
  let btnDescargar = null;

  // Crear y agregar el botón de descarga
  const crearBotonDescarga = () => {
    const searchBar = document.querySelector('.search-bar');
    const container = document.querySelector('.container.content-with-sidebar');
    
    if (!searchBar || !container) return;

    // Crear contenedor del botón
    const btnContainer = document.createElement('div');
    btnContainer.className = 'd-flex justify-content-center mb-3';
    btnContainer.id = 'downloadButtonContainer';

    // Crear botón de descarga
    btnDescargar = document.createElement('button');
    btnDescargar.className = 'btn btn-success btn-sm px-4';
    btnDescargar.id = 'btnDescargar';
    btnDescargar.disabled = true;
    btnDescargar.innerHTML = `
      <i class="fas fa-download me-2"></i>
      Descargar Archivos
    `;

    btnContainer.appendChild(btnDescargar);
    
    // Insertar entre la barra de búsqueda y el card
    searchBar.parentNode.insertBefore(btnContainer, container);

    console.log('Botón de descarga creado');
  };

  // Verificar si hay datos en la lista
  const verificarDatos = () => {
    const profesores = document.querySelectorAll("#profesorList li:not(#mensaje-sin-resultados)");
    const hayDatos = profesores.length > 0;

    if (btnDescargar) {
      btnDescargar.disabled = !hayDatos;
      btnDescargar.classList.toggle('btn-success', hayDatos);
      btnDescargar.classList.toggle('btn-secondary', !hayDatos);
      
      // Cambiar texto según el estado
      const texto = hayDatos 
        ? `<i class="fas fa-download me-2"></i>Descargar Archivos` 
        : `<i class="fas fa-download me-2"></i>Sin datos disponibles`;
      
      btnDescargar.innerHTML = texto;
    }

    return hayDatos;
  };

  // Función para generar y descargar el archivo desde la API
  const descargarLista = async () => {
    if (!verificarDatos()) {
      alert('No hay datos disponibles para descargar');
      return;
    }

    // Mostrar opciones de descarga
    const tipoSeleccionado = await mostrarOpcionesDescarga();
    if (!tipoSeleccionado) return;

    // Deshabilitar botón durante la descarga
    btnDescargar.disabled = true;
    btnDescargar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Descargando...';

    try {
      const response = await fetch(`https://cabadath.duckdns.org/api/archivos/download/${tipoSeleccionado}`);
      
      if (!response.ok) {
        throw new Error(`Error en la descarga: ${response.status} ${response.statusText}`);
      }

      // Obtener el contenido del archivo
      const blob = await response.blob();
      const contentType = response.headers.get('content-type');
      
      // Determinar extensión del archivo
      let extension = 'xlsx';
      if (contentType?.includes('json')) extension = 'json';
      else if (contentType?.includes('csv')) extension = 'csv';

      // Crear y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `${tipoSeleccionado}_${new Date().toISOString().split('T')[0]}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`Descarga completada: ${tipoSeleccionado}.${extension}`);
      
    } catch (error) {
      console.error('Error en la descarga:', error);
      alert(`Error al descargar el archivo: ${error.message}`);
    } finally {
      // Restaurar botón
      setTimeout(() => {
        verificarDatos();
      }, 1000);
    }
  };

  // Función para mostrar opciones de descarga
  const mostrarOpcionesDescarga = () => {
    return new Promise((resolve) => {
      // Crear modal de opciones
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.style.zIndex = '9999';
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-download me-2"></i>Seleccionar tipo de descarga
              </h5>
              <button type="button" class="btn-close" data-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="mb-3">Selecciona el tipo de archivo que deseas descargar:</p>
              <div class="list-group">
                <button type="button" class="list-group-item list-group-item-action" data-tipo="general">
                  <i class="fas fa-file-alt me-2"></i>
                  <strong>General</strong> - Datos generales del último periodo
                </button>
                <button type="button" class="list-group-item list-group-item-action" data-tipo="asignaturas">
                  <i class="fas fa-book me-2"></i>
                  <strong>Asignaturas</strong> - Lista de todas las asignaturas
                </button>
                <button type="button" class="list-group-item list-group-item-action" data-tipo="profesores">
                  <i class="fas fa-chalkboard-teacher me-2"></i>
                  <strong>Profesores</strong> - Lista completa de profesores
                </button>
                <button type="button" class="list-group-item list-group-item-action" data-tipo="horarios">
                  <i class="fas fa-calendar-alt me-2"></i>
                  <strong>Horarios</strong> - Horarios completos detallados
                </button>
                <button type="button" class="list-group-item list-group-item-action" data-tipo="horarios-simple">
                  <i class="fas fa-clock me-2"></i>
                  <strong>Horarios Simple</strong> - Horarios en formato simplificado
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Event listeners
      const opciones = modal.querySelectorAll('[data-tipo]');
      const btnCerrar = modal.querySelectorAll('[data-dismiss="modal"]');

      opciones.forEach(opcion => {
        opcion.addEventListener('click', () => {
          const tipo = opcion.dataset.tipo;
          document.body.removeChild(modal);
          resolve(tipo);
        });
      });

      btnCerrar.forEach(btn => {
        btn.addEventListener('click', () => {
          document.body.removeChild(modal);
          resolve(null);
        });
      });

      // Mostrar modal (sin Bootstrap JS)
      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Cerrar al hacer click fuera
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          document.body.style.overflow = '';
          resolve(null);
        }
      });
    });
  };

  // Event listener para el botón
  const configurarEventListener = () => {
    if (btnDescargar) {
      btnDescargar.addEventListener('click', descargarLista);
    }
  };

  // Observer para detectar cambios en la lista
  const observarCambiosLista = () => {
    const lista = document.getElementById("profesorList");
    if (!lista) return;

    const observer = new MutationObserver(() => {
      // Pequeño delay para asegurar que el DOM se actualice
      setTimeout(verificarDatos, 100);
    });

    observer.observe(lista, {
      childList: true,
      subtree: true
    });

    console.log('Observer de descarga inicializado');
  };

  // Función global para actualizar estado desde otros scripts
  window.actualizarBotonDescarga = () => {
    setTimeout(verificarDatos, 50);
  };

  // Inicialización
  const inicializar = () => {
    crearBotonDescarga();
    configurarEventListener();
    observarCambiosLista();
    
    // Verificación inicial después de un delay
    setTimeout(verificarDatos, 1000);
    
    // Verificación periódica
    setInterval(verificarDatos, 3000);
  };

  // Ejecutar inicialización
  inicializar();

  console.log('Sistema de descarga inicializado');
});