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
        // Caudal y Longitud siempre fijos por defecto en esta página
        inQLs.value = "1000";
        inQm3s.value = "1";
        inL.value = "1";
        
        // Sincronizar Diámetro (D) y Factor de Fricción (f) desde la página FACTOR FRICCION
        const reynoldsDataStr = localStorage.getItem("virtualab_reynolds_data");
        if (reynoldsDataStr) {
            try {
                const rData = JSON.parse(reynoldsDataStr);
                // Diámetro desde la página anterior
                if(rData.inDmm !== undefined) inDmm.value = rData.inDmm;
                if(rData.inDm !== undefined) inDm.value = rData.inDm;
                
                if (rData.calculatedF !== undefined && rData.calculatedF !== "") {
                    inF.value = rData.calculatedF.replace(',', '.');
                } else {
                    // Recalcular f como respaldo
                    const q_Ls = parseFloat(rData.inQLs) || 0;
                    const d_mm = parseFloat(rData.inDmm) || 0;
                    const e_m = parseFloat(rData.inE) || 0;
                    const nu_m2s = parseFloat(rData.inNu.toString().replace(',', '.')) || 1.02e-6;
                    
                    if (d_mm > 0 && q_Ls > 0 && nu_m2s > 0) {
                        const q_m3s = q_Ls / 1000;
                        const d_m = d_mm / 1000;
                        const area = (Math.PI * Math.pow(d_m, 2)) / 4;
                        const v = q_m3s / area;
                        const re = (v * d_m) / nu_m2s;
                        let f = 0.0200;
                        if (re < 2000) {
                            f = 64 / re;
                        } else {
                            const term1 = e_m / (3.7 * d_m);
                            const term2 = 5.74 / Math.pow(re, 0.9);
                            const logTerm = Math.log10(term1 + term2);
                            f = 0.25 / Math.pow(logTerm, 2);
                        }
                        inF.value = f.toFixed(4);
                    } else {
                        inF.value = "0.0200";
                    }
                }
            } catch (e) {
                inF.value = "0.0200";
            }
        } else {
            inF.value = "0.0200";
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

    // Carga inicial de datos persistidos y primer cálculo
    loadData();
    calculate();
});
