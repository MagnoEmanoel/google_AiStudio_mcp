/**
 * MCP Bridge - UI Logic & Helpers
 */

async function fetchFromMCP(toolName, args) {
    const response = await fetch('http://localhost:3000/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: toolName,
            arguments: args
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.content[0].text;
}

function injectToChat(text) {
    const textarea = document.querySelector('textarea.prompt-textarea') || document.querySelector('[role="textbox"]');
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value || textarea.innerText;
        
        // Handle both standard textareas and contenteditable DIVs
        if (textarea.tagName === 'TEXTAREA') {
            textarea.value = currentText.substring(0, start) + text + currentText.substring(end);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            textarea.innerText = currentText + "\n" + text;
        }
    } else {
        console.error("Could not find AI Studio chat input");
        alert("Could not find chat input. Please make sure you are in a chat session.");
    }
}

async function loadDirectory(path) {
    const content = await fetchFromMCP('local_explorer', { action: 'list', path });
    const fileList = document.getElementById('mcp-file-list');
    fileList.innerHTML = '';
    
    const lines = content.split('\n').slice(1); // Skip header
    lines.forEach(line => {
        if (!line.trim()) return;
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerText = line;
        div.onclick = async () => {
            const filePath = `${path}/${line}`;
            if (line.includes('.')) { // Simple check for file vs folder
                const fileContent = await fetchFromMCP('local_explorer', { action: 'read', path: filePath });
                injectToChat(`--- File: ${line} ---\n${fileContent}\n--- End File ---`);
            } else {
                loadDirectory(filePath); // Navigate into folder
            }
        };
        fileList.appendChild(div);
    });
}

async function loadWholeRepo(path) {
    const structure = await fetchFromMCP('list_directory_recursive', { path });
    const confirmation = confirm("Loading the whole repo structure will add all relative paths to the chat. Do you also want to load ALL file contents? (WARNING: High token usage)");
    
    if (confirmation) {
        const files = structure.split('\n').slice(1);
        let fullContent = "--- FULL REPOSITORY CONTENT ---\n";
        for (const file of files) {
            if (file.trim() && !file.includes('node_modules') && !file.includes('.git')) {
                const content = await fetchFromMCP('local_explorer', { action: 'read', path: `${path}/${file.trim()}` });
                fullContent += `\nFILE: ${file}\n${content}\n`;
            }
        }
        injectToChat(fullContent);
    } else {
        injectToChat(`--- REPO STRUCTURE ---\n${structure}`);
    }
}
