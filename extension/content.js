/**
 * MCP Bridge - Content Script
 */

function createSidebar() {
    if (document.getElementById('mcp-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'mcp-sidebar';
    sidebar.innerHTML = `
        <div class="mcp-header">
            <h2>MCP Context Bridge</h2>
        </div>
        <div class="mcp-connection">
            <h3>CONNECTION</h3>
            <div id="mcp-status" class="status">Disconnected</div>
            <button id="btn-connect" class="mcp-button primary">Connect to Local MCP</button>
        </div>
        <div class="mcp-tools">
            <h3>PROJECT TOOLS</h3>
            <button id="btn-setup-agent" class="mcp-button special">Configure Agent Mode</button>
            <button id="btn-open-folder" class="mcp-button">Open Local Folder</button>
            <button id="btn-repo-all" class="mcp-button">Inject Whole Repo</button>
        </div>
        <div class="mcp-files">
            <h3>LOCAL FILES</h3>
            <div id="mcp-file-list" class="file-list"></div>
        </div>
        <div class="mcp-footer">
            Created by Magno Emanoel<br>
            magno_emanoel@outlook.com
        </div>
    `;

    const toggle = document.createElement('div');
    toggle.id = 'mcp-sidebar-toggle';
    toggle.innerText = '◀';
    toggle.onclick = () => {
        sidebar.classList.toggle('open');
        toggle.innerText = sidebar.classList.contains('open') ? '▶' : '◀';
    };

    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);

    // Event Listeners
    document.getElementById('btn-connect').onclick = async () => {
        const status = document.getElementById('mcp-status');
        const btnConnect = document.getElementById('btn-connect');
        status.innerText = "Connecting...";
        
        try {
            const eventSource = new EventSource('http://localhost:3000/sse');
            eventSource.onopen = () => {
                status.innerText = "Connected to localhost:3000";
                status.style.color = "#0f9d58";
                btnConnect.style.display = 'none';
            };
            eventSource.onerror = () => {
                status.innerText = "Connection Failed.";
                status.style.color = "#ff4b4b";
                eventSource.close();
            };
        } catch (e) {
            console.error("Connection Error", e);
        }
    };

    document.getElementById('btn-setup-agent').onclick = () => setupAgenticSystemInstructions();
    
    document.getElementById('btn-open-folder').onclick = () => {
        const path = prompt("Enter local directory path:", "/mnt/c/Users/magno.emanoel/Documents/meu_agente");
        if (path) loadDirectory(path);
    };

    document.getElementById('btn-repo-all').onclick = () => {
        const path = prompt("Enter repository path:", "/mnt/c/Users/magno.emanoel/Documents/meu_agente");
        if (path) loadWholeRepo(path);
    };
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createSidebar(); startAgenticObserver(); });
} else {
    createSidebar();
    startAgenticObserver();
}

/**
 * Agentic Mode
 */
function startAgenticObserver() {
    console.log("MCP Bridge: Agentic Observer active.");
    
    const observer = new MutationObserver(() => {
        // Broad search for model messages
        const responses = document.querySelectorAll('.model-message, ms-chat-view .model-message, .ms-message-content');
        responses.forEach(resp => {
            if (resp.dataset.mcpProcessed) return;

            const text = resp.innerText;
            const match = text.match(/\[READ:\s*(.*?)\]/);
            
            if (match) {
                const filePath = match[1].trim();
                console.log("MCP Bridge: Command detected ->", filePath);
                resp.dataset.mcpProcessed = "true";
                handleAgenticRead(filePath);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function handleAgenticRead(path) {
    try {
        const fileContent = await fetchFromMCP('local_explorer', { action: 'read', path });
        const injectedText = `\n\n--- AUTO-INJECTED CONTEXT: ${path} ---\n${fileContent}\n--- END ---`;
        const success = await injectToSystemInstructions(injectedText);
        
        if (success) {
            injectToChat(`[System: Context updated with ${path.split('/').pop()}]`);
            console.log("MCP Bridge: Agentic injection complete.");
        }
    } catch (e) {
        console.error("Agentic Read Error", e);
    }
}
