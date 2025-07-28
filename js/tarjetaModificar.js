//PROPOSITO: Actualizar la vista principal tras cambios locales
//Esto vuelve a dibujar todas las tarjetas con los datos actualizados que llegan de la API (/asignaciones) 
//reemplaza la vista anterior.
//construye una tarjeta grande editable del profesor seleccionado
import { actualizarVista } from './asignar.js';

window.addEventListener("DOMContentLoaded", () => {
    // Limpiar cualquier almacenamiento temporal si se recarga la página (F5)
    for (let key in localStorage) {
        if (key.startsWith("materiasProfesor_")) {
            localStorage.removeItem(key);
            console.log("🧹 LocalStorage limpio por recarga de página:", key);
        }
    }
});

export function cargarCRUDModal(profesor) {
    const modalBody = document.querySelector("#modalEditarProfesor .modal-body");
    if (!modalBody) return;

    modalBody.innerHTML = ""; // Limpiar contenido anterior
    window.profesorActual = profesor; // Guardar para edición futura
    const key = "materiasProfesor_" + profesor.nombre;

    // 1. Inicializa localStorage si está vacío: mezcla materias backend en formato string "nombre - grupo"
    if (!localStorage.getItem(key)) {
        const materiasIniciales = profesor.materias.map(m => {
            if (m.grupo) return `${m.nombre_base} - ${m.grupo}`;
            return m.nombre_base;
        });
        localStorage.setItem(key, JSON.stringify(materiasIniciales));
    }

    //creacion de la terjeta grande
    const card = document.createElement("div");
    card.className = "card border-start border-info border-4 shadow-lg p-4 position-relative";

    // Botón eliminar profesor (esquina superior izquierda)
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn btn-link position-absolute";
    btnEliminar.style.top = "10px";
    btnEliminar.style.left = "10px";
    btnEliminar.innerHTML = `<i class="fa-solid fa-user-xmark" style="color: #74C0FC; font-size: 1.2rem;"></i>`;
    btnEliminar.title = "Eliminar profesor";

    // Dentro de cargarCRUDModal o después de que creas btnEliminar:
    btnEliminar.onclick = () => {
        const mensaje = document.getElementById("mensajeConfirmacion");
        mensaje.textContent = `¿Deseas eliminar al profesor ${profesor.nombre}?`;

        const modalConfirmacionElement = document.getElementById("modalConfirmarEliminacion");
        const modalConfirmacion = new bootstrap.Modal(modalConfirmacionElement);
        modalConfirmacion.show();

        const btnConfirmar = document.getElementById("btnConfirmarEliminar");

        // Limpiar listeners previos
        const nuevoBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);

        nuevoBtn.addEventListener("click", async () => {
            try {
                const nombreEncoded = encodeURIComponent(profesor.nombre.trim());
                const url = `http://74.208.77.56:5483/asigna_crud/elimina/${nombreEncoded}`;
                const response = await fetch(url, { method: "DELETE" });

                if (!response.ok) throw new Error("No se pudo eliminar el profesor.");
                console.log(`✅ Profesor eliminado: ${profesor.nombre}`);

                let asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || [];
                asignaciones = asignaciones.filter(p => p.nombre !== profesor.nombre);
                localStorage.setItem("asignaciones", JSON.stringify(asignaciones));

                // Cerrar modales
                bootstrap.Modal.getInstance(modalConfirmacionElement)?.hide();
                bootstrap.Modal.getInstance(document.getElementById("modalEditarProfesor"))?.hide();

                // Mostrar Toast
                mostrarToast(`✅ Profesor eliminado: ${profesor.nombre}`);

                // Recargar vista
                await actualizarVista();
            } catch (error) {
                console.error("❌ Error al eliminar profesor:", error);
                alert("No se pudo eliminar el profesor. Revisa la consola.");
            }
        });
    };

    // Título con nombre del profesor
    const nombre = document.createElement("h5");
    nombre.className = "card-title m-2 text-center text-info";
    nombre.innerHTML = `<i class="fa-solid fa-user-tie me-2"></i>${profesor.nombre}`;

    // Horas asignadas y creditos totales
    const info = document.createElement("div");
    info.className = "d-flex justify-content-between mb-1";

    info.innerHTML = `
        <span><strong>Horas asignadas:</strong> ${profesor.horas_asignadas}</span>
        <span><strong>Créditos totales:</strong> <span id="creditosTotales">${profesor.creditos_asignados}</span></span>
    `;

    // Horas entrada / salida
    const datosHoras = document.createElement("form");
    datosHoras.className = "row justify-content-center align-items-center mb-2";
    datosHoras.innerHTML = `
        <div class="col-6">
            <label class="form-label mb-1 "><strong>Entrada</strong></label>
            <input type="time" class="form-control form-control-sm" value="${profesor.hora_entrada || ''}" name="entrada-${profesor.id}">
        </div>
        <div class="col-6">
            <label class="form-label mb-1"><strong>Salida</strong></label>
            <input type="time" class="form-control form-control-sm" value="${profesor.hora_salida || ''}" name="salida-${profesor.id}">
        </div>
    `;

    // datos enviados a la funcion tomados del form de hora entrada / salida
    const inputEntrada = datosHoras.querySelector(`input[name="entrada-${profesor.id}"]`);
    const inputSalida = datosHoras.querySelector(`input[name="salida-${profesor.id}"]`);

    inputEntrada.addEventListener("change", (e) => {
        window.profesorActual.hora_entrada = e.target.value;
        console.log("Hora entrada actualizada localmente:", window.profesorActual.hora_entrada);
    });
    inputSalida.addEventListener("change", (e) => {
        window.profesorActual.hora_salida = e.target.value;
        console.log("Hora salida actualizada localmente:", window.profesorActual.hora_salida);
    });

    // Lista de Materias
    const materiasDiv = document.createElement("div");
    materiasDiv.className = "m-1";

    const tituloMaterias = document.createElement("p");
    tituloMaterias.className = "fw-semibold m-0 text-center";
    tituloMaterias.textContent = "Materias asignadas:";

    const listaMaterias = document.createElement("ul");
    listaMaterias.className = "list-group";
    listaMaterias.id = "listaMaterias";

    profesor.materias.forEach((materia) => {
        const nombreCompleto = materia.grupo
            ? `${materia.nombre_base} - ${materia.grupo}`
            : materia.nombre_base;

        const li = document.createElement("li");
        li.className = "list-group-item d-flex align-items-center";
        li.style.border = "2px solid #74C0FC";
        li.style.borderRadius = "6px";
        li.style.marginBottom = "4px";
        li.style.fontSize = "0.95rem";
        li.style.padding = "6px 12px";

        // Contenedor del nombre: flexible y con wrap para 2 líneas
        const contenedorNombre = document.createElement("div");
        contenedorNombre.style.flexGrow = "1";
        contenedorNombre.style.whiteSpace = "normal";  // permite salto de línea
        contenedorNombre.style.wordBreak = "break-word"; // para palabras largas

        contenedorNombre.textContent = nombreCompleto;

        // Créditos: bloque fijo, sin wrap, alineado centro vertical
        const spanCreditos = document.createElement("span");
        spanCreditos.className = "text-muted small";
        spanCreditos.style.whiteSpace = "nowrap";
        spanCreditos.style.marginLeft = "12px";
        spanCreditos.style.flexShrink = "0";  // para que no se reduzca
        spanCreditos.textContent = `Créditos: ${materia.creditos ?? '-'}`;

        // Icono de eliminar
        const iconoEliminar = document.createElement("i");
        iconoEliminar.className = "fa-solid fa-delete-left";
        iconoEliminar.style.color = "#74C0FC";
        iconoEliminar.style.cursor = "pointer";
        iconoEliminar.style.marginLeft = "12px";
        iconoEliminar.title = "Eliminar materia";

        iconoEliminar.addEventListener("click", () => {
            console.log(`🗑️ Materia marcada para eliminar: ${nombreCompleto}`);
            eliminarMateria(nombreCompleto);
        });

        li.appendChild(contenedorNombre);
        li.appendChild(spanCreditos);
        li.appendChild(iconoEliminar);

        listaMaterias.appendChild(li);
    });

    // FORMULARIO PARA AGREGAR MATERIA 
    const formAgregarMateria = document.createElement("div");
    formAgregarMateria.className = "mt-3";
    formAgregarMateria.innerHTML = `
        <label for="selectMateria" class="form-label fw-semibold text-center w-100">Agregar materia:</label>
        <div class="input-group">
            <select id="selectMateria" class="form-select form-select-sm">
                <option value="">Selecciona una materia...</option>
            </select>
            <button class="btn btn-outline-primary btn-sm" id="btnAgregarMateria">
                <i class="fa-solid fa-circle-plus me-1" style="color: #74C0FC;"></i>Agregar
            </button>
        </div>
    `;

    // Cargar materias desde API en el select del FORM
    (async function cargarMateriasDisponibles() {
        try {
            const resp = await fetch("http://74.208.77.56:5480/asignaturas");
            if (!resp.ok) throw new Error("Error al obtener materias");
            const data = await resp.json();

            const select = formAgregarMateria.querySelector("#selectMateria");
            select.innerHTML = '<option value="">Selecciona una materia...</option>';

            data.sort((a, b) => a.ASIGNATURA.localeCompare(b.ASIGNATURA))
                .forEach(({ ASIGNATURA, CRED }) => {
                    const option = document.createElement("option");
                    option.value = ASIGNATURA;
                    option.textContent = `${ASIGNATURA} (créditos: ${CRED})`;
                    select.appendChild(option);
                });

        } catch (err) {
            console.error("Error cargando materias:", err);
            alert("No se pudieron cargar las materias.");
        }
    })();

    materiasDiv.appendChild(tituloMaterias);
    materiasDiv.appendChild(listaMaterias);
    materiasDiv.appendChild(formAgregarMateria);
    cargarMateriasDesdeLocalStorage();

    card.appendChild(btnEliminar);
    card.appendChild(nombre);
    card.appendChild(info);
    card.appendChild(datosHoras);
    card.appendChild(materiasDiv);
    modalBody.appendChild(card);

    cargarCatalogoYRenderizar();

    // Luego asignar evento:
    const btnAgregarMateria = formAgregarMateria.querySelector("#btnAgregarMateria");
    const selectMateria = formAgregarMateria.querySelector("#selectMateria");
    //BOTON AGREGAR MATERIA LOCALMENTE
    btnAgregarMateria.addEventListener("click", async (e) => {
        e.preventDefault();

        const key = "materiasProfesor_" + window.profesorActual.nombre;
        const select = formAgregarMateria.querySelector("#selectMateria");
        const materiaBase = select.value;
        if (!materiaBase) {
            alert("Selecciona una materia");
            return;
        }
        try {
            const grupo = await calcularSiguienteGrupoUnico(window.profesorActual, materiaBase);
            const materiaCompleta = `${materiaBase} - ${grupo}`;

            let materiasLocal = JSON.parse(localStorage.getItem(key)) || [];

            if (materiasLocal.includes(materiaCompleta)) {
                alert("Esa materia con grupo ya está asignada");
                return;
            }
            materiasLocal.push(materiaCompleta);
            localStorage.setItem(key, JSON.stringify(materiasLocal));
            console.log("Guardando materias localmente:", materiasLocal);

            const listaMateriasContainer = document.getElementById("listaMaterias");
            renderizarMateriasConCreditos(materiasLocal, listaMateriasContainer);

            select.value = "";
        } catch (error) {
            alert("Error generando grupo: " + error.message);
        }
    });
}

