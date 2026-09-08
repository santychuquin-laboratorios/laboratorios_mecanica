# Bomba centrífuga 3D interactiva — 3D GENIAL

## Enviar a los alumnos: un único archivo

Envía **BOMBA_CENTRIFUGA_3D.html**. Incluye estilos, código, Three.js, modelo y flujo dentro del mismo archivo. Los alumnos deben descargarlo y abrirlo con Chrome, Edge o Firefox. No necesita servidor ni internet. En un teléfono, la vista previa de WhatsApp o del correo puede no ejecutar aplicaciones HTML; deben abrir el archivo descargado en un navegador compatible. Se recomienda computadora.

La versión autónoma conserva las funciones del proyecto. Para regenerarla después de modificar los archivos originales, ejecuta `node build-standalone.cjs`. Se comprobó que el JavaScript empaquetado compila y que el HTML no contiene recursos externos. La apertura directa en el navegador automatizado no pudo verificarse porque su política bloquea archivos locales; queda pendiente la comprobación manual por doble clic.

Aplicación educativa HTML/CSS/JavaScript con Three.js 0.170.0 y OrbitControls. No requiere compilación, instalación de paquetes ni conexión a internet: las bibliotecas están incluidas en `vendor/`, junto con su licencia MIT.

## Abrir el proyecto

### VS Code y Live Server
1. Abre esta carpeta en VS Code.
2. Instala la extensión Live Server si no la tienes.
3. Haz clic derecho en `index.html` → **Open with Live Server**.

### Python
Desde una terminal situada en esta carpeta, ejecuta:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

En Windows también puedes usar `py -m http.server 8000 --bind 127.0.0.1`. Abre http://localhost:8000. Python debe estar instalado.

### Node.js (alternativa incluida)

```sh
node server.cjs
```

Abre http://127.0.0.1:8080. Detén cualquier servidor con Ctrl+C. No abras el HTML con doble clic: los módulos JavaScript requieren un servidor HTTP. Se necesita un navegador moderno con WebGL.

## Uso

- Arrastra con el botón izquierdo para girar; rueda para zoom y botón derecho para desplazar. En pantalla táctil, un dedo gira y dos dedos acercan o desplazan.
- **Vista externa** y **Armar bomba** restablecen el ensamblaje, muestran todas las piezas y desactivan el flujo.
- **Vista interna** hace transparentes la carcasa, las bocas y el alojamiento de rodamientos, con transición suave.
- **Despiece** separa los diez componentes. Detiene el flujo porque el circuito queda desconectado.
- **Iniciar impulsor / Detener impulsor** controla el giro. Eje y acoplamiento giran de forma solidaria. El deslizador ajusta 0–3600 RPM; la velocidad visual equivale a 1/30 de la indicada para poder observar los álabes. A 0 RPM no hay giro.
- **Animación del flujo** activa una visualización tipo posprocesado CFD, con 42 trayectorias de entrada axial, paso radial, voluta y descarga. Las estelas animadas muestran el sentido del transporte. El color azul–cian–verde–amarillo–rojo representa una magnitud relativa prescrita entre 0 y 1, sin unidades físicas. La leyenda y los controles aparecen al activarlo. Carcasas e impulsor se vuelven transparentes para ver el recorrido.
- Un clic sobre una pieza la resalta y abre su ficha. La lista también centra la cámara y revela el interior cuando hace falta.
- **Ocultar pieza / Mostrar pieza** opera sobre el componente seleccionado. **Mostrar todas** recupera las piezas ocultas.
- Las etiquetas acompañan a las piezas y pueden seleccionarse. Las vistas restablecen el encuadre; **Reiniciar cámara** conserva el modo actual.

## Archivos y modelo

`index.html`: interfaz semántica y mapa de importación. `style.css`: diseño responsive. `script.js`: catálogo didáctico, selección, transiciones, flujo y estado. `pump-model.js`: construcción paramétrica del modelo industrial detallado. `flow-field.js`: trayectorias y shaders del flujo ilustrativo. `server.cjs`: servidor opcional. `vendor/`: Three.js, OrbitControls, RoomEnvironment y licencia.

Se utiliza un modelo geométrico propio, no un GLB. Las diez piezas son grupos independientes: `voluta`, `impulsor`, `eje`, `aspiracion`, `descarga`, `sello`, `rodamiento-delantero`, `rodamiento-posterior`, `acoplamiento`, `soporte`. La bancada es un elemento de contexto.

Representación cualitativa sin escala: voluta espiral redondeada de pared hueca, tapas abombadas, impulsor semiabierto de siete álabes y eje Z. Incorpora bridas con taladros pasantes y caras mecanizadas, tornillos hexagonales con arandelas, juntas, eje escalonado, resorte helicoidal del sello, jaulas de rodamientos, nervaduras, tapón de lubricación, visor de aceite y placa identificativa. La fundición pintada tiene microrrugosidad procedural; el acero, el impulsor metálico y los detalles del acoplamiento usan materiales físicos con reflejos de estudio. Se añaden sombras de contacto y una bancada con anclajes. Todos los detalles pertenecen al componente correspondiente y acompañan su despiece.

Es un modelo genérico de mayor detalle visual, no una réplica certificada ni un plano de fabricación; la unión de descarga y las holguras siguen siendo aproximaciones didácticas. No incluye motor ni una solución CFD. La generación local no requiere descargas de texturas o modelos. Las carcasas dejan de proyectar sombra al hacerse transparentes para mantener legible el interior.

