console.log("MCP Bridge: Content script initializing...");

function createSidebar() {
    console.log("MCP Bridge: Creating sidebar elements...");
    
    // Prevent duplicate injection (all_frames might cause this)
    if (document.getElementById('mcp-sidebar')) {
        console.log("MCP Bridge: Sidebar already exists, skipping.");
        return;
    }

    const sidebar = document.createElement('div');
    sidebar.id = 'mcp-sidebar';
    sidebar.className = 'hidden';
    sidebar.innerHTML = `
        <div id="mcp-header">
            <h2>MCP Context Bridge</h2>
        </div>
        <div id="mcp-content">
            <div class="mcp-section">
                <h3>Connection</h3>
                <div id="mcp-status" style="font-size: 0.8rem; margin-bottom: 10px; color: #ff4b4b;">Disconnected</div>
                <button class="mcp-button primary" id="btn-connect">Connect to Local MCP</button>
            </div>
            
            <div class="mcp-section">
                <h3>Project Tools</h3>
                <button class="mcp-button" id="btn-load-root">Open Local Folder</button>
                <button class="mcp-button" id="btn-repo-all">Inject Whole Repo</button>
            </div>

            <div class="mcp-section">
                <h3>Local Files</h3>
                <div id="mcp-file-list" style="max-height: 400px; overflow-y: auto;">
                    <!-- Files will appear here -->
                    <div style="font-size: 0.8rem; color: #666;">Connect and open a folder to see files.</div>
                </div>
            </div>
            
            <div id="mcp-footer">
                Created by <a href="https://github.com/MagnoEmanoel" target="_blank">Magno Emanoel</a><br>
                magno_emanoel@outlook.com
            </div>
        </div>
    `;

    const toggle = document.createElement('div');
    toggle.id = 'mcp-toggle';
    // No hidden class - toggle is always visible at right:0
    toggle.innerHTML = '◀';
    toggle.onclick = () => {
        console.log("MCP Bridge: Toggle clicked");
        const isHidden = sidebar.classList.toggle('hidden');
        toggle.classList.toggle('sidebar-open', !isHidden);
        toggle.innerHTML = isHidden ? '◀' : '▶';
    };

    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);
    console.log("MCP Bridge: Sidebar and Toggle appended to body. Toggle should be visible at right edge.");

    // Event Listeners
    const btnConnect = document.getElementById('btn-connect');
    if (btnConnect) {
        btnConnect.onclick = async () => {
            try {
                const status = document.getElementById('mcp-status');
                status.innerText = "Connecting...";
                status.style.color = "#f4b400";
                
                console.log("MCP Bridge: Attempting SSE connection to localhost:3000...");
                // Establish SSE connection
                const eventSource = new EventSource('http://localhost:3000/sse');
                eventSource.onopen = () => {
                    console.log("MCP Bridge: SSE Connected!");
                    status.innerText = "Connected to localhost:3000";
                    status.style.color = "#0f9d58";
                    btnConnect.style.display = 'none';
                };
                eventSource.onerror = () => {
                    console.error("MCP Bridge: SSE Connection failed.");
                    status.innerText = "Connection Failed. Is the server running?";
                    status.style.color = "#ff4b4b";
                    eventSource.close();
                };
            } catch (e) {
                console.error("MCP Bridge Error:", e);
            }
        };
    }

    const btnLoadRoot = document.getElementById('btn-load-root');
    if (btnLoadRoot) {
        btnLoadRoot.onclick = () => {
            const path = prompt("Enter the absolute path of the local folder:", "/mnt/c/Users/magno.emanoel/Documents/meu_agente");
            if (path) {
                loadDirectory(path);
            }
        };
    }

    const btnRepoAll = document.getElementById('btn-repo-all');
    if (btnRepoAll) {
        btnRepoAll.onclick = () => {
            const path = prompt("Enter the absolute path of the repository:", "/mnt/c/Users/magno.emanoel/Documents/meu_agente");
            if (path) {
                loadWholeRepo(path);
            }
        };
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createSidebar();
        startAgenticObserver();
    });
} else {
    createSidebar();
    startAgenticObserver();
}

/**
 * Agentic Mode: Observes the chat for commands like [READ: path]
 */
function startAgenticObserver() {
    console.log("MCP Bridge: Agentic Observer started.");
    
    const observer = new MutationObserver((mutations) => {
        // Look for new messages from Gemini
        const lastResponse = document.querySelector('ms-chat-view .model-message:last-child');
        if (lastResponse && !lastResponse.dataset.mcpProcessed) {
            const text = lastResponse.innerText;
            const match = text.match(/\[READ:\s*(.*?)\]/);
            
            if (match) {
                const filePath = match[1].trim();
                console.log("MCP Bridge: Agentic request detected for:", filePath);
                lastResponse.dataset.mcpProcessed = "true";
                handleAgenticRead(filePath);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function handleAgenticRead(path) {
    try {
        console.log("MCP Bridge: Executing agentic read for", path);
        const fileContent = await fetchFromMCP('local_explorer', { action: 'read', path });
        
        // Inject into System Instructions (to keep chat clean)
        const injectedText = `\n\n--- AUTO-INJECTED CONTEXT: ${path} ---\n${fileContent}\n--- END CONTEXT ---`;
        const success = await injectToSystemInstructions(injectedText);
        
        if (success) {
            injectToChat(`[System: Context updated with file ${path}]`);
            // Optional: Auto-click send button if you want fully hands-free
            // document.querySelector('button[aria-label="Run"]').click();
        }
    } catch (e) {
        console.error("MCP Bridge Agentic Error:", e);
    }
}
