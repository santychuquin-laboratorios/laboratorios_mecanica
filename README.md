# VirtuaLab - Plataforma de Laboratorios Virtuales

VirtuaLab es un portal académico diseñado para alojar laboratorios y simulaciones interactivas de física e ingeniería (Mecánica, Fluidos, Electricidad, etc.). 

Este proyecto está construido exclusivamente con **HTML, CSS puro y Vanilla JavaScript**, asegurando un rendimiento ligero, alta compatibilidad y fácil mantenimiento sin dependencias de frameworks externos.

## Estructura del Proyecto

```text
EJEMPLOS/
│
├── index.html               # Página principal (Home, Catálogo)
├── css/
│   └── style.css            # Estilos globales y de la página principal
├── js/
│   ├── config.js            # Archivo de configuración (Catálogo de laboratorios)
│   └── main.js              # Lógica de renderizado, búsqueda y filtros
├── assets/
│   └── images/              # Imágenes locales y SVGs para las tarjetas
├── laboratorios/
│   └── template/            # Plantilla base para crear nuevos laboratorios
│       ├── index.html       # Estructura del laboratorio (Objetivos, Teoría, Simulación)
│       ├── style.css        # Estilos específicos del laboratorio
│       └── app.js           # Lógica y cálculos de la simulación
└── README.md                # Este archivo de documentación
```

---

## Cómo ejecutar la página

Al ser un proyecto de frontend estático sin backend ni preprocesadores, la ejecución es muy sencilla:

1. **Opción 1 (Recomendada):** Usa un servidor local ligero. Si utilizas Visual Studio Code, instala la extensión "Live Server" y haz clic derecho sobre `index.html` -> "Open with Live Server".
2. **Opción 2 (Python):** Si tienes Python instalado, abre una terminal en la carpeta principal y ejecuta `python -m http.server 8000`. Luego entra en tu navegador a `http://localhost:8000`.
3. **Opción 3 (Básica):** Simplemente haz doble clic en el archivo `index.html` para abrirlo directamente en tu navegador (algunos recursos como módulos JS estrictos podrían requerir servidor local, pero en este proyecto estándar funcionará correctamente).

---

## Gestión del Catálogo

El catálogo de la página principal se genera de forma **dinámica**. No necesitas editar el HTML para agregar tarjetas.

### Cómo modificar una tarjeta existente
1. Abre el archivo `js/config.js`.
2. Busca el objeto dentro del arreglo `laboratorios`.
3. Modifica los campos que necesites: `nombre`, `categoria`, `descripcion`, `dificultad`, `estado`, o `imagen`.

### Cómo cambiar textos y categorías
- Para cambiar la categoría, modifica el campo `categoria` en `js/config.js` (Ej. "Fluidos", "Mecánica", "Electricidad").
- Si añades una nueva categoría, recuerda agregarla también como una opción `<option>` en el `<select id="category-filter">` dentro del archivo `index.html`.

### Cómo cambiar imágenes
1. Coloca tu nueva imagen (ej. `mi-imagen.png`) en la carpeta `assets/images/`.
2. En `js/config.js`, actualiza la propiedad `"imagen": "assets/images/mi-imagen.png"`.

---

## Cómo agregar un laboratorio nuevo

Para agregar un laboratorio completamente funcional (por ejemplo, "Leyes de Newton"):

1. **Duplica la plantilla:**
   Copia la carpeta entera `laboratorios/template/` y pégala con un nuevo nombre, por ejemplo: `laboratorios/newton/`.

2. **Personaliza el contenido:**
   Abre `laboratorios/newton/index.html` y reemplaza los marcadores como `[Nombre del Laboratorio]`, los objetivos y el fundamento teórico.

3. **Programa la simulación:**
   Abre `laboratorios/newton/app.js` y escribe la lógica matemática y física necesaria para que tu simulación interactiva funcione (capturar inputs, hacer cálculos, dibujar en canvas/HTML, actualizar tabla).

4. **Agrégalo al catálogo principal:**
   Abre `js/config.js` y añade un nuevo bloque de código al arreglo, apuntando la URL a tu nueva carpeta:

   ```javascript
   {
       id: "lab-007",
       nombre: "Leyes de Newton",
       categoria: "Mecánica",
       descripcion: "Análisis de fuerzas y aceleración en un sistema de poleas.",
       dificultad: "Intermedio",
       estado: "disponible", // Esto activará el botón de "Iniciar laboratorio"
       imagen: "assets/images/newton.jpg",
       url: "laboratorios/newton/index.html" // Ruta al nuevo laboratorio
   }
   ```

---

## Cómo publicar la plataforma en internet

Dado que este proyecto consiste únicamente en archivos estáticos, puedes alojarlo gratuitamente de forma rápida:

### Usando GitHub Pages (Recomendado)
1. Crea una cuenta en [GitHub](https://github.com/) si no tienes una.
2. Crea un nuevo repositorio y sube todos los archivos de esta carpeta (`index.html`, `css/`, `js/`, etc.).
3. Ve a **Settings** (Configuración) de tu repositorio.
4. En el menú lateral, busca **Pages** (Páginas).
5. En la sección "Build and deployment", selecciona la rama `main` o `master` y guarda.
6. En unos minutos, tu página estará pública en un enlace tipo `https://tuusuario.github.io/tu-repositorio/`.

### Otras alternativas gratuitas
- **Vercel** o **Netlify**: Solo tienes que arrastrar y soltar la carpeta principal en su panel web, y crearán un enlace público automáticamente.
