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
        const q = (parseFloat(inputs.sysQ.value.toString().replace(',', '.')) || 0) / 1000;
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
        
        const pumpA_temp = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB_temp = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC_temp = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        
        function findIntQ(a, b, c) {
            if (Math.abs(a) < 1e-9) return Math.abs(b) > 1e-9 ? -c / b : 0;
            const disc = b * b - 4 * a * c;
            if (disc < 0) return 0;
            return Math.max((-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a), 0);
        }

        const q_int_orig = findIntQ(pumpC_temp - sysK, pumpB_temp, pumpA_temp - sysHg);
        const q_zero_orig = findIntQ(pumpC_temp, pumpB_temp, pumpA_temp);
        
        let q_int_var = 0, q_zero_var = 0;
        if (alphaGlobal !== 1 && alphaGlobal > 0) {
            q_int_var = findIntQ(pumpC_temp - sysK, pumpB_temp * alphaGlobal, pumpA_temp * Math.pow(alphaGlobal, 2) - sysHg);
            q_zero_var = findIntQ(pumpC_temp, pumpB_temp * alphaGlobal, pumpA_temp * Math.pow(alphaGlobal, 2));
        }

        let q_base = (q_op > 0 ? q_op : 0.015);
        let q_max = q_base * 1.5;

        if (!isNaN(q_int_orig) && q_int_orig > 0) q_max = Math.max(q_max, q_int_orig * 1.15);
        if (!isNaN(q_zero_orig) && q_zero_orig > 0) q_max = Math.max(q_max, q_zero_orig * 1.05);
        if (!isNaN(q_int_var) && q_int_var > 0) q_max = Math.max(q_max, q_int_var * 1.15);
        if (!isNaN(q_zero_var) && q_zero_var > 0) q_max = Math.max(q_max, q_zero_var * 1.05);

        if (q_max <= 0 || isNaN(q_max)) q_max = 0.015 * 1.5;

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

        const pumpSaved = localStorage.getItem('pumpLabState');
        let pState = {};
        if (pumpSaved) {
            try { pState = JSON.parse(pumpSaved); } catch(e){}
        }
        pState['sys-hg'] = inputs.sysHg.value;
        pState['sys-k'] = inputs.sysK.value;
        pState['flow-rate'] = inputs.sysQ.value;
        pState['b1-a'] = inputs.pumpA.value;
        pState['b1-b'] = inputs.pumpB.value;
        pState['b1-c'] = inputs.pumpC.value;
        localStorage.setItem('pumpLabState', JSON.stringify(pState));
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
        
        const pumpSaved = localStorage.getItem('pumpLabState');
        if (pumpSaved) {
            try {
                const pState = JSON.parse(pumpSaved);
                if (pState['sys-hg'] !== undefined) inputs.sysHg.value = pState['sys-hg'];
                if (pState['sys-k'] !== undefined) inputs.sysK.value = pState['sys-k'];
                if (pState['flow-rate'] !== undefined) inputs.sysQ.value = pState['flow-rate'];
                if (pState['b1-a'] !== undefined) inputs.pumpA.value = pState['b1-a'];
                if (pState['b1-b'] !== undefined) inputs.pumpB.value = pState['b1-b'];
                if (pState['b1-c'] !== undefined) inputs.pumpC.value = pState['b1-c'];
            } catch (e) {}
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

