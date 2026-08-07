// Lógica específica para el laboratorio plantilla

document.addEventListener("DOMContentLoaded", () => {
    
    // Referencias a elementos del DOM
    const var1Input = document.getElementById("var1");
    const var1Display = document.getElementById("var1-val");
    const var2Input = document.getElementById("var2");
    const btnSimulate = document.getElementById("btn-simulate");
    const resultsTable = document.querySelector("#results-table tbody");

    // 1. Manejar eventos de los controles de entrada
    if (var1Input && var1Display) {
        var1Input.addEventListener("input", (e) => {
            var1Display.textContent = e.target.value;
            // Aquí puedes actualizar la simulación visual en tiempo real
        });
    }

    // 2. Lógica de simulación
    if (btnSimulate) {
        btnSimulate.addEventListener("click", () => {
            // Leer variables
            const val1 = parseFloat(var1Input.value.toString().replace(',', '.'));
            const val2 = parseFloat(var2Input.value.toString().replace(',', '.'));
            
            if (isNaN(val2)) {
                alert("Por favor ingrese un número válido en la Variable 2.");
                return;
            }

            // Realizar cálculos de física/ingeniería
            // (Ejemplo básico: suma)
            const resultado = val1 + val2; 

            // 3. Actualizar la simulación visual
            // const simArea = document.getElementById("simulation-area");
            // Aquí iría el código para mover elementos en el DOM o Canvas

            // 4. Agregar resultados a la tabla
            addResultToTable(val1, val2, resultado);

            // 5. Actualizar gráficas si existen (ej. usando Chart.js)
            // updateChart(val1, resultado);
        });
    }

    // Función auxiliar para tabla
    function addResultToTable(v1, v2, res) {
        // Limpiar mensaje "Realice una simulación" si es el primer dato
        const firstRow = resultsTable.querySelector("tr td[colspan]");
        if (firstRow) {
            resultsTable.innerHTML = "";
        }

        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td>${v1.toFixed(2)}</td>
            <td>${v2.toFixed(2)}</td>
            <td><strong>${res.toFixed(2)}</strong></td>
        `;
        resultsTable.appendChild(newRow);
    }
});
