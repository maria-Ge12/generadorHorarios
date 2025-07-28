document.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.getElementById('drop-area');
  const file = document.getElementById('file');
  const fileList = document.getElementById('fileList');
  const archivoNombre = document.getElementById('archivoNombre');
  const btnEnviar = document.getElementById('btnEnviar');
  const btnCancelar = document.getElementById('btnCancelar');
  let archivoSeleccionado = null;

  // Desactiva los botones inicialmente
  btnEnviar.disabled = true;
  btnCancelar.disabled = true;

  // Función para actualizar estado de botones
  const actualizarEstadoBoton = () => {
    const hayArchivo = !!archivoSeleccionado;
    btnEnviar.disabled = !hayArchivo;
    btnCancelar.disabled = !hayArchivo;
  };

  // Al cambiar archivo desde el input
  file.addEventListener('change', () => {
    if (file.files.length > 0) {
      archivoSeleccionado = file.files[0];
      archivoNombre.textContent = 'Archivo seleccionado: ' + archivoSeleccionado.name;
    } else {
      archivoNombre.textContent = '';
      archivoSeleccionado = null;
    }
    actualizarEstadoBoton();
  });

  // Evita que se suba el archivo automáticamente al arrastrar
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const archivos = e.dataTransfer.files;
    if (archivos.length > 0) {
      file.files = archivos; // sincroniza con input
      archivoSeleccionado = archivos[0];
      archivoNombre.textContent = 'Archivo seleccionado: ' + archivoSeleccionado.name;
    } else {
      archivoNombre.textContent = '';
      archivoSeleccionado = null;
    }
    actualizarEstadoBoton();
  });

  // Botón cancelar limpia la selección y texto
  btnCancelar.addEventListener('click', () => {
    archivoNombre.textContent = '';
    file.value = '';
    archivoSeleccionado = null;
    actualizarEstadoBoton();
  });

  // Al enviar, se muestra el archivo en la lista y limpia selección
  document.getElementById('csvForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) return;

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    li.textContent = archivoSeleccionado.name;

    const btnEliminar = document.createElement('button');
    btnEliminar.classList.add('btn', 'btn-sm', 'btn-danger');
    btnEliminar.innerHTML = "<i class='bx bx-trash'></i>";
    btnEliminar.onclick = () => li.remove();

    li.appendChild(btnEliminar);
    fileList.appendChild(li);

    // Limpiar selección después de enviar
    archivoNombre.textContent = '';
    file.value = '';
    archivoSeleccionado = null;
    actualizarEstadoBoton();
  });
});
