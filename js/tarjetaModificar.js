import { actualizarVista } from './asignar.js';

// ==========================================
// CONSTANTES Y CONFIGURACIÓN
// ==========================================
const CONFIG = {
    API_BASE: 'https://cabadath.duckdns.org/api',
    STORAGE_PREFIX: 'materiasProfesor_',
    COLORS: new Map()
};

const SELECTORS = {
    modalBody: '#modalEditarProfesor .modal-body',
    modalEditar: '#modalEditarProfesor',
    modalConfirmacion: '#modalConfirmarEliminacion',
    btnGuardar: '#btnGuardarCambios',
    btnCancelar: '#btnCancelar',
    btnConfirmar: '#btnConfirmarEliminar',
    mensajeConfirmacion: '#mensajeConfirmacion',
    toastContainer: '#toastContainer',
    toastBody: '#toastBody'
};

// ==========================================
// GESTIÓN DE ALMACENAMIENTO LOCAL
// ==========================================
class LocalStorageManager {
    static getKey(profesorNombre) {
        return CONFIG.STORAGE_PREFIX + profesorNombre;
    }

    static getMaterias(profesorNombre) {
        try {
            const key = this.getKey(profesorNombre);
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (error) {
            console.error('Error al obtener materias del localStorage:', error);
            return [];
        }
    }

    static setMaterias(profesorNombre, materias) {
        try {
            const key = this.getKey(profesorNombre);
            localStorage.setItem(key, JSON.stringify(materias));
            console.log('Materias guardadas en localStorage:', materias);
        } catch (error) {
            console.error('Error al guardar materias en localStorage:', error);
        }
    }

    static removeMaterias(profesorNombre) {
        try {
            const key = this.getKey(profesorNombre);
            localStorage.removeItem(key);
            console.log('🧹 LocalStorage limpiado para:', profesorNombre);
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
        }
    }

    static initializeMaterias(profesor) {
        const key = this.getKey(profesor.nombre);
        if (!localStorage.getItem(key)) {
            const materiasIniciales = profesor.materias.map(m => {
                return m.grupo ? `${m.nombre_base} - ${m.grupo}` : m.nombre_base;
            });
            this.setMaterias(profesor.nombre, materiasIniciales);
        }
    }

    static cleanupOnReload() {
        try {
            for (let key in localStorage) {
                if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                    console.log("🧹 LocalStorage limpio por recarga de página:", key);
                }
            }
        } catch (error) {
            console.error('Error al limpiar localStorage en recarga:', error);
        }
    }
}

// ==========================================
// GESTIÓN DE API
// ==========================================
class ApiManager {
    static async eliminarProfesor(profesorNombre) {
        try {
            const nombreEncoded = encodeURIComponent(profesorNombre.trim());
            const url = `${CONFIG.API_BASE}/crud/tarjetas/asigna_crud/elimina/${nombreEncoded}`;
            const response = await fetch(url, { method: "DELETE" });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            console.log(`✅ Profesor eliminado: ${profesorNombre}`);
            return true;
        } catch (error) {
            console.error('❌ Error al eliminar profesor:', error);
            throw error;
        }
    }

    static async actualizarHorario(profesor) {
        try {
            const url = `${CONFIG.API_BASE}/crud/tarjetas/asigna_crud/actualiza/${encodeURIComponent(profesor.nombre)}/horario`;
            const body = {
                hora_entrada: profesor.hora_entrada,
                hora_salida: profesor.hora_salida,
            };
            
            const response = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            console.log("✅ Horario actualizado");
            return true;
        } catch (error) {
            console.error('❌ Error al actualizar horario:', error);
            throw error;
        }
    }

    static async eliminarMateria(profesorNombre, materiaCompleta) {
        try {
            const url = `${CONFIG.API_BASE}/crud/tarjetas/asigna_crud/elimina/${encodeURIComponent(profesorNombre)}/materias/${encodeURIComponent(materiaCompleta)}`;
            const response = await fetch(url, { method: "DELETE" });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            console.log("✅ Materia eliminada en backend:", materiaCompleta);
            return true;
        } catch (error) {
            console.error(`❌ Error al eliminar materia ${materiaCompleta}:`, error);
            throw error;
        }
    }

