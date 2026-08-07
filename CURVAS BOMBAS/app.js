document.addEventListener("DOMContentLoaded", () => {
    // --- Guardado Automático ---
    function saveState() {
        const state = {};
        document.querySelectorAll("input").forEach(input => {
            if (input.id) state[input.id] = input.value;
        });
        localStorage.setItem('pumpLabState', JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem('pumpLabState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                document.querySelectorAll("input").forEach(input => {
                    if (input.id && state[input.id] !== undefined) {
                        input.value = state[input.id];
                    }
                });
            } catch (e) { console.error("Error cargando estado:", e); }
        }
    }

    // Cargar los valores guardados antes de hacer nada más
    loadState();

    function getBombas() {
        return [
            { name: "Bomba 1", a: parseFloat(document.getElementById("b1-a").value.toString().replace(',', '.')) || 0, b: parseFloat(document.getElementById("b1-b").value.toString().replace(',', '.')) || 0, c: parseFloat(document.getElementById("b1-c").value.toString().replace(',', '.')) || 0, color: "#e53e3e" },
            { name: "Bomba 2", a: parseFloat(document.getElementById("b2-a").value.toString().replace(',', '.')) || 0, b: parseFloat(document.getElementById("b2-b").value.toString().replace(',', '.')) || 0, c: parseFloat(document.getElementById("b2-c").value.toString().replace(',', '.')) || 0, color: "#dd6b20" },
            { name: "Bomba 3", a: parseFloat(document.getElementById("b3-a").value.toString().replace(',', '.')) || 0, b: parseFloat(document.getElementById("b3-b").value.toString().replace(',', '.')) || 0, c: parseFloat(document.getElementById("b3-c").value.toString().replace(',', '.')) || 0, color: "#38a169" },
            { name: "Bomba 4", a: parseFloat(document.getElementById("b4-a").value.toString().replace(',', '.')) || 0, b: parseFloat(document.getElementById("b4-b").value.toString().replace(',', '.')) || 0, c: parseFloat(document.getElementById("b4-c").value.toString().replace(',', '.')) || 0, color: "#3182ce" },
            { name: "Bomba 5", a: parseFloat(document.getElementById("b5-a").value.toString().replace(',', '.')) || 0, b: parseFloat(document.getElementById("b5-b").value.toString().replace(',', '.')) || 0, c: parseFloat(document.getElementById("b5-c").value.toString().replace(',', '.')) || 0, color: "#805ad5" }
        ];
    }

    const maxQ = 50;
    const stepQ = 1;
    let labels = [];
    for(let q = 0; q <= maxQ; q += stepQ) {
        labels.push(q);
    }

    const ctx = document.getElementById("pumpChart").getContext("2d");
    let chart;

    // Plugin personalizado para dibujar letreros hermosos directamente en las líneas
    const drawLabelsPlugin = {
        id: 'drawLabels',
        afterDraw(chart) {
            const ctx = chart.ctx;
            ctx.save();
            
            chart.data.datasets.forEach((dataset, i) => {
                if (dataset.label === "Caudal Seleccionado") return;
                
                const meta = chart.getDatasetMeta(i);
                if (!meta || !meta.data || meta.data.length === 0) return;
                
                // Si la bomba está en cero, no dibujar letrero
                if (dataset.label.startsWith("Bomba") && dataset.data[0] <= 0) return;
                
                let index = 5; // Dibujar el letrero cerca del inicio
                if (dataset.label === "Curva Resistente") {
                    index = Math.floor(meta.data.length * 0.7); // Dibujarlo hacia el final para la curva resistente
                }
                
                if (index >= meta.data.length) index = meta.data.length - 1;
                
                const point = meta.data[index];
                
                if (point && !point.skip) {
                    const text = dataset.label;
                    ctx.font = 'bold 12px "Inter", sans-serif';
                    const textWidth = ctx.measureText(text).width;
                    
                    const x = point.x + 8;
                    const y = point.y - 12;
                    
                    // Fondo tipo píldora
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x - 5, y - 12, textWidth + 10, 18, 5);
                    } else {
                        ctx.rect(x - 5, y - 12, textWidth + 10, 18);
                    }
                    ctx.fill();
                    
                    // Borde del color de la línea
                    ctx.strokeStyle = dataset.borderColor;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    // Texto
                    ctx.fillStyle = dataset.borderColor;
                    ctx.fillText(text, x, y + 1);
                }
            });
            
            ctx.restore();
        }
    };

    function generateCurve(a, b, c) {
        return labels.map(q => {
            let q_m3 = q / 1000;
            let h = a + b * q_m3 + c * Math.pow(q_m3, 2);
            return h > 0 ? h : null; // No graficar valores negativos de altura
        });
    }

    function generateResistantCurve(Hg, K) {
        return labels.map(q => {
            // El caudal 'q' está en L/s, lo dividimos por 1000 para pasarlo a m³/s
            let q_m3 = q / 1000;
            return Hg + K * Math.pow(q_m3, 2);
        });
    }



    function drawChart() {
        // Leer inputs
        const Q_op = parseFloat(document.getElementById("flow-rate").value.toString().replace(',', '.'));
        // Obtener bombas
        const bombas = getBombas();

        // Leer datos de la curva resistente
        const Hg = parseFloat(document.getElementById("sys-hg").value.toString().replace(',', '.')) || 0;
        const K = parseFloat(document.getElementById("sys-k").value.toString().replace(',', '.')) || 0;

        // 1. Eje Y: De la bomba que tenga más altura, aumenta un intervalo (asumimos intervalo de 10)
        let maxPumpH = 0;
        bombas.forEach(b => {
            if (b.a > maxPumpH) maxPumpH = b.a;
        });
        let maxY = Math.ceil(maxPumpH / 10) * 10 + 10;
        if (maxY < 20) maxY = 20;

        // 2. Eje X: Encontrar la intersección (corte) más lejana entre las bombas y la curva resistente
        let maxIntersectQ = 0;
        bombas.forEach(b => {
            // Ecuación cuadrática: (C - K)*x^2 + B*x + (A - Hg) = 0
            let a_eq = b.c - K;
            let b_eq = b.b;
            let c_eq = b.a - Hg;
            
            let delta = b_eq*b_eq - 4*a_eq*c_eq;
            if (delta >= 0 && a_eq !== 0) {
                let x1 = (-b_eq + Math.sqrt(delta)) / (2*a_eq);
                let x2 = (-b_eq - Math.sqrt(delta)) / (2*a_eq);
                let x = Math.max(x1, x2);
                if (x > 0) {
                    let q_intersect = x * 1000;
                    if (q_intersect > maxIntersectQ) maxIntersectQ = q_intersect;
                }
            } else if (a_eq === 0 && b_eq !== 0) {
                 let x = -c_eq / b_eq;
                 if (x > 0 && x * 1000 > maxIntersectQ) maxIntersectQ = x * 1000;
            }
        });
        
        // Eje X: Darle dos intervalos más (asumimos intervalo de 5 L/s)
        let maxX = Math.ceil(maxIntersectQ / 5) * 5 + 10;
        
        // Asegurarnos de que el Caudal Seleccionado (Q_op) no quede cortado
        if (Q_op > maxX - 5) {
            maxX = Math.ceil(Q_op / 5) * 5 + 5;
        }
        if (maxX < 15) maxX = 15;

        // Ajuste especial: si las bombas se limpian a 0, basar el eje Y en la Curva Resistente para no perderla de vista
        if (maxPumpH === 0) {
            let maxResistantH = Hg + K * Math.pow(maxX / 1000, 2);
            maxY = Math.ceil(maxResistantH / 10) * 10 + 10;
        }

        // 3. Regenerar etiquetas X dinámicamente según el nuevo límite
        labels = [];
        for(let q = 0; q <= maxX; q += stepQ) {
            labels.push(q);
        }

        // 4. Preparar datasets ahora que labels está generado hasta maxX
        const datasets = bombas.map(bomba => ({
            label: bomba.name,
            data: generateCurve(bomba.a, bomba.b, bomba.c),
            borderColor: bomba.color,
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4
        }));

        datasets.push({
            label: "Curva Resistente",
            data: generateResistantCurve(Hg, K),
            borderColor: "#000000",
            backgroundColor: "transparent",
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0.4
        });

        // Línea vertical del caudal de funcionamiento (punteada)
        datasets.push({
            label: "Caudal Seleccionado",
            data: [{x: Q_op, y: 0}, {x: Q_op, y: maxY}],
            borderColor: "#a0aec0", // Gris para que se note como guía
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0,
            showLine: true
        });
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            plugins: [drawLabelsPlugin],
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            boxHeight: 4,
                            boxWidth: 30
                        }
                    },
                    title: {
                        display: true,
                        text: 'Curvas Características y Resistente',
                        font: { size: 18 }
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Caudal Q (L/s)',
                            font: { size: 14, weight: 'bold' }
                        },
                        min: 0,
                        max: Math.ceil(maxX)
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Altura H (m)',
                            font: { size: 14, weight: 'bold' }
                        },
                        min: 0,
                        max: maxY
                    }
                }
            }
        });
    }

    // Inicializar gráfica
    drawChart();

    // Eventos
    const inputsToWatch = [
        document.getElementById("flow-rate"),
        document.getElementById("sys-hg"),
        document.getElementById("sys-k"),
        document.getElementById("studentName")
    ];
    
    inputsToWatch.forEach(input => {
        if (input) {
            input.addEventListener("input", () => {
                drawChart();
                saveState();
            });
        }
    });
    
    // Eventos para todos los inputs de las bombas
    document.querySelectorAll(".pump-inputs-container input").forEach(input => {
        input.addEventListener("input", () => {
            drawChart();
            saveState();
        });
    });

    // --- Lógica de Limpiar Bombas ---
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.querySelectorAll(".pump-inputs-container input").forEach(input => {
                if (input.id.endsWith('-c')) {
                    input.value = "-0";
                } else {
                    input.value = "0";
                }
            });
            drawChart();
            saveState();
        });
    }
});
