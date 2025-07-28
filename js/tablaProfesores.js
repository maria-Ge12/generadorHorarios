let profesorNombreAEliminar = null;
let materiasAgregadas = [];
let nombreProfesorOriginal = null;

// Función para agregar materia a la lista visual con botón eliminar y actualización del array
function agregarMateriaALista(materia, listaElement, materiasArray) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = materia;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn btn-sm btn-danger";
    btnEliminar.textContent = "Eliminar";

    btnEliminar.addEventListener("click", () => {
        // Elimina la materia del array
        const index = materiasArray.indexOf(materia);
        if (index > -1) materiasArray.splice(index, 1);
        // Elimina el li del DOM
        li.remove();
    });

    li.appendChild(btnEliminar);
    listaElement.appendChild(li);
}

// TABLA GENERAL
function cargarTablaProfesores() {
    fetch("http://74.208.77.56:5484/profesores")
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = "";

            document.getElementById("totalProfesores").textContent = data.length;

            data.forEach((profesor, index) => {
                const materiasList = profesor.materias ?? [];
                const tooltipMaterias = materiasList.join("\n");

                const fila = document.createElement("tr");
                fila.innerHTML = `
          <td>${profesor.nombre}</td>
          <td>${profesor.horas_asignadas ?? '-'}</td>
          <td>${profesor.hora_entrada ?? '-'}</td>
          <td>${profesor.hora_salida ?? '-'}</td>
          <td title="${tooltipMaterias}">${materiasList.length} materia${materiasList.length !== 1 ? 's' : ''}</td>
          <td>${profesor.periodo ?? '-'}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-info me-2 btn-editar"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger btn-eliminar"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;
                tbody.appendChild(fila);
            });

            // BOTONES EDITAR DE CADA MAESTRO EN LA TABLA QUE ABRE EL MODAL EDITAR
            document.querySelectorAll(".btn-editar").forEach((btn, i) => {
                btn.addEventListener("click", () => {
                    const profesor = data[i];
                    nombreProfesorOriginal = profesor.nombre;
                    document.getElementById("editarNombreProfesor").value = profesor.nombre;
                    document.getElementById("editarHorasAsignadas").value = profesor.horas_asignadas;
                    document.getElementById("editarHoraEntrada").value = profesor.hora_entrada;
                    document.getElementById("editarHoraSalida").value = profesor.hora_salida;
                    document.getElementById("editarPeriodo").value = profesor.periodo;

                    const lista = document.getElementById("editarListaMaterias");
                    lista.innerHTML = "";
                    materiasAgregadas = [];

                    (profesor.materias ?? []).forEach(materia => {
                        materiasAgregadas.push(materia);
                        agregarMateriaALista(materia, lista, materiasAgregadas);
                    });

                    new bootstrap.Modal(document.getElementById("modalEditarProfesor")).show();
                });
            });

            // BOTONES ELIMINAR DE CADA MAESTRO EN LA TABLA
            document.querySelectorAll(".btn-eliminar").forEach((btn, i) => {
                btn.addEventListener("click", () => {
                    const profesor = data[i];
                    let nombre = profesor.nombre;
                    if (nombre.includes(":")) nombre = nombre.split(":")[0];

                    profesorNombreAEliminar = nombre;

                    document.getElementById("textoConfirmacion").textContent =
                        `¿Seguro de que deseas eliminar al profesor "${nombre}"?`;

                    new bootstrap.Modal(document.getElementById("modalConfirmarEliminar")).show();
                });
            });
        })
        .catch(err => console.error("Error al obtener los profesores:", err));
}

// BOTON ELIMINAR DEL MODAL PARA CONFIRMAR Y BORRAR DEFINITIVAMENTE A UN PROFESOR
document.getElementById("btnConfirmarEliminar").addEventListener("click", () => {
    if (!profesorNombreAEliminar) return;

    const nombreEncoded = encodeURIComponent(profesorNombreAEliminar);

    fetch(`http://74.208.77.56:5484/profesores/${nombreEncoded}/eliminar`, {
        method: "DELETE"
    })
        .then(response => {
            if (!response.ok) throw new Error("Error al eliminar el profesor.");
            return response.text(); // acepta respuesta vacía
        })
        .then(() => {
            bootstrap.Modal.getInstance(document.getElementById("modalConfirmarEliminar")).hide();
            mostrarToast("Profesor eliminado correctamente.");
            cargarTablaProfesores();
        })
        .catch(err => {
            console.error("Error al eliminar:", err);
            mostrarToastWarning("No se pudo eliminar el profesor.");
        });
});

function mostrarToast(mensaje) {
    const toastElement = document.getElementById("toastEliminado");
    toastElement.querySelector(".toast-body").textContent = mensaje;
    new bootstrap.Toast(toastElement).show();
}
function mostrarToastWarning(mensaje) {
    const toastEl = document.getElementById("toastWarning");
    document.getElementById("toastBodyWarning").textContent = mensaje;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}
