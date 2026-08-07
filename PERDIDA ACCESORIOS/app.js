document.addEventListener("DOMContentLoaded", () => {
    // Referencias a los elementos del DOM
    const inK = document.getElementById("in-k");
    const inQLs = document.getElementById("in-q-ls");
    const inQm3s = document.getElementById("in-q-m3s");
    const inDmm = document.getElementById("in-d-mm");
    const inDm = document.getElementById("in-d-m");
    const outHm = document.getElementById("out-hm");
    
    // Constantes físicas
    const g = 9.81;

    function loadData() {
        // Valores por defecto
        inQLs.value = "1000";
        inQm3s.value = "1";
        inDmm.value = "250";
        inDm.value = "0.250";

        // Sincronizar D desde la página FACTOR FRICCION
        const reynoldsDataStr = localStorage.getItem("virtualab_reynolds_data");
        if (reynoldsDataStr) {
            try {
                const rData = JSON.parse(reynoldsDataStr);
                // Si existe el diámetro en la memoria
                if(rData.inDmm !== undefined) {
                    inDmm.value = rData.inDmm;
                    const valD = parseFloat(rData.inDmm) || 0;
                    inDm.value = valD === 0 ? "" : (valD / 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
                }
            } catch (e) {
                console.error("Error sincronizando desde página de fricción", e);
            }
        }
    }

    function calculate() {
        const k = parseFloat(inK.value.toString().replace(',', '.')) || 0;
        const q_m3s = parseFloat(inQm3s.value.toString().replace(',', '.')) || 0;
        const d_m = parseFloat(inDm.value.toString().replace(',', '.')) || 0;
        
        if (d_m > 0 && q_m3s > 0) {
            // hm = K * (8 * Q^2) / (pi^2 * g * D^4)
            const num = 8 * k * Math.pow(q_m3s, 2);
            const den = Math.pow(Math.PI, 2) * g * Math.pow(d_m, 4);
            const hm = num / den;
            outHm.textContent = hm.toFixed(4).replace('.', ',');
        } else {
            outHm.textContent = "0,0000";
        }
    }

    // --- Manejadores de eventos ---
    
    // Al escribir un K
    inK.addEventListener("input", calculate);

    // Caudal
    inQLs.addEventListener("input", () => {
        const val = parseFloat(inQLs.value.toString().replace(',', '.')) || 0;
        inQm3s.value = val === 0 ? "" : (val / 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
        calculate();
    });
    
    inQm3s.addEventListener("input", () => {
        const val = parseFloat(inQm3s.value.toString().replace(',', '.')) || 0;
        inQLs.value = val === 0 ? "" : (val * 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
        calculate();
    });
    
    // Diámetro
    inDmm.addEventListener("input", () => {
        const val = parseFloat(inDmm.value.toString().replace(',', '.')) || 0;
        inDm.value = val === 0 ? "" : (val / 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
        calculate();
    });
    
    inDm.addEventListener("input", () => {
        const val = parseFloat(inDm.value.toString().replace(',', '.')) || 0;
        inDmm.value = val === 0 ? "" : (val * 1000).toPrecision(4).replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
        calculate();
    });

    // Inicializar la aplicación
    loadData();
    calculate();
});
