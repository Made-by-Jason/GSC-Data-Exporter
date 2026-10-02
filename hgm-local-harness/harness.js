import fs from 'node:fs/promises';
import express from 'express';
import cors from 'cors';

// --- 1. OLLAMA GATEWAY CLIENT ---
class OllamaClient {
    constructor(model = 'llama3', host = 'http://localhost:11434') {
        this.model = model;
        this.host = host;
    }

    async chat(messages, tools = []) {
        const payload = {
            model: this.model,
            messages: messages,
            stream: false,
            options: {
                temperature: 0.1, // Low variance for strict tool adherence
                num_predict: 1024
            }
        };

        if (tools.length > 0) {
            payload.tools = tools;
        }

        try {
            const response = await fetch(`${this.host}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.message;
        } catch (error) {
            throw new Error(`Failed to communicate with Ollama daemon: ${error.message}`);
        }
    }
}

// --- 2. LOCAL TOOL REGISTRY ---
class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.schemas = [];
    }

    register(name, description, parameters, handler) {
        this.tools.set(name, handler);
        this.schemas.push({
            type: 'function',
            function: { name, description, parameters }
        });
    }

    async execute(name, args) {
        const handler = this.tools.get(name);
        if (!handler) {
            throw new Error(`Tool not found: ${name}`);
        }

        // Failsafe: LLMs occasionally return stringified JSON for arguments
        const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
        return await handler(parsedArgs);
    }
}

// --- 3. THE AGENTIC HARNESS RUNTIME ---
class LocalAgentHarness {
    constructor(modelName) {
        this.client = new OllamaClient(modelName);
        this.registry = new ToolRegistry();
        this.initializeTools();
    }

    initializeTools() {
        this.registry.register(
            'read_local_file',
            'Read the contents of a local workspace file.',
            {
                type: 'object',
                properties: { filepath: { type: 'string', description: 'Path to file' } },
                required: ['filepath']
            },
            async ({ filepath }) => {
                try {
                    return await fs.readFile(filepath, 'utf8');
                } catch (error) {
                    return `Error reading file ${filepath}: ${error.message}`;
                }
            }
        );

        this.registry.register(
            'write_state_json',
            'Write execution state or results to state.json.',
            {
                type: 'object',
                properties: { data: { type: 'string', description: 'JSON string to write' } },
                required: ['data']
            },
            async ({ data }) => {
                try {
                    // Ensure workspace directory exists before writing
                    await fs.mkdir('workspace', { recursive: true });
                    await fs.writeFile('workspace/state.json', data, 'utf8');
                    return "Successfully committed state to workspace/state.json";
                } catch (error) {
                    return `Error writing state: ${error.message}`;
                }
            }
        );
    }

    async run(goal, maxSteps = 5) {
        console.log(`\n[HARNESS START] Goal: "${goal}"\n`);

        const messages = [
            {
                role: 'system',
                content: 'You are an autonomous local agent harness. Use available tools to fulfill user goals step-by-step. If you need to execute a tool, output a tool call.'
            },
            { role: 'user', content: goal }
        ];

        for (let step = 1; step <= maxSteps; step++) {
            console.log(`--- Loop ${step}/${maxSteps} [REASONING] ---`);

            const response = await this.client.chat(messages, this.registry.schemas);

            if (!response) {
                console.error("[CRITICAL] Received empty response payload from model.");
                break;
            }

            messages.push(response);

            const toolCalls = response?.tool_calls || [];

            // Branch A: Model requested tool executions
            if (toolCalls.length > 0) {
                for (const call of toolCalls) {
                    const toolName = call.function.name;
                    const toolArgs = call.function.arguments;

                    console.log(`  -> [ACT] Executing: ${toolName}`);

                    try {
                        const result = await this.registry.execute(toolName, toolArgs);
                        console.log(`  <- [OBSERVE] Success (${String(result).length} chars)`);

                        messages.push({
                            role: 'tool',
                            content: String(result)
                        });
                    } catch (err) {
                        console.error(`  <- [ERROR] ${err.message}`);
                        messages.push({ role: 'tool', content: `Execution Error: ${err.message}` });
                    }
                }
            }
            // Branch B: Model provided a conversational/terminal response
            else {
                console.log(`\n[TERMINAL STATE REACHED]`);
                console.log(`\nFinal Output:\n${response.content || 'No text content provided.'}`);
                return response.content;
            }
        }

        console.log(`\n[WARNING] Process halted. Reached maximum iteration limit of ${maxSteps}.`);
        return "Execution halted: Max step limit reached.";
    }
}

// --- 4. EXPRESS API SERVER (ENTRYPOINT) ---
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/execute', async (req, res) => {
    const { goal, model = 'llama3' } = req.body;

    if (!goal) {
        return res.status(400).json({ error: "Goal is required" });
    }

    // Initialize a fresh harness instance for the request
    const harness = new LocalAgentHarness(model);

    try {
        // Run the agentic loop
        const finalAnswer = await harness.run(goal);
        res.json({ status: "success", output: finalAnswer });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n[SYSTEM ONLINE] Agentic API listening on http://localhost:${PORT}`);
    console.log(`Substrate: Local Node.js + Ollama Engine`);
});