    static async agregarMateria(profesorNombre, materiaCompleta) {
        try {
            const url = `${CONFIG.API_BASE}/crud/tarjetas/asigna_crud/agrega/${encodeURIComponent(profesorNombre)}/materias`;
            const body = { nombre_completo: materiaCompleta };
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            console.log("✅ Materia agregada en backend:", materiaCompleta);
            return true;
        } catch (error) {
            console.error(`❌ Error al agregar materia ${materiaCompleta}:`, error);
            throw error;
        }
    }

    static async obtenerAsignaturas() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/archivos/asignaturas`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Error al obtener asignaturas:', error);
            throw error;
        }
    }

    static async obtenerEstadisticas() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/asignacion-materias/estadisticas`);
            if (!response.ok) {
                // Si la API no existe, devolver datos por defecto
                if (response.status === 404) {
                    console.warn('⚠️ API de estadísticas no disponible, usando datos por defecto');
                    return { grupos_por_materia: {} };
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            // Devolver estructura por defecto en caso de error
            return { grupos_por_materia: {} };
        }
    }
}

// ==========================================
// UTILIDADES
// ==========================================
class Utils {
    static getCareerColor(carrera) {
        if (!CONFIG.COLORS.has(carrera)) {
            const hash = carrera.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const hue = hash % 360;
            CONFIG.COLORS.set(carrera, `hsl(${hue}, 65%, 80%)`);
        }
        return CONFIG.COLORS.get(carrera);
    }

    static calcularCreditosTotales(materiasLocal, catalogoAsignaturas) {
        let total = 0;
        materiasLocal.forEach(materiaCompleta => {
            const nombreBase = materiaCompleta.split(" - ")[0].trim();
            const creditos = parseFloat(catalogoAsignaturas?.[nombreBase] || 0);
            total += creditos;
        });
        return total;
    }

    static mostrarToast(mensaje) {
        try {
            const toastContainer = document.querySelector(SELECTORS.toastContainer);
            const toastBody = document.querySelector(SELECTORS.toastBody);
            
            if (!toastContainer || !toastBody) {
                console.warn('Toast elements not found, using alert instead');
                alert(mensaje);
                return;
            }
            
            toastBody.textContent = mensaje;
            const toast = new bootstrap.Toast(toastContainer);
            toast.show();
        } catch (error) {
            console.error('Error al mostrar toast:', error);
            alert(mensaje);
        }
    }

    static async calcularSiguienteGrupoUnico(profesor, materiaBase) {
        try {
            const dataEstadisticas = await ApiManager.obtenerEstadisticas();
            const gruposAPI = dataEstadisticas.grupos_por_materia?.[materiaBase] || [];

            // Obtener asignaciones actuales locales
            const asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || [];
            const gruposAsignadosLocales = asignaciones
                .flatMap(p => p.materias || [])
                .filter(m => m && m.nombre_base === materiaBase)
                .map(m => {
                    if (m.nombre_completo && m.nombre_completo.includes(" - ")) {
                        return m.nombre_completo.split(" - ")[1];
                    }
                    return null;
                })
                .filter(g => g);

            const gruposUsados = Array.from(new Set([...gruposAPI, ...gruposAsignadosLocales]));
            const letrasUsadas = gruposUsados.map(g => g.slice(-1)).sort();
            const ultimaLetra = letrasUsadas.length > 0 ? letrasUsadas[letrasUsadas.length - 1] : '@';
            const siguienteLetra = String.fromCharCode(ultimaLetra.charCodeAt(0) + 1);
            const nuevoGrupo = `X${siguienteLetra}`;

            if (gruposUsados.includes(nuevoGrupo)) {
                throw new Error("No se pudo generar un grupo único. Límite alcanzado");
            }

            return nuevoGrupo;
        } catch (error) {
            console.error('Error al calcular siguiente grupo:', error);
            // En caso de error, generar grupo básico
            const timestamp = Date.now().toString().slice(-3);
            return `X${String.fromCharCode(65 + parseInt(timestamp) % 26)}`;
        }
    }
}

