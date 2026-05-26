const elements = {
    code: document.getElementById("code"),
    lineNumbers: document.getElementById("lineNumbers"),
    errors: document.getElementById("errors"),
    warnings: document.getElementById("warnings"),
    output: document.getElementById("output"),
    astSvg: document.getElementById("astSvg"),
    astContainer: document.getElementById("astContainer"),
    symbolTableBody: document.getElementById("symbolTableBody"),
    tabs: document.querySelectorAll(".tab"),
    tabContents: document.querySelectorAll(".tab-content"),
    errorCount: document.getElementById("errorCount"),
    warningCount: document.getElementById("warningCount"),
    outputCount: document.getElementById("outputCount"),
    statusText: document.getElementById("statusText"),
    aiBotBox: document.getElementById("aiBotBox")
};
let lastRunData = null;

function debounce(func, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

function updateLineNumbers() {
    const lines = elements.code.value.split("\n").length;
    elements.lineNumbers.innerHTML = "";

    for (let i = 1; i <= lines; i++) {
        elements.lineNumbers.innerHTML += `${i}<br>`;
    }
}

elements.code.addEventListener("input", updateLineNumbers);

elements.code.addEventListener("scroll", () => {
    elements.lineNumbers.scrollTop = elements.code.scrollTop;
});

async function apiCall(url, body) {
    try {
        elements.statusText.innerText = "Running";

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error("Server error");
        }

        return await res.json();

    } catch (err) {
        showError("⚠ Network or server error");
        elements.statusText.innerText = "Failed";
        console.error(err);
    }
}

const analyzeCode = debounce(async () => {
    const data = await apiCall("/analyze", {
        code: elements.code.value
    });

    if (!data) return;

    if (data.status === "error") {
        renderList(elements.errors, data.errors, "error");
        elements.errorCount.innerText = data.errors.length;
        elements.statusText.innerText = "Error";
    } else {
        elements.errors.innerHTML = `<div class="message success">✅ No syntax errors</div>`;
        elements.errorCount.innerText = "0";
        elements.statusText.innerText = "Ready";
    }
}, 500);

elements.code.addEventListener("input", analyzeCode);

async function runCode() {
    clearOutputs();

    const data = await apiCall("/run", {
        code: elements.code.value
    });

    if (!data) return;

    if (data.status === "error") {
        renderList(elements.errors, data.errors, "error");
        elements.errorCount.innerText = data.errors.length;
        elements.statusText.innerText = "Error";
        openTab("errors");
        return;
    }

    renderList(elements.warnings, data.warnings, "warning");
    renderList(elements.output, data.output, "output");

    elements.warningCount.innerText = data.warnings ? data.warnings.length : 0;
    elements.outputCount.innerText = data.output ? data.output.length : 0;
    elements.errorCount.innerText = "0";
    elements.statusText.innerText = "Success";

    lastRunData = data;

    drawAstTree(data.ast);
    renderSymbolTable(data.symbols);

    openTab("output");
}

let scale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

