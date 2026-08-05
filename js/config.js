// Configuración centralizada del catálogo de laboratorios

const laboratorios = [
    // SECCIÓN 1: MECÁNICA DE FLUIDOS
    {
        id: "lab-001",
        nombre: "Gravedad Específica",
        categoria: "Mecánica de Fluidos",
        descripcion: "Determinación de la gravedad específica de diferentes fluidos.",
        dificultad: "Básico",
        estado: "disponible",
        imagen: "assets/images/lab_gravedad_especifica.jpg",
        url: "1. GRAVEDAD ESPECIFICA/GRAVEDAD ESPECIFICA.html"
    },
    {
        id: "lab-002",
        nombre: "Viscosímetro Saybolt",
        categoria: "Mecánica de Fluidos",
        descripcion: "Medición de la viscosidad cinemática de los fluidos utilizando el viscosímetro universal Saybolt.",
        dificultad: "Intermedio",
        estado: "disponible",
        imagen: "assets/images/lab_viscosimetro.jpg",
        url: "2. VISCOSIMETRO SAYBOLT/VISCOSIMETRO SAYBOLT.html"
    },
    {
        id: "lab-003",
        nombre: "Fuerzas Hidrostáticas",
        categoria: "Mecánica de Fluidos",
        descripcion: "Calcula las fuerzas ejercidas por fluidos en reposo sobre superficies sumergidas y su centro de presión.",
        dificultad: "Intermedio",
        estado: "disponible",
        imagen: "assets/images/lab_fuerzas_hidro.jpg",
        url: "3. FUERZAS HIDROSTATICAS/FUERZAS HIDROSTATICAS.html"
    },
    {
        id: "lab-004",
        nombre: "Flujo Laminar y Turbulento",
        categoria: "Mecánica de Fluidos",
        descripcion: "Análisis del número de Reynolds y los diferentes regímenes de flujo.",
        dificultad: "Básico",
        estado: "disponible",
        imagen: "assets/images/lab_flujo_laminar.jpg",
        url: "4. FLUJO LAMINAR Y TURBULENTO/FLUJO LAMINAR Y TURBULENTO.html"
    },

    // SECCIÓN 2: MECÁNICA DE FLUIDOS APLICADA
    {
        id: "lab-005",
        nombre: "Pérdidas por Longitud de Tubería",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Determinación empírica y teórica de las pérdidas de carga primarias.",
        dificultad: "Intermedio",
        estado: "disponible",
        imagen: "assets/images/lab_perdidas_tuberia.jpg",
        url: "5. PERDIDAS LONGITUD TUB/PERDIDAS TUBERIA.html"
    },
    {
        id: "lab-006",
        nombre: "Pérdidas en Válvulas",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Medición y cálculo de coeficientes de pérdidas menores en diversos accesorios.",
        dificultad: "Intermedio",
        estado: "disponible",
        imagen: "assets/images/lab_perdidas_valvulas.jpg",
        url: "6. PERDIDA VALVULA/PERDIDAS EN VALVULA.html"
    },
    {
        id: "lab-007",
        nombre: "Bombas en Serie",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Curvas de rendimiento y operación de bombas conectadas en serie.",
        dificultad: "Avanzado",
        estado: "proximamente",
        imagen: "assets/images/lab_bombas_serie.jpg",
        url: "#"
    },
    {
        id: "lab-008",
        nombre: "Bombas en Paralelo",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Curvas de rendimiento y operación de bombas conectadas en paralelo.",
        dificultad: "Avanzado",
        estado: "proximamente",
        imagen: "assets/images/lab_bombas_paralelo.jpg",
        url: "#"
    },
    {
        id: "lab-009",
        nombre: "Variador, Curva Motriz",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Efectos del uso de variadores de frecuencia en la curva motriz.",
        dificultad: "Avanzado",
        estado: "proximamente",
        imagen: "assets/images/lab_variador.jpg",
        url: "#"
    },
    {
        id: "lab-010",
        nombre: "Turbina Pelton",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Pruebas de eficiencia y potencia en turbinas de acción Pelton.",
        dificultad: "Avanzado",
        estado: "proximamente",
        imagen: "assets/images/lab_turbina_pelton.jpg",
        url: "#"
    },
    {
        id: "lab-011",
        nombre: "Turbina Francis",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Pruebas de eficiencia y potencia en turbinas de reacción Francis.",
        dificultad: "Avanzado",
        estado: "proximamente",
        imagen: "assets/images/lab_turbina_francis.jpg",
        url: "#"
    },
    {
        id: "lab-012",
        nombre: "Turbina Kaplan",
        categoria: "Mecánica de Fluidos Aplicada",
        descripcion: "Pruebas de eficiencia en turbinas de hélice tipo Kaplan.",
        dificultad: "Avanzado",
        estado: "proximamente",
        imagen: "assets/images/lab_turbina_kaplan.jpg",
        url: "#"
    }
];