// ==========================================
// COMPONENTES UI
// ==========================================
class UIComponents {
    static crearBotonEliminarProfesor(profesor, onEliminar) {
        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-link position-absolute";
        btnEliminar.style.cssText = "top: 10px; left: 10px;";
        btnEliminar.innerHTML = `<i class="fa-solid fa-user-xmark" style="color: #74C0FC; font-size: 1.2rem;"></i>`;
        btnEliminar.title = "Eliminar profesor";
        btnEliminar.onclick = () => onEliminar(profesor);
        return btnEliminar;
    }

    static crearTituloProfesor(profesor) {
        const nombre = document.createElement("h5");
        nombre.className = "card-title m-2 text-center text-info";
        nombre.innerHTML = `<i class="fa-solid fa-user-tie me-2"></i>${profesor.nombre}`;
        return nombre;
    }

    static crearInfoProfesor(profesor) {
        const info = document.createElement("div");
        info.className = "d-flex justify-content-between mb-1";
        info.innerHTML = `
            <span><strong>Horas asignadas:</strong> ${profesor.horas_asignadas}</span>
            <span><strong>Créditos totales:</strong> <span id="creditosTotales">${profesor.creditos_asignados}</span></span>
        `;
        return info;
    }

    static crearFormularioHorario(profesor, onChange) {
        const datosHoras = document.createElement("form");
        datosHoras.className = "row justify-content-center align-items-center mb-2";
        datosHoras.innerHTML = `
            <div class="col-6">
                <label class="form-label mb-1"><strong>Entrada</strong></label>
                <input type="time" class="form-control form-control-sm" value="${profesor.hora_entrada || ''}" name="entrada-${profesor.id}">
            </div>
            <div class="col-6">
                <label class="form-label mb-1"><strong>Salida</strong></label>
                <input type="time" class="form-control form-control-sm" value="${profesor.hora_salida || ''}" name="salida-${profesor.id}">
            </div>
        `;

        const inputEntrada = datosHoras.querySelector(`input[name="entrada-${profesor.id}"]`);
        const inputSalida = datosHoras.querySelector(`input[name="salida-${profesor.id}"]`);
        
        inputEntrada.addEventListener("change", (e) => onChange('hora_entrada', e.target.value));
        inputSalida.addEventListener("change", (e) => onChange('hora_salida', e.target.value));

        return datosHoras;
    }

    static crearItemMateria(materiaCompleta, creditos, onEliminar) {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex align-items-center";
        li.style.cssText = `
            border: 2px solid #74C0FC;
            border-radius: 6px;
            margin-bottom: 4px;
            font-size: 0.95rem;
            padding: 6px 12px;
        `;

        const contenedorNombre = document.createElement("div");
        contenedorNombre.style.cssText = `
            flex-grow: 1;
            white-space: normal;
            word-break: break-word;
        `;
        contenedorNombre.textContent = materiaCompleta;

        const spanCreditos = document.createElement("span");
        spanCreditos.className = "text-muted small";
        spanCreditos.style.cssText = `
            white-space: nowrap;
            margin-left: 12px;
            flex-shrink: 0;
        `;
        spanCreditos.textContent = `Créditos: ${creditos ?? '-'}`;

        const iconoEliminar = document.createElement("i");
        iconoEliminar.className = "fa-solid fa-delete-left";
        iconoEliminar.style.cssText = `
            color: #74C0FC;
            cursor: pointer;
            margin-left: 12px;
        `;
        iconoEliminar.title = "Eliminar materia";
        iconoEliminar.addEventListener("click", () => onEliminar(materiaCompleta));

        li.appendChild(contenedorNombre);
        li.appendChild(spanCreditos);
        li.appendChild(iconoEliminar);

        return li;
    }

