/*
  Muestra tarjetas de profesores con sus materias asignadas, 
  permite filtrarlos por nombre, asignar materias vía API '/asignar' 
  y editar con un ícono que abre un modal.

  Visual: crea tarjetas con nombre, horas, entrada/salida y lista de materias, 
  en dos columnas, con ícono de edición y buscador arriba.
  Solo abre el modal de modificacion y manda a tarjetaModificar.js
*/

import { actualizarTotalProfesores, mostrarProfesoresDesdeStorage } from './profAsignados.js';
import { cargarCRUDModal } from './tarjetaModificar.js';

export const filaTarjetas = createElementWithClass("div", "row gy-3");
filaTarjetas.id = "profesorList";


export function renderizarTarjetas(datos) {
    filaTarjetas.innerHTML = "";

    datos.forEach(profesor => {
        const col = createElementWithClass("div", "col-md-6 mb-3");
        const card = createElementWithClass("div", "card border-start border-3 border-info shadow-sm position-relative");

        const iconoEditar = document.createElement("lord-icon");
        Object.assign(iconoEditar, {
            src: "https://cdn.lordicon.com/exymduqj.json",
            trigger: "hover",
            colors: "primary:#121331,secondary:#4030e8"
        });
        Object.assign(iconoEditar.style, {
            width: "28px",
            height: "28px",
            position: "absolute",
            top: "10px",
            right: "10px",
            cursor: "pointer"
        });

        iconoEditar.className = "icono-editar";
        iconoEditar.addEventListener("click", () => {
            const modalEl = document.getElementById("modalEditarProfesor");
            if (!modalEl) return;
            cargarCRUDModal(profesor);
            new bootstrap.Modal(modalEl).show();
        });

        const cardBody = createElementWithClass("div", "card-body py-2 px-3 text-center");

        const titulo = createElementWithClass("h6", "card-title mb-1");
        titulo.innerHTML = `<i class="fa-solid fa-user-tie me-2 text-info"></i>${profesor.nombre}`;

        const subtitulo = document.createElement("small");
        subtitulo.className = "text-muted";
        subtitulo.innerHTML = `Horas asignadas: <strong>${profesor.horas_asignadas}</strong> | Creditos totales: <strong>${profesor.creditos_asignados}</strong> | Entrada: <strong>${profesor.hora_entrada || '-'}</strong> | Salida: <strong>${profesor.hora_salida || '-'}</strong>`;

        const hr = document.createElement("hr");
        hr.className = "my-2";

        const divMaterias = createElementWithClass("div", "text-start");

        const tituloMaterias = createElementWithClass("p", "fw-semibold mb-1 small");
        tituloMaterias.textContent = "Materias asignadas:";

        const ul = createElementWithClass("ul", "mb-0 ps-3 small");

        [...new Set(profesor.materias.map(m => m.nombre_base))].forEach(nombre => {
            const li = document.createElement("li");
            li.textContent = nombre;
            ul.appendChild(li);
        });

        divMaterias.appendChild(tituloMaterias);
        divMaterias.appendChild(ul);

        [titulo, subtitulo, hr, divMaterias].forEach(el => cardBody.appendChild(el));
        [iconoEditar, cardBody].forEach(el => card.appendChild(el));
        col.appendChild(card);
        filaTarjetas.appendChild(col);
    });

    filtrarTarjetas();
}

export function filtrarTarjetas() {
    const inputBusqueda = document.getElementById("searchInput");
    const filtro = inputBusqueda?.value.toLowerCase() || "";
    const tarjetas = document.querySelectorAll("#profesorList .col-md-6");
    tarjetas.forEach(tarjeta => {
        const nombre = tarjeta.querySelector(".card-title")?.textContent.toLowerCase() || "";
        tarjeta.style.display = nombre.includes(filtro) ? "" : "none";
    });
}

export function createElementWithClass(tag, className = "", styleObj = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.assign(el.style, styleObj);
    return el;
}

// ✅ Función para cargar datos iniciales
async function cargarDatosIniciales() {
    try {
        // 1. Primero intentar cargar desde localStorage
        const datosGuardados = localStorage.getItem("asignaciones");
        
        if (datosGuardados) {
            const datos = JSON.parse(datosGuardados);
            if (datos && datos.length > 0) {
                console.log("Cargando datos desde localStorage");
                renderizarTarjetas(datos);
                actualizarTotalProfesores();
                return; // Si hay datos en localStorage, terminar aquí
            }
        }

        // 2. Si no hay datos en localStorage, intentar cargar desde /asignaciones
        console.log("No hay datos en localStorage, intentando cargar desde /asignaciones");
        const resp = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignaciones");
        
        if (!resp.ok) {
            console.log("No hay asignaciones disponibles en el servidor");
            return; // No hay datos disponibles, mostrar vista vacía
        }

        const datos = await resp.json();
        
        if (datos && datos.length > 0) {
            console.log("Datos cargados desde /asignaciones:", datos.length, "profesores");
            
            // Guardar en localStorage para futuras cargas
            localStorage.setItem("asignaciones", JSON.stringify(datos));
            
            // Renderizar las tarjetas
            renderizarTarjetas(datos);
            actualizarTotalProfesores();
        } else {
            console.log("No hay asignaciones disponibles");
        }
        
    } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        // En caso de error, mostrar vista vacía sin errores molestos al usuario
    }
}

