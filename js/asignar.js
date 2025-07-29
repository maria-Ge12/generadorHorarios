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

// ACTUALIZAR TARJETAS USANDO btnGuardar en tarjetaModificar.js
export async function actualizarVista() {
    try {
        const resp = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignaciones");
        if (!resp.ok) throw new Error("Error al obtener asignaciones");

        const datos = await resp.json();
        localStorage.setItem("asignaciones", JSON.stringify(datos));
        renderizarTarjetas(datos);
        actualizarTotalProfesores();
    } catch (error) {
        console.error("Error actualizando vista:", error);
    }
}

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

// ✅ Código principal al cargar la página
document.addEventListener("DOMContentLoaded", () => {
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

    const datosGuardados = localStorage.getItem("asignaciones");
    if (datosGuardados) renderizarTarjetas(JSON.parse(datosGuardados));

    btnAsignar?.addEventListener("click", asignarMaterias);
    inputBusqueda?.addEventListener("input", filtrarTarjetas);
});

async function asignarMaterias() {
    const seleccionados = Array.from(document.querySelectorAll('input[name="archivos"]:checked'))
                               .map(cb => cb.value);

    if (seleccionados.length === 0) {
        alert("Selecciona al menos un periodo para asignar materias.");
        return;
    }

    try {
        const res = await fetch("https://cabadath.duckdns.org/api/asignacion-materias/asignar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ periodos: seleccionados })
        });

        if (!res.ok) throw new Error("Error al asignar materias");
        const datos = await res.json();
        console.log(datos);

        localStorage.setItem("asignaciones", JSON.stringify(datos));
        renderizarTarjetas(datos);
        actualizarTotalProfesores();
    } catch (error) {
        console.error("Error al asignar materias:", error);
        alert("Ocurrió un error al asignar materias.");
    }
}