    static async crearFormularioAgregarMateria(onAgregar) {
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

        const select = formAgregarMateria.querySelector("#selectMateria");
        const btnAgregar = formAgregarMateria.querySelector("#btnAgregarMateria");

        // Cargar materias disponibles
        try {
            const data = await ApiManager.obtenerAsignaturas();
            const fragment = document.createDocumentFragment();

            data
                .sort((a, b) => a.ASIGNATURA.localeCompare(b.ASIGNATURA))
                .forEach(item => {
                    const option = document.createElement("option");
                    option.value = item.ASIGNATURA;
                    option.textContent = `${item.ASIGNATURA} | ${item.CARRERA} - Sem.${item.SEM} (${item.CRED} créd.)`;
                    option.style.backgroundColor = Utils.getCareerColor(item.CARRERA);
                    fragment.appendChild(option);
                });

            select.appendChild(fragment);
        } catch (error) {
            select.innerHTML = '<option value="">Error cargando materias</option>';
        }

        btnAgregar.addEventListener("click", (e) => {
            e.preventDefault();
            if (select.value) {
                onAgregar(select.value);
                select.value = "";
            } else {
                alert("Selecciona una materia");
            }
        });

        return formAgregarMateria;
    }
}

// ==========================================
// MANEJADOR PRINCIPAL DE MATERIAS
// ==========================================
class MateriasManager {
    constructor(profesor) {
        this.profesor = profesor;
        this.catalogoAsignaturas = {};
        this.listaMaterias = null;
        this.init();
    }

    async init() {
        LocalStorageManager.initializeMaterias(this.profesor);
        await this.cargarCatalogo();
    }

    async cargarCatalogo() {
        try {
            const data = await ApiManager.obtenerAsignaturas();
            this.catalogoAsignaturas = {};
            data.forEach(({ ASIGNATURA, CRED }) => {
                this.catalogoAsignaturas[ASIGNATURA] = CRED;
            });
        } catch (error) {
            console.error('Error cargando catálogo:', error);
            Utils.mostrarToast("Error cargando catálogo de asignaturas");
        }
    }

    setListaContainer(container) {
        this.listaMaterias = container;
        this.renderizar();
    }

    renderizar() {
        if (!this.listaMaterias) return;

        const materiasLocal = LocalStorageManager.getMaterias(this.profesor.nombre);
        this.listaMaterias.innerHTML = "";

        materiasLocal.forEach(materiaCompleta => {
            const nombreBase = materiaCompleta.split(" - ")[0].trim();
            const creditos = this.catalogoAsignaturas[nombreBase];
            
            const itemMateria = UIComponents.crearItemMateria(
                materiaCompleta,
                creditos,
                (materia) => this.eliminarMateria(materia)
            );
            
            this.listaMaterias.appendChild(itemMateria);
        });

        this.actualizarCreditosTotales();
    }

    eliminarMateria(materiaCompleta) {
        const materiasLocal = LocalStorageManager.getMaterias(this.profesor.nombre);
        const nuevasMaterias = materiasLocal.filter(m => m !== materiaCompleta);
        LocalStorageManager.setMaterias(this.profesor.nombre, nuevasMaterias);
        this.renderizar();
    }

    async agregarMateria(materiaBase) {
        try {
            const grupo = await Utils.calcularSiguienteGrupoUnico(this.profesor, materiaBase);
            const materiaCompleta = `${materiaBase} - ${grupo}`;
            
            const materiasLocal = LocalStorageManager.getMaterias(this.profesor.nombre);
            
            if (materiasLocal.includes(materiaCompleta)) {
                alert("Esa materia con grupo ya está asignada");
                return;
            }
            
            materiasLocal.push(materiaCompleta);
            LocalStorageManager.setMaterias(this.profesor.nombre, materiasLocal);
            this.renderizar();
        } catch (error) {
            alert("Error generando grupo: " + error.message);
        }
    }

    actualizarCreditosTotales() {
        const materiasLocal = LocalStorageManager.getMaterias(this.profesor.nombre);
        const creditosTotales = Utils.calcularCreditosTotales(materiasLocal, this.catalogoAsignaturas);
        const creditosSpan = document.getElementById("creditosTotales");
        if (creditosSpan) {
            creditosSpan.textContent = creditosTotales;
        }
    }

