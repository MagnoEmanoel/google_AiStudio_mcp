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
    // Try multiple common selectors for Google AI Studio
    const selectors = [
        'ms-prompt-textarea textarea',
        'div[contenteditable="true"]',
        '.prompt-textarea',
        '[role="textbox"]',
        'textarea'
    ];
    
    let textarea = null;
    for (const selector of selectors) {
        textarea = document.querySelector(selector);
        if (textarea) break;
    }

    if (textarea) {
        console.log("MCP Bridge: Found input element", textarea);
        
        // Handle ContentEditable (Modern AI Studio)
        if (textarea.getAttribute('contenteditable') === 'true' || textarea.tagName !== 'TEXTAREA') {
            const currentText = textarea.innerText;
            textarea.innerText = currentText ? currentText + "\n" + text : text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } 
        // Handle standard TextArea
        else {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentText = textarea.value;
            textarea.value = currentText.substring(0, start) + text + currentText.substring(end);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Final attempt to trigger AI Studio's internal listeners
        textarea.focus();
    } else {
        console.error("Could not find AI Studio chat input");
        alert("Ops! Não consegui encontrar o campo de texto do Google AI Studio. Tente clicar no campo de texto antes de injetar o arquivo.");
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

async function injectToSystemInstructions(text) {
    // Selectors for the System Instructions field in AI Studio
    const selectors = [
        'ms-system-instructions textarea',
        'ms-system-instructions [contenteditable="true"]',
        '.system-instructions-container textarea',
        '[aria-label*="System instructions"]'
    ];
    
    let target = null;
    for (const selector of selectors) {
        target = document.querySelector(selector);
        if (target) break;
    }

    if (target) {
        console.log("MCP Bridge: Injecting into System Instructions", target);
        if (target.getAttribute('contenteditable') === 'true' || target.tagName !== 'TEXTAREA') {
            target.innerText += text;
        } else {
            target.value += text;
        }
        target.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    } else {
        // Fallback: If no system instructions field found, inject into chat
        console.warn("MCP Bridge: System Instructions field not found, falling back to chat.");
        injectToChat(text);
        return true;
    }
}

async function setupAgenticSystemInstructions() {
    console.log("MCP Bridge: Configuring Agentic Mode...");
    const instructions = `\n\n[MCP AGENT MODE] Você tem acesso ao sistema de arquivos local.
Se precisar de contexto adicional, escreva: [READ: /caminho/do/arquivo]
O conteúdo será injetado nestas instruções. Responda apenas com a análise.`;

    const success = await injectToSystemInstructions(instructions);
    if (success) {
        alert("Gemini configurado! Agora ele sabe como pedir arquivos.");
    } else {
        alert("Campo 'System Instructions' não encontrado. Cole as instruções manualmente.");
    }
}
