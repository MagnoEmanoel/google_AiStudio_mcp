# MCP Bridge for Google AI Studio

A community-ready browser extension and local server that bridges **Google AI Studio** with the **Model Context Protocol (MCP)**. This allows Gemini to access local files and private GitHub repositories without manual uploads, saving context tokens and improving workflow efficiency.

## Features

- **Premium UI:** Glassmorphism sidebar injected directly into Google AI Studio.
- **On-Demand Context:** Browse local folders and inject only the files you need into the chat.
- **Whole Repo Analysis:** List recursive structures or read multiple files at once.
- **GitHub Integration:** Access private repositories seamlessly.
- **Minimal Token Usage:** Avoid "token explosion" by staying in control of what context is sent.

## 🛠 Setup Instructions

### 1. Prerequisities

- **Node.js v18+**
- **Google Chrome** or **Firefox**

### 2. Server Setup

1. Clone or download this project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment:
   - Rename `.env.example` to `.env`.
   - Add your `GITHUB_TOKEN` and define `ALLOWED_DIRECTORIES`.
4. Start the server:
   ```bash
   node index.js
   ```
   The server will run on `http://localhost:3000`.

### 3. Extension Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer Mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension` folder from this project.

### 4. Usage

1. Go to [aistudio.google.com](https://aistudio.google.com).
2. Look for the **MCP Bridge Sidebar** on the right side.
3. Click **Connect to Local MCP**.
4. Browse your files and click to inject content directly into the prompt!

## 🛡 Security & Privacy

- **Local Access:** The server only accesses directories you explicitly allow in the `.env` file.
- **Private Tokens:** Your GitHub PAT is stored locally in `.env` and never shared.
- **Selective Injection:** You decide exactly what content goes to Google's servers.

---
## 👨‍💻 Author

**Magno Emanoel**
- Email: magno_emanoel@outlook.com
- GitHub: [https://github.com/MagnoEmanoel](https://github.com/MagnoEmanoel)

---
*Created for the community. Contributions are welcome!*
