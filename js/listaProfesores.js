document.addEventListener("DOMContentLoaded", async () => {
  const listaProfesores = document.getElementById("profesorList");
  const h6 = document.querySelector("#cardHeader h6");

  // Configuración - CORREGIDA LA URL
  const CONFIG = {
    statusUrl: "https://cabadath.duckdns.org/api/archivos/status", // CAMBIADO: stats -> status
    profesoresUrl: "https://cabadath.duckdns.org/api/generar-horarios/listar-profesores",
    timeoutMs: 8000
  };

  // Utilidades
  const utils = {
    // Fetch con timeout
    fetchWithTimeout: async (url, timeoutMs = CONFIG.timeoutMs) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          method: "GET",
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('TIMEOUT');
        }
        throw error;
      }
    },

    // Verificar si existe archivo de asignaciones
    verificarAsignaciones: async () => {
      try {
        console.log("Verificando existencia de archivo de asignaciones...");
        
        const response = await utils.fetchWithTimeout(CONFIG.statusUrl);
        
        if (!response.ok) {
          console.warn(`Error en /status: ${response.status}`);
          return false;
        }

        const data = await response.json();
        console.log("Respuesta de /status:", data);
        
        // CORREGIDO: La respuesta tiene 'archivos_existentes' no 'archivos'
        if (!data || !data.archivos_existentes || typeof data.archivos_existentes !== 'object') {
          console.warn("Respuesta de /status inválida - no tiene archivos_existentes:", data);
          return false;
        }

        // Obtener los nombres de archivos del objeto archivos_existentes
        const archivos = Object.keys(data.archivos_existentes);
        console.log(`Archivos encontrados:`, archivos);

        const tieneAsignaciones = archivos.some(archivo => 
          archivo.toLowerCase().includes('asignacion') || 
          archivo.toLowerCase().includes('asignac')
        );

        console.log(`Archivo de asignaciones: ${tieneAsignaciones ? 'EXISTE' : 'NO EXISTE'}`);
        return tieneAsignaciones;
        
      } catch (error) {
        console.error("Error verificando asignaciones:", error.message);
        return false;
      }
    },

    // Mostrar mensaje de no hay datos
    mostrarSinDatos: (tipo = 'info') => {
      const className = tipo === 'error' ? 'text-danger' : 'text-muted';
      const icono = tipo === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
      
      if (listaProfesores) {
        listaProfesores.innerHTML = `
          <li class="list-group-item ${className} text-center py-4">
            <i class="fa-solid ${icono} me-2"></i>
            ${tipo === 'error' ? 'Error al cargar datos' : 'No hay datos disponibles'}
            <br><small class="mt-2 d-block">
              ${tipo === 'error' 
                ? 'Verifica tu conexión e intenta nuevamente' 
                : 'Ejecuta primero la asignacion de materias y genera un horario para obtener la lista de profesores'
              }
            </small>
          </li>`;
      }
      
      if (h6) {
        h6.textContent = tipo === 'error' ? "Error - Datos no disponibles" : "Total de profesores: 0";
      }
    },

    // Mostrar estado de carga
    mostrarCargando: () => {
      if (listaProfesores) {
        listaProfesores.innerHTML = `
          <li class="list-group-item text-center py-4">
            <i class="fa-solid fa-spinner fa-spin me-2"></i>
            Verificando asignaciones...
          </li>`;
      }
      
      if (h6) {
        h6.textContent = "Cargando...";
      }
    },

    // Renderizar lista de profesores
    renderizarProfesores: (profesores, totalProfesores) => {
      // Actualizar contador
      if (h6) {
        h6.textContent = `Total de profesores: ${totalProfesores}`;
      }

      // Limpiar lista previa
      listaProfesores.innerHTML = "";

      // Mostrar mensaje si no hay profesores
      if (!profesores || profesores.length === 0) {
        listaProfesores.innerHTML = `
          <li class="list-group-item text-muted text-center py-4">
            <i class="fa-solid fa-users me-2"></i>
            No hay profesores disponibles.
            <br><small class="mt-2 d-block text-muted">
              La lista de profesores está vacía
            </small>
          </li>`;
        return;
      }

      // Agregar cada profesor a la lista
      profesores.forEach((profesor, index) => {
        const nombre = profesor.nombre;
        const urlNombre = encodeURIComponent(nombre);
        
        const item = document.createElement("li");
        item.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
        
        const link = document.createElement("a");
        link.href = `horario.html?nombre=${urlNombre}`;
        link.className = "text-decoration-none text-dark d-flex align-items-center";
        link.innerHTML = `
          <i class="fa-solid fa-user-tie me-3 text-info"></i>
          <span>${nombre}</span>
        `;
        
        // Badge con número
        const badge = document.createElement("span");
        badge.className = "badge bg-light text-dark";
        badge.textContent = `#${index + 1}`;
        
        item.appendChild(link);
        item.appendChild(badge);
        listaProfesores.appendChild(item);
      });

      console.log(`Lista renderizada con ${profesores.length} profesores`);
      
      // INTEGRACIÓN CON FILTRO: Reinicializar filtro después de cargar
      if (typeof window.reinicializarFiltro === 'function') {
        window.reinicializarFiltro();
      }
    }
  };

  // Función principal
  const cargarProfesores = async () => {
    try {
      // 1. Mostrar estado de carga
      utils.mostrarCargando();

      // 2. Verificar si existe el archivo de asignaciones
      const hayAsignaciones = await utils.verificarAsignaciones();
      
      if (!hayAsignaciones) {
        console.log("No hay archivo de asignaciones - no se pueden listar profesores");
        utils.mostrarSinDatos('info');
        return;
      }

      // 3. Si hay asignaciones, obtener lista de profesores
      console.log("Obteniendo lista de profesores desde API...");
      const response = await utils.fetchWithTimeout(CONFIG.profesoresUrl);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Datos obtenidos:", data);

      // 4. Validar estructura de respuesta
      if (!data || typeof data !== 'object') {
        throw new Error("Respuesta de API inválida");
      }

      // Extraer datos con valores por defecto
      const profesores = data.profesores || [];
      const totalProfesores = data.total_profesores || profesores.length || 0;

      // 5. Renderizar la lista
      utils.renderizarProfesores(profesores, totalProfesores);

    } catch (error) {
      console.error("Error al cargar profesores:", error);
      
      // Determinar tipo de error y mostrar mensaje apropiado
      let tipoError = 'error';
      
      if (error.message === 'TIMEOUT') {
        console.error("Timeout al obtener profesores");
      } else if (!navigator.onLine) {
        console.error("Sin conexión a internet");
      } else if (error.message.includes('404')) {
        console.error("Endpoint no encontrado");
      }
      
      utils.mostrarSinDatos(tipoError);
    }
  };

  // Función para refrescar datos (puede ser llamada externamente)
  window.refrescarListaProfesores = async () => {
    console.log("Refrescando lista de profesores...");
    await cargarProfesores();
  };

  // Ejecutar función principal
  await cargarProfesores();
});