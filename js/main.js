// Lógica principal de la plataforma web

document.addEventListener("DOMContentLoaded", () => {
    // 1. Manejo del menú móvil
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const navMenu = document.getElementById("nav-menu");

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            navMenu.classList.toggle("show");
        });

        // Cerrar menú al hacer clic en un enlace (móvil)
        const navLinks = navMenu.querySelectorAll("a");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 768) {
                    navMenu.classList.remove("show");
                }
            });
        });
    }

    // 2. Renderizado del catálogo
    const gridFluidos = document.getElementById("grid-fluidos");
    const gridAplicada = document.getElementById("grid-aplicada");
    const titleFluidos = document.getElementById("title-fluidos");
    const titleAplicada = document.getElementById("title-aplicada");
    const categoryFilter = document.getElementById("category-filter");
    const searchInput = document.getElementById("search-input");
    const noResultsMsg = document.getElementById("no-results");

    // Función para crear el HTML de la tarjeta
    const generateCardHTML = (lab) => {
        const isAvailable = lab.estado === "disponible";
        const btnClass = isAvailable ? "btn-start" : "btn-disabled";
        const btnText = isAvailable ? "Iniciar laboratorio" : "Próximamente";
        const btnEl = isAvailable 
            ? `<a href="${lab.url}" class="btn-card ${btnClass}">${btnText}</a>`
            : `<button class="btn-card ${btnClass}" disabled>${btnText}</button>`;
        
        const statusClass = isAvailable ? "status-available" : "status-coming";
        const statusText = isAvailable ? "Disponible" : "Próximamente";

        return `
            <article class="lab-card">
                <div class="card-img-container">
                    <img src="${lab.imagen}" alt="Imagen de ${lab.nombre}" class="card-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100%\\' height=\\'100%\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23e2e8f0\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\' font-size=\\'1rem\\' fill=\\'%2364748b\\'>Sin imagen</text></svg>'">
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <span class="category-tag">${lab.categoria}</span>
                    </div>
                    <h3 class="lab-title">${lab.nombre}</h3>
                    <p class="lab-desc">${lab.descripcion}</p>
                    
                    <div class="card-meta">
                        <span class="difficulty">Nivel: ${lab.dificultad}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    
                    ${btnEl}
                </div>
            </article>
        `;
    };

    // Función para renderizar el catálogo en las secciones correspondientes
    const renderCards = (data) => {
        if (!gridFluidos || !gridAplicada) return;
        
        // Limpiar grids
        gridFluidos.innerHTML = "";
        gridAplicada.innerHTML = "";
        
        let countFluidos = 0;
        let countAplicada = 0;

        data.forEach(lab => {
            const cardHTML = generateCardHTML(lab);
            if (lab.categoria === "Mecánica de Fluidos") {
                gridFluidos.insertAdjacentHTML("beforeend", cardHTML);
                countFluidos++;
            } else if (lab.categoria === "Mecánica de Fluidos Aplicada") {
                gridAplicada.insertAdjacentHTML("beforeend", cardHTML);
                countAplicada++;
            }
        });

        // Mostrar u ocultar títulos de secciones dependiendo si hay resultados
        if (titleFluidos) titleFluidos.style.display = countFluidos > 0 ? "block" : "none";
        if (gridFluidos) gridFluidos.style.display = countFluidos > 0 ? "grid" : "none";

        if (titleAplicada) titleAplicada.style.display = countAplicada > 0 ? "block" : "none";
        if (gridAplicada) gridAplicada.style.display = countAplicada > 0 ? "grid" : "none";

        // Mostrar mensaje de no resultados si ambos están vacíos
        if (countFluidos === 0 && countAplicada === 0) {
            noResultsMsg.classList.remove("hidden");
        } else {
            noResultsMsg.classList.add("hidden");
        }
    };

    // Render inicial
    if (typeof laboratorios !== "undefined") {
        renderCards(laboratorios);
    } else {
        console.error("No se encontró el archivo de configuración (laboratorios).");
    }

    // 3. Filtrado y Búsqueda
    const filterLabs = () => {
        const categoryTerm = categoryFilter.value;
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

        const filtered = laboratorios.filter(lab => {
            const matchCategory = categoryTerm === "all" || lab.categoria === categoryTerm;
            const matchSearch = lab.nombre.toLowerCase().includes(searchTerm) || 
                                lab.descripcion.toLowerCase().includes(searchTerm);
            return matchCategory && matchSearch;
        });

        renderCards(filtered);
    };

    if (categoryFilter) categoryFilter.addEventListener("change", filterLabs);
    if (searchInput) searchInput.addEventListener("input", filterLabs);

    // 4. Lógica del Carrusel
    const slides = document.querySelectorAll(".carousel-slide");
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            slides[currentSlide].classList.remove("active");
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add("active");
        }, 3000); // Cambia de imagen cada 3 segundos
    }
});
