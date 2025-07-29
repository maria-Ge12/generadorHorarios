document.addEventListener("DOMContentLoaded", () => {
    // Toast functions (sin cambios)
    function mostrarToastExito(mensaje) {
        const toastEl = document.getElementById("toastExito");
        document.getElementById("toastBodyExito").textContent = mensaje;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    function mostrarToastError(mensaje) {
        const toastEl = document.getElementById("toastError");
        document.getElementById("toastBodyError").textContent = mensaje;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    // Variables para modal eliminar
    const modalEliminar = new bootstrap.Modal(document.getElementById("modalConfirmarEliminar"));
    const textoConfirmacion = document.getElementById("textoConfirmacionEliminar");
    const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");

    let nombreAsignaturaEliminar = null;

    // Validación para que el nombre en el modal editar solo acepte mayúsculas y espacios
    document.getElementById('editarNombreMateria').addEventListener('input', function () {
        this.value = this.value.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').toUpperCase();
    });

    // Cargar asignaturas y montar tabla
    fetch("https://cabadath.duckdns.org/api/crud/asignaturas/asignaturas")
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector("#tabla-asignaturas tbody");
            tbody.innerHTML = ""; // Limpiar tabla

            let totalAsignaturas = 0;

            data.forEach(asignatura => {
                totalAsignaturas++;

                // Construir fila con data-atributos para editar fácilmente
                const fila = document.createElement("tr");
                fila.innerHTML = `
          <td class="text-start">${asignatura.ASIGNATURA ?? '-'}</td>
          <td class="text-center">${asignatura.SEM ?? '-'}</td>
          <td class="text-center">${asignatura.HT ?? '-'}</td>
          <td class="text-center">${asignatura.HP ?? '-'}</td>
          <td class="text-center">${asignatura.CRED ?? '-'}</td>
          <td class="text-center">${asignatura.max_grup ?? '-'}</td>
          <td class="text-center">
            <button
              class="btn btn-sm btn-info me-2 btn-editar-materia"
              data-id="${asignatura.id ?? asignatura.ID ?? totalAsignaturas}"
              data-asignatura="${asignatura.ASIGNATURA ?? ''}"
              data-sem="${asignatura.SEM ?? ''}"
              data-ht="${asignatura.HT ?? ''}"
              data-hp="${asignatura.HP ?? ''}"
              data-cred="${asignatura.CRED ?? ''}"
              data-max="${asignatura.max_grup ?? ''}"
            >
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-eliminar-materia" data-nombre="${encodeURIComponent(asignatura.ASIGNATURA ?? '')}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
                tbody.appendChild(fila);
            });

            document.getElementById("totalAsignaturas").textContent = totalAsignaturas;

            // Delegación de eventos para editar y eliminar
            tbody.addEventListener("click", (e) => {
                // Editar
                if (e.target.closest(".btn-editar-materia")) {
                    const btn = e.target.closest(".btn-editar-materia");

                    // Asignar valores a modal editar
                    document.getElementById("editarIdMateria").value = btn.dataset.id;
                    document.getElementById("editarNombreOriginal").value = btn.dataset.asignatura; // input hidden para nombre original
                    document.getElementById("editarNombreMateria").value = btn.dataset.asignatura;
                    document.getElementById("editarSemestre").value = btn.dataset.sem;
                    document.getElementById("editarHorasTeoria").value = btn.dataset.ht;
                    document.getElementById("editarHorasPractica").value = btn.dataset.hp;
                    document.getElementById("editarCreditos").value = btn.dataset.cred;
                    document.getElementById("editarMaxGrupos").value = btn.dataset.max;

                    // Abrir modal editar
                    const modalEditar = new bootstrap.Modal(document.getElementById("modalEditarMateria"));
                    modalEditar.show();
                }

                // Eliminar con modal confirmación
                if (e.target.closest(".btn-eliminar-materia")) {
                    const btnEliminar = e.target.closest(".btn-eliminar-materia");
                    nombreAsignaturaEliminar = decodeURIComponent(btnEliminar.dataset.nombre);

                    textoConfirmacion.textContent = `¿Seguro que quieres eliminar la asignatura "${nombreAsignaturaEliminar}"?`;
                    modalEliminar.show();
                }
            });
        })
        .catch(error => {
            console.error("Error al obtener las asignaturas:", error);
        });

    // Evento para confirmar eliminación desde modal
    btnConfirmarEliminar.addEventListener("click", () => {
        if (!nombreAsignaturaEliminar) return;

        fetch(`https://cabadath.duckdns.org/api/crud/asignaturas/asignaturas/${encodeURIComponent(nombreAsignaturaEliminar)}`, {
            method: "DELETE"
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al eliminar la asignatura.");
                console.log(`Asignatura "${nombreAsignaturaEliminar}" eliminada.`);
                modalEliminar.hide();
                mostrarToastExito("Asignatura eliminada");
                setTimeout(() => {
                    location.reload();
                }, 2000);
            })
            .catch(error => {
                console.error("Error al eliminar asignatura:", error);
                modalEliminar.hide();
                mostrarToastError("No se pudo eliminar la asignatura.");
            });
    });

    // Submit del formulario editar para hacer PUT
    const formEditar = document.getElementById("formEditarMateria");
    formEditar.addEventListener("submit", e => {
        e.preventDefault();

        const idMateria = document.getElementById("editarIdMateria").value;
        const nombre = document.getElementById("editarNombreMateria").value.trim();
        const semestre = document.getElementById("editarSemestre").value;
        const ht = document.getElementById("editarHorasTeoria").value;
        const hp = document.getElementById("editarHorasPractica").value;
        const cred = document.getElementById("editarCreditos").value;
        const maxGrupos = document.getElementById("editarMaxGrupos").value;
        const nombreOriginal = document.getElementById("editarNombreOriginal").value;

        const data = {
            ASIGNATURA: nombre,
            SEM: semestre,
            HT: ht,
            HP: hp,
            CRED: cred,
            max_grup: parseInt(maxGrupos, 10)
        };

        console.log("Enviando PUT para actualizar materia:", idMateria, data);

        fetch(`https://cabadath.duckdns.org/api/crud/asignaturas/asignaturas/${encodeURIComponent(nombreOriginal)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                console.log("Respuesta PUT:", response);
                if (!response.ok) throw new Error("Error al actualizar la asignatura.");
                return response.json();
            })
            .then(result => {
                console.log("Asignatura actualizada:", result);
                mostrarToastExito("Asignatura actualizada correctamente.");
                setTimeout(() => {
                    location.reload();
                }, 2000);
            })
            .catch(error => {
                console.error("Error al actualizar asignatura:", error);
                mostrarToastError("No se pudo actualizar la asignatura.");
            });
    });
});
