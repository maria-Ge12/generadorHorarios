document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('nombreMateria').addEventListener('input', function () {
        this.value = this.value.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').toUpperCase();
    });

    const btnAgregar = document.querySelector(".btn-outline-verde");
    const modalAgregar = new bootstrap.Modal(document.getElementById("modalAgregarMateria"));
    const form = document.getElementById("formAgregarMateria");
    const tabla = document.getElementById("tabla-asignaturas").querySelector("tbody");
    const totalAsignaturas = document.getElementById("totalAsignaturas");

    btnAgregar.addEventListener("click", () => {
        form.reset(); // Limpia el formulario
        modalAgregar.show(); // Abre el modal
    });

    form.addEventListener("submit", e => {
        e.preventDefault();

        const nombre = document.getElementById("nombreMateria").value.trim();
        const semestre = document.getElementById("semestre").value;
        const teoria = document.getElementById("horasTeoria").value;
        const practica = document.getElementById("horasPractica").value;
        const creditos = document.getElementById("creditos").value;
        const maxGrupos = document.getElementById("maxGrupos").value;

        const soloMayusculas = /^[A-ZÁÉÍÓÚÑ\s]+$/;
        if (!soloMayusculas.test(nombre)) {
            console.warn("Validación fallida: El nombre debe contener solo letras MAYÚSCULAS y espacios.");
            mostrarToastInfo("El nombre de la asignatura solo puede contener letras MAYÚSCULAS y espacios.");
            return;
        }

        const data = {
            ASIGNATURA: nombre,
            SEM: semestre,
            HT: teoria,
            HP: practica,
            CRED: creditos,
            max_grup: parseInt(maxGrupos, 10)
        };

        console.log("Enviando datos al servidor:", data);

        fetch("https://cabadath.duckdns.org/api/crud/asignaturas/asignaturas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                console.log("Respuesta recibida:", response);
                if (!response.ok) {
                    throw new Error("Error al guardar la asignatura en el servidor.");
                }
                return response.json();
            })
            .then(result => {
                console.log("Respuesta JSON del servidor:", result);

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${data.ASIGNATURA}</td>
                    <td class="text-center">${data.SEM}</td>
                    <td class="text-center">${data.HT}</td>
                    <td class="text-center">${data.HP}</td>
                    <td class="text-center">${data.CRED}</td>
                    <td class="text-center">${data.max_grup}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-info me-1"><i class="fa fa-pen"></i></button>
                        <button class="btn btn-sm btn-danger"><i class="fa fa-trash"></i></button>
                    </td>
                `;
                tabla.appendChild(fila);

                totalAsignaturas.textContent = tabla.querySelectorAll("tr").length;

                modalAgregar.hide();

                form.reset();

                console.log("Asignatura guardada correctamente y tabla actualizada.");
                mostrarToastExito("Asignatura guardada correctamente.");
                setTimeout(() => {
                    location.reload();
                }, 2000);
            })
            .catch(error => {
                console.error("Error en la solicitud fetch:", error);
                mostrarToastError(error.message);
            });
    });
    
});

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

function mostrarToastInfo(mensaje) {
    const toastEl = document.getElementById("toastInfo");
    document.getElementById("toastBodyInfo").textContent = mensaje;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}