    async guardarCambios() {
        try {
            // Actualizar horario
            await ApiManager.actualizarHorario(this.profesor);

            // Detectar cambios en materias
            const materiasLocal = LocalStorageManager.getMaterias(this.profesor.nombre);
            const originales = this.profesor.materias.map(m => {
                return m.grupo ? `${m.nombre_base} - ${m.grupo}` : m.nombre_base;
            });

            // Eliminar materias
            const eliminadas = originales.filter(m => !materiasLocal.includes(m));
            for (const materia of eliminadas) {
                await ApiManager.eliminarMateria(this.profesor.nombre, materia);
            }

            // Agregar materias nuevas
            const nuevas = materiasLocal.filter(m => !originales.includes(m));
            for (const materia of nuevas) {
                await ApiManager.agregarMateria(this.profesor.nombre, materia);
            }

            LocalStorageManager.removeMaterias(this.profesor.nombre);
            console.log("✅ Cambios guardados exitosamente");
            return true;
        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            throw error;
        }
    }
}

// ==========================================
// MANEJADOR DE MODALES
// ==========================================
class ModalManager {
    static mostrarConfirmacionEliminar(profesor, onConfirmar) {
        try {
            const mensaje = document.querySelector(SELECTORS.mensajeConfirmacion);
            if (mensaje) {
                mensaje.textContent = `¿Deseas eliminar al profesor ${profesor.nombre}?`;
            }

            const modalElement = document.querySelector(SELECTORS.modalConfirmacion);
            if (!modalElement) {
                console.error('Modal de confirmación no encontrado');
                return;
            }

            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Configurar botón de confirmación
            const btnConfirmar = document.querySelector(SELECTORS.btnConfirmar);
            if (btnConfirmar) {
                const nuevoBtn = btnConfirmar.cloneNode(true);
                btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
                
                nuevoBtn.addEventListener("click", async () => {
                    try {
                        await onConfirmar();
                        modal.hide();
                    } catch (error) {
                        console.error('Error en confirmación:', error);
                    }
                });
            }
        } catch (error) {
            console.error('Error mostrando modal de confirmación:', error);
        }
    }

