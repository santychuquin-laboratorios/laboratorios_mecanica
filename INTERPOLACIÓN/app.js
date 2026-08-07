document.addEventListener("DOMContentLoaded", () => {
    // Inputs
    const inX1 = document.getElementById("in-x1");
    const inY1 = document.getElementById("in-y1");
    const inX2 = document.getElementById("in-x2");
    const inY2 = document.getElementById("in-y2");
    const inX = document.getElementById("in-x");
    
    // Outputs
    const outY = document.getElementById("out-y");

    // Gráfico SVG elementos
    const gTx1 = document.getElementById("g-tx1");
    const gTy1 = document.getElementById("g-ty1");
    const gTx2 = document.getElementById("g-tx2");
    const gTy2 = document.getElementById("g-ty2");
    const gTx = document.getElementById("g-tx");
    const gTy = document.getElementById("g-ty");

    const gP1 = document.getElementById("g-p1");
    const gP2 = document.getElementById("g-p2");
    const gP = document.getElementById("g-p");

    const gLine = document.getElementById("graph-line");
    const gLineDashed = document.getElementById("graph-line-dashed");

    const gX1Line = document.getElementById("g-x1-line");
    const gY1Line = document.getElementById("g-y1-line");
    const gX2Line = document.getElementById("g-x2-line");
    const gY2Line = document.getElementById("g-y2-line");
    const gXLine = document.getElementById("g-x-line");
    const gYLine = document.getElementById("g-y-line");

    // SVG Boundaries
    const SVG_X_MIN = 200;
    const SVG_X_MAX = 650;
    const SVG_Y_MIN = 100; // Superior en SVG
    const SVG_Y_MAX = 400; // Inferior en SVG

    function formatNumber(num) {
        if (Number.isInteger(num)) return num.toString();
        return num.toFixed(4).replace('.', ',');
    }

    function updateGraph(x1, y1, x2, y2, x, y) {
        // Encontrar mínimos y máximos para la escala
        const minX = Math.min(x1, x2, x);
        const maxX = Math.max(x1, x2, x);
        const minY = Math.min(y1, y2, y);
        const maxY = Math.max(y1, y2, y);

        // Añadir margen (padding) al gráfico
        const paddingX = (maxX - minX) * 0.2 || 1;
        const paddingY = (maxY - minY) * 0.2 || 1;

        const scaleMinX = minX - paddingX;
        const scaleMaxX = maxX + paddingX;
        const scaleMinY = minY - paddingY;
        const scaleMaxY = maxY + paddingY;

        // Función de mapeo al SVG
        const mapX = (val) => {
            const ratio = (val - scaleMinX) / (scaleMaxX - scaleMinX);
            return SVG_X_MIN + ratio * (SVG_X_MAX - SVG_X_MIN);
        };
        const mapY = (val) => {
            // Invertir Y porque en SVG 0 está arriba
            const ratio = (val - scaleMinY) / (scaleMaxY - scaleMinY);
            return SVG_Y_MAX - ratio * (SVG_Y_MAX - SVG_Y_MIN);
        };

        const px1 = mapX(x1);
        const py1 = mapY(y1);
        const px2 = mapX(x2);
        const py2 = mapY(y2);
        const px = mapX(x);
        const py = mapY(y);

        // Actualizar posiciones
        gP1.setAttribute("cx", px1); gP1.setAttribute("cy", py1);
        gP2.setAttribute("cx", px2); gP2.setAttribute("cy", py2);
        gP.setAttribute("cx", px);   gP.setAttribute("cy", py);

        gLine.setAttribute("x1", px1); gLine.setAttribute("y1", py1);
        gLine.setAttribute("x2", px2); gLine.setAttribute("y2", py2);
        
        gLineDashed.setAttribute("x1", px1); gLineDashed.setAttribute("y1", py1);
        gLineDashed.setAttribute("x2", px2); gLineDashed.setAttribute("y2", py2);

        // Líneas punteadas P1
        gX1Line.setAttribute("x1", px1); gX1Line.setAttribute("y1", 450);
        gX1Line.setAttribute("x2", px1); gX1Line.setAttribute("y2", py1);
        gY1Line.setAttribute("x1", 140); gY1Line.setAttribute("y1", py1);
        gY1Line.setAttribute("x2", px1); gY1Line.setAttribute("y2", py1);

        // Líneas punteadas P2
        gX2Line.setAttribute("x1", px2); gX2Line.setAttribute("y1", 450);
        gX2Line.setAttribute("x2", px2); gX2Line.setAttribute("y2", py2);
        gY2Line.setAttribute("x1", 140); gY2Line.setAttribute("y1", py2);
        gY2Line.setAttribute("x2", px2); gY2Line.setAttribute("y2", py2);

        // Líneas punteadas interp
        gXLine.setAttribute("x1", px); gXLine.setAttribute("y1", 450);
        gXLine.setAttribute("x2", px); gXLine.setAttribute("y2", py);
        gYLine.setAttribute("x1", 140); gYLine.setAttribute("y1", py);
        gYLine.setAttribute("x2", px); gYLine.setAttribute("y2", py);

        // Actualizar Textos
        gTx1.setAttribute("x", px1); gTx1.textContent = formatNumber(x1);
        gTy1.setAttribute("y", py1 + 10); gTy1.textContent = formatNumber(y1);
        
        gTx2.setAttribute("x", px2); gTx2.textContent = formatNumber(x2);
        gTy2.setAttribute("y", py2 + 10); gTy2.textContent = formatNumber(y2);
        
        gTx.setAttribute("x", px); gTx.textContent = formatNumber(x);
        gTy.setAttribute("y", py + 10); gTy.textContent = formatNumber(y);
    }

    function calculate() {
        const x1 = parseFloat(inX1.value.toString().replace(',', '.')) || 0;
        const y1 = parseFloat(inY1.value.toString().replace(',', '.')) || 0;
        const x2 = parseFloat(inX2.value.toString().replace(',', '.')) || 0;
        const y2 = parseFloat(inY2.value.toString().replace(',', '.')) || 0;
        const x = parseFloat(inX.value.toString().replace(',', '.')) || 0;

        if (x1 !== x2) {
            // Y = Y1 + ((Y2 - Y1) / (X2 - X1)) * (X - X1)
            const y = y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
            outY.textContent = formatNumber(y);
            
            // Actualizar Gráfico
            updateGraph(x1, y1, x2, y2, x, y);
        } else {
            outY.textContent = "Error (X₁ = X₂)";
        }
    }

    // Event listeners
    const inputs = [inX1, inY1, inX2, inY2, inX];
    inputs.forEach(input => {
        input.addEventListener("input", calculate);
    });

    // Iniciar
    calculate();
});
