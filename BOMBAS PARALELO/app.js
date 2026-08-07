document.addEventListener('DOMContentLoaded', () => {
    const btnCalc = document.getElementById('btn-calc');

    const inputs = {
        sysHg: document.getElementById('sys-hg'),
        sysK: document.getElementById('sys-k'),
        sysQ: document.getElementById('sys-q'),
        pumpA: document.getElementById('pump-a'),
        pumpB: document.getElementById('pump-b'),
        pumpC: document.getElementById('pump-c')
    };

    const outputs = {
        n: document.getElementById('out-n'),
        nuevoQ: document.getElementById('out-nuevo-q'),
        nuevoH: document.getElementById('out-nuevo-h')
    };

    const inputNManual = document.getElementById('input-n-manual');
    const btnCalcNuevoQ = document.getElementById('btn-calc-var'); // El ID en HTML sigue siendo btn-calc-var

    // Inicializar valores de resultados
    let qOperacionNuevo = 0;
    let hOperacionNuevo = 0;

    function getHrAndQ() {
        const sysHg = parseFloat(inputs.sysHg.value.toString().replace(',', '.')) || 0;
        const sysK = parseFloat(inputs.sysK.value.toString().replace(',', '.')) || 0;
        const q = (parseFloat(inputs.sysQ.value.toString().replace(',', '.')) || 0) / 1000;
        const hr = sysHg + (sysK * Math.pow(q, 2));
        return { hr, q, sysHg, sysK };
    }

    function calcularParalelo() {
        const { hr, q } = getHrAndQ();
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;

        if (q <= 0) {
            alert('Por favor ingrese un valor válido para Q de funcionamiento.');
            return;
        }

        // Ecuación para encontrar x = 1/n
        // (C * Q^2)x^2 + (B * Q)x + (A - Hr) = 0
        const a = pumpC * Math.pow(q, 2);
        const b = pumpB * q;
        const c = pumpA - hr;

        if (a === 0) {
            // Ecuación lineal: bx + c = 0 -> x = -c/b
            if (b === 0) {
                outputs.n.textContent = 'Error';
                return;
            }
            const x = -c / b;
            if (x > 0) {
                outputs.n.textContent = (1 / x).toFixed(3).replace('.', ',');
            } else {
                outputs.n.textContent = 'Error';
            }
        } else {
            const discriminante = Math.pow(b, 2) - (4 * a * c);
            if (discriminante < 0) {
                alert('No hay solución real para las bombas en paralelo para este punto.');
                outputs.n.textContent = 'Error';
                return;
            }

            const x1 = (-b + Math.sqrt(discriminante)) / (2 * a);
            const x2 = (-b - Math.sqrt(discriminante)) / (2 * a);
            
            let xFinal = 0;
            if (x1 > 0 && x2 > 0) {
                // Tomar el x que requiera menos bombas (mayor x, ya que n = 1/x)
                xFinal = Math.max(x1, x2);
            } else if (x1 > 0) {
                xFinal = x1;
            } else if (x2 > 0) {
                xFinal = x2;
            } else {
                outputs.n.textContent = 'Error';
                return;
            }

            const n = 1 / xFinal;
            outputs.n.textContent = n.toFixed(3).replace('.', ',');
        }
        
        actualizarHbManual();
    }

    function calcularNuevoQ() {
        const { sysHg, sysK } = getHrAndQ();
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        const nManual = parseFloat(inputNManual.value.toString().replace(',', '.')) || 1;

        if (nManual <= 0) {
            alert('El número de bombas debe ser mayor a 0');
            return;
        }

        // Igualar curva resistente con curva paralelo
        // (C/n^2 - K)Q^2 + (B/n)Q + (A - Hg) = 0
        const a = (pumpC / Math.pow(nManual, 2)) - sysK;
        const b = pumpB / nManual;
        const c = pumpA - sysHg;

        if (a === 0) {
            if (b === 0) {
                qOperacionNuevo = 0;
                hOperacionNuevo = 0;
                outputs.nuevoQ.textContent = 'Error';
                outputs.nuevoH.textContent = 'Error';
                return;
            }
            qOperacionNuevo = -c / b;
        } else {
            const discriminante = Math.pow(b, 2) - (4 * a * c);
            if (discriminante < 0) {
                alert('Las curvas no se intersectan en valores reales.');
                qOperacionNuevo = 0;
                hOperacionNuevo = 0;
                outputs.nuevoQ.textContent = 'Error';
                outputs.nuevoH.textContent = 'Error';
                return;
            }

            const q1 = (-b + Math.sqrt(discriminante)) / (2 * a);
            const q2 = (-b - Math.sqrt(discriminante)) / (2 * a);
            
            if (q1 > 0 && q2 > 0) {
                qOperacionNuevo = Math.max(q1, q2); // Tomamos el caudal mayor como punto operativo principal
            } else if (q1 > 0) {
                qOperacionNuevo = q1;
            } else if (q2 > 0) {
                qOperacionNuevo = q2;
            } else {
                qOperacionNuevo = 0;
            }
        }

        if (qOperacionNuevo > 0) {
            hOperacionNuevo = sysHg + (sysK * Math.pow(qOperacionNuevo, 2));
            outputs.nuevoQ.textContent = (qOperacionNuevo * 1000).toFixed(4).replace('.', ','); // en l/s
            outputs.nuevoH.textContent = hOperacionNuevo.toFixed(2).replace('.', ',');
        } else {
            outputs.nuevoQ.textContent = 'Error';
            outputs.nuevoH.textContent = 'Error';
        }

        actualizarGrafica();
    }

    function actualizarHbManual() {
        if (typeof actualizarGrafica === 'function') {
            actualizarGrafica();
        }
    }

    let myChart = null;

    function actualizarGrafica() {
        const canvas = document.getElementById('grafica-bombas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const { q: q_op_original, sysHg, sysK } = getHrAndQ();
        
        const pumpA_temp = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB_temp = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC_temp = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        const n_manual_temp = parseFloat(inputNManual.value.toString().replace(',', '.')) || 1;

        function findIntQ(a, b, c) {
            if (Math.abs(a) < 1e-9) return Math.abs(b) > 1e-9 ? -c / b : 0;
            const disc = b * b - 4 * a * c;
            if (disc < 0) return 0;
            return Math.max((-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a), 0);
        }

        const q_int_unitaria = findIntQ(pumpC_temp - sysK, pumpB_temp, pumpA_temp - sysHg);
        const q_int_paralelo = findIntQ(pumpC_temp / Math.pow(n_manual_temp, 2) - sysK, pumpB_temp / n_manual_temp, pumpA_temp - sysHg);
        const q_zero_unitaria = findIntQ(pumpC_temp, pumpB_temp, pumpA_temp);
        const q_zero_paralelo = findIntQ(pumpC_temp / Math.pow(n_manual_temp, 2), pumpB_temp / n_manual_temp, pumpA_temp);

        let q_max_ref = Math.max(qOperacionNuevo, q_op_original, 0.015);
        let q_max = q_max_ref * 1.5;

        if (!isNaN(q_int_unitaria) && q_int_unitaria > 0) q_max = Math.max(q_max, q_int_unitaria * 1.15);
        if (!isNaN(q_int_paralelo) && q_int_paralelo > 0) q_max = Math.max(q_max, q_int_paralelo * 1.15);
        if (!isNaN(q_zero_unitaria) && q_zero_unitaria > 0) q_max = Math.max(q_max, q_zero_unitaria * 1.05);
        if (!isNaN(q_zero_paralelo) && q_zero_paralelo > 0) q_max = Math.max(q_max, q_zero_paralelo * 1.05);

        if (q_max <= 0 || isNaN(q_max)) q_max = 0.015 * 1.5;

        const num_points = 100;
        const q_array = [];
        for (let i = 0; i <= num_points; i++) {
            q_array.push((q_max * i) / num_points);
        }

        // Datos Curva Resistente
// const sysHg = ... redeclared
// const sysK = ... redeclared
        
        let max_h = 0;

        const hr_data = q_array.map(q => {
            const h = sysHg + sysK * Math.pow(q, 2);
            if (h > max_h) max_h = h;
            return { x: q * 1000, y: h };
        });

        // Datos Curva Paralelo (Arreglo 1)
        const n_manual = parseFloat(inputNManual.value.toString().replace(',', '.')) || 1;
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        
        const hb_paralelo_data = [];
        q_array.forEach(q => {
            const q_unitaria = q / n_manual;
            const h = pumpA + (pumpB * q_unitaria) + (pumpC * Math.pow(q_unitaria, 2));
            if (h >= 0) {
                hb_paralelo_data.push({ x: q * 1000, y: h });
                if (h > max_h) max_h = h;
            }
        });

        if (myChart) {
            myChart.destroy();
        }

        // Datasets
        const datasets = [
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
                label: 'Q Funcionamiento',
                data: [{ x: q_op_original * 1000, y: 0 }, { x: q_op_original * 1000, y: max_h * 2 }],
                borderColor: 'red',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }
        ];

        // Solo graficar bombas en paralelo si se han ingresado los coeficientes (ej. pumpA no es 0)
        if (pumpA !== 0 || pumpB !== 0 || pumpC !== 0) {
            datasets.push({
                label: `Bombas en Paralelo (n=${n_manual})`,
                data: hb_paralelo_data,
                borderColor: '#18a87b', // Green
                borderWidth: 2,
                borderDash: [5, 5],
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
                plugins: {
                    title: { display: true, text: 'Curvas Características - Bombas en Paralelo' }
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
            pumpC: inputs.pumpC.value,
            nManual: inputNManual.value
        };
        localStorage.setItem('bombasParaleloInputs', JSON.stringify(datos));

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
        const guardados = localStorage.getItem('bombasParaleloInputs');
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
        
        actualizarHbManual();
    }

    // Escuchar cambios para guardar y actualizar automáticamente
    ['sysHg', 'sysK', 'sysQ', 'pumpA', 'pumpB', 'pumpC'].forEach(key => {
        inputs[key].addEventListener('input', () => {
            guardarDatos();
            actualizarHbManual();
        });
    });

    btnCalc.addEventListener('click', calcularParalelo);
    btnCalcNuevoQ.addEventListener('click', calcularNuevoQ);

    inputNManual.addEventListener('input', () => {
        actualizarHbManual();
        guardarDatos();
    });

    // Cargar datos al iniciar
    cargarDatos();
});