    static cerrarModal(modalSelector) {
        try {
            const modalElement = document.querySelector(modalSelector);
            if (modalElement) {
                // Remover focus de elementos activos antes de cerrar
                const activeElement = modalElement.querySelector(':focus');
                if (activeElement) {
                    activeElement.blur();
                }
                
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        } catch (error) {
            console.error('Error cerrando modal:', error);
        }
    }

    static configurarEventosModal() {
        // Manejar el focus cuando se abre un modal
        const modales = document.querySelectorAll('.modal');
        modales.forEach(modal => {
            modal.addEventListener('show.bs.modal', () => {
                // Remover focus del elemento que disparó el modal
                const activeElement = document.activeElement;
                if (activeElement && activeElement !== document.body) {
                    activeElement.blur();
                }
            });

            modal.addEventListener('hidden.bs.modal', () => {
                // Asegurar que no hay elementos con focus cuando se cierra
                const focusedElements = modal.querySelectorAll(':focus');
                focusedElements.forEach(el => el.blur());
            });
        });
    }
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================
export function cargarCRUDModal(profesor) {
    try {
        const modalBody = document.querySelector(SELECTORS.modalBody);
        if (!modalBody) {
            console.error('Modal body no encontrado');
            return;
        }

        modalBody.innerHTML = "";
        window.profesorActual = profesor;

        // Inicializar manejador de materias
        const materiasManager = new MateriasManager(profesor);

        // Crear card principal
        const card = document.createElement("div");
        card.className = "card border-start border-info border-4 shadow-lg p-4 position-relative";

        // Manejador de eliminación de profesor
        const manejarEliminacionProfesor = async (profesor) => {
            ModalManager.mostrarConfirmacionEliminar(profesor, async () => {
                try {
                    await ApiManager.eliminarProfesor(profesor.nombre);
                    
                    // Actualizar localStorage de asignaciones
                    let asignaciones = JSON.parse(localStorage.getItem("asignaciones")) || [];
                    asignaciones = asignaciones.filter(p => p.nombre !== profesor.nombre);
                    localStorage.setItem("asignaciones", JSON.stringify(asignaciones));

                    ModalManager.cerrarModal(SELECTORS.modalEditar);
                    Utils.mostrarToast(`✅ Profesor eliminado: ${profesor.nombre}`);
                    await actualizarVista();
                } catch (error) {
                    alert("No se pudo eliminar el profesor. Revisa la consola.");
                }
            });
        };

        // Manejador de cambios en horario
        const manejarCambioHorario = (campo, valor) => {
            if (window.profesorActual) {
                window.profesorActual[campo] = valor;
                console.log(`${campo} actualizado localmente:`, valor);
            }
        };

        // Crear componentes
        const btnEliminar = UIComponents.crearBotonEliminarProfesor(profesor, manejarEliminacionProfesor);
        const titulo = UIComponents.crearTituloProfesor(profesor);
        const info = UIComponents.crearInfoProfesor(profesor);
        const formularioHorario = UIComponents.crearFormularioHorario(profesor, manejarCambioHorario);

        // Crear sección de materias
        const materiasDiv = document.createElement("div");
        materiasDiv.className = "m-1";

        const tituloMaterias = document.createElement("p");
        tituloMaterias.className = "fw-semibold m-0 text-center";
        tituloMaterias.textContent = "Materias asignadas:";

        const listaMaterias = document.createElement("ul");
        listaMaterias.className = "list-group";
        listaMaterias.id = "listaMaterias";

        // Crear formulario para agregar materias
        UIComponents.crearFormularioAgregarMateria((materiaBase) => {
            materiasManager.agregarMateria(materiaBase);
        }).then(formAgregarMateria => {
            materiasDiv.appendChild(tituloMaterias);
            materiasDiv.appendChild(listaMaterias);
            materiasDiv.appendChild(formAgregarMateria);

            // Configurar el contenedor de lista en el manejador
            materiasManager.setListaContainer(listaMaterias);
        });

        // Ensamblar card
        card.appendChild(btnEliminar);
        card.appendChild(titulo);
        card.appendChild(info);
        card.appendChild(formularioHorario);
        card.appendChild(materiasDiv);
        modalBody.appendChild(card);

        // Configurar manejador de guardado global
        window.materiasManagerActual = materiasManager;

    } catch (error) {
        console.error('Error cargando CRUD modal:', error);
        Utils.mostrarToast('Error cargando el modal de edición');
    }
}

// ==========================================
// EVENT LISTENERS GLOBALES
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    LocalStorageManager.cleanupOnReload();
    // Configurar eventos de modales para evitar problemas de aria-hidden
    ModalManager.configurarEventosModal();
});

// Botón Guardar
const btnGuardar = document.querySelector(SELECTORS.btnGuardar);
if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
        try {
            // Remover focus del botón para evitar problemas de aria-hidden
            btnGuardar.blur();
            
            if (window.materiasManagerActual && window.profesorActual) {
                await window.materiasManagerActual.guardarCambios();
                await actualizarVista();
                ModalManager.cerrarModal(SELECTORS.modalEditar);
                Utils.mostrarToast('✅ Cambios guardados exitosamente');
            } else {
                alert("No hay profesor seleccionado");
            }
        } catch (error) {
            console.error('Error guardando cambios:', error);
            Utils.mostrarToast('❌ Error al guardar cambios');
        }
    });
}

// Botón Cancelar
const btnCancelar = document.querySelector(SELECTORS.btnCancelar);
if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
        // Remover focus del botón para evitar problemas de aria-hidden
        btnCancelar.blur();
        
        if (window.profesorActual?.nombre) {
            LocalStorageManager.removeMaterias(window.profesorActual.nombre);
        }
    });
}

// Limpiar localStorage al cerrar modal
const modalEditar = document.querySelector(SELECTORS.modalEditar);
if (modalEditar) {
    modalEditar.addEventListener("hidden.bs.modal", () => {
        if (window.profesorActual?.nombre) {
            LocalStorageManager.removeMaterias(window.profesorActual.nombre);
        }
        // Limpiar referencias globales
        window.profesorActual = null;
        window.materiasManagerActual = null;
        
        // Asegurar que no hay elementos con focus
        const focusedElements = modalEditar.querySelectorAll(':focus');
        focusedElements.forEach(el => el.blur());
    });
}