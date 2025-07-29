document.addEventListener("DOMContentLoaded", () => {
    //mayusculas el nombre y periodo
    document.getElementById('nombreProfesor').addEventListener('input', function () {
        this.value = this.value.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').toUpperCase();
    });
    document.getElementById('periodo').addEventListener('input', function () {
        this.value = this.value.toUpperCase();
    });

    const btnAgregar = document.querySelector(".btn-outline-verde");
    const modalElement = document.getElementById("modalAgregarProfesor");
    const modal = new bootstrap.Modal(modalElement);
    const selectMateria = document.getElementById("selectMateria");
    const btnAgregarMateria = document.getElementById("btnAgregarMateria");
    const listaMaterias = document.getElementById("listaMaterias");
    const form = document.getElementById("formAgregarProfesor");

    // Cargar materias desde API
    fetch("http://74.208.77.56:5480/asignaturas")
        .then(response => response.json())
        .then(data => {
            data.forEach(materia => {
                const option = document.createElement("option");
                option.value = materia.ASIGNATURA;
                option.textContent = `${materia.ASIGNATURA} (Cred: ${materia.CRED})`;
                selectMateria.appendChild(option);
            });
        })
        .catch(err => console.error("Error cargando materias:", err));

    // Mostrar modal al dar clic y limpiar campos
    btnAgregar.addEventListener("click", () => {
        form.reset(); // Limpia inputs
        listaMaterias.innerHTML = ""; // Limpia lista
        selectMateria.value = "";
        localStorage.removeItem("materiasProfesor");
        modal.show();
    });

    // Agregar materia
    btnAgregarMateria.addEventListener("click", () => {
        const materiaSeleccionada = selectMateria.value;
        if (!materiaSeleccionada) return mostrarToastInfo("Selecciona una materia antes de agregar.");

        let materias = JSON.parse(localStorage.getItem("materiasProfesor")) || [];

        if (materias.includes(materiaSeleccionada)) {
            return mostrarToastInfo("La materia ya está en la lista.");
        }

        materias.push(materiaSeleccionada);
        localStorage.setItem("materiasProfesor", JSON.stringify(materias));
        agregarMateriaALista(materiaSeleccionada);
        selectMateria.value = "";
    });

    // Función para mostrar materia en la lista
    function agregarMateriaALista(materia) {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.textContent = materia;

        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-sm btn-danger";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminarMateria(materia));

        li.appendChild(btnEliminar);
        listaMaterias.appendChild(li);
    }

    // Eliminar materia
    function eliminarMateria(materia) {
        let materias = JSON.parse(localStorage.getItem("materiasProfesor")) || [];
        materias = materias.filter(m => m !== materia);
        localStorage.setItem("materiasProfesor", JSON.stringify(materias));
        cargarListaMateriasDesdeStorage();
    }

    // Cargar materias desde localStorage
    function cargarListaMateriasDesdeStorage() {
        listaMaterias.innerHTML = "";
        const materias = JSON.parse(localStorage.getItem("materiasProfesor")) || [];
        materias.forEach(materia => agregarMateriaALista(materia));
    }

    // Al cerrar el modal
    modalElement.addEventListener('hidden.bs.modal', () => {
        localStorage.removeItem("materiasProfesor");
        listaMaterias.innerHTML = "";
        form.reset();
    });

    // Enviar formulario
    form.addEventListener("submit", e => {
        e.preventDefault();

        const nombre = document.getElementById("nombreProfesor").value.trim();
        const horasAsignadas = parseInt(document.getElementById("horasAsignadas").value, 10);
        const horaEntrada = document.getElementById("horaEntrada").value;
        const horaSalida = document.getElementById("horaSalida").value;
        const periodo = document.getElementById("periodo").value.trim();
        if (!validarPeriodo(periodo)) {
            mostrarToastWarning("El período debe tener el formato 'ENE-JUN 25'.");
            return;
        }
        const materias = JSON.parse(localStorage.getItem("materiasProfesor")) || [];
        if (!nombre || isNaN(horasAsignadas) || !horaEntrada || !horaSalida || !periodo || materias.length === 0) {
            mostrarToastWarning("Por favor completa todos los campos y agrega al menos una materia.");
            return;
        }

        const nuevoProfesor = {
            nombre,
            horas_asignadas: horasAsignadas,
            hora_entrada: horaEntrada,
            hora_salida: horaSalida,
            periodo,
            materias
        };

        fetch("https://cabadath.duckdns.org/api/crud/profesores/profesores/nuevo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoProfesor)
        })
            .then(res => {
                if (!res.ok) throw new Error("Error al crear profesor");
                return res.json();
            })
            .then(() => {
                mostrarToastExito("Profesor creado correctamente.");
                modal.hide();
                localStorage.removeItem("materiasProfesor");
                form.reset();
                listaMaterias.innerHTML = "";
                if (typeof cargarTablaProfesores === "function") {
                    cargarTablaProfesores(); // Solo si existe esa función
                }
            })
            .catch(err => {
                console.error("Error al crear profesor:", err);
                mostrarToastError("Error al crear el profesor. Intenta de nuevo.");
            });
    });
});

function validarPeriodo(periodo) {
    const regex = /^[A-Z]{3}-[A-Z]{3} \d{2}$/;
    return regex.test(periodo);
}

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
