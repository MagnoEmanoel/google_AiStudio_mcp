import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "octokit";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * MCP Server Initialization
 */
const server = new Server({
  name: "google_AiStudio_mcp",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});

/**
 * 1. Tool Definitions
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "local_explorer",
        description: "List files or read content from local folders.",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["list", "read"] },
            path: { type: "string", description: "Absolute path to the file or directory" }
          },
          required: ["action", "path"]
        }
      },
      {
        name: "list_directory_recursive",
        description: "Recursively list all files in a directory to understand project structure.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to the directory" }
          },
          required: ["path"]
        }
      },
      {
        name: "git_private_reader",
        description: "Access files in private GitHub repositories.",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            path: { type: "string", description: "Path within the repository" }
          },
          required: ["owner", "repo"]
        }
      }
    ]
  };
});

/**
 * Recursive directory listing helper
 */
async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

/**
 * 2. Tool Logic Implementation
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // LOCAL FILE SYSTEM LOGIC
    if (name === "local_explorer") {
      if (args.action === "list") {
        const files = await fs.readdir(args.path);
        return { content: [{ type: "text", text: `Contents of ${args.path}:\n${files.join("\n")}` }] };
      }
      const content = await fs.readFile(args.path, "utf-8");
      return { content: [{ type: "text", text: content }] };
    }

    if (name === "list_directory_recursive") {
      const allFiles = await getFiles(args.path);
      const relativeFiles = allFiles.map(f => path.relative(args.path, f));
      return { content: [{ type: "text", text: `Recursive structure of ${args.path}:\n${relativeFiles.join("\n")}` }] };
    }

    // PRIVATE GITHUB LOGIC
    if (name === "git_private_reader") {
      const response = await octokit.rest.repos.getContent({
        owner: args.owner,
        repo: args.repo,
        path: args.path || ""
      });

      if (Array.isArray(response.data)) {
        const list = response.data.map(f => f.name).join("\n");
        return { content: [{ type: "text", text: `Files in Repo:\n${list}` }] };
      }
      const code = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return { content: [{ type: "text", text: code }] };
    }
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: `Error: ${err.message}` }] };
  }
});

/**
 * 3. SSE Transport Setup
 */
let transport;

app.get("/sse", async (req, res) => {
  console.log("New SSE connection established");
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  console.log("Received message");
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP SSE Server running on http://localhost:${PORT}`);
});
