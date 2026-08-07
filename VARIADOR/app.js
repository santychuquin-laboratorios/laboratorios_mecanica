document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        sysHg: document.getElementById('sys-hg'),
        sysK: document.getElementById('sys-k'),
        sysQ: document.getElementById('sys-q'),
        pumpA: document.getElementById('pump-a'),
        pumpB: document.getElementById('pump-b'),
        pumpC: document.getElementById('pump-c')
    };

    const outputs = {
        alpha: document.getElementById('out-alpha'),
        hz: document.getElementById('out-hz'),
        slider: document.getElementById('alpha-slider')
    };

    let alphaGlobal = 1;
    const baseHz = 60;

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

        // Ecuación cuadrática para alpha: A*alpha^2 + (B*Q)*alpha + (C*Q^2 - Hr) = 0
        const a = pumpA;
        const b = pumpB * q;
        const c = (pumpC * Math.pow(q, 2)) - hr;

        if (a === 0) {
            if (b === 0) {
                alphaGlobal = 1;
                outputs.alpha.textContent = 'Error';
                outputs.hz.textContent = 'Error';
            } else {
                const alpha = -c / b;
                if (alpha > 0) {
                    alphaGlobal = alpha;
                    outputs.alpha.textContent = alpha.toFixed(4).replace('.', ',');
                    outputs.hz.textContent = (alpha * baseHz).toFixed(2).replace('.', ',');
                } else {
                    alphaGlobal = 1;
                    outputs.alpha.textContent = 'Error';
                    outputs.hz.textContent = 'Error';
                }
            }
        } else {
            const discriminante = Math.pow(b, 2) - (4 * a * c);
            if (discriminante < 0) {
                alphaGlobal = 1;
                outputs.alpha.textContent = 'Error';
                outputs.hz.textContent = 'Error';
            } else {
                const alpha1 = (-b + Math.sqrt(discriminante)) / (2 * a);
                const alpha2 = (-b - Math.sqrt(discriminante)) / (2 * a);
                
                let alphaFinal = 0;
                // Escoger la raíz positiva que tenga sentido (usualmente la mayor o la única positiva)
                if (alpha1 > 0 && alpha2 > 0) {
                    alphaFinal = Math.max(alpha1, alpha2);
                } else if (alpha1 > 0) {
                    alphaFinal = alpha1;
                } else if (alpha2 > 0) {
                    alphaFinal = alpha2;
                }

                if (alphaFinal > 0) {
                    alphaGlobal = alphaFinal;
                    outputs.alpha.textContent = alphaFinal.toFixed(4).replace('.', ',');
                    outputs.hz.textContent = (alphaFinal * baseHz).toFixed(2).replace('.', ',');
                    if (outputs.slider) {
                        outputs.slider.value = alphaFinal;
                        outputs.slider.disabled = false;
                    }
                } else {
                    alphaGlobal = 1;
                    outputs.alpha.textContent = 'Error';
                    outputs.hz.textContent = 'Error';
                    if (outputs.slider) {
                        outputs.slider.value = 1;
                        outputs.slider.disabled = true;
                    }
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
        
        // Determinar max Q para la gráfica (extender un 50% más allá de Q operativo)
        const q_max = (q_op > 0 ? q_op : 0.015) * 1.5;
        const num_points = 100;
        const q_array = [];
        for (let i = 0; i <= num_points; i++) {
            q_array.push((q_max * i) / num_points);
        }

        // Datos Curva Resistente
        let max_h = 0;
        const hr_data = q_array.map(q => {
            const h = sysHg + sysK * Math.pow(q, 2);
            if (h > max_h) max_h = h;
            return { x: q * 1000, y: h };
        });

        // Coeficientes de bomba unitaria
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        
        // Datos Bomba Original (alpha = 1)
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

        // Datos Bomba Variador (alpha global)
        const hb_var_data = [];
        if (alphaGlobal !== 1 && (pumpA !== 0 || pumpB !== 0 || pumpC !== 0)) {
            q_array.forEach(q => {
                const h = (pumpA * Math.pow(alphaGlobal, 2)) + (pumpB * alphaGlobal * q) + (pumpC * Math.pow(q, 2));
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
                label: 'Bomba Original (α=1)',
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
                label: `Bomba Ajustada (α=${alphaGlobal.toFixed(3).replace('.', ',')})`,
                data: hb_var_data,
                borderColor: '#f47b20', // Naranja
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
                    title: { display: true, text: 'Modificación de Curva por Variador de Frecuencia' }
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
            pumpC: inputs.pumpC.value
        };
        localStorage.setItem('variadorInputs', JSON.stringify(datos));
    }

    function cargarDatos() {
        const guardados = localStorage.getItem('variadorInputs');
        if (guardados) {
            try {
                const datos = JSON.parse(guardados);
                if (datos.sysHg !== undefined) inputs.sysHg.value = datos.sysHg;
                if (datos.sysK !== undefined) inputs.sysK.value = datos.sysK;
                if (datos.sysQ !== undefined) inputs.sysQ.value = datos.sysQ;
                if (datos.pumpA !== undefined) inputs.pumpA.value = datos.pumpA;
                if (datos.pumpB !== undefined) inputs.pumpB.value = datos.pumpB;
                if (datos.pumpC !== undefined) inputs.pumpC.value = datos.pumpC;
            } catch (e) {
                console.error("Error al cargar datos", e);
            }
        }
        // Graficar el estado inicial sin calcular resultados automáticamente
        actualizarGrafica();
    }

    // Escuchar cambios para guardar y actualizar (reseteando el VFD hasta presionar calcular)
    ['sysHg', 'sysK', 'sysQ', 'pumpA', 'pumpB', 'pumpC'].forEach(key => {
        inputs[key].addEventListener('input', () => {
            guardarDatos();
            // Resetear cálculo del variador al modificar datos
            alphaGlobal = 1;
            outputs.alpha.textContent = '0,0000';
            outputs.hz.textContent = '0,00';
            if (outputs.slider) {
                outputs.slider.value = 1;
                outputs.slider.disabled = true;
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
            outputs.alpha.textContent = val.toFixed(4).replace('.', ',');
            outputs.hz.textContent = (val * baseHz).toFixed(2).replace('.', ',');
            actualizarGrafica();
        });
    }

    // Cargar datos al iniciar
    cargarDatos();
});
