/**
 * MCP Bridge - Content Script Refined
 */

function createSidebar() {
    if (document.getElementById('mcp-sidebar')) return;

    // Sidebar Container
    const sidebar = document.createElement('div');
    sidebar.id = 'mcp-sidebar';
    // Start closed
    sidebar.classList.remove('open');
    
    sidebar.innerHTML = `
        <div id="mcp-header">
            <h2>MCP Context Bridge</h2>
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

    // Toggle Button
    const toggle = document.createElement('div');
    toggle.id = 'mcp-toggle';
    toggle.innerText = '◀';
    toggle.onclick = () => {
        const isOpen = sidebar.classList.toggle('open');
        toggle.innerText = isOpen ? '▶' : '◀';
        console.log("MCP Bridge: Sidebar " + (isOpen ? "opened" : "closed"));
    };

    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);

    // Event Listeners
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
                    console.log("MCP Bridge: SSE Connected!");
                };
                eventSource.onerror = () => {
                    status.innerText = "Connection Failed. Retrying...";
                    status.style.color = "#ff4b4b";
                };
            } catch (e) {
                console.error("MCP Bridge: SSE Error", e);
            }
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
 * Universal Agentic Observer
 */
function startAgenticObserver() {
    console.log("MCP Bridge: Universal Agentic Observer active (Firefox Optimized).");
    
    const observer = new MutationObserver((mutations) => {
        // High-performance check for model output
        const modelBlocks = document.querySelectorAll('ms-one-message:not([data-mcp-checked]), .model-message:not([data-mcp-checked]), .ms-message-content:not([data-mcp-checked])');
        
        modelBlocks.forEach(el => {
            const text = el.innerText;
            if (text.includes('[READ:')) {
                const match = text.match(/\[READ:\s*(.*?)\]/);
                if (match && match[1]) {
                    const filePath = match[1].trim();
                    console.log("%c MCP Bridge: Command detected -> " + filePath, "color: #4285f4; font-weight: bold; padding: 2px 5px; border: 1px solid #4285f4; border-radius: 3px;");
                    el.setAttribute('data-mcp-checked', 'true'); // Mark as handled
                    handleAgenticRead(filePath);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function handleAgenticRead(path) {
    try {
        console.log("MCP Bridge: Fetching file...", path);
        const fileContent = await fetchFromMCP('local_explorer', { action: 'read', path });
        
        const injectedText = `\n\n--- AUTO-INJECTED CONTEXT: ${path} ---\n${fileContent}\n--- END CONTEXT ---`;
        const success = await injectToSystemInstructions(injectedText);
        
        if (success) {
            console.log("%c MCP Bridge: Success! Data injected into System Instructions.", "color: #0f9d58; font-weight: bold;");
            injectToChat(`[Context Loaded: ${path.split('/').pop()}]`);
        } else {
            console.warn("MCP Bridge: Failed to inject to System Instructions, falling back to chat injection.");
            injectToChat(injectedText);
        }
    } catch (e) {
        console.error("MCP Bridge Agentic Error:", e);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createSidebar(); startAgenticObserver(); });
} else {
    createSidebar();
    startAgenticObserver();
}