// ------------------------------------------- BOTONES -------------------------------------------------------------
//BOTON GUARDAR
const btnGuardar = document.getElementById("btnGuardarCambios");
if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
        if (window.profesorActual) {
            await guardarCambiosHorario(window.profesorActual);
            await actualizarVista();

            // Cerrar modal Bootstrap
            const modalElement = document.getElementById("modalEditarProfesor");
            const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modalInstance.hide();
            btnGuardar.blur();
        } else {
            alert("No hay profesor seleccionado");
        }
    });
}

const btnCancelar = document.getElementById("btnCancelar");
if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
        if (window.profesorActual?.nombre) {
            const materiasLocalKey = "materiasProfesor_" + window.profesorActual.nombre;
            localStorage.removeItem(materiasLocalKey);
            console.log("LocalStorage cancelado para:", window.profesorActual.nombre);
        }
    });
}

// También limpiar localStorage si se cierra el modal sin hacer clic en Cancelar
const modalEditar = document.getElementById("modalEditarProfesor");
if (modalEditar) {
    modalEditar.addEventListener("hidden.bs.modal", () => {
        if (window.profesorActual?.nombre) {
            const key = "materiasProfesor_" + window.profesorActual.nombre;
            localStorage.removeItem(key);
            console.log("🧹 LocalStorage limpiado por cierre del modal:", key);
        }
    });
}

