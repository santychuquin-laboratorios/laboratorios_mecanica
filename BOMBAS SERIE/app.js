document.addEventListener('DOMContentLoaded', () => {
    const btnCalc = document.getElementById('btn-calc');

    const inputs = {
        sysHg: document.getElementById('sys-hg'),
        sysK: document.getElementById('sys-k'),
        sysQ: document.getElementById('sys-q'),
        pumpA: document.getElementById('pump-a'),
        pumpB: document.getElementById('pump-b'),
        pumpC: document.getElementById('pump-c'),
        varA: document.getElementById('var-a'),
        varB: document.getElementById('var-b'),
        varC: document.getElementById('var-c'),
    };

    const outputs = {
        n: document.getElementById('out-n'),
        alpha: document.getElementById('out-alpha')
    };

    const inputNManual = document.getElementById('input-n-manual');
    const btnCalcVar = document.getElementById('btn-calc-var');

    function getHrAndQ() {
        const sysHg = parseFloat(inputs.sysHg.value.toString().replace(',', '.')) || 0;
        const sysK = parseFloat(inputs.sysK.value.toString().replace(',', '.')) || 0;
        const q = parseFloat(inputs.sysQ.value.toString().replace(',', '.')) || 0;
        const hr = sysHg + (sysK * Math.pow(q, 2));
        return { hr, q };
    }

    function getHbUnitaria(q) {
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        return pumpA + (pumpB * q) + (pumpC * Math.pow(q, 2));
    }

    function calcularSerie() {
        const { hr, q } = getHrAndQ();

        if (q <= 0) {
            alert('Por favor ingrese un valor válido para Q de funcionamiento.');
            return;
        }

        const hb = getHbUnitaria(q);

        if (hb <= 0) {
            alert('La bomba unitaria no proporciona altura positiva para este caudal.');
            outputs.n.textContent = 'Error';
            return;
        }

        const n = hr / hb;
        
        outputs.n.textContent = n.toFixed(3).replace('.', ',');
        
        // Actualizar el valor manual si es necesario
        actualizarHbManual();
    }

    function actualizarHbManual() {
        const { q } = getHrAndQ();
        const hb = getHbUnitaria(q);
        const n_manual = parseFloat(inputNManual.value.toString().replace(',', '.')) || 0;
        
        if (n_manual > 0 && hb > 0) {
            // outputs.hbN.textContent = (hb * n_manual).toFixed(2).replace('.', ',');
        } else {
            // outputs.hbN.textContent = '0,00';
        }

        // Auto-llenar Arreglo 2: A, B, C = (A, B, C de Arreglo 1) * n_manual
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        
        if (n_manual > 0) {
            inputs.varA.value = pumpA * n_manual;
            inputs.varB.value = (pumpB * n_manual);
            inputs.varC.value = (pumpC * n_manual);
        }
        
        if (typeof actualizarGrafica === 'function') {
            actualizarGrafica();
        }
    }

    // Escuchar cambios para recalcular el auto-llenado
    ['pumpA', 'pumpB', 'pumpC'].forEach(key => {
        inputs[key].addEventListener('input', () => {
            actualizarHbManual();
        });
    });

    inputNManual.addEventListener('input', () => {
        actualizarHbManual();
        guardarDatos();
    });

    function calcularVariador() {
        const { hr, q } = getHrAndQ();
        
        const A = parseFloat(inputs.varA.value.toString().replace(',', '.')) || 0;
        const B = parseFloat(inputs.varB.value.toString().replace(',', '.')) || 0;
        const C = parseFloat(inputs.varC.value.toString().replace(',', '.')) || 0;

        if (q <= 0) {
            alert('Por favor ingrese un valor válido para Q de funcionamiento.');
            return;
        }

        // Ecuación cuadrática: A*alpha^2 + (B*Q)*alpha + (C*Q^2 - Hr) = 0
        const a = A;
        const b = B * q;
        const c = (C * Math.pow(q, 2)) - hr;

        if (a === 0) {
            if (b !== 0) {
                const alpha = -c / b;
                outputs.alpha.textContent = alpha.toFixed(4).replace('.', ',');
            } else {
                outputs.alpha.textContent = 'Error';
            }
            return;
        }

        const discriminante = Math.pow(b, 2) - (4 * a * c);

        if (discriminante < 0) {
            alert('No hay solución real para la frecuencia (la bomba no alcanza el punto).');
            outputs.alpha.textContent = 'Error';
            return;
        }

        const alpha1 = (-b + Math.sqrt(discriminante)) / (2 * a);
        const alpha2 = (-b - Math.sqrt(discriminante)) / (2 * a);
        
        let alphaFinal = 0;
        if (alpha1 > 0 && alpha2 > 0) {
            alphaFinal = Math.max(alpha1, alpha2);
        } else if (alpha1 > 0) {
            alphaFinal = alpha1;
        } else if (alpha2 > 0) {
            alphaFinal = alpha2;
        } else {
            outputs.alpha.textContent = 'Error';
            return;
        }

        outputs.alpha.textContent = alphaFinal.toFixed(4).replace('.', ',');
        actualizarGrafica();
    }

    let myChart = null;

    function actualizarGrafica() {
        const canvas = document.getElementById('grafica-bombas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const { q: q_op } = getHrAndQ();
        
        const sysHg_temp = parseFloat(inputs.sysHg.value.toString().replace(',', '.')) || 0;
        const sysK_temp = parseFloat(inputs.sysK.value.toString().replace(',', '.')) || 0;
        const n_manual_temp = parseFloat(inputNManual.value.toString().replace(',', '.')) || 1;
        const pumpA_temp = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB_temp = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC_temp = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        const varA_temp = parseFloat(inputs.varA.value.toString().replace(',', '.')) || 0;
        const varB_temp = parseFloat(inputs.varB.value.toString().replace(',', '.')) || 0;
        const varC_temp = parseFloat(inputs.varC.value.toString().replace(',', '.')) || 0;
        
        let alpha_temp = 1;
        const alphaText_temp = outputs.alpha.textContent.replace(',', '.');
        if (!isNaN(parseFloat(alphaText_temp))) alpha_temp = parseFloat(alphaText_temp);

        function findIntQ(a, b, c) {
            if (Math.abs(a) < 1e-9) return Math.abs(b) > 1e-9 ? -c / b : 0;
            const disc = b * b - 4 * a * c;
            if (disc < 0) return 0;
            return Math.max((-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a), 0);
        }
        
        const q_int1 = findIntQ(n_manual_temp * pumpC_temp - sysK_temp, n_manual_temp * pumpB_temp, n_manual_temp * pumpA_temp - sysHg_temp);
        const q_int2 = findIntQ(varC_temp - sysK_temp, varB_temp * alpha_temp, varA_temp * Math.pow(alpha_temp, 2) - sysHg_temp);

        const q_zero1 = findIntQ(n_manual_temp * pumpC_temp, n_manual_temp * pumpB_temp, n_manual_temp * pumpA_temp);
        const q_zero2 = findIntQ(varC_temp, varB_temp * alpha_temp, varA_temp * Math.pow(alpha_temp, 2));

        let q_base = (q_op > 0 ? q_op : 0.015);
        
        let q_max = q_base * 1.5;
        if (!isNaN(q_int1) && q_int1 > 0) q_max = Math.max(q_max, q_int1 * 1.15);
        if (!isNaN(q_int2) && q_int2 > 0) q_max = Math.max(q_max, q_int2 * 1.15);
        if (!isNaN(q_zero1) && q_zero1 > 0) q_max = Math.max(q_max, q_zero1 * 1.05);
        if (!isNaN(q_zero2) && q_zero2 > 0) q_max = Math.max(q_max, q_zero2 * 1.05);
        
        if (q_max <= 0 || isNaN(q_max)) q_max = 0.015 * 1.5;

        const num_points = 50;
        const q_array = [];
        for (let i = 0; i <= num_points; i++) {
            q_array.push((q_max * i) / num_points);
        }

        // Datos Curva Resistente
        const sysHg = parseFloat(inputs.sysHg.value.toString().replace(',', '.')) || 0;
        const sysK = parseFloat(inputs.sysK.value.toString().replace(',', '.')) || 0;
        
        let max_h = 0;

        const hr_data = q_array.map(q => {
            const h = sysHg + sysK * Math.pow(q, 2);
            if (h > max_h) max_h = h;
            return { x: q * 1000, y: h };
        });

        // Datos Curva Serie (Arreglo 1)
        const n_manual = parseFloat(inputNManual.value.toString().replace(',', '.')) || 1;
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        
        const hb_serie_data = [];
        q_array.forEach(q => {
            const h = n_manual * (pumpA + (pumpB * q) + (pumpC * Math.pow(q, 2)));
            if (h >= 0) {
                hb_serie_data.push({ x: q * 1000, y: h });
                if (h > max_h) max_h = h;
            }
        });

        // Datos Curva Variador (Arreglo 2)
        const varA = parseFloat(inputs.varA.value.toString().replace(',', '.')) || 0;
        const varB = parseFloat(inputs.varB.value.toString().replace(',', '.')) || 0;
        const varC = parseFloat(inputs.varC.value.toString().replace(',', '.')) || 0;
        
        let alpha = 1;
        const alphaText = outputs.alpha.textContent.replace(',', '.');
        if (!isNaN(parseFloat(alphaText))) {
            alpha = parseFloat(alphaText);
        }

        const hb_var_data = [];
        q_array.forEach(q => {
            const h = (varA * Math.pow(alpha, 2)) + (varB * alpha * q) + (varC * Math.pow(q, 2));
            if (h >= 0) {
                hb_var_data.push({ x: q * 1000, y: h });
                if (h > max_h) max_h = h;
            }
        });

        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Curva Resistente',
                        data: hr_data,
                        borderColor: '#246bfd', // Blue
                        backgroundColor: 'rgba(36, 107, 253, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: `Bomba en Serie (n=${n_manual})`,
                        data: hb_serie_data,
                        borderColor: '#18a87b', // Green
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: `Bomba con Variador (α=${alpha.toFixed(3).replace('.', ',')})`,
                        data: hb_var_data,
                        borderColor: '#ff6347', // Tomate
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Q Funcionamiento',
                        data: [{ x: q_op * 1000, y: 0 }, { x: q_op * 1000, y: max_h }],
                        borderColor: 'red',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Curvas Características del Sistema y las Bombas' }
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function resetear() {
        Object.values(inputs).forEach(input => input.value = '');
        inputNManual.value = '1';
        outputs.n.textContent = '0,000';
        outputs.alpha.textContent = '0,0000';
        localStorage.removeItem('bombasSerieInputs');
        actualizarHbManual();
    }

    function guardarDatos() {
        const datos = {
            sysHg: inputs.sysHg.value,
            sysK: inputs.sysK.value,
            sysQ: inputs.sysQ.value,
            pumpA: inputs.pumpA.value,
            pumpB: inputs.pumpB.value,
            pumpC: inputs.pumpC.value,
            nManual: inputNManual.value
        };
        localStorage.setItem('bombasSerieInputs', JSON.stringify(datos));

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
        const guardados = localStorage.getItem('bombasSerieInputs');
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
        
        // Auto-llenar al inicio basado en los datos cargados o por defecto
        actualizarHbManual();
    }

    // Escuchar cambios para guardar automáticamente
    ['sysHg', 'sysK', 'sysQ', 'pumpA', 'pumpB', 'pumpC'].forEach(key => {
        inputs[key].addEventListener('input', guardarDatos);
    });

    btnCalc.addEventListener('click', calcularSerie);
    btnCalcVar.addEventListener('click', calcularVariador);

    // Cargar datos al iniciar
    cargarDatos();
});
