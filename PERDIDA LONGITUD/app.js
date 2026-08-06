document.addEventListener("DOMContentLoaded", () => {
    // Inputs
    const inQLs = document.getElementById("in-q-ls");
    const inQm3s = document.getElementById("in-q-m3s");
    const inDmm = document.getElementById("in-d-mm");
    const inDm = document.getElementById("in-d-m");
    const inL = document.getElementById("in-l");
    const inE = document.getElementById("in-e");
    const inTemp = document.getElementById("in-temp");
    const inNu = document.getElementById("in-nu");
    const materialSelect = document.getElementById("material-select");

    // Datos de agua para viscosidad cinemática
    const waterProperties = [
        { t: 0, nu: 1.75e-6 },
        { t: 5, nu: 1.52e-6 },
        { t: 10, nu: 1.30e-6 },
        { t: 15, nu: 1.15e-6 },
        { t: 20, nu: 1.02e-6 },
        { t: 25, nu: 8.94e-7 },
        { t: 30, nu: 8.03e-7 },
        { t: 35, nu: 7.22e-7 },
        { t: 40, nu: 6.56e-7 },
        { t: 45, nu: 6.00e-7 },
        { t: 50, nu: 5.48e-7 },
        { t: 55, nu: 5.05e-7 },
        { t: 60, nu: 4.67e-7 },
        { t: 65, nu: 4.39e-7 },
        { t: 70, nu: 4.11e-7 },
        { t: 75, nu: 3.83e-7 },
        { t: 80, nu: 3.60e-7 },
        { t: 85, nu: 3.41e-7 },
        { t: 90, nu: 3.22e-7 },
        { t: 95, nu: 3.04e-7 },
        { t: 100, nu: 2.94e-7 }
    ];

    function getViscosity(temp) {
        if (temp <= 0) return waterProperties[0].nu;
        if (temp >= 100) return waterProperties[waterProperties.length - 1].nu;
        
        for (let i = 0; i < waterProperties.length - 1; i++) {
            if (temp >= waterProperties[i].t && temp <= waterProperties[i+1].t) {
                const t1 = waterProperties[i].t;
                const nu1 = waterProperties[i].nu;
                const t2 = waterProperties[i+1].t;
                const nu2 = waterProperties[i+1].nu;
                return nu1 + ((temp - t1) / (t2 - t1)) * (nu2 - nu1);
            }
        }
        return 1.02e-6;
    }

    // Outputs
    const outHf = document.getElementById("out-hf");
    const outF = document.getElementById("out-f");
    const outV = document.getElementById("out-v");
    const outRe = document.getElementById("out-re");
    const outStatus = document.getElementById("out-status");
    const outEq = document.getElementById("out-eq");
    const formulaF = document.getElementById("formula-f");
    const cardRe = document.querySelector(".card-re");
    const cardHf = document.querySelector(".card-hf");

    // SVG Simulation Elements
    const hglLine = document.getElementById("hgl-line");
    const waterIn = document.getElementById("water-in");
    const waterOut = document.getElementById("water-out");
    const hfText = document.getElementById("hf-text");

    let currentRe = 0; // Para la simulación
    let currentV = 0;  // Para la simulación
    let currentHf = 0; // Para la simulación
    const STORAGE_KEY = "virtualab_shared_lab_data";

    function saveData() {
        let data = {};
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
            try { data = JSON.parse(existing); } catch(e) {}
        }
        data.inQLs = inQLs.value;
        data.inQm3s = inQm3s.value;
        data.inDmm = inDmm.value;
        data.inDm = inDm.value;
        data.inL = inL.value;
        data.inE = inE.value;
        data.inTemp = inTemp ? inTemp.value : "";
        data.inNu = inNu.value;
        data.materialSelect = materialSelect ? materialSelect.value : "custom";
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
                if(parsed.inE !== undefined) inE.value = parsed.inE;
                if(parsed.inTemp !== undefined && inTemp) inTemp.value = parsed.inTemp;
                if(parsed.inNu !== undefined) inNu.value = parsed.inNu.toString().replace('.', ',');
                if(parsed.materialSelect !== undefined && materialSelect) materialSelect.value = parsed.materialSelect;
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
        const e_m_input = parseFloat(inE.value) || 0;
        const nu_m2s_input = parseFloat(inNu.value.replace(',', '.')) || 0;

        if (d_mm <= 0 || nu_m2s_input <= 0 || q_Ls === 0 || l_m <= 0) {
            outHf.innerText = "0,0000";
            outF.innerText = "0,0000";
            outV.innerText = "0,0000";
            outRe.innerText = "0";
            outStatus.innerText = "Sin flujo";
            outStatus.className = "status-badge status-laminar";
            outEq.innerText = "-";
            currentRe = 0;
            currentV = 0;
            currentHf = 0;

            if (cardRe) {
                cardRe.style.background = "#f8fafc";
                cardRe.style.borderColor = "#cbd5e1";
            }
            if (formulaF) {
                formulaF.innerHTML = `f = <span class="fraction"><span class="numerator">0,25</span><span class="denominator">[log<sub>10</sub>(<span class="fraction"><span class="numerator">ε</span><span class="denominator">3,7 · D</span></span> + <span class="fraction"><span class="numerator">5,74</span><span class="denominator">Re<sup>0,9</sup></span></span>)]<sup>2</sup></span></span>`;
            }
            updateSimulation(0);
            return;
        }

        // Conversiones
        const q_m3s = q_Ls / 1000;
        const d_m = d_mm / 1000;
        const e_m = e_m_input;
        const nu_m2s = nu_m2s_input;

        // Área y Velocidad
        const area = (Math.PI * Math.pow(d_m, 2)) / 4;
        const v = q_m3s / area;
        currentV = v;

        // Reynolds
        const re = (v * d_m) / nu_m2s;
        currentRe = re;

        // Factor de Fricción
        let f = 0;
        let eqName = "";

        if (re < 2000) {
            // Laminar
            f = 64 / re;
            eqName = "Ecuación de Poiseuille (Laminar)";
            if (formulaF) {
                formulaF.innerHTML = `f = <span class="fraction"><span class="numerator">64</span><span class="denominator">Re</span></span>`;
            }
        } else {
            // Turbulento/Transición (Swamee-Jain)
            const term1 = e_m / (3.7 * d_m);
            const term2 = 5.74 / Math.pow(re, 0.9);
            const logTerm = Math.log10(term1 + term2);
            f = 0.25 / Math.pow(logTerm, 2);
            eqName = "Ecuación de Swamee-Jain";
            if (formulaF) {
                formulaF.innerHTML = `f = <span class="fraction"><span class="numerator">0,25</span><span class="denominator">[log<sub>10</sub>(<span class="fraction"><span class="numerator">ε</span><span class="denominator">3,7 · D</span></span> + <span class="fraction"><span class="numerator">5,74</span><span class="denominator">Re<sup>0,9</sup></span></span>)]<sup>2</sup></span></span>`;
            }
        }

        // Pérdida de Carga Primaria (Darcy-Weisbach)
        const g = 9.81;
        const hf = f * (l_m / d_m) * (Math.pow(v, 2) / (2 * g));
        currentHf = hf;

        // Actualizar visualizaciones numéricas
        outHf.innerText = hf.toFixed(4).replace('.', ',');
        outF.innerText = f.toFixed(4).replace('.', ',');
        outV.innerText = v.toFixed(4).replace('.', ',');
        outRe.innerText = Number.isInteger(re) ? re.toString() : re.toFixed(3).replace('.', ',');

        // Actualizar tarjeta Reynolds
        if (re < 2000) {
            outStatus.innerText = "Flujo Laminar";
            outStatus.className = "status-badge status-laminar";
            if (cardRe) {
                cardRe.style.background = "#f0fdf4"; 
                cardRe.style.borderColor = "#a3e2bb";
            }
        } else if (re <= 4000) {
            outStatus.innerText = "Flujo en Transición";
            outStatus.className = "status-badge status-transition";
            if (cardRe) {
                cardRe.style.background = "#fff7ed"; 
                cardRe.style.borderColor = "#ffd1a9";
            }
        } else {
            outStatus.innerText = "Flujo Turbulento";
            outStatus.className = "status-badge status-turbulent";
            if (cardRe) {
                cardRe.style.background = "#fef2f2"; 
                cardRe.style.borderColor = "#fca5a5";
            }
        }

        outEq.innerText = eqName;
        updateSimulation(hf);
    }

    function updateSimulation(hf) {
        // Altura inicial del agua y1 = 40 (representa la carga en la entrada, constante)
        const y1 = 40;
        // La caída máxima en el piezómetro de salida es de 60px (llega hasta y=100)
        // Escalamos suponiendo que 5 metros de pérdida es el máximo visual.
        const maxDrop = 60;
        const drop = Math.min((hf / 5) * maxDrop, maxDrop);
        const y2 = y1 + drop;

        if (hglLine) {
            hglLine.setAttribute("y2", y2);
        }
        if (waterOut) {
            waterOut.setAttribute("y1", y2);
            waterOut.setAttribute("y2", y2);
        }
        if (hfText) {
            hfText.textContent = `hLT: ${hf.toFixed(4).replace('.', ',')} m`;
        }
    }

    // Event listeners
    const inputs = [inL, inE, inNu];
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            if (input === inE && materialSelect) {
                materialSelect.value = "custom";
            }
            if (input === inNu && inTemp) {
                inTemp.value = ""; 
            }
            calculate();
        });
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

    if (inTemp) {
        inTemp.addEventListener("input", () => {
            if (inTemp.value !== "") {
                const t = parseFloat(inTemp.value);
                const nu = getViscosity(t);
                inNu.value = nu.toExponential(4).replace('.', ',');
                calculate();
            }
        });
    }

    if (materialSelect) {
        materialSelect.addEventListener("change", () => {
            if (materialSelect.value !== "custom") {
                inE.value = materialSelect.value;
                calculate();
            }
        });
    }

    // --- SIMULACIÓN DE FLUJO DE PARTÍCULAS ---
    const pipe = document.getElementById("pipe-view");
    const particles = [];
    const numParticles = 100;

    for (let i = 0; i < numParticles; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        // Las partículas fluyen dentro de la tubería, de y=110px a y=150px en la simulación.
        // En porcentaje del contenedor de 180px de alto, la tubería va de ~61% a ~83%.
        // Dejamos un margen del 2% arriba y abajo.
        p.style.top = (63 + Math.random() * 16) + "%";
        if (pipe) pipe.appendChild(p);
        particles.push({
            el: p,
            x: Math.random() * 100,
            y: parseFloat(p.style.top),
            baseSpeed: 0.2 + Math.random() * 0.5,
            offsetY: Math.random() * 100
        });
    }

    function animateParticles() {
        const re = currentRe;
        const v = currentV;
        const isTurbulent = re > 4000;
        const isTransition = re > 2000 && re <= 4000;
        const isZero = re === 0 || v === 0;

        particles.forEach(p => {
            if (isZero) return; // Sin flujo
            
            // La velocidad controla la velocidad visual
            const speedFactor = Math.min(Math.max(v * 0.3, 0.01), 1.5);
            p.x += p.baseSpeed * speedFactor;
            if (p.x > 105) p.x = -5;
            
            let currentY = p.y;
            
            if (isTurbulent) {
                // Caótico
                currentY += Math.sin(p.x * 0.8 + p.offsetY) * 2 + (Math.random() - 0.5) * 3;
                p.el.style.backgroundColor = "#ff003c";
                p.el.style.color = "#ff003c";
            } else if (isTransition) {
                // Ondulado
                currentY += Math.sin(p.x * 0.2 + p.offsetY) * 1.5;
                p.el.style.backgroundColor = "#ff9d00";
                p.el.style.color = "#ff9d00";
            } else {
                // Laminar rectilíneo
                p.el.style.backgroundColor = "#00f6ff";
                p.el.style.color = "#00f6ff";
            }

            // Mantener dentro del tubo (61% a 83% de 180px)
            if(currentY < 62) currentY = 62;
            if(currentY > 82) currentY = 82;

            p.el.style.left = p.x + "%";
            p.el.style.top = currentY + "%";
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    if (pipe) {
        animateParticles();
    }

    // Carga inicial de datos persistidos y primer cálculo
    loadData();
    calculate();
});