//------------------------------------------- FUNCIONES DE MODIFICACIONES CON APIS ------------------------------------------------
async function guardarCambiosHorario(profesor) {
    // 1. Actualizar horas
    try {
        const urlHorario = `http://74.208.77.56:5483/asigna_crud/actualiza/${encodeURIComponent(profesor.nombre)}/horario`;
        const bodyHorario = {
            hora_entrada: profesor.hora_entrada,
            hora_salida: profesor.hora_salida,
        };
        const respHorario = await fetch(urlHorario, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyHorario),
        });
        if (!respHorario.ok) throw new Error(`Error al actualizar horario: ${respHorario.statusText}`);
        console.log("Horas actualizadas");
    } catch (error) {
        console.error(error);
        alert("Error al actualizar horario. Intenta de nuevo.");
        return;
    }

    // 2. Detectar materias eliminadas y llamar API DELETE
    try {
        const key = "materiasProfesor_" + profesor.nombre;
        const materiasLocal = JSON.parse(localStorage.getItem(key)) || [];

        const originales = profesor.materias.map(m => {
            return m.grupo ? `${m.nombre_base} - ${m.grupo}` : m.nombre_base;
        });

        const eliminadas = originales.filter(m => !materiasLocal.includes(m));
        for (const materiaEliminada of eliminadas) {
            const url = `http://74.208.77.56:5483/asigna_crud/elimina/${encodeURIComponent(profesor.nombre)}/materias/${encodeURIComponent(materiaEliminada)}`;
            const resp = await fetch(url, { method: "DELETE" });
            if (!resp.ok) {
                console.error(`Error al eliminar materia ${materiaEliminada}`, await resp.text());
            } else {
                console.log("Materia eliminada en backend:", materiaEliminada);
            }
        }

        // 3. Agregar materias nuevas
        const nuevas = materiasLocal.filter(m => !originales.includes(m));
        for (const materiaNueva of nuevas) {
            const urlMaterias = `http://74.208.77.56:5483/asigna_crud/agrega/${encodeURIComponent(profesor.nombre)}/materias`;
            const bodyMateria = { nombre_completo: materiaNueva };
            const respMateria = await fetch(urlMaterias, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyMateria),
            });
            if (!respMateria.ok) {
                console.error(`Error al agregar materia ${materiaNueva}`, await respMateria.text());
            }
        }

        localStorage.removeItem(key); // Limpiar cache local después de guardar
        console.log("Cambios guardados (materias eliminadas y agregadas)");
    } catch (error) {
        console.error("Error guardando materias:", error);
    }
    return true;
}

