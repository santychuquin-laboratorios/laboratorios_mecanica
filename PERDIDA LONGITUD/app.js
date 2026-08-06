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

    // --- JET COLORMAP (Mapeo de color CFD para temperaturas/velocidades) ---
    function getCfdColor(value, alpha = 1.0) {
        const val = Math.min(Math.max(value, 0), 1);
        let r = 0, g = 0, b = 0;
        if (val < 0.25) {
            // Azul a Celeste
            r = 37;
            g = Math.round(99 + val * 4 * 136); // de 99 a 235
            b = 235;
        } else if (val < 0.5) {
            // Celeste a Verde
            r = Math.round(37 - (val - 0.25) * 4 * 3); // de 37 a 34
            g = Math.round(235 - (val - 0.25) * 4 * 38); // de 235 a 197
            b = Math.round(235 - (val - 0.25) * 4 * 141); // de 235 a 94
        } else if (val < 0.75) {
            // Verde a Amarillo/Naranja
            r = Math.round(34 + (val - 0.5) * 4 * 211); // de 34 a 245
            g = Math.round(197 - (val - 0.5) * 4 * 39); // de 197 a 158
            b = Math.round(94 - (val - 0.5) * 4 * 83); // de 94 a 11
        } else {
            // Naranja a Rojo
            r = Math.round(245 + (val - 0.75) * 4 * 14); // de 245 a 255
            g = Math.round(158 - (val - 0.75) * 4 * 158); // de 158 a 0
            b = Math.round(11 - (val - 0.75) * 4 * 11); // de 11 a 0
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // --- BUCLE DE SIMULACIÓN CFD ---
    function animateCfd() {
        const re = currentRe;
        const v = currentV;
        const isTurbulent = re > 4000;
        const isTransition = re > 2000 && re <= 4000;
        const isZero = re === 0 || v === 0;

        // 1. Limpiar fondo del resolvedor (Color crema claro/gris del entorno)
        ctx.fillStyle = "#faf8f2"; // Crema muy suave como el de la imagen de referencia
        ctx.fillRect(0, 0, 800, 220);

        // 2. Dibujar zona de entrada fría (Completamente Azul Real)
        ctx.fillStyle = "rgb(37, 99, 235)";
        ctx.fillRect(0, 80, 150, 95);

        // 3. Renderizar gradiente CFD térmico desarrollado a lo largo del tubo
        // Se dibuja en rebanadas verticales (slices) para crear un mapa continuo de alta performance
        const xStart = 150;
        const xEnd = 720;
        const tNow = Date.now() * 0.003 * Math.max(v, 0.5);

        // Determinar tasa de difusión según régimen (turbulento mezcla mucho más rápido que laminar)
        let diffRate = 0.024;
        if (isTurbulent) diffRate = 0.22; // Desarrollo térmico ultra corto por mezcla turbulenta
        else if (isTransition) diffRate = 0.075;

        for (let x = xStart; x <= xEnd; x += 3) {
            const dx = x - xStart;
            
            // Espesor de penetración de capa límite térmica delta (de 0 a 1)
            let d_thermal = diffRate * Math.sqrt(dx);

            // Modulaciones dinámicas de flujo (ondas de inestabilidad y remolinos turbulentos)
            if (!isZero) {
                if (isTurbulent) {
                    // Turbulencia: Remolinos caóticos de alta frecuencia viajando a la derecha
                    const freq1 = 0.06, freq2 = 0.14;
                    const amp1 = 0.09, amp2 = 0.04;
                    d_thermal += Math.sin(x * freq1 - tNow * 2.0) * amp1 + 
                                 Math.sin(x * freq2 + tNow * 3.5) * amp2 + 
                                 (Math.random() - 0.5) * 0.02;
                } else if (isTransition) {
                    // Transición: Ondulación sinusoidal clásica de capa límite (ondas Tollmien-Schlichting)
                    const freq = 0.025;
                    const amp = 0.08;
                    d_thermal += Math.sin(x * freq - tNow * 1.2) * amp;
                }
            }

            const delta = Math.min(Math.max(d_thermal, 0), 1.0);

            // Temperatura del centro (se calienta cuando las capas límite se unen en el centro, delta=1)
            let T_center = 0.0;
            if (d_thermal > 1.0) {
                const mergeFactor = isTurbulent ? 1.8 : 1.2;
                T_center = 1.0 - Math.exp(-mergeFactor * (d_thermal - 1.0));
            }

            // Crear gradiente lineal vertical para este slice
            const grad = ctx.createLinearGradient(0, 80, 0, 175);
            grad.addColorStop(0.0, "rgb(239, 68, 68)"); // Pared superior caliente (Red)
            
            const stopTop = Math.max(0.001, Math.min(delta * 0.5, 0.49));
            grad.addColorStop(stopTop, "rgb(37, 99, 235)"); // Límite de la corriente fría superior (Blue)
            
            grad.addColorStop(0.5, getCfdColor(T_center)); // Temperatura en el eje central
            
            const stopBottom = Math.min(0.999, Math.max(1.0 - delta * 0.5, 0.51));
            grad.addColorStop(stopBottom, "rgb(37, 99, 235)"); // Límite de la corriente fría inferior (Blue)
            
            grad.addColorStop(1.0, "rgb(239, 68, 68)"); // Pared inferior caliente (Red)

            ctx.fillStyle = grad;
            ctx.fillRect(x, 80, 3.2, 95);
        }

        // 4. Dibujar zona de salida (Flujo térmicamente desarrollado / remanente)
        // Se rellena con el gradiente final obtenido en xEnd
        const finalGrad = ctx.createLinearGradient(0, 80, 0, 175);
        let finalDelta = diffRate * Math.sqrt(xEnd - xStart);
        let finalTCenter = 1.0 - Math.exp(-(isTurbulent ? 1.8 : 1.2) * (finalDelta - 1.0));
        
        finalGrad.addColorStop(0.0, "rgb(239, 68, 68)");
        finalGrad.addColorStop(0.5, getCfdColor(finalTCenter));
        finalGrad.addColorStop(1.0, "rgb(239, 68, 68)");
        
        ctx.fillStyle = finalGrad;
        ctx.fillRect(xEnd, 80, 800 - xEnd, 95);

        // 5. Dibujar paredes sólidas del tubo (Barras grises horizontales)
        ctx.fillStyle = "#57534e"; // Gris piedra oscuro
        ctx.fillRect(0, 72, 800, 8);  // Pared superior
        ctx.fillRect(0, 175, 800, 8); // Pared inferior

        // 6. Graficar el Perfil de Velocidad Vectorial (Línea blanca de sonda con flechas)
        drawVelocityProfile();

        // 7. Renderizar elementos HUD y Leyenda del resolvedor CFD
        drawCfdHud();

        requestAnimationFrame(animateCfd);
    }

    function drawVelocityProfile() {
        // Línea vertical base de referencia en x=30
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(30, 80);
        ctx.lineTo(30, 175);
        ctx.stroke();
        ctx.setLineDash([]);

        const re = currentRe;
        const isTurbulent = re > 4000;
        const isTransition = re > 2000 && re <= 4000;
        const isZero = currentRe === 0 || currentV === 0;

        if (isZero) return;

        // Dibujar curva parabólica/plana en blanco reluciente
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.2;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 4;
        ctx.beginPath();

        const xBase = 30;
        const maxArrowLength = 80;

        for (let y = 80; y <= 175; y++) {
            const yNorm = (y - 127.5) / 47.5;
            let u = 0;

            if (isTurbulent) {
                // Perfil turbulento chato (Ley 1/7)
                u = 1.0 * Math.pow(1.0 - Math.min(Math.abs(yNorm), 0.999), 1/7);
                // Vibración de turbulencia
                const noise = Math.sin(y * 0.4 + Date.now() * 0.08) * 0.02 + (Math.random() - 0.5) * 0.015;
                u = Math.max(u + noise, 0);
            } else if (isTransition) {
                u = 1.1 * (1.0 - yNorm * yNorm);
                const wave = Math.sin(y * 0.15 + Date.now() * 0.015) * 0.03;
                u = Math.max(u + wave, 0);
            } else {
                // Laminar parabólico puro
                u = 1.2 * (1.0 - yNorm * yNorm);
            }

            const dx = u * maxArrowLength;
            if (y === 80) ctx.moveTo(xBase + dx, y);
            else ctx.lineTo(xBase + dx, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dibujar vectores de velocidad (flechas horizontales internas)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 1.2;
        
        const arrowYPositions = [96, 112, 127.5, 143, 159];
        arrowYPositions.forEach(y => {
            const yNorm = (y - 127.5) / 47.5;
            let u = 0;
            if (isTurbulent) {
                u = 1.0 * Math.pow(1.0 - Math.min(Math.abs(yNorm), 0.999), 1/7);
            } else if (isTransition) {
                u = 1.1 * (1.0 - yNorm * yNorm);
            } else {
                u = 1.2 * (1.0 - yNorm * yNorm);
            }

            const dx = u * maxArrowLength;

            if (dx > 8) {
                // Línea del vector
                ctx.beginPath();
                ctx.moveTo(xBase, y);
                ctx.lineTo(xBase + dx, y);
                ctx.stroke();

                // Cabeza de la flecha
                ctx.beginPath();
                ctx.moveTo(xBase + dx - 5, y - 3.5);
                ctx.lineTo(xBase + dx, y);
                ctx.lineTo(xBase + dx - 5, y + 3.5);
                ctx.stroke();
            }
        });
    }

    function drawCfdHud() {
        const re = currentRe;
        const v = currentV;
        const isTurbulent = re > 4000;
        const isTransition = re > 2000 && re <= 4000;
        const isZero = re === 0 || v === 0;

        let regimeText = "LAMINAR";
        let regimeColor = "#2563eb"; // Azul para laminar
        let statusText = "ESTACIONARIO / PARABÓLICO";
        if (isZero) {
            regimeText = "SIN FLUJO";
            regimeColor = "#64748b"; // Gris
            statusText = "INACTIVO";
        } else if (isTurbulent) {
            regimeText = "TURBULENTO";
            regimeColor = "#dc2626"; // Rojo para turbulento
            statusText = "DESARROLLADO / CAÓTICO";
        } else if (isTransition) {
            regimeText = "TRANSICIÓN";
            regimeColor = "#d97706"; // Naranja
            statusText = "ONDAS TRANSITORIAS";
        }

        // Título de la simulación CFD
        ctx.fillStyle = "#475569";
        ctx.font = 'bold 9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText("SIMULACIÓN DE FLUIDOS CFD - DESARROLLO TÉRMICO Y PERFIL", 15, 25);

        // Parámetros numéricos en la parte superior derecha
        ctx.textAlign = "right";
        
        ctx.fillStyle = regimeColor;
        ctx.font = 'bold 11px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText(`RÉGIMEN: ${regimeText}`, 785, 25);
        
        ctx.fillStyle = "#475569";
        ctx.font = '10px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText(`Re = ${Math.round(re).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, 785, 40);
        ctx.fillText(`Velocidad Media V = ${v.toFixed(4).replace('.', ',')} m/s`, 785, 55);
        
        ctx.fillStyle = "#64748b";
        ctx.font = '9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText(`ESTADO: ${statusText}`, 785, 70);
        
        // --- LEYENDA DEL GRADIENTE TÉRMICO (Lado Derecho) ---
        const legendX = 745;
        const legendY = 80;
        const legendW = 12;
        const legendH = 95;
        
        // Dibujar barra de color vertical
        const grad = ctx.createLinearGradient(0, legendY, 0, legendY + legendH);
        grad.addColorStop(0.0, "rgb(37, 99, 235)"); // Frío (Cold) - Azul en la parte superior
        grad.addColorStop(0.25, getCfdColor(0.25));
        grad.addColorStop(0.5, getCfdColor(0.5));
        grad.addColorStop(0.75, getCfdColor(0.75));
        grad.addColorStop(1.0, "rgb(239, 68, 68)"); // Caliente (Hot) - Rojo en la parte inferior
        
        ctx.fillStyle = grad;
        ctx.fillRect(legendX, legendY, legendW, legendH);
        
        // Bordes de la barra de leyenda
        ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, legendW, legendH);
        
        // Etiquetas de la leyenda
        ctx.textAlign = "left";
        ctx.fillStyle = "#1e293b";
        ctx.font = 'bold 9px "JetBrains Mono", "Courier New", monospace';
        ctx.fillText("Cold (Entrada)", legendX + 18, legendY + 8);
        ctx.fillText("Hot (Paredes)", legendX + 18, legendY + legendH - 2);
        
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
