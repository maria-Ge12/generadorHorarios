document.addEventListener("DOMContentLoaded", () => {
    const btnEditarMaxGrupos = document.querySelector(".btn-info");
    const spanMax = document.getElementById("maxGruposGlobal");
    const modal = new bootstrap.Modal(document.getElementById("modalMaxGrupos"));
    const inputMaxGrup = document.getElementById("inputMaxGrup");
    const btnConfirmar = document.getElementById("btnConfirmarMaxGrupos");

    if (!btnEditarMaxGrupos || !spanMax || !inputMaxGrup || !btnConfirmar) return;

    btnEditarMaxGrupos.addEventListener("click", () => {
        inputMaxGrup.value = ""; // Limpia valor anterior
        modal.show();
    });

    btnConfirmar.addEventListener("click", async () => {
        const maxGrup = parseInt(inputMaxGrup.value, 10);

        if (isNaN(maxGrup) || maxGrup < 1) {
            mostrarToastInfo("Por favor ingresa un número válido mayor que 0.");
            return;
        }

        try {
            const respuesta = await fetch("https://cabadath.duckdns.org/api/crud/asignaturas/asignaturas/global/max-grupos", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ max_grup: maxGrup })
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.message || "Error al actualizar los grupos.");
            }

            console.log("Respuesta del servidor:", data);
            mostrarToastExito(data.message);
            spanMax.textContent = ` ${data.max_grup}`;
            modal.hide();
            setTimeout(() => {
                location.reload();
            }, 3000);

        } catch (error) {
            console.error("Error al actualizar máximo de grupos:", error);
            mostrarToastError("Hubo un problema: " + error.message);
        }
    });
});

function mostrarToastExito(mensaje) {
    const toastEl = document.getElementById("toastExito");
    document.getElementById("toastBodyExito").textContent = mensaje;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}
function mostrarToastInfo(mensaje) {
    const toastEl = document.getElementById("toastInfo");
    document.getElementById("toastBodyInfo").textContent = mensaje;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}