// ------------------------------------------- FUNCIONES EXTRA -------------------------------------------
function eliminarMateria(materiaCompleta) {
    const key = "materiasProfesor_" + window.profesorActual.nombre;
    let materiasLocal = JSON.parse(localStorage.getItem(key)) || [];

    materiasLocal = materiasLocal.filter(m => m !== materiaCompleta);
    localStorage.setItem(key, JSON.stringify(materiasLocal));
    cargarMateriasDesdeLocalStorage();
}

function calcularCreditosTotales(materiasLocal) {
    let total = 0;
    materiasLocal.forEach(materiaCompleta => {
        const nombreBase = materiaCompleta.split(" - ")[0].trim();
        const creditos = parseFloat(window.catalogoAsignaturas?.[nombreBase] || 0);
        total += creditos;
    });
    return total;
}

async function cargarCatalogoYRenderizar(materiasLocal, listaMaterias) {
    try {
        const resp = await fetch("http://74.208.77.56:5480/asignaturas");
        if (!resp.ok) throw new Error("No se pudo cargar asignaturas");
        const data = await resp.json();

        window.catalogoAsignaturas = {};
        data.forEach(({ ASIGNATURA, CRED }) => {
            window.catalogoAsignaturas[ASIGNATURA] = CRED;
        });

        // ✅ Asegurarse de que listaMaterias existe antes de renderizar
        if (listaMaterias) {
            renderizarMateriasConCreditos(materiasLocal, listaMaterias);
        } else {
            console.warn("Contenedor listaMaterias no encontrado al intentar renderizar.");
        }

    } catch (error) {
        console.error(error);
        alert("Error cargando catálogo de asignaturas");
    }
}