function updateAstTransform() {
    elements.astSvg.style.transform =
        `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function zoomIn() {
    scale = Math.min(3, scale + 0.1);
    updateAstTransform();
}

function zoomOut() {
    scale = Math.max(0.2, scale - 0.1);
    updateAstTransform();
}

function resetZoom() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateAstTransform();
}

elements.astContainer.addEventListener("wheel", (e) => {
    e.preventDefault();

    const rect = elements.astContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldScale = scale;

    if (e.deltaY < 0) {
        scale = Math.min(3, scale + 0.1);
    } else {
        scale = Math.max(0.2, scale - 0.1);
    }

    const scaleRatio = scale / oldScale;

    panX = mouseX - (mouseX - panX) * scaleRatio;
    panY = mouseY - (mouseY - panY) * scaleRatio;

    updateAstTransform();
});

elements.astContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    panX = e.clientX - startX;
    panY = e.clientY - startY;

    updateAstTransform();
});

function drawAstTree(astData) {
    const svg = elements.astSvg;
    svg.innerHTML = "";

    resetZoom();

    if (!astData || !astData.nodes || !astData.edges) return;

    const nodes = astData.nodes;
    const edges = astData.edges;

    const nodeMap = {};
    const childrenMap = {};

    nodes.forEach(node => {
        childrenMap[node.id] = [];
    });

    edges.forEach(edge => {
        if (childrenMap[edge.from]) {
            childrenMap[edge.from].push(edge.to);
        }
    });

    const root = nodes[0];
    const levels = [];

    function assignLevels(nodeId, level = 0) {
        if (!levels[level]) levels[level] = [];
        levels[level].push(nodeId);

        childrenMap[nodeId].forEach(childId => {
            assignLevels(childId, level + 1);
        });
    }

    assignLevels(root.id);

    const width = Math.max(1400, nodes.length * 150);
    const levelGap = 130;
    const nodeGap = 190;

    svg.setAttribute("width", width);
    svg.setAttribute("height", levels.length * levelGap + 160);

    levels.forEach((levelNodes, levelIndex) => {
        const totalWidth = (levelNodes.length - 1) * nodeGap;
        const startPositionX = width / 2 - totalWidth / 2;

        levelNodes.forEach((nodeId, index) => {
            nodeMap[nodeId] = {
                x: startPositionX + index * nodeGap,
                y: 90 + levelIndex * levelGap
            };
        });
    });

    edges.forEach(edge => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];

        if (!from || !to) return;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y + 32);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y - 32);
        line.setAttribute("class", "ast-edge");

        svg.appendChild(line);
    });

    nodes.forEach(node => {
        const pos = nodeMap[node.id];

        if (!pos) return;

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        circle.setAttribute("cx", pos.x);
        circle.setAttribute("cy", pos.y);
        circle.setAttribute("r", "42");
        circle.setAttribute("class", "ast-node");

        svg.appendChild(circle);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

        text.setAttribute("x", pos.x);
        text.setAttribute("y", pos.y + 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "ast-text");

        text.textContent = node.label;

        svg.appendChild(text);
    });
}

function renderSymbolTable(symbols) {
    elements.symbolTableBody.innerHTML = "";

    if (!symbols || Object.keys(symbols).length === 0) {
        elements.symbolTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-symbols">No symbols found</td>
            </tr>
        `;
        return;
    }

    Object.entries(symbols).forEach(([variable, value]) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><span class="var-badge">${variable}</span></td>
            <td>${value}</td>
            <td><span class="type-pill">${typeof value}</span></td>
        `;

        elements.symbolTableBody.appendChild(row);
    });
}

function renderList(container, list, type = "normal") {
    if (!list || list.length === 0) {
        container.innerHTML = `<div class="message muted">✔ Empty</div>`;
        return;
    }

    container.innerHTML = list.map(item => {
        return `<div class="message ${type}">${item}</div>`;
    }).join("");
}

function showError(message) {
    elements.errors.innerHTML = `<div class="message error">${message}</div>`;
}

function openTab(id) {
    elements.tabContents.forEach(tab => tab.classList.remove("active"));
    elements.tabs.forEach(tab => tab.classList.remove("active"));

    document.getElementById(id).classList.add("active");

    document.querySelector(`.tab[onclick="openTab('${id}')"]`).classList.add("active");
}

function clearAll() {
    elements.code.value = "";
    updateLineNumbers();
    clearOutputs();
}

function clearOutputs() {
    elements.errors.innerHTML = "";
    elements.warnings.innerHTML = "";
    elements.output.innerHTML = "";
    elements.astSvg.innerHTML = "";
    elements.symbolTableBody.innerHTML = "";

    resetZoom();

    elements.errorCount.innerText = "0";
    elements.warningCount.innerText = "0";
    elements.outputCount.innerText = "0";
    elements.statusText.innerText = "Ready";
}

function loadSample() {
    elements.code.value = `let a = 10
let b = 10
let c = a + b
print(c)

if (a < b) {
    print(a)
} else {
    print(c)
}`;

    updateLineNumbers();
    analyzeCode();
}

updateLineNumbers();

/* BACKGROUND PARTICLES */

const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let mouse = {
    x: null,
    y: null
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
});

const symbols = [
    "{}",
    "()",
    "[]",
    "</>",
    ";",
    "let",
    "if",
    "else",
    "while",
    "print",
    "+",
    "*",
    "/",
    "<",
    ">",
    "AST",
    "LEX",
    "PARSE"
];

const particles = [];

for (let i = 0; i < 70; i++) {
    particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseSpeedY: 0.25 + Math.random() * 0.45,
        baseSpeedX: (Math.random() - 0.5) * 0.25,
        size: 11 + Math.random() * 15,
        opacity: 0.10 + Math.random() * 0.18,
        text: symbols[Math.floor(Math.random() * symbols.length)]
    });
}

function animateBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        if (mouse.x !== null && mouse.y !== null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = 140;

            if (distance < radius && distance !== 0) {
                const force = (radius - distance) / radius;

                p.x += (dx / distance) * force * 3;
                p.y += (dy / distance) * force * 3;
            }
        }

        ctx.font = `${p.size}px Consolas`;
        ctx.fillStyle = `rgba(96,165,250,${p.opacity})`;
        ctx.fillText(p.text, p.x, p.y);

        p.y += p.baseSpeedY;
        p.x += p.baseSpeedX;

        if (p.y > canvas.height + 40) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
        }

        if (p.x > canvas.width + 40) {
            p.x = -40;
        }

        if (p.x < -40) {
            p.x = canvas.width + 40;
        }
    });

    requestAnimationFrame(animateBackground);
}

animateBackground();
function explainCode() {
    const code = elements.code.value.trim();

    if (!code) {
        elements.aiBotBox.innerHTML = "Write some code first, then run it.";
        return;
    }

    if (!lastRunData) {
        elements.aiBotBox.innerHTML = "Run the code first, then I can explain the actual execution.";
        return;
    }

    const lines = code
        .split("\n")
        .map(line => line.trim())
        .filter(line => line !== "");

    let explanation = "";

    explanation += `<b>Code Explanation:</b><br><br>`;

    lines.forEach((line, index) => {
        explanation += `<b>Line ${index + 1}:</b> `;

        if (line.startsWith("let ")) {
            const match = line.match(/let\s+([a-zA-Z_]\w*)\s*=\s*(.+)/);

            if (match) {
                const variable = match[1];
                const expression = match[2];

                explanation += `Creates variable <b>${variable}</b> and assigns it the result of <code>${expression}</code>.`;

                if (lastRunData.symbols && variable in lastRunData.symbols) {
                    explanation += ` Final value is <b>${lastRunData.symbols[variable]}</b>.`;
                }
            } else {
                explanation += `This line declares a variable.`;
            }
        }

        else if (line.startsWith("print")) {
            const match = line.match(/print\s*\((.+)\)/);

            if (match) {
                explanation += `Prints the value of <code>${match[1]}</code> to the output window.`;
            } else {
                explanation += `Prints output.`;
            }
        }

        else if (line.startsWith("if")) {
            const match = line.match(/if\s*\((.+)\)/);

            if (match) {
                explanation += `Checks the condition <code>${match[1]}</code>. If it is true, the compiler executes the if-block. Otherwise, it executes the else-block.`;
            } else {
                explanation += `Starts a conditional block.`;
            }
        }

        else if (line.startsWith("else")) {
            explanation += `This block runs only when the if condition is false.`;
        }

        else if (line.startsWith("while")) {
            const match = line.match(/while\s*\((.+)\)/);

            if (match) {
                explanation += `Repeats the loop while <code>${match[1]}</code> remains true.`;
            } else {
                explanation += `Starts a loop.`;
            }
        }

        else if (line.includes("=")) {
            const parts = line.split("=");

            const variable = parts[0].trim();
            const expression = parts.slice(1).join("=").trim();

            explanation += `Updates variable <b>${variable}</b> using expression <code>${expression}</code>.`;

            if (lastRunData.symbols && variable in lastRunData.symbols) {
                explanation += ` Final value becomes <b>${lastRunData.symbols[variable]}</b>.`;
            }
        }

        else if (line === "{" || line === "}") {
            explanation += `Marks the start or end of a code block.`;
        }

        else {
            explanation += `This line is part of the program structure.`;
        }

        explanation += `<br><br>`;
    });

    if (lastRunData.output && lastRunData.output.length > 0) {
        explanation += `<b>Final Output:</b><br>`;
        lastRunData.output.forEach(out => {
            explanation += `• ${out}<br>`;
        });
        explanation += `<br>`;
    }

    if (lastRunData.symbols && Object.keys(lastRunData.symbols).length > 0) {
        explanation += `<b>Final Symbol Table:</b><br>`;

        Object.entries(lastRunData.symbols).forEach(([key, value]) => {
            explanation += `• ${key} = ${value}<br>`;
        });

        explanation += `<br>`;
    }

    if (lastRunData.warnings && lastRunData.warnings.length > 0) {
        explanation += `<b>Warnings:</b><br>`;

        lastRunData.warnings.forEach(warning => {
            explanation += `• ${warning}<br>`;
        });
    }

    elements.aiBotBox.innerHTML = explanation;
}