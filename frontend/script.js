// ==============================
// DOM ELEMENTS
// ==============================
const elements = {
    code: document.getElementById("code"),
    errors: document.getElementById("errors"),
    warnings: document.getElementById("warnings"),
    output: document.getElementById("output"),
    ast: document.getElementById("ast"),
    symbols: document.getElementById("symbols"),
    tabs: document.querySelectorAll(".tab"),
    tabContents: document.querySelectorAll(".tab-content")
};

// ==============================
// DEBOUNCE
// ==============================
function debounce(func, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ==============================
// API CALL
// ==============================
async function apiCall(url, body) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Server error");

        return await res.json();
    } catch (err) {
        showError("⚠ Network/Server error");
        console.error(err);
    }
}

// ==============================
// REAL-TIME ANALYSIS
// ==============================
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

// ==============================
// RUN CODE
// ==============================
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

    // 🔥 TREE AST (not JSON)
    elements.ast.innerText = data.ast;

    elements.symbols.innerText = JSON.stringify(data.symbols, null, 2);

    openTab("output");
}

// ==============================
// UI HELPERS
// ==============================
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

// ==============================
// TAB SYSTEM
// ==============================
function openTab(id) {
    elements.tabContents.forEach(tab => tab.classList.remove("active"));
    elements.tabs.forEach(tab => tab.classList.remove("active"));

    document.getElementById(id).classList.add("active");

    document.querySelector(`.tab[onclick="openTab('${id}')"]`)
        .classList.add("active");
}

// ==============================
// UTIL FUNCTIONS
// ==============================
function clearAll() {
    elements.code.value = "";
    clearOutputs();
}

function clearOutputs() {
    elements.errors.innerHTML = "";
    elements.warnings.innerHTML = "";
    elements.output.innerHTML = "";
    elements.ast.innerText = "";
    elements.symbols.innerText = "";
}

function loadSample() {
    elements.code.value = `let x = 5
let y = 10

if (x < y) {
    print(x)
} else {
    print(y)
}`;
    analyzeCode();
}