// ✅ Código principal al cargar la página - MEJORADO
document.addEventListener("DOMContentLoaded", async () => {
    // Mostrar estadísticas desde storage inmediatamente (si existen)
    mostrarProfesoresDesdeStorage();

    const btnAsignar = document.querySelector(".btn.btn-info");
    const contenedorAsignaciones = document.getElementById("contenedorAsignaciones");
    const inputBusqueda = document.getElementById("searchInput");

    const cardBodyScrollable = createElementWithClass("div", null, {
        maxHeight: "270px",
        overflowY: "auto",
        overflowX: "hidden"
    });

    cardBodyScrollable.appendChild(filaTarjetas);
    contenedorAsignaciones?.appendChild(cardBodyScrollable);

    // Cargar datos iniciales (verifica localStorage y luego /asignaciones)
    await cargarDatosIniciales();

    // Event listeners
    btnAsignar?.addEventListener("click", asignarMaterias);
    inputBusqueda?.addEventListener("input", filtrarTarjetas);
});

// ✅ Función actualizarVista mejorada (para usar después de asignar)
export async function actualizarVista() {
    try {
        console.log("Actualizando vista desde /asignaciones...");
        const resp = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignaciones");
        
        if (!resp.ok) {
            throw new Error(`Error ${resp.status} al obtener asignaciones`);
        }

        const datos = await resp.json();
        
        // Guardar en localStorage
        localStorage.setItem("asignaciones", JSON.stringify(datos));
        
        // Renderizar tarjetas
        renderizarTarjetas(datos);
        actualizarTotalProfesores();
        
        console.log("Vista actualizada correctamente:", datos.length, "profesores");
        
    } catch (error) {
        console.error("Error actualizando vista:", error);
        throw error; // Re-lanzar el error para que lo maneje asignarMaterias()
    }
}

async function asignarMaterias() {
    const seleccionados = Array.from(document.querySelectorAll('input[name="archivos"]:checked'))
                               .map(cb => cb.value);

    if (seleccionados.length === 0) {
        alert("Selecciona al menos un periodo para asignar materias.");
        return;
    }

    try {
        // 1. Realizar la asignación inicial
        console.log("Iniciando asignación de materias...");
        const resAsignacion = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ periodos: seleccionados })
        });

        if (!resAsignacion.ok) throw new Error("Error al asignar materias");
        
        // 2. Verificar discrepancias usando estadísticas
        console.log("Obteniendo estadísticas y verificando discrepancias...");
        const resEstadisticas = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/estadisticas");
        
        if (!resEstadisticas.ok) {
            console.warn("No se pudieron obtener las estadísticas, continuando con la vista normal");
            await actualizarVista();
            return;
        }

        const estadisticas = await resEstadisticas.json();
        console.log("Estadísticas obtenidas:", estadisticas);

        // 3. Si hay discrepancias, intentar reasignar individualmente
        if (estadisticas.success && estadisticas.discrepancias && estadisticas.discrepancias.length > 0) {
            console.log(`Se encontraron ${estadisticas.discrepancias.length} maestros con discrepancias. Intentando reasignar...`);
            
            // Procesar cada maestro con discrepancias
            for (const maestro of estadisticas.discrepancias) {
                try {
                    // Omitir maestros con nombre "_" (datos incompletos)
                    if (maestro.nombre === "_") {
                        console.log("Omitiendo maestro con nombre '_' (datos incompletos)");
                        continue;
                    }

                    console.log(`Reasignando maestro: ${maestro.nombre} (Diferencia: ${maestro.diferencia})`);
                    
                    // Estructura correcta para la API asignar-individual
                    const payload = {
                        nombre_profesor: maestro.nombre,
                        tolerancia: 5,
                        max_combinaciones: 500
                    };

                    console.log("Enviando payload:", payload);

                    const resReasignacion = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignar-individual", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (!resReasignacion.ok) {
                        const errorText = await resReasignacion.text();
                        console.error(`Error ${resReasignacion.status} para ${maestro.nombre}:`, errorText);
                        throw new Error(`HTTP ${resReasignacion.status}: ${errorText}`);
                    }

                    if (resReasignacion.ok) {
                        const resultado = await resReasignacion.json();
                        console.log(`✅ Maestro ${maestro.nombre} reasignado correctamente:`, resultado);
                    }
                } catch (errorIndividual) {
                    console.error(`❌ Error al reasignar maestro ${maestro.nombre}:`, errorIndividual);
                }
            }
            
            console.log("Proceso de reasignación completado. Actualizando vista...");
            
            console.log("Proceso de reasignación completado. Actualizando vista...");
        } else {
            console.log("No se encontraron discrepancias en las estadísticas.");
        }

        // 4. Actualizar la vista final con los datos corregidos
        await actualizarVista();
        console.log("Vista actualizada correctamente.");

    } catch (error) {
        console.error("Error en el proceso de asignación:", error);
        alert("Ocurrió un error al asignar materias: " + error.message);
    }
}
