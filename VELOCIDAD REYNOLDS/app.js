document.addEventListener("DOMContentLoaded", () => {
    // Inputs
    const inQLs = document.getElementById("in-q-ls");
    const inQm3s = document.getElementById("in-q-m3s");
    const inDmm = document.getElementById("in-d-mm");
    const inDm = document.getElementById("in-d-m");
    const inE = document.getElementById("in-e");
    const inTemp = document.getElementById("in-temp");
    const inNu = document.getElementById("in-nu");
    const materialSelect = document.getElementById("material-select");

    // Datos de agua
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
    const outV = document.getElementById("out-v");
    const outRe = document.getElementById("out-re");
    const outStatus = document.getElementById("out-status");
    const outF = document.getElementById("out-f");
    const outEq = document.getElementById("out-eq");
    const cardRe = document.querySelector(".card-re");
    const formulaF = document.getElementById("formula-f");
    
    let currentRe = 0; // Para la animación
    let currentV = 0;  // Para la velocidad de la animación
    const STORAGE_KEY = "virtualab_reynolds_data";

    function saveData(calculatedF = "") {
        const data = {
            inQLs: inQLs.value,
            inQm3s: inQm3s.value,
            inDmm: inDmm.value,
            inDm: inDm.value,
            inE: inE.value,
            inTemp: inTemp ? inTemp.value : "",
            inNu: inNu.value,
            materialSelect: materialSelect ? materialSelect.value : "custom",
            calculatedF: calculatedF
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
        saveData(); // Guardar el estado actual de los inputs de inmediato

        const q_Ls = parseFloat(inQLs.value.toString().replace(',', '.')) || 0;
        const d_mm = parseFloat(inDmm.value.toString().replace(',', '.')) || 0;
        const e_m_input = parseFloat(inE.value.toString().replace(',', '.')) || 0;
        const nu_m2s_input = parseFloat(inNu.value.replace(',', '.')) || 0;

        if (d_mm <= 0 || nu_m2s_input <= 0 || q_Ls === 0) {
            outV.innerText = "0,0000";
            outRe.innerText = "0";
            outF.innerText = "0,0000";
            outStatus.innerText = "Sin flujo";
            outStatus.className = "status-badge status-laminar";
            outEq.innerText = "-";
            currentRe = 0;
            currentV = 0;
            if (cardRe) {
                cardRe.style.background = "#f8fafc";
                cardRe.style.borderColor = "#cbd5e1";
            }
            if (formulaF) {
                formulaF.innerHTML = `f = <span class="fraction"><span class="numerator">0,25</span><span class="denominator">[log<sub>10</sub>(<span class="fraction"><span class="numerator">ε</span><span class="denominator">3,7 · D</span></span> + <span class="fraction"><span class="numerator">5,74</span><span class="denominator">Re<sup>0,9</sup></span></span>)]<sup>2</sup></span></span>`;
            }
            return;
        }

        // Conversions
        const q_m3s = q_Ls / 1000;
        const d_m = d_mm / 1000;
        const e_m = e_m_input;
        const nu_m2s = nu_m2s_input;

        // Area and Velocity
        const area = (Math.PI * Math.pow(d_m, 2)) / 4;
        const v = q_m3s / area;
        currentV = v; // Guardar para la animación
        
        // Reynolds
        const re = (v * d_m) / nu_m2s;
        currentRe = re; // Guardar para la animación

        // Friction Factor
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
            // Turbulent or Transition. Use Swamee-Jain.
            const term1 = e_m / (3.7 * d_m);
            const term2 = 5.74 / Math.pow(re, 0.9);
            const logTerm = Math.log10(term1 + term2);
            f = 0.25 / Math.pow(logTerm, 2);
            eqName = "Ecuación de Swamee-Jain";
            if (formulaF) {
                formulaF.innerHTML = `f = <span class="fraction"><span class="numerator">0,25</span><span class="denominator">[log<sub>10</sub>(<span class="fraction"><span class="numerator">ε</span><span class="denominator">3,7 · D</span></span> + <span class="fraction"><span class="numerator">5,74</span><span class="denominator">Re<sup>0,9</sup></span></span>)]<sup>2</sup></span></span>`;
            }
        }

        // Display updates
        outV.innerText = v.toFixed(4).replace('.', ',');
        
        // Format Reynolds nicely
        outRe.innerText = Number.isInteger(re) ? re.toString() : re.toFixed(3).replace('.', ',');
        
        // Status Badge and Card Background
        if (re < 2000) {
            outStatus.innerText = "Flujo Laminar";
            outStatus.className = "status-badge status-laminar";
            if (cardRe) {
                cardRe.style.background = "#f0fdf4"; // Verde pastel
                cardRe.style.borderColor = "#a3e2bb";
            }
        } else if (re <= 4000) {
            outStatus.innerText = "Flujo en Transición";
            outStatus.className = "status-badge status-transition";
            if (cardRe) {
                cardRe.style.background = "#fff7ed"; // Naranja pastel
                cardRe.style.borderColor = "#ffd1a9";
            }
        } else {
            outStatus.innerText = "Flujo Turbulento";
            outStatus.className = "status-badge status-turbulent";
            if (cardRe) {
                cardRe.style.background = "#fef2f2"; // Rojo pastel
                cardRe.style.borderColor = "#fca5a5";
            }
        }

        outF.innerText = f.toFixed(4).replace('.', ',');
        outEq.innerText = eqName;
        saveData(f.toFixed(4).replace('.', ',')); // Guardar el f calculado final
        
        // Actualizar el enlace Siguiente dinámicamente con parámetros de la URL
        const btnSiguiente = document.getElementById("btn-siguiente");
        if (btnSiguiente) {
            btnSiguiente.href = `../PERDIDA LONGITUD/PERDIDA LONGITUD.html?q=${q_Ls}&d=${d_mm}&f=${f.toFixed(4)}`;
        }
    }

    // Add event listeners to all inputs
    const inputs = [inE, inNu];
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            if (input === inE && materialSelect) {
                materialSelect.value = "custom";
            }
            if (input === inNu && inTemp) {
                inTemp.value = ""; // Limpiar temp si se escribe manualmente
            }
            calculate();
        });
    });

    if (inQLs && inQm3s) {
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
    }

    if (inDmm && inDm) {
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
    }

    if (inTemp) {
        inTemp.addEventListener("input", () => {
            if (inTemp.value !== "") {
                const t = parseFloat(inTemp.value.toString().replace(',', '.'));
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

    // --- SIMULACIÓN DE FLUJO ---
    const pipe = document.getElementById("pipe-view");
    const particles = [];
    const numParticles = 100;

    for (let i = 0; i < numParticles; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.top = (Math.random() * 90 + 5) + "%";
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
            
            // La velocidad física (v) controla el factor de rapidez visual (reducido para ser más lento)
            const speedFactor = Math.min(Math.max(v * 0.3, 0.01), 1.5);
            p.x += p.baseSpeed * speedFactor;
            if (p.x > 105) p.x = -5;
            
            let currentY = p.y;
            
            if (isTurbulent) {
                // Caótico
                currentY += Math.sin(p.x * 0.8 + p.offsetY) * 4 + (Math.random() - 0.5) * 6;
                p.el.style.backgroundColor = "#ff003c";
                p.el.style.color = "#ff003c";
            } else if (isTransition) {
                // Ondulado
                currentY += Math.sin(p.x * 0.2 + p.offsetY) * 3;
                p.el.style.backgroundColor = "#ff9d00";
                p.el.style.color = "#ff9d00";
            } else {
                // Laminar rectilíneo
                p.el.style.backgroundColor = "#00f6ff";
                p.el.style.color = "#00f6ff";
            }

            if(currentY < 3) currentY = 3;
            if(currentY > 93) currentY = 93;

            p.el.style.left = p.x + "%";
            p.el.style.top = currentY + "%";
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    if (pipe) {
        animateParticles();
    }

    // Initial load and calculation
    loadData();
    calculate();
});
