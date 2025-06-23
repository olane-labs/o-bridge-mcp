import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const server = new Server({
  name: 'o-bridge-mcp',
  version: '1.0.0',
  description: 'The MCP server to connect to the o-network of services.',
  capabilities: {
    tools: {},
  },
});
server.registerCapabilities({
  tools: {
    plan: {
      description: 'Plan a task',
    },
  },
});

const PlanYourTaskArgsSchema = z.object({
  task: z.string(),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const planTool = {
  name: 'plan',
  description: 'Plan whatever task you want to accomplish.',
  inputSchema: zodToJsonSchema(PlanYourTaskArgsSchema) as ToolInput,
};

server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  console.log('ListToolsRequestSchema', request);
  return {
    tools: [planTool],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    console.log('CallToolRequestSchema', request);
    const { name, arguments: args } = request.params;
    if (name === 'plan') {
      const { task } = args as { task: string };
      return {
        result: `Sorry we were unable to plan your task.`,
      };
    }
    return {
      result: 'Sorry we were unable to plan your task.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Secure MCP Filesystem Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