## Evolución del laboratorio

El catálogo contiene identificadores, colores y explicaciones separados de la construcción geométrica. `component()` registra cada grupo, su posición ensamblada y su desplazamiento de despiece. Para integrar un GLB posteriormente, incorpora GLTFLoader de la misma versión, coloca el archivo en `assets/bomba.glb` y registra sus grupos con los mismos identificadores. Centra el pivote del rotor en su eje Z; conserva el modelo geométrico como alternativa si falla la carga. La carga GLB no está implementada en esta primera versión.

`labState` exporta RPM, modo de vista y estados de animación, y reserva `hydraulics` para datos físicos. El evento `pump:statechange` notifica cambios del deslizador. Los siguientes módulos pueden consumir ese estado sin modificar las geometrías:

- Curvas H–Q, eficiencia y potencia a partir de datos experimentales o del fabricante.
- Leyes de semejanza y variación del diámetro, indicando hipótesis y límites de validez.
- NPSH disponible/requerido y cavitación con parámetros de la instalación.
- Comparación de bombas en serie y paralelo y curva del sistema.

Estas funciones hidráulicas son ampliaciones futuras, no cálculos disponibles en esta entrega.

Documentación técnica: https://threejs.org/docs/ y https://threejs.org/docs/#examples/en/controls/OrbitControls.


## Visualización de flujo tipo CFD

- **Pausar estelas / Reanudar estelas** congela únicamente el transporte del fluido para inspección; el rotor mantiene su control independiente.
- **Líneas de corriente** alterna el trazado tenue de referencia bajo las estelas.
- **Densidad** permite elegir aproximadamente 14, 28 o 42 trayectorias.
- **Velocidad visual** ajusta 0.5×, 1× o 2×. El transporte también escala con las RPM seleccionadas: a 0 RPM queda detenido y el campo coloreado se conserva como referencia. El botón de giro del impulsor es independiente.
- Despiece y vista externa desactivan el flujo y ocultan sus controles. El impulsor recupera su opacidad al salir de este modo.

El campo se prescribe geométricamente y no resuelve Navier–Stokes, continuidad, condiciones de contorno ni interacción móvil con los álabes. Los colores no son resultados numéricos de CFD; no se calculan presión, turbulencia, cavitación, caudal ni fuerzas. La escala es relativa y permanece fija al cambiar RPM. La distribución de colores y los tiempos de las estelas son recursos didácticos cualitativos. Para un análisis real sería necesario importar resultados de un solver y mapear los campos a una malla validada.

Las trayectorias se construyen una sola vez con TubeGeometry. Su animación se ejecuta en GPU mediante un shader compartido; no se regeneran geometrías por fotograma ni se requieren servicios externos.

### Refinamiento de la fundición y el montaje

La carcasa utiliza ahora una sección superelíptica de hombros anchos, con contrabrida posterior, resaltes para espárragos, nervios de tapa y orejeta de izaje. Se agregó una linterna nervada entre el alojamiento y la tapa, junto con corona de entrada del impulsor, detalles del cárter y ranuras del bastidor. La descarga penetra en el colector para evitar una separación visual entre las piezas. Los materiales y el encuadre se ajustaron para distinguir mejor las superficies mecanizadas y la fundición. El conjunto sigue siendo una interpretación paramétrica genérica, con componentes independientes; no necesita un CAD externo.

## Referencia visual KWP

Actualización basada en el catálogo KSB KWP proporcionado por el usuario: materiales (p. 7), impulsor abierto tipo O (p. 11) y montaje con aceitera de nivel constante 638 (Fig. 11, p. 32). Se mantiene la geometría didáctica de siete álabes; no se afirma que ese número corresponda a un tamaño KWP concreto. El impulsor adopta un acabado metálico neutro en lugar del bronce anterior. La pintura azul es una elección visual, no un color certificado por el catálogo. Se incorporan depósito de aceite, tubería, respiradero y tornillería de las tapas del soporte. Las dimensiones, variante de material y tamaño comercial siguen pendientes de identificación; el resultado es una interpretación sin escala.

## Mapa de presión relativa

El color representa ahora presión ilustrativa normalizada (0–1): ligera caída en la aspiración hasta el ojo, aumento a través del impulsor y recuperación en la voluta hasta la descarga. El campo se asigna por tramo de trayectoria. No tiene unidades de presión, no es presión manométrica ni absoluta y no se obtiene de CFD. La escala permanece como referencia al variar RPM; las estelas indican únicamente el transporte visual.

## Caso de presión estimada en bar (actualización vigente)

Referencia: KWP.PDF, página 17, diagrama de selección KWP K a 1450 RPM, zona 65-315. Se elige Q aproximado 70 m³/h y H aproximada 22 m dentro de esa zona; no se trata de un punto de ensayo ni de una curva para diámetro específico. El dibujo 3D conserva su impulsor abierto didáctico y no representa la geometría del tipo K. Supuestos: agua con densidad 1000 kg/m³, g=9.80665 m/s², entrada 0 bar manométricos y diferencias de velocidad/cota entre conexiones despreciables. Δp≈ρgH=2.157463 bar; salida≈2.16 bar(g). El perfil interior y su caída en el ojo son ilustrativos. La leyenda muestra bar(g), con rango -0.30 a 2.157463, y sustituye la anterior escala relativa. El caso permanece fijo a 1450 RPM incluso cuando el usuario cambia la velocidad de animación; no predice otro punto de operación.
