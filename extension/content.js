/**
 * MCP Bridge - Content Script High Reliability
 */

function createSidebar() {
    if (document.getElementById('mcp-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'mcp-sidebar';
    sidebar.classList.remove('open');
    
    sidebar.innerHTML = `
        <div id="mcp-header">
            <h2>MCP Context Bridge</h2>
            <div id="agent-signal" style="display:none; color: #00ff00; font-size: 0.7rem; font-weight: bold; margin-top: 5px;">
                🔴 AGENT COMMAND DETECTED...
            </div>
        </div>
        <div id="mcp-content">
            <div class="mcp-section">
                <h3>CONNECTION</h3>
                <div id="mcp-status" style="font-size: 0.8rem; margin: 10px 0; color: #888;">Disconnected</div>
                <button id="btn-connect" class="mcp-button primary">Connect to Local MCP</button>
            </div>
            
            <div class="mcp-section">
                <h3>PROJECT TOOLS</h3>
                <button id="btn-setup-agent" class="mcp-button" style="border-color: #4285f4 !important;">Configure Agent Mode</button>
                <button id="btn-open-folder" class="mcp-button">Open Local Folder</button>
                <button id="btn-repo-all" class="mcp-button">Inject Whole Repo</button>
            </div>
            
            <div class="mcp-section">
                <h3>LOCAL FILES</h3>
                <div id="mcp-file-list"></div>
            </div>
        </div>
        <div id="mcp-footer">
            Developed by Magno Emanoel<br>
            <a href="mailto:magno_emanoel@outlook.com">magno_emanoel@outlook.com</a>
        </div>
    `;

    const toggle = document.createElement('div');
    toggle.id = 'mcp-toggle';
    toggle.innerText = '◀';
    toggle.onclick = () => {
        const isOpen = sidebar.classList.toggle('open');
        toggle.innerText = isOpen ? '▶' : '◀';
    };

    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);
    setupEventListeners();
}

function setupEventListeners() {
    const btnConnect = document.getElementById('btn-connect');
    if (btnConnect) {
        btnConnect.onclick = async () => {
            const status = document.getElementById('mcp-status');
            status.innerText = "Connecting...";
            try {
                const eventSource = new EventSource('http://localhost:3000/sse');
                eventSource.onopen = () => {
                    status.innerText = "Connected to localhost:3000";
                    status.style.color = "#0f9d58";
                    btnConnect.style.display = 'none';
                };
                eventSource.onerror = () => { status.innerText = "Conn Failed. Retrying..."; };
            } catch (e) { console.error("SSE Error", e); }
        };
    }

    document.getElementById('btn-setup-agent').onclick = () => setupAgenticSystemInstructions();
    document.getElementById('btn-open-folder').onclick = () => {
        const path = prompt("Enter local path:", "/mnt/c/Users/magno.emanoel/Documents/meu_agente");
        if (path) loadDirectory(path);
    };
    document.getElementById('btn-repo-all').onclick = () => {
        const path = prompt("Enter repository path:", "/mnt/c/Users/magno.emanoel/Documents/meu_agente");
        if (path) loadWholeRepo(path);
    };
}

/**
 * High-Reliability Observer: Scans entire page text for commands
 */
function startAgenticObserver() {
    console.log("MCP Bridge: High-Reliability Observer active.");
    
    // Set to track already processed commands (by their path) to avoid loops
    const handledPaths = new Set();

    const observer = new MutationObserver(() => {
        // Scan the entire body text for the pattern
        const bodyText = document.body.innerText;
        const match = bodyText.match(/\[READ:\s*(.*?)\]/);
        
        if (match && match[1]) {
            const filePath = match[1].trim();
            if (!handledPaths.has(filePath)) {
                console.log("%c MCP Bridge: COMMAND DETECTED -> " + filePath, "background: #4285f4; color: white; padding: 2px 5px;");
                handledPaths.add(filePath);
                
                // Visual Signal
                const signal = document.getElementById('agent-signal');
                if (signal) {
                    signal.style.display = 'block';
                    setTimeout(() => { signal.style.display = 'none'; }, 5000);
                }
                
                handleAgenticRead(filePath);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

async function handleAgenticRead(path) {
    try {
        const fileContent = await fetchFromMCP('local_explorer', { action: 'read', path });
        const injectedText = `\n\n--- FILE CONTENT: ${path} ---\n${fileContent}\n--- END ---`;
        const success = await injectToSystemInstructions(injectedText);
        
        if (success) {
            console.log("MCP Bridge: Injection OK for", path);
            injectToChat(`[READY: File ${path.split('/').pop()} has been loaded into context]`);
        } else {
            injectToChat(injectedText);
        }
    } catch (e) {
        console.error("MCP Bridge Read Error", e);
    }
}

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createSidebar(); startAgenticObserver(); });
} else {
    createSidebar();
    startAgenticObserver();
}
