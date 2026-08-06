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

    // Canvas CFD Simulation Elements
    const canvas = document.getElementById("cfd-canvas");
    const ctx = canvas.getContext("2d");

    let currentRe = 0; // Para la simulación
    let currentV = 0;  // Para la simulación
    let currentHf = 0; // Para la simulación
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
            currentRe = 0;
            currentV = 0;
            currentHf = 0;
            return;
        }

        // Conversiones y constantes
        const q_m3s = q_Ls / 1000;
        const d_m = d_mm / 1000;
        const nu_m2s = 1.02e-6; // Viscosidad constante del agua a 20°C bajo el capó

        // Área y Velocidad
        const area = (Math.PI * Math.pow(d_m, 2)) / 4;
        const v = q_m3s / area;
        currentV = v;

        // Reynolds (para clasificación visual y animaciones)
        const re = (v * d_m) / nu_m2s;
        currentRe = re;

        // Pérdida de Carga Primaria (Darcy-Weisbach)
        const g = 9.81;
        const hf = f_val * (l_m / d_m) * (Math.pow(v, 2) / (2 * g));
        currentHf = hf;

        // Actualizar visualizaciones numéricas
        outHf.innerText = hf.toFixed(4).replace('.', ',');
    }

    // --- JET COLORMAP (Mapeo de color CFD) ---
    function getCfdColor(value, alpha = 1.0) {
        const val = Math.min(Math.max(value, 0), 1);
        let r = 0, g = 0, b = 0;
        if (val < 0.25) {
            r = 0;
            g = Math.round(val * 4 * 255);
            b = 255;
        } else if (val < 0.5) {
            r = 0;
            g = 255;
            b = Math.round((0.5 - val) * 4 * 255);
        } else if (val < 0.75) {
            r = Math.round((val - 0.5) * 4 * 255);
            g = 255;
            b = 0;
        } else {
            r = 255;
            g = Math.round((1.0 - val) * 4 * 255);
            b = 0;
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // --- SIMULACIÓN DE FLUJO CFD ---
    const particles = [];
    const numParticles = 140;

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * 800,
            y: 82 + Math.random() * 91, // Entre y=80 y y=175
            baseSpeed: 0.4 + Math.random() * 0.6,
            offsetY: Math.random() * 100,
            size: 1.5 + Math.random() * 1.5
        });
    }

    function animateCfd() {
        const re = currentRe;
        const v = currentV;
        const isTurbulent = re > 4000;
        const isTransition = re > 2000 && re <= 4000;
        const isZero = re === 0 || v === 0;

        // 1. Limpieza con arrastre (estilo cometa)
        ctx.fillStyle = "rgba(15, 23, 42, 0.24)"; // 0.24 para estelas fluidas hermosas
        ctx.fillRect(0, 0, 800, 220);

        // 2. Actualizar y dibujar partículas CFD
        particles.forEach(p => {
            if (isZero) {
                // Dibujar estático si no hay flujo
                ctx.fillStyle = "rgba(100, 116, 139, 0.3)";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
                ctx.fill();
                return;
            }

            // Normalizado respecto al eje central del tubo (y=127.5, radio=47.5)
            const yNorm = (p.y - 127.5) / 47.5;
            let u_local = 0;

            // Perfil de velocidad CFD
            if (isTurbulent) {
                // Perfil turbulento (Ley de la potencia 1/7 - más plano en el centro)
                u_local = v * 1.2 * Math.pow(1.0 - Math.min(Math.abs(yNorm), 0.999), 1/7);
            } else {
                // Perfil laminar (Parabólico de Poiseuille)
                u_local = v * 2.0 * (1.0 - yNorm * yNorm);
            }

            // Velocidad de movimiento visual en el canvas
            const speedScale = 12; // Factor de animación
            const dx = u_local * speedScale * p.baseSpeed;
            p.x += dx;

            // Retorno al inicio al salir de la pantalla
            if (p.x > 810) {
                p.x = -10;
                p.y = 82 + Math.random() * 91;
            }

            // Fluctuaciones dinámicas (remolinos en turbulento, ondas en transición)
            if (isTurbulent) {
                // Turbulencia caótica de alta frecuencia
                const freq = 0.05;
                const amp = 1.5 * Math.min(v, 1.5);
                p.y += Math.sin(p.x * freq + p.offsetY + Date.now() * 0.005) * amp + (Math.random() - 0.5) * 1.5;
            } else if (isTransition) {
                // Ondulación suave en transición (Ondas TS)
                const freq = 0.02;
                const amp = 1.0;
                p.y += Math.sin(p.x * freq + p.offsetY + Date.now() * 0.002) * amp;
            }

            // Mantener estrictamente dentro del tubo
            if (p.y < 82) p.y = 82;
            if (p.y > 173) p.y = 173;

            // Obtener color CFD Jet según velocidad local
            const maxRefSpeed = isTurbulent ? v * 1.2 : v * 2.0;
            const normSpeed = maxRefSpeed > 0 ? u_local / maxRefSpeed : 0;
            
            let pColor = "#64748b";
            if (isTurbulent) {
                pColor = getCfdColor(normSpeed, 0.65);
            } else if (isTransition) {
                pColor = getCfdColor(normSpeed, 0.55);
            } else {
                pColor = getCfdColor(normSpeed, 0.45);
            }

            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
            ctx.fill();
        });

        // 3. Rejilla de medición CFD (Faint Grid)
        ctx.strokeStyle = "rgba(71, 85, 105, 0.15)";
        ctx.lineWidth = 1;
        for (let x = 40; x < 800; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 80);
            ctx.lineTo(x, 175);
            ctx.stroke();
        }
        for (let y = 80; y <= 175; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(800, y);
            ctx.stroke();
        }

        // 4. Paredes del tubo
        ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.lineTo(800, 80);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 175);
        ctx.lineTo(800, 175);
        ctx.stroke();

        // 5. Graficar perfil de velocidad u(y) (Línea de sonda)
        drawVelocityProfile();

        // 6. Elementos HUD del Solver CFD
        drawCfdHud();

        requestAnimationFrame(animateCfd);
    }

    function drawVelocityProfile() {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(80, 80);
        ctx.lineTo(80, 175);
        ctx.stroke();
        ctx.setLineDash([]);

        if (currentV === 0) return;

        const isTurbulent = currentRe > 4000;
        const isTransition = currentRe >= 2000 && currentRe <= 4000;

        let profileColor = "#00f6ff"; // Laminar
        if (isTurbulent) profileColor = "#ef4444"; // Turbulento
        else if (isTransition) profileColor = "#f59e0b"; // Transición

        ctx.strokeStyle = profileColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = profileColor;
        ctx.shadowBlur = 4;
        ctx.beginPath();

        for (let y = 80; y <= 175; y++) {
            const yNorm = (y - 127.5) / 47.5;
            let u = 0;

            if (isTurbulent) {
                u = 1.0 * Math.pow(1.0 - Math.min(Math.abs(yNorm), 0.999), 1/7);
                // Vibración de alta frecuencia (ruido turbulento)
                const noise = Math.sin(y * 0.4 + Date.now() * 0.08) * 0.025 + (Math.random() - 0.5) * 0.03;
                u = Math.max(u + noise, 0);
            } else if (isTransition) {
                u = 1.1 * (1.0 - yNorm * yNorm);
                // Fluctuación ondulatoria suave
                const wave = Math.sin(y * 0.15 + Date.now() * 0.015) * 0.04;
                u = Math.max(u + wave, 0);
            } else {
                u = 1.2 * (1.0 - yNorm * yNorm);
            }

            const scale = 110; // Pixeles de escala
            const dx = u * scale;

            if (y === 80) ctx.moveTo(80 + dx, y);
            else ctx.lineTo(80 + dx, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Texto del perfil de velocidad
        ctx.fillStyle = profileColor;
        ctx.font = 'bold 9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText("PERFIL DE VELOCIDAD u(y)", 80, 72);
    }

    function drawCfdHud() {
        const isTurbulent = currentRe > 4000;
        const isTransition = currentRe >= 2000 && currentRe <= 4000;
        const isZero = currentRe === 0 || currentV === 0;

        let regimeText = "LAMINAR";
        let regimeColor = "#00f6ff"; // Cyan
        let statusText = "ESTACIONARIO / PARABÓLICO";
        if (isZero) {
            regimeText = "SIN FLUJO";
            regimeColor = "#64748b"; // Slate
            statusText = "INACTIVO";
        } else if (isTurbulent) {
            regimeText = "TURBULENTO";
            regimeColor = "#ef4444"; // Red
            statusText = "DESARROLLADO / CAÓTICO";
        } else if (isTransition) {
            regimeText = "TRANSICIÓN";
            regimeColor = "#f59e0b"; // Amber
            statusText = "ONDAS TRANSITORIAS";
        }

        // Título de la simulación CFD
        ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
        ctx.font = '9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText("SIMULACIÓN DE FLUIDOS NUMÉRICA (CFD)", 25, 25);

        // Parámetros numéricos a la derecha
        ctx.textAlign = "right";
        
        ctx.fillStyle = regimeColor;
        ctx.font = 'bold 11px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText(`RÉGIMEN: ${regimeText}`, 775, 25);
        
        ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
        ctx.font = '10px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText(`Re = ${Math.round(currentRe).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, 775, 40);
        ctx.fillText(`Velocidad Media V = ${currentV.toFixed(4).replace('.', ',')} m/s`, 775, 55);
        
        ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
        ctx.font = '9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText(`ESTADO: ${statusText}`, 775, 70);
        
        // Escala de Colores Jet de velocidad
        const legendX = 620;
        const legendY = 192;
        const legendW = 150;
        const legendH = 8;
        
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
        ctx.font = '9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText("Velocidad u", legendX - 70, legendY + 7);
        
        // Gradiente de leyenda
        const grad = ctx.createLinearGradient(legendX, legendY, legendX + legendW, legendY);
        grad.addColorStop(0.0, getCfdColor(0.0));
        grad.addColorStop(0.25, getCfdColor(0.25));
        grad.addColorStop(0.5, getCfdColor(0.5));
        grad.addColorStop(0.75, getCfdColor(0.75));
        grad.addColorStop(1.0, getCfdColor(1.0));
        
        ctx.fillStyle = grad;
        ctx.fillRect(legendX, legendY, legendW, legendH);
        
        // Ticks
        ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
        ctx.font = '8px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText("0", legendX, legendY + 18);
        ctx.textAlign = "right";
        ctx.fillText("Vmax", legendX + legendW, legendY + 18);
        
        // Reset alineación
        ctx.textAlign = "left";
    }

    if (canvas) {
        animateCfd();
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
