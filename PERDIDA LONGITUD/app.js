document.addEventListener("DOMContentLoaded", () => {
    // Inputs
    const inQLs = document.getElementById("in-q-ls");
    const inQm3s = document.getElementById("in-q-m3s");
    const inDmm = document.getElementById("in-d-mm");
    const inDm = document.getElementById("in-d-m");
    const inL = document.getElementById("in-l");
    const inF = document.getElementById("in-f");

    // Outputs
    const outHf = document.getElementById("out-hf");

    const STORAGE_KEY = "virtualab_loss_data";

    function saveData() {
        const data = {
            inQLs: inQLs.value,
            inQm3s: inQm3s.value,
            inDmm: inDmm.value,
            inDm: inDm.value,
            inL: inL.value,
            inF: inF.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if(parsed.inQLs !== undefined) inQLs.value = parsed.inQLs;
                if(parsed.inQm3s !== undefined) inQm3s.value = parsed.inQm3s;
                if(parsed.inDmm !== undefined) inDmm.value = parsed.inDmm;
                if(parsed.inDm !== undefined) inDm.value = parsed.inDm;
                if(parsed.inL !== undefined) inL.value = parsed.inL;
                if(parsed.inF !== undefined) inF.value = parsed.inF;
            } catch (e) {
                console.error("Error cargando datos guardados", e);
            }
        }
    }

    function calculate() {
        saveData(); // Persistir entradas de inmediato

        const q_Ls = parseFloat(inQLs.value) || 0;
        const d_mm = parseFloat(inDmm.value) || 0;
        const l_m = parseFloat(inL.value) || 0;
        const f_val = parseFloat(inF.value.toString().replace(',', '.')) || 0;

        if (d_mm <= 0 || f_val <= 0 || q_Ls === 0 || l_m <= 0) {
            outHf.innerText = "0,0000";
            return;
        }

        // Conversiones y constantes
        const q_m3s = q_Ls / 1000;
        const d_m = d_mm / 1000;

        // Área y Velocidad
        const area = (Math.PI * Math.pow(d_m, 2)) / 4;
        const v = q_m3s / area;

        // Pérdida de Carga Primaria (Darcy-Weisbach)
        const g = 9.81;
        const hf = f_val * (l_m / d_m) * (Math.pow(v, 2) / (2 * g));

        // Actualizar visualizaciones numéricas
        outHf.innerText = hf.toFixed(4).replace('.', ',');
    }

    // Event listeners
    const inputs = [inL, inF];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener("input", () => {
                calculate();
            });
        }
    });

    if (inQLs && inQm3s) {
        inQLs.addEventListener("input", () => {
            const val = parseFloat(inQLs.value) || 0;
            inQm3s.value = val === 0 ? "" : (val / 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
            calculate();
        });
        inQm3s.addEventListener("input", () => {
            const val = parseFloat(inQm3s.value) || 0;
            inQLs.value = val === 0 ? "" : (val * 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
            calculate();
        });
    }

    if (inDmm && inDm) {
        inDmm.addEventListener("input", () => {
            const val = parseFloat(inDmm.value) || 0;
            inDm.value = val === 0 ? "" : (val / 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
            calculate();
        });
        inDm.addEventListener("input", () => {
            const val = parseFloat(inDm.value) || 0;
            inDmm.value = val === 0 ? "" : (val * 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
            calculate();
        });
    }

    // --- ELIMINACIÓN DE FONDO DE CUADRÍCULA (TRANSPARENCIA REAL) ---
    function processTransparency(imgElement) {
        if (imgElement.dataset.processed === "true") return;
        imgElement.dataset.processed = "true";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const w = imgElement.naturalWidth;
        const h = imgElement.naturalHeight;
        if (w === 0 || h === 0) return;
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(imgElement, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        const visited = new Uint8Array(w * h);
        const queue = [];
        
        // Detecta colores típicos de la cuadrícula de transparencia falsa (blanco o gris claro)
        function isBgColor(r, g, b) {
            const isGrayscale = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
            if (!isGrayscale) return false;
            const avg = (r + g + b) / 3;
            return avg > 170; // Detecta grises por encima del tono de las paredes
        }
        
        // Inicializar cola desde los bordes de la imagen
        for (let x = 0; x < w; x++) {
            queue.push(x, 0);
            queue.push(x, h - 1);
            visited[x] = 1;
            visited[x + (h - 1) * w] = 1;
        }
        for (let y = 1; y < h - 1; y++) {
            queue.push(0, y);
            queue.push(w - 1, y);
            visited[y * w] = 1;
            visited[(w - 1) + y * w] = 1;
        }
        
        let head = 0;
        while (head < queue.length) {
            const x = queue[head++];
            const y = queue[head++];
            const idx = (x + y * w) * 4;
            
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            if (isBgColor(r, g, b)) {
                data[idx + 3] = 0; // Transparente
                
                const neighbors = [
                    [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
                ];
                for (let i = 0; i < neighbors.length; i++) {
                    const nx = neighbors[i][0];
                    const ny = neighbors[i][1];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const nIdx = nx + ny * w;
                        if (!visited[nIdx]) {
                            visited[nIdx] = 1;
                            queue.push(nx, ny);
                        }
                    }
                }
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        imgElement.src = canvas.toDataURL("image/png");
    }

    // Cargar imagen y remover fondo
    const cfdImg = document.querySelector("#pipe-view img");
    if (cfdImg) {
        if (cfdImg.complete) {
            processTransparency(cfdImg);
        } else {
            cfdImg.addEventListener("load", () => {
                processTransparency(cfdImg);
            });
        }
    }

    // Carga inicial de datos persistidos y primer cálculo
    loadData();
    calculate();
});
