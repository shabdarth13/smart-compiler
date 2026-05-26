const elements = {
    code: document.getElementById("code"),
    errors: document.getElementById("errors"),
    warnings: document.getElementById("warnings"),
    output: document.getElementById("output"),
    astSvg: document.getElementById("astSvg"),
    symbols: document.getElementById("symbols"),
    tabs: document.querySelectorAll(".tab"),
    tabContents: document.querySelectorAll(".tab-content")
};

function debounce(func, delay = 500) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

async function apiCall(url, body) {
    try {
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
        showError("⚠ Network/Server error");
        console.error(err);
    }
}

const analyzeCode = debounce(async () => {
    const data = await apiCall("/analyze", {
        code: elements.code.value
    });

    if (!data) return;

    if (data.status === "error") {
        renderList(elements.errors, data.errors);
    } else {
        elements.errors.innerHTML = "✅ No syntax errors";
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
        renderList(elements.errors, data.errors);
        openTab("errors");
        return;
    }

    renderList(elements.warnings, data.warnings);
    renderList(elements.output, data.output);

    drawAstTree(data.ast);

    elements.symbols.innerText = JSON.stringify(data.symbols, null, 2);

    openTab("output");
}

function drawAstTree(astData) {
    const svg = elements.astSvg;
    svg.innerHTML = "";

    const nodes = astData.nodes;
    const edges = astData.edges;

    const nodeMap = {};
    const childrenMap = {};

    nodes.forEach(node => {
        childrenMap[node.id] = [];
    });

    edges.forEach(edge => {
        childrenMap[edge.from].push(edge.to);
    });

    const root = nodes[0];
    const levels = [];

    function assignLevels(nodeId, level = 0) {
        if (!levels[level]) {
            levels[level] = [];
        }

        levels[level].push(nodeId);

        childrenMap[nodeId].forEach(childId => {
            assignLevels(childId, level + 1);
        });
    }

    assignLevels(root.id);

    const width = 1600;
    const levelGap = 110;
    const nodeGap = 170;

    svg.setAttribute("width", width);
    svg.setAttribute("height", levels.length * levelGap + 100);

    levels.forEach((levelNodes, levelIndex) => {
        const totalWidth = (levelNodes.length - 1) * nodeGap;
        const startX = width / 2 - totalWidth / 2;

        levelNodes.forEach((nodeId, index) => {
            nodeMap[nodeId] = {
                x: startX + index * nodeGap,
                y: 60 + levelIndex * levelGap
            };
        });
    });

    edges.forEach(edge => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y + 25);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y - 25);
        line.setAttribute("stroke", "#888");
        line.setAttribute("stroke-width", "2");

        svg.appendChild(line);
    });

    nodes.forEach(node => {
        const pos = nodeMap[node.id];

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        circle.setAttribute("cx", pos.x);
        circle.setAttribute("cy", pos.y);
        circle.setAttribute("r", "35");
        circle.setAttribute("fill", "#007acc");
        circle.setAttribute("stroke", "#ffffff");
        circle.setAttribute("stroke-width", "2");

        svg.appendChild(circle);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

        text.setAttribute("x", pos.x);
        text.setAttribute("y", pos.y + 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", "12");

        text.textContent = node.label;

        svg.appendChild(text);
    });
}

function renderList(container, list) {
    if (!list || list.length === 0) {
        container.innerHTML = "✔ Empty";
        return;
    }

    container.innerHTML = list.map(item => `<div>${item}</div>`).join("");
}

function showError(message) {
    elements.errors.innerHTML = `<span style="color:red">${message}</span>`;
}

function openTab(id) {
    elements.tabContents.forEach(tab => tab.classList.remove("active"));
    elements.tabs.forEach(tab => tab.classList.remove("active"));

    document.getElementById(id).classList.add("active");

    document.querySelector(`.tab[onclick="openTab('${id}')"]`)
        .classList.add("active");
}

function clearAll() {
    elements.code.value = "";
    clearOutputs();
}

function clearOutputs() {
    elements.errors.innerHTML = "";
    elements.warnings.innerHTML = "";
    elements.output.innerHTML = "";
    elements.astSvg.innerHTML = "";
    elements.symbols.innerText = "";
}

function loadSample() {
    elements.code.value = `let a = 10
let b = 10
let c = a + b
print(c)`;

    analyzeCode();
}