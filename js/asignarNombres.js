// asignarNombres.js

function mostrarModal(html, segundos = 4) {
    const modal = document.getElementById("modalMensaje");
    const contenido = document.getElementById("modalContenido");

    contenido.innerHTML = html;
    modal.classList.remove("d-none");

    // Cerrar automáticamente
    setTimeout(() => {
        modal.classList.add("d-none");
    }, segundos * 1000);
}

document.getElementById("btnProcesar").addEventListener("click", async () => {

    const archivo = document.getElementById("archivoCSV").files[0];
    const mensaje = document.getElementById("mensaje");
    const barra = document.getElementById("barraCarga");

    if (!archivo) {
        mostrarModal(`
            <h5 class="text-danger fw-bold mb-2">Error</h5>
            Debes seleccionar un archivo CSV.
        `);
        return;
    }

    barra.classList.remove("d-none");

    const formData = new FormData();
    formData.append("archivo_csv", archivo);

    try {
        const response = await fetch("https://cabadath.duckdns.org/api/coloca-prof/asignar", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Error al procesar el archivo con la API");
        }

        const data = await response.json();
        barra.classList.add("d-none");

        if (!data.exito) {
            mostrarModal(`
                <h5 class="text-warning fw-bold mb-2">Proceso no completado</h5>
                ${data.mensaje}
            `);
            return;
        }

        // Datos importantes
        const nombreArchivo = data.archivo_csv;
        const totalProcesados = data.estadisticas.total_procesados;
        const tasaExito = data.estadisticas.tasa_exito.toFixed(2);
        const asignados = data.estadisticas.asignados;
        const noAsignados = data.estadisticas.no_asignados;

        // Mostrar modal elegante
        mostrarModal(`
            <h5 class="fw-bold text-success mb-2">Proceso completado</h5>
            <p><strong>Archivo:</strong> ${nombreArchivo}</p>
            <p><strong>Total procesados:</strong> ${totalProcesados}</p>
            <p><strong>Asignados:</strong> ${asignados}</p>
            <p><strong>No asignados:</strong> ${noAsignados}</p>
            <p><strong>Tasa de éxito:</strong> ${tasaExito}%</p>
        `);

    } catch (error) {
        barra.classList.add("d-none");

        mostrarModal(`
            <h5 class="text-danger fw-bold">Error inesperado</h5>
            ${error.message}
        `);
    }
});
