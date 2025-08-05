document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const btnBuscar = document.getElementById("btnBuscar");
  
  // Estilos CSS
  const style = document.createElement('style');
  style.textContent = `
    .profesor-oculto { display: none !important; }
    .highlight-search { background-color: #fff3cd; transition: background-color 0.3s ease; }
  `;
  document.head.appendChild(style);

  // Función principal de filtrado
  const aplicarFiltro = () => {
    const filtro = searchInput.value.toLowerCase().trim();
    const profesores = document.querySelectorAll("#profesorList li:not(#mensaje-sin-resultados)");
    
    let visibles = 0;
    let total = 0;

    profesores.forEach(item => {
      const nombreElement = item.querySelector('a span');
      if (!nombreElement) return;
      
      total++;
      const nombre = nombreElement.textContent.toLowerCase();
      const coincide = filtro === "" || nombre.includes(filtro);
      
      // Mostrar/ocultar
      item.classList.toggle('profesor-oculto', !coincide);
      item.classList.toggle('highlight-search', coincide && filtro !== "");
      
      if (coincide) visibles++;
    });

    actualizarContador(visibles, total, filtro);
    mostrarMensajeSinResultados(visibles, filtro, total);
  };

  // Actualizar contador
  const actualizarContador = (visibles, total, filtro) => {
    const h6 = document.querySelector("#cardHeader h6");
    if (h6 && total > 0) {
      h6.textContent = filtro === "" 
        ? `Total de profesores: ${total}`
        : `Mostrando: ${visibles} de ${total} profesores`;
    }
  };

  // Mensaje sin resultados
  const mostrarMensajeSinResultados = (visibles, filtro, total) => {
    const lista = document.getElementById("profesorList");
    const mensajeExistente = document.getElementById("mensaje-sin-resultados");
    
    if (mensajeExistente) mensajeExistente.remove();

    if (visibles === 0 && filtro !== "" && total > 0) {
      const mensaje = document.createElement("li");
      mensaje.id = "mensaje-sin-resultados";
      mensaje.className = "list-group-item text-center py-4 text-muted";
      mensaje.innerHTML = `
        <i class="fa-solid fa-search me-2"></i>
        No se encontraron profesores que coincidan con "<strong>${filtro}</strong>"
        <br><small class="mt-2 d-block">Intenta con un término diferente</small>
      `;
      lista.appendChild(mensaje);
    }
  };

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    searchInput.value = "";
    aplicarFiltro();
    searchInput.focus();
  };

  // Event Listeners
  searchInput.addEventListener("input", aplicarFiltro);
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      aplicarFiltro();
    }
  });
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Escape") limpiarBusqueda();
  });
  
  if (btnBuscar) {
    btnBuscar.addEventListener("click", e => {
      e.preventDefault();
      aplicarFiltro();
    });
  }

  // Función global para reinicializar
  window.reinicializarFiltro = () => {
    searchInput.value = "";
    const mensaje = document.getElementById("mensaje-sin-resultados");
    if (mensaje) mensaje.remove();
    
    document.querySelectorAll("#profesorList li").forEach(item => {
      item.classList.remove('profesor-oculto', 'highlight-search');
    });
    
    setTimeout(aplicarFiltro, 100);
  };

  // Observer para cambios en la lista
  const lista = document.getElementById("profesorList");
  if (lista) {
    const observer = new MutationObserver(mutations => {
      const hayNuevos = mutations.some(m => 
        m.type === 'childList' && 
        Array.from(m.addedNodes).some(n => 
          n.nodeType === Node.ELEMENT_NODE && 
          n.tagName === 'LI' && 
          n.id !== 'mensaje-sin-resultados'
        )
      );
      
      if (hayNuevos) {
        setTimeout(aplicarFiltro, 50);
      }
    });
    
    observer.observe(lista, { childList: true });
  }

  // Placeholder dinámico
  const actualizarPlaceholder = () => {
    const total = document.querySelectorAll("#profesorList li:not(#mensaje-sin-resultados)").length;
    searchInput.placeholder = total > 0 
      ? `Buscar entre ${total} profesores...` 
      : "Buscar profesores...";
  };
  
  setInterval(actualizarPlaceholder, 2000);

  console.log("Sistema de filtrado inicializado");
});