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
        knew: document.getElementById('out-alpha'), // Es el span del K adicional
        deltaH: document.getElementById('out-hz'),   // Es el span del Delta H
        kTotalContainer: document.getElementById('k-total-container'),
        outKTotal: document.getElementById('out-k-total')
    };

    let kGlobal = -1;

    function getOriginalParams() {
        const sysHg = parseFloat(inputs.sysHg.value.toString().replace(',', '.')) || 0;
        const sysK = parseFloat(inputs.sysK.value.toString().replace(',', '.')) || 0;
        const pumpA = parseFloat(inputs.pumpA.value.toString().replace(',', '.')) || 0;
        const pumpB = parseFloat(inputs.pumpB.value.toString().replace(',', '.')) || 0;
        const pumpC = parseFloat(inputs.pumpC.value.toString().replace(',', '.')) || 0;
        return { sysHg, sysK, pumpA, pumpB, pumpC };
    }

    function resolverQ(k) {
        const { sysHg, pumpA, pumpB, pumpC } = getOriginalParams();
        // Intersección: (pumpC - k) * Q^2 + pumpB * Q + (pumpA - sysHg) = 0
        const a = pumpC - k;
        const b = pumpB;
        const c = pumpA - sysHg;

        if (a === 0) {
            if (b === 0) return -1;
            return -c / b;
        }

        const discriminante = Math.pow(b, 2) - (4 * a * c);
        if (discriminante < 0) return -1;

        const q1 = (-b + Math.sqrt(discriminante)) / (2 * a);
        const q2 = (-b - Math.sqrt(discriminante)) / (2 * a);
        
        let qFinal = -1;
        if (q1 > 0 && q2 > 0) qFinal = Math.max(q1, q2);
        else if (q1 > 0) qFinal = q1;
        else if (q2 > 0) qFinal = q2;

        return qFinal;
    }

    function calcularNuevaCurva() {
        const { sysHg, sysK, pumpA, pumpB, pumpC } = getOriginalParams();
        const qReq = parseFloat(inputs.sysQ.value.toString().replace(',', '.')) || 0;

        if (qReq <= 0) {
            resetOutputs();
            return;
        }

        const hReq = pumpA + (pumpB * qReq) + (pumpC * Math.pow(qReq, 2));

        if (hReq <= sysHg) {
            // Imposible, la bomba no da ni para vencer el desnivel a ese caudal
            resetOutputs();
            return;
        }

        const kNew = (hReq - sysHg) / Math.pow(qReq, 2);

        if (kNew < sysK) {
            // Imposible por estrangulamiento (se necesitaría K negativa o menor a tubería base)
            // Lo calculamos igual pero indicamos que es menor
        }

        kGlobal = kNew;
        updateUIFromK(kNew);
    }

    function updateUIFromK(k) {
        const { sysHg, sysK, pumpA, pumpB, pumpC } = getOriginalParams();
        const q_op = resolverQ(k);

        if (q_op > 0) {
            const deltaH = (k - sysK) * Math.pow(q_op, 2);
            const kAdicional = k - sysK;
            
            outputs.knew.textContent = kAdicional.toFixed(4).replace('.', ',');
            outputs.deltaH.textContent = deltaH.toFixed(2).replace('.', ',');
            
            if (outputs.kTotalContainer && outputs.outKTotal) {
                outputs.kTotalContainer.style.display = 'block';
                outputs.outKTotal.textContent = k.toFixed(4).replace('.', ',');
            }
        } else {
            outputs.knew.textContent = 'Error';
            outputs.deltaH.textContent = 'Error';
            if (outputs.kTotalContainer) {
                outputs.kTotalContainer.style.display = 'none';
            }
        }
        actualizarGrafica();
    }

    function resetOutputs() {
        kGlobal = -1;
        outputs.knew.textContent = '0';
        outputs.deltaH.textContent = '0,00';
        if (outputs.kTotalContainer) {
            outputs.kTotalContainer.style.display = 'none';
        }
        actualizarGrafica();
    }

    let myChart = null;

    function actualizarGrafica() {
        const canvas = document.getElementById('grafica-bombas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const { sysHg, sysK, pumpA, pumpB, pumpC } = getOriginalParams();
        
        function findIntQ(a, b, c) {
            if (Math.abs(a) < 1e-9) return Math.abs(b) > 1e-9 ? -c / b : 0;
            const disc = b * b - 4 * a * c;
            if (disc < 0) return 0;
            return Math.max((-b + Math.sqrt(disc)) / (2 * a), (-b - Math.sqrt(disc)) / (2 * a), 0);
        }

        const q_int_orig = findIntQ(pumpC - sysK, pumpB, pumpA - sysHg);
        const q_zero_orig = findIntQ(pumpC, pumpB, pumpA);
        
        let q_int_nueva = 0;
        if (kGlobal > 0) {
            q_int_nueva = findIntQ(pumpC - kGlobal, pumpB, pumpA - sysHg);
        }

        let q_base = resolverQ(sysK) > 0 ? resolverQ(sysK) : 0.015;
        let q_max = (Math.ceil(q_base * 1000) + 3) / 1000; // Legacy approach

        if (!isNaN(q_int_orig) && q_int_orig > 0) q_max = Math.max(q_max, q_int_orig * 1.15);
        if (!isNaN(q_zero_orig) && q_zero_orig > 0) q_max = Math.max(q_max, q_zero_orig * 1.05);
        if (!isNaN(q_int_nueva) && q_int_nueva > 0) q_max = Math.max(q_max, q_int_nueva * 1.15);

        if (q_max <= 0 || isNaN(q_max)) q_max = 0.015 * 1.5;

        const num_points = 100;
        const q_array = [];
        for (let i = 0; i <= num_points; i++) {
            q_array.push((q_max * i) / num_points);
        }

        let max_h = 0;
        const hr_original_data = q_array.map(q => {
            const h = sysHg + sysK * Math.pow(q, 2);
            if (h > max_h) max_h = h;
            return { x: q * 1000, y: h };
        });

        const hb_data = [];
        if (pumpA !== 0 || pumpB !== 0 || pumpC !== 0) {
            q_array.forEach(q => {
                const h = pumpA + (pumpB * q) + (pumpC * Math.pow(q, 2));
                if (h >= 0) {
                    hb_data.push({ x: q * 1000, y: h });
                    if (h > max_h) max_h = h;
                }
            });
        }

        const hr_nueva_data = [];
        if (kGlobal > 0) {
            q_array.forEach(q => {
                const h = sysHg + kGlobal * Math.pow(q, 2);
                if (h >= 0) {
                    hr_nueva_data.push({ x: q * 1000, y: h });
                    if (h > max_h) max_h = h;
                }
            });
        }

        if (myChart) {
            myChart.destroy();
        }

        const datasets = [
            {
                label: 'Sistema Original',
                data: hr_original_data,
                borderColor: '#61708b', // Gris azulado
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4
            }
        ];

        if (hb_data.length > 0) {
            datasets.push({
                label: 'Bomba',
                data: hb_data,
                borderColor: '#18a87b', // Verde
                backgroundColor: 'rgba(24, 168, 123, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            });
        }

        if (hr_nueva_data.length > 0) {
            datasets.push({
                label: 'Nuevo Sistema (Estrangulado)',
                data: hr_nueva_data,
                borderColor: '#ef4444', // Rojo
                borderWidth: 2.5,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            });
            
            const q_op = resolverQ(kGlobal);
            if (q_op > 0) {
                const hReq = pumpA + (pumpB * q_op) + (pumpC * Math.pow(q_op, 2));
                datasets.push({
                    label: 'Q Operación',
                    data: [{ x: q_op * 1000, y: 0 }, { x: q_op * 1000, y: hReq }],
                    borderColor: 'red',
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false
                });
            }
        }

        myChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                aspectRatio: 1.5,
                plugins: {
                    title: { display: true, text: 'Modificación de Curva Resistente (Estrangulamiento)' }
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
        localStorage.setItem('hrnuevaInputs', JSON.stringify(datos));

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
        const guardados = localStorage.getItem('hrnuevaInputs');
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

        actualizarGrafica();
    }

    // Escuchar cambios
    ['sysHg', 'sysK', 'sysQ', 'pumpA', 'pumpB', 'pumpC'].forEach(key => {
        inputs[key].addEventListener('input', () => {
            guardarDatos();
            resetOutputs();
        });
    });

    const btnCalc = document.getElementById('btn-calc');
    if (btnCalc) {
        btnCalc.addEventListener('click', calcularNuevaCurva);
    }

    cargarDatos();
});