function mostrarToastInfo(mensaje) {
    const toastEl = document.getElementById("toastInfo");
    document.getElementById("toastBodyInfo").textContent = mensaje;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// --- Carga materias disponibles y maneja agregar al modal ---

document.addEventListener("DOMContentLoaded", () => {
    const selectMateriaEditar = document.getElementById("editarSelectMateria");
    const btnAgregarMateriaEditar = document.getElementById("btnAgregarMateriaEditar");
    const listaMateriasEditar = document.getElementById("editarListaMaterias");

    // Cargar materias desde API (solo llena el select)
    fetch("http://74.208.77.56:5480/asignaturas")
        .then(res => res.json())
        .then(data => {
            data.forEach(item => {
                const option = document.createElement("option");
                option.value = item.ASIGNATURA;
                option.textContent = `${item.ASIGNATURA} (Cred: ${item.CRED})`;
                selectMateriaEditar.appendChild(option);
            });
        })
        .catch(err => console.error("Error cargando materias:", err));

    // Evento al hacer clic en agregar materia
    btnAgregarMateriaEditar.addEventListener("click", () => {
        const materiaSeleccionada = selectMateriaEditar.value;
        if (!materiaSeleccionada) {
            mostrarToastWarning("Selecciona una materia antes de agregar.");
            return;
        }
        if (materiasAgregadas.includes(materiaSeleccionada)) {
            mostrarToastInfo("La materia ya está en la lista.");
            return;
        }
        materiasAgregadas.push(materiaSeleccionada);
        agregarMateriaALista(materiaSeleccionada, listaMateriasEditar, materiasAgregadas);
        selectMateriaEditar.value = "";
    });
    document.getElementById("formEditarProfesor").addEventListener("submit", async function (event) {
        event.preventDefault(); // evitar recarga

        console.log("Inicio del guardado de cambios...");

        const nombreOriginal = nombreProfesorOriginal; // asumiendo variable global
        const nuevoNombre = document.getElementById("editarNombreProfesor").value.trim();
        const horasAsignadas = parseInt(document.getElementById("editarHorasAsignadas").value, 10);
        const horaEntrada = document.getElementById("editarHoraEntrada").value;
        const horaSalida = document.getElementById("editarHoraSalida").value;
        const periodo = document.getElementById("editarPeriodo").value.trim();
        const materias = materiasAgregadas;

        console.log("Nombre original:", nombreOriginal);
        console.log("Nuevo nombre:", nuevoNombre);

        try {
            // Cambiar nombre si es diferente
            if (nuevoNombre !== nombreOriginal) {
                console.log("Modificando nombre...");
                const urlNombre = `http://74.208.77.56:5484/profesores/${encodeURIComponent(nombreOriginal)}/nombre?nuevo_nombre=${encodeURIComponent(nuevoNombre)}`;
                const respNombre = await fetch(urlNombre, { method: "PUT" });
                if (!respNombre.ok) throw new Error("Error al modificar el nombre.");
                console.log("Nombre modificado correctamente.");
            } else {
                console.log("El nombre no cambió, no se modifica.");
            }

            // Modificar horas asignadas
            console.log("Modificando horas asignadas...");
            const urlHoras = `http://74.208.77.56:5484/profesores/${encodeURIComponent(nuevoNombre)}/horas?horas_asignadas=${encodeURIComponent(horasAsignadas)}`;
            const respHoras = await fetch(urlHoras, {
                method: "PUT"
            });

            if (!respHoras.ok) throw new Error("Error al modificar las horas asignadas.");
            console.log("Horas asignadas modificadas correctamente.");

            // Modificar horario entrada/salida
            console.log("Modificando horario...");
            const urlHorario = `http://74.208.77.56:5484/profesores/${encodeURIComponent(nuevoNombre)}/horario`;
            const respHorario = await fetch(urlHorario, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hora_entrada: horaEntrada, hora_salida: horaSalida })
            });
            if (!respHorario.ok) throw new Error("Error al modificar el horario.");
            console.log("Horario modificado correctamente.");

            // Modificar periodo
            console.log("Modificando periodo...");
            const urlPeriodo = `http://74.208.77.56:5484/profesores/${encodeURIComponent(nuevoNombre)}/periodo?periodo=${encodeURIComponent(periodo)}`;
            const respPeriodo = await fetch(urlPeriodo, {
                method: "PUT"
            });

            if (!respPeriodo.ok) throw new Error("Error al modificar el periodo.");
            console.log("Periodo modificado correctamente.");


            // Reemplazar materias
            console.log("Reemplazando materias...");
            const urlMaterias = `http://74.208.77.56:5484/profesores/${encodeURIComponent(nuevoNombre)}/materias/reemplazar`;
            const respMaterias = await fetch(urlMaterias, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(materias) // asegúrate que sea un array de strings
            });

            if (!respMaterias.ok) throw new Error("Error al modificar las materias.");
            console.log("Materias reemplazadas correctamente.");


            console.log("Todos los cambios se guardaron correctamente.");
            mostrarToast("Profesor actualizado correctamente.");
            bootstrap.Modal.getInstance(document.getElementById("modalEditarProfesor")).hide();
            cargarTablaProfesores();

        } catch (error) {
            console.error("Error al guardar cambios:", error);
            mostrarToastWarning("Error al guardar los cambios. Intenta de nuevo.");
        }
    });
});

// mayusculas el nombre y periodo
document.getElementById('editarNombreProfesor').addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ\s]/g, '');
});
document.getElementById('editarPeriodo').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
});

cargarTablaProfesores(); // Carga inicial
