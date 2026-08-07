document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        sysHg: document.getElementById('sys-hg'),
        sysK: document.getElementById('sys-k'),
        sysQ: document.getElementById('sys-q'),
        pumpA: document.getElementById('pump-a'),
        pumpB: document.getElementById('pump-b'),
        pumpC: document.getElementById('pump-c'),
        diametro: document.getElementById('input-diametro')
    };

    const outputs = {
        alpha: document.getElementById('out-alpha'),
        hz: document.getElementById('out-hz'),
        slider: document.getElementById('alpha-slider'),
        trimContainer: document.getElementById('trim-percent-container'),
        outPercent: document.getElementById('out-percent')
    };

    let alphaGlobal = 1;

    function getHrAndQ() {
        const sysHg = parseFloat(inputs.sysHg.value.toString().replace(',', '.')) || 0;
        const sysK = parseFloat(inputs.sysK.value.toString().replace(',', '.')) || 0;
        const q = parseFloat(inputs.sysQ.value.toString().replace(',', '.')) || 0;
        const hr = sysHg + (sysK * Math.pow(q, 2));
        return { hr, q, sysHg, sysK };
    }

    function calcularVariador() {
        const { hr, q } = getHrAndQ();
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        const dOriginal = parseFloat(inputs.diametro.value.toString().replace(',', '.')) || 0;

        if (q <= 0) {
            outputs.alpha.textContent = '0,0000';
            outputs.hz.textContent = '0,00';
            if (outputs.slider) {
                outputs.slider.value = 1;
                outputs.slider.disabled = true;
            }
            alphaGlobal = 1;
            actualizarGrafica();
            return;
        }

        // Nueva Ecuación para Recorte: H = A*lambda^2 + B*Q + C*(Q^2 / lambda^2)
        // Igualando a Hr: A*lambda^2 + B*Q + C*(Q^2 / lambda^2) = Hr
        // Sea x = lambda^2: A*x^2 + (B*Q - Hr)*x + C*Q^2 = 0
        const a = pumpA;
        const b = (pumpB * q) - hr;
        const c = pumpC * Math.pow(q, 2);

        function setOutputs(val) {
            if (val > 0) {
                alphaGlobal = val;
                outputs.alpha.textContent = val.toFixed(4).replace('.', ',');
                outputs.hz.textContent = (val * dOriginal).toFixed(2).replace('.', ',');
                if (outputs.slider) {
                    outputs.slider.value = val;
                    outputs.slider.disabled = false;
                }
                if (outputs.trimContainer && outputs.outPercent) {
                    outputs.trimContainer.style.display = 'block';
                    const pct = (1 - val) * 100;
                    outputs.outPercent.textContent = pct.toFixed(2).replace('.', ',');
                }
            } else {
                alphaGlobal = 1;
                outputs.alpha.textContent = 'Error';
                outputs.hz.textContent = 'Error';
                if (outputs.slider) {
                    outputs.slider.value = 1;
                    outputs.slider.disabled = true;
                }
                if (outputs.trimContainer) {
                    outputs.trimContainer.style.display = 'none';
                }
            }
        }

        if (a === 0) {
            if (b === 0) {
                setOutputs(-1);
            } else {
                const alpha = -c / b;
                setOutputs(alpha);
            }
        } else {
            const discriminante = Math.pow(b, 2) - (4 * a * c);
            if (discriminante < 0) {
                setOutputs(-1);
            } else {
                const x1 = (-b + Math.sqrt(discriminante)) / (2 * a);
                const x2 = (-b - Math.sqrt(discriminante)) / (2 * a);
                
                let xFinal = 0;
                if (x1 > 0 && x2 > 0) {
                    xFinal = Math.max(x1, x2);
                } else if (x1 > 0) {
                    xFinal = x1;
                } else if (x2 > 0) {
                    xFinal = x2;
                }

                if (xFinal > 0) {
                    setOutputs(Math.sqrt(xFinal));
                } else {
                    setOutputs(-1);
                }
            }
        }
        
        actualizarGrafica();
    }

    let myChart = null;

    function actualizarGrafica() {
        const canvas = document.getElementById('grafica-bombas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const { q: q_op, sysHg, sysK } = getHrAndQ();
        
        const q_max = (q_op > 0 ? q_op : 0.015) * 1.5;
        const num_points = 100;
        const q_array = [];
        for (let i = 0; i <= num_points; i++) {
            q_array.push((q_max * i) / num_points);
        }

        let max_h = 0;
        const hr_data = q_array.map(q => {
            const h = sysHg + sysK * Math.pow(q, 2);
            if (h > max_h) max_h = h;
            return { x: q * 1000, y: h };
        });

        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        
        const hb_original_data = [];
        if (pumpA !== 0 || pumpB !== 0 || pumpC !== 0) {
            q_array.forEach(q => {
                const h = pumpA + (pumpB * q) + (pumpC * Math.pow(q, 2));
                if (h >= 0) {
                    hb_original_data.push({ x: q * 1000, y: h });
                    if (h > max_h) max_h = h;
                }
            });
        }

        const hb_var_data = [];
        if (alphaGlobal !== 1 && alphaGlobal > 0 && (pumpA !== 0 || pumpB !== 0 || pumpC !== 0)) {
            q_array.forEach(q => {
                // H = A*lambda^2 + B*Q + C*(Q^2 / lambda^2)
                const h = (pumpA * Math.pow(alphaGlobal, 2)) + (pumpB * q) + (pumpC * Math.pow(q, 2) / Math.pow(alphaGlobal, 2));
                if (h >= 0) {
                    hb_var_data.push({ x: q * 1000, y: h });
                    if (h > max_h) max_h = h;
                }
            });
        }

        if (myChart) {
            myChart.destroy();
        }

        const datasets = [
            {
                label: 'Curva Resistente',
                data: hr_data,
                borderColor: '#246bfd', // Azul
                backgroundColor: 'rgba(36, 107, 253, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            },
            {
                label: 'Q Funcionamiento',
                data: [{ x: q_op * 1000, y: 0 }, { x: q_op * 1000, y: max_h * 2 }],
                borderColor: 'red',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }
        ];

        if (hb_original_data.length > 0) {
            datasets.push({
                label: 'Bomba Original (λ=1)',
                data: hb_original_data,
                borderColor: '#18a87b', // Verde
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4
            });
        }

        if (hb_var_data.length > 0) {
            datasets.push({
                label: `Bomba Recortada (λ=${alphaGlobal.toFixed(3).replace('.', ',')})`,
                data: hb_var_data,
                borderColor: '#8b5cf6', // Violeta
                borderWidth: 2.5,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            });
        }

        myChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                aspectRatio: 1.5,
                plugins: {
                    title: { display: true, text: 'Modificación de Curva por Recorte de Rodete' }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Caudal Q (l/s)' },
                        min: 0,
                        max: q_max * 1000,
                        ticks: {
                            callback: function(val) {
                                return val.toFixed(1).replace('.', ',');
                            }
                        }
                    },
                    y: {
                        title: { display: true, text: 'Altura H (m)' },
                        beginAtZero: true,
                        max: Math.ceil(max_h * 1.1)
                    }
                }
            }
        });
    }

    function guardarDatos() {
        const datos = {
            sysHg: inputs.sysHg.value,
            sysK: inputs.sysK.value,
            sysQ: inputs.sysQ.value,
            pumpA: inputs.pumpA.value,
            pumpB: inputs.pumpB.value,
            pumpC: inputs.pumpC.value,
            diametro: inputs.diametro.value
        };
        localStorage.setItem('rodeteInputs', JSON.stringify(datos));
    }

    function cargarDatos() {
        const guardados = localStorage.getItem('rodeteInputs');
        if (guardados) {
            try {
                const datos = JSON.parse(guardados);
                if (datos.sysHg !== undefined) inputs.sysHg.value = datos.sysHg;
                if (datos.sysK !== undefined) inputs.sysK.value = datos.sysK;
                if (datos.sysQ !== undefined) inputs.sysQ.value = datos.sysQ;
                if (datos.pumpA !== undefined) inputs.pumpA.value = datos.pumpA;
                if (datos.pumpB !== undefined) inputs.pumpB.value = datos.pumpB;
                if (datos.pumpC !== undefined) inputs.pumpC.value = datos.pumpC;
                if (datos.diametro !== undefined) inputs.diametro.value = datos.diametro;
            } catch (e) {
                console.error("Error al cargar datos", e);
            }
        }
        actualizarGrafica();
    }

    // Escuchar cambios para guardar y resetear estado
    ['sysHg', 'sysK', 'sysQ', 'pumpA', 'pumpB', 'pumpC', 'diametro'].forEach(key => {
        inputs[key].addEventListener('input', () => {
            guardarDatos();
            alphaGlobal = 1;
            outputs.alpha.textContent = '0,0000';
            outputs.hz.textContent = '0,00';
            if (outputs.slider) {
                outputs.slider.value = 1;
                outputs.slider.disabled = true;
            }
            if (outputs.trimContainer) {
                outputs.trimContainer.style.display = 'none';
            }
            actualizarGrafica(); 
        });
    });

    const btnCalc = document.getElementById('btn-calc');
    if (btnCalc) {
        btnCalc.addEventListener('click', calcularVariador);
    }

    if (outputs.slider) {
        outputs.slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value.toString().replace(',', '.'));
            alphaGlobal = val;
            const dOriginal = parseFloat(inputs.diametro.value.toString().replace(',', '.')) || 0;
            outputs.alpha.textContent = val.toFixed(4).replace('.', ',');
            outputs.hz.textContent = (val * dOriginal).toFixed(2).replace('.', ',');
            if (outputs.trimContainer && outputs.outPercent) {
                outputs.trimContainer.style.display = 'block';
                const pct = (1 - val) * 100;
                outputs.outPercent.textContent = pct.toFixed(2).replace('.', ',');
            }
            actualizarGrafica();
        });
    }

    cargarDatos();
});
