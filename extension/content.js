/**
 * MCP Bridge - Content Script
 * Injects the sidebar and manages the connection to local MCP.
 */

function createSidebar() {
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
    toggle.className = 'hidden';
    toggle.innerHTML = '‹';
    toggle.onclick = () => {
        sidebar.classList.toggle('hidden');
        toggle.classList.toggle('hidden');
        toggle.innerHTML = sidebar.classList.contains('hidden') ? '‹' : '›';
    };

    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);

    // Event Listeners
    document.getElementById('btn-connect').onclick = async () => {
        try {
            const status = document.getElementById('mcp-status');
            status.innerText = "Connecting...";
            status.style.color = "#f4b400";
            
            // Establish SSE connection
            const eventSource = new EventSource('http://localhost:3000/sse');
            eventSource.onopen = () => {
                status.innerText = "Connected to localhost:3000";
                status.style.color = "#0f9d58";
                document.getElementById('btn-connect').style.display = 'none';
                toggle.classList.remove('hidden');
                sidebar.classList.remove('hidden');
            };
            eventSource.onerror = () => {
                status.innerText = "Connection Failed. Is the server running?";
                status.style.color = "#ff4b4b";
                eventSource.close();
            };
        } catch (e) {
            console.error(e);
        }
    };

    document.getElementById('btn-load-root').onclick = () => {
        const path = prompt("Enter the absolute path of the local folder:", "/home/magno/pessoal");
        if (path) {
            loadDirectory(path);
        }
    };

    document.getElementById('btn-repo-all').onclick = () => {
        const path = prompt("Enter the absolute path of the repository:", "/home/magno/pessoal");
        if (path) {
            loadWholeRepo(path);
        }
    };
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidebar);
} else {
    createSidebar();
}
