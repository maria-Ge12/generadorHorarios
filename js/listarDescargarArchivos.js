document.getElementById("btnListarArchivos").addEventListener("click", async () => {
    const lista = document.getElementById("lista-archivos");
    const spinner = document.getElementById("spinner");

    lista.innerHTML = "";
    spinner.style.display = "block";

    try {
        const response = await fetch("http://74.208.77.56:5486/archivos");
        if (!response.ok) throw new Error("Error al obtener archivos");

        const data = await response.json();
        lista.innerHTML = "";
        spinner.style.display = "none";

        data.archivos.forEach((item) => {
            const div = document.createElement("div");
            div.classList.add("archivo-item");

            div.innerHTML = `
                <span>${item.nombre}</span>
                <button class="download-btn" data-nombre="${item.nombre}">
                    Descargar
                </button>
            `;

            lista.appendChild(div);
        });

        document.querySelectorAll(".download-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const filename = btn.dataset.nombre;
                const url = `https://cabadath.duckdns.org/api/coloca-prof/descargar/${encodeURIComponent(filename)}`;

                btn.innerHTML = "Descargando...";

                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error("Error en descarga");

                    const blob = await res.blob();
                    const enlace = document.createElement("a");
                    enlace.href = URL.createObjectURL(blob);
                    enlace.download = filename;
                    enlace.click();

                    btn.innerHTML = "✔️ Listo";

                    setTimeout(() => {
                        btn.innerHTML = "Descargar";
                    }, 1500);

                } catch (err) {
                    btn.innerHTML = "Error";
                    console.error(err);
                    setTimeout(() => {
                        btn.innerHTML = "Descargar";
                    }, 1500);
                }
            });
        });

    } catch (error) {
        spinner.style.display = "none";
        lista.innerHTML = "<p>Error al cargar archivos.</p>";
        console.error(error);
    }
});
