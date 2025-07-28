document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggleMenu");
    const sidebar = document.getElementById("sidebar");

    // Aplicar estado guardado
    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") {
        sidebar.classList.remove("sidebar-expanded");
        sidebar.classList.add("sidebar-collapsed");
    } else {
        sidebar.classList.remove("sidebar-collapsed");
        sidebar.classList.add("sidebar-expanded");
    }

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar-expanded");
        sidebar.classList.toggle("sidebar-collapsed");

        // Guardar estado
        if (sidebar.classList.contains("sidebar-expanded")) {
            localStorage.setItem("sidebarState", "expanded");
        } else {
            localStorage.setItem("sidebarState", "collapsed");
        }
    });
});