function renderizarMateriasConCreditos(materiasLocal, listaMateriasContainer) {
    listaMateriasContainer.innerHTML = ""; // limpiar

    materiasLocal.forEach(materiaCompleta => {
        // Obtener nombre base para buscar créditos
        const nombreBase = materiaCompleta.split(" - ")[0].trim();
        const creditos = window.catalogoAsignaturas?.[nombreBase] ?? "-";

        const li = document.createElement("li");
        li.className = "list-group-item d-flex align-items-center";
        li.style.border = "2px solid #74C0FC";
        li.style.borderRadius = "6px";
        li.style.marginBottom = "4px";
        li.style.fontSize = "0.95rem";
        li.style.padding = "6px 12px";

        // Contenedor nombre
        const contenedorNombre = document.createElement("div");
        contenedorNombre.style.flexGrow = "1";
        contenedorNombre.style.whiteSpace = "normal";
        contenedorNombre.style.wordBreak = "break-word";
        contenedorNombre.textContent = materiaCompleta;

        // Créditos
        const spanCreditos = document.createElement("span");
        spanCreditos.className = "text-muted small";
        spanCreditos.style.whiteSpace = "nowrap";
        spanCreditos.style.marginLeft = "12px";
        spanCreditos.style.flexShrink = "0";
        spanCreditos.textContent = `Créditos: ${creditos}`;

        const creditosTotales = calcularCreditosTotales(materiasLocal);
        const creditosSpan = document.getElementById("creditosTotales");
        if (creditosSpan) {
            creditosSpan.textContent = creditosTotales;
        }

        // Icono eliminar
        const iconEliminar = document.createElement("i");
        iconEliminar.className = "fa-solid fa-delete-left";
        iconEliminar.style.color = "#74C0FC";
        iconEliminar.style.cursor = "pointer";
        iconEliminar.style.marginLeft = "12px";
        iconEliminar.title = "Eliminar materia";

        iconEliminar.addEventListener("click", () => {
            eliminarMateria(materiaCompleta);
            // Actualizar vista tras eliminar
            const nuevasMaterias = JSON.parse(localStorage.getItem("materiasProfesor_" + window.profesorActual.nombre)) || [];
            renderizarMateriasConCreditos(nuevasMaterias, listaMateriasContainer);
        });

        li.appendChild(contenedorNombre);
        li.appendChild(spanCreditos);
        li.appendChild(iconEliminar);

        listaMateriasContainer.appendChild(li);
    });
}

function cargarMateriasDesdeLocalStorage() {
    const listaMaterias = document.getElementById("listaMaterias");
    if (!listaMaterias) return;

    const materiasLocal = JSON.parse(localStorage.getItem("materiasProfesor_" + window.profesorActual.nombre)) || [];
    console.log("Materias cargadas desde localStorage:", materiasLocal);
    listaMaterias.innerHTML = "";

    materiasLocal.forEach(materiaCompleta => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.style.border = "3px solid #74C0FC";
        li.style.borderRadius = "6px";
        li.style.marginBottom = "1px";

        const span = document.createElement("span");
        span.textContent = materiaCompleta;

        const iconEliminar = document.createElement("i");
        iconEliminar.className = "fa-solid fa-delete-left";
        iconEliminar.style.color = "#74C0FC";
        iconEliminar.style.cursor = "pointer";
        iconEliminar.title = "Eliminar materia";

        iconEliminar.addEventListener("click", () => {
            eliminarMateria(materiaCompleta);
        });

        li.appendChild(span);
        li.appendChild(iconEliminar);
        listaMaterias.appendChild(li);
    });
    // ➕ Aquí actualizamos las horas asignadas si no hay materias
    const info = document.querySelector(".card-title + p"); // p después del nombre
    if (info) {
        const horas = materiasLocal.length > 0 ? window.profesorActual.horas_asignadas : 0;
        info.innerHTML = `<strong>Horas asignadas:</strong> ${horas}`;
    }
}

async function calcularSiguienteGrupoUnico(profesor, materiaBase) {
    const respEstadisticas = await fetch("http://74.208.77.56:5481/estadisticas");
    if (!respEstadisticas.ok) throw new Error("Error al obtener estadísticas");
    const dataEstadisticas = await respEstadisticas.json();
    const gruposAPI = dataEstadisticas.grupos_por_materia?.[materiaBase] || [];

    // Obtener asignaciones actuales locales (localStorage)
    const asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || [];
    const gruposAsignadosLocales = asignaciones
        .flatMap(p => p.materias)
        .filter(m => m.nombre_base === materiaBase)
        .map(m => {
            if (m.nombre_completo && m.nombre_completo.includes(" - ")) {
                return m.nombre_completo.split(" - ")[1]; // grupo "XA", "XB", etc
            }
            return null;
        })
        .filter(g => g);
    const gruposUsados = Array.from(new Set([...gruposAPI, ...gruposAsignadosLocales]));
    const letrasUsadas = gruposUsados.map(g => g.slice(-1)); // toma solo la letra final
    letrasUsadas.sort();
    const ultimaLetra = letrasUsadas.length > 0 ? letrasUsadas[letrasUsadas.length - 1] : '@';
    const siguienteLetra = String.fromCharCode(ultimaLetra.charCodeAt(0) + 1);
    const nuevoGrupo = `X${siguienteLetra}`;

    if (gruposUsados.includes(nuevoGrupo)) {
        throw new Error("No se pudo generar un grupo único. Límite alcanzado?");
    }
    return nuevoGrupo;
}

function mostrarToast(mensaje) {
    const toastContainer = document.getElementById("toastContainer");
    const toastBody = document.getElementById("toastBody");
    toastBody.textContent = mensaje;

    const toast = new bootstrap.Toast(toastContainer);
    toast.show();
}