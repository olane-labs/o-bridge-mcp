#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3003;

// Enable CORS
app.use(cors());
app.use(express.json());

// Create MCP server instance
const mcpServer = new Server({
  name: 'o-network',
  description:
    'o-network MCP server used to connect to the o-network of services.',
  version: '1.0.0',
});

// Define the "use" tool
const useTool: Tool = {
  name: 'use',
  description:
    'Use a resource, command, or perform an action. This is a versatile tool that can be used for various purposes.',
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        description: 'The resource, command, or action to use',
      },
      parameters: {
        type: 'object',
        description: 'Optional parameters for the resource or command',
        additionalProperties: true,
      },
      context: {
        type: 'string',
        description: 'Optional context or additional information',
      },
    },
    required: ['resource'],
  },
};

const planTool: Tool = {
  name: 'plan',
  description:
    'Create a plan to achieve a goal. This tool is used to create a plan to achieve a goal.',
  inputSchema: {
    type: 'object',
  },
};

// Handle tool listing
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [useTool, planTool],
  };
});

// Handle tool calls with streaming support
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'use') {
    const { resource, parameters, context } = args as {
      resource: string;
      parameters?: Record<string, any>;
      context?: string;
    };

    try {
      // Process the use command based on the resource
      let result: any;

      switch (resource.toLowerCase()) {
        case 'help':
          result = {
            message:
              'Available resources: help, info, echo, calculate, status, stream',
            availableResources: [
              'help',
              'info',
              'echo',
              'calculate',
              'status',
              'stream',
            ],
          };
          break;

        case 'info':
          result = {
            message: 'o-bridge-mcp server is running',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            parameters: parameters || {},
            context: context || 'No context provided',
          };
          break;

        case 'echo':
          result = {
            message: 'Echo response',
            input: parameters?.input || 'No input provided',
            context: context || 'No context provided',
          };
          break;

        case 'calculate':
          const expression = parameters?.expression;
          if (expression) {
            try {
              // Safe evaluation - only allow basic math operations
              const sanitizedExpression = expression.replace(
                /[^0-9+\-*/().\s]/g,
                '',
              );
              result = {
                message: 'Calculation result',
                expression: expression,
                result: eval(sanitizedExpression),
              };
            } catch (error) {
              result = {
                message: 'Calculation failed',
                error: 'Invalid expression or calculation error',
                expression: expression,
              };
            }
          } else {
            result = {
              message: 'Calculation failed',
              error: 'No expression provided',
            };
          }
          break;

        case 'status':
          result = {
            message: 'Server status',
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
          };
          break;

        case 'stream':
          // This will be handled specially for streaming responses
          result = {
            message: 'Streaming response',
            type: 'stream',
            data: parameters?.data || 'Default streaming data',
          };
          break;

        default:
          result = {
            message: `Unknown resource: ${resource}`,
            availableResources: [
              'help',
              'info',
              'echo',
              'calculate',
              'status',
              'stream',
            ],
            providedResource: resource,
            parameters: parameters || {},
            context: context || 'No context provided',
          };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Failed to process use command',
                message:
                  error instanceof Error ? error.message : 'Unknown error',
                resource,
                parameters,
                context,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// HTTP endpoints

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'o-bridge-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// List tools endpoint
app.get('/tools', async (req, res) => {
  try {
    // Directly return the tools list since we have them defined
    res.json({
      tools: [useTool, planTool],
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list tools',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Call tool endpoint (non-streaming)
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    // Create a mock request object for the handler
    const request = {
      params: {
        name,
        arguments: args,
      },
    };

    // Call the appropriate handler based on the tool name
    if (name === 'use') {
      const { resource, parameters, context } = args as {
        resource: string;
        parameters?: Record<string, any>;
        context?: string;
      };

      try {
        // Process the use command based on the resource
        let result: any;

        switch (resource.toLowerCase()) {
          case 'help':
            result = {
              message:
                'Available resources: help, info, echo, calculate, status, stream',
              availableResources: [
                'help',
                'info',
                'echo',
                'calculate',
                'status',
                'stream',
              ],
            };
            break;

          case 'info':
            result = {
              message: 'o-bridge-mcp server is running',
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              parameters: parameters || {},
              context: context || 'No context provided',
            };
            break;

          case 'echo':
            result = {
              message: 'Echo response',
              input: parameters?.input || 'No input provided',
              context: context || 'No context provided',
            };
            break;

          case 'calculate':
            const expression = parameters?.expression;
            if (expression) {
              try {
                // Safe evaluation - only allow basic math operations
                const sanitizedExpression = expression.replace(
                  /[^0-9+\-*/().\s]/g,
                  '',
                );
                result = {
                  message: 'Calculation result',
                  expression: expression,
                  result: eval(sanitizedExpression),
                };
              } catch (error) {
                result = {
                  message: 'Calculation failed',
                  error: 'Invalid expression or calculation error',
                  expression: expression,
                };
              }
            } else {
              result = {
                message: 'Calculation failed',
                error: 'No expression provided',
              };
            }
            break;

          case 'status':
            result = {
              message: 'Server status',
              status: 'running',
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              timestamp: new Date().toISOString(),
            };
            break;

          case 'stream':
            // This will be handled specially for streaming responses
            result = {
              message: 'Streaming response',
              type: 'stream',
              data: parameters?.data || 'Default streaming data',
            };
            break;

          default:
            result = {
              message: `Unknown resource: ${resource}`,
              availableResources: [
                'help',
                'info',
                'echo',
                'calculate',
                'status',
                'stream',
              ],
              providedResource: resource,
              parameters: parameters || {},
              context: context || 'No context provided',
            };
        }

        res.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      } catch (error) {
        res.status(500).json({
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Failed to process use command',
                  message:
                    error instanceof Error ? error.message : 'Unknown error',
                  resource,
                  parameters,
                  context,
                },
                null,
                2,
              ),
            },
          ],
        });
      }
    } else if (name === 'plan') {
      res.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Plan created',
                plan: 'This is a sample plan for the requested goal.',
              },
              null,
              2,
            ),
          },
        ],
      });
    } else {
      res.status(400).json({
        error: 'Unknown tool',
        message: `Tool '${name}' not found`,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to call tool',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// SSE endpoint for streaming tool calls
app.post('/tools/call/stream', async (req, res) => {
  const { name, arguments: args } = req.body;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  try {
    // Handle streaming for specific tools
    if (name === 'use' && args?.resource === 'stream') {
      // Send initial response
      res.write(
        `data: ${JSON.stringify({
          type: 'start',
          message: 'Starting stream...',
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );

      // Simulate streaming data
      const data = args?.data || 'Default streaming data';
      const chunks = data.split(' ');

      for (let i = 0; i < chunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay between chunks

        res.write(
          `data: ${JSON.stringify({
            type: 'chunk',
            index: i,
            chunk: chunks[i],
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      }

      // Send final response
      res.write(
        `data: ${JSON.stringify({
          type: 'end',
          message: 'Stream completed',
          totalChunks: chunks.length,
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );
    } else {
      // For non-streaming tools, process them directly
      if (name === 'use') {
        const { resource, parameters, context } = args as {
          resource: string;
          parameters?: Record<string, any>;
          context?: string;
        };

        let result: any;

        switch (resource.toLowerCase()) {
          case 'help':
            result = {
              message:
                'Available resources: help, info, echo, calculate, status, stream',
              availableResources: [
                'help',
                'info',
                'echo',
                'calculate',
                'status',
                'stream',
              ],
            };
            break;

          case 'info':
            result = {
              message: 'o-bridge-mcp server is running',
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              parameters: parameters || {},
              context: context || 'No context provided',
            };
            break;

          case 'echo':
            result = {
              message: 'Echo response',
              input: parameters?.input || 'No input provided',
              context: context || 'No context provided',
            };
            break;

          case 'calculate':
            const expression = parameters?.expression;
            if (expression) {
              try {
                const sanitizedExpression = expression.replace(
                  /[^0-9+\-*/().\s]/g,
                  '',
                );
                result = {
                  message: 'Calculation result',
                  expression: expression,
                  result: eval(sanitizedExpression),
                };
              } catch (error) {
                result = {
                  message: 'Calculation failed',
                  error: 'Invalid expression or calculation error',
                  expression: expression,
                };
              }
            } else {
              result = {
                message: 'Calculation failed',
                error: 'No expression provided',
              };
            }
            break;

          case 'status':
            result = {
              message: 'Server status',
              status: 'running',
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              timestamp: new Date().toISOString(),
            };
            break;

          default:
            result = {
              message: `Unknown resource: ${resource}`,
              availableResources: [
                'help',
                'info',
                'echo',
                'calculate',
                'status',
                'stream',
              ],
              providedResource: resource,
              parameters: parameters || {},
              context: context || 'No context provided',
            };
        }

        res.write(
          `data: ${JSON.stringify({
            type: 'result',
            data: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      } else if (name === 'plan') {
        res.write(
          `data: ${JSON.stringify({
            type: 'result',
            data: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      message: 'Plan created',
                      plan: 'This is a sample plan for the requested goal.',
                    },
                    null,
                    2,
                  ),
                },
              ],
            },
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: 'Unknown tool',
            message: `Tool '${name}' not found`,
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      }
    }

    res.end();
  } catch (error) {
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );
    res.end();
  }
});

// SSE endpoint for real-time status updates
app.get('/status/stream', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send status updates every 5 seconds
  const interval = setInterval(() => {
    const status = {
      type: 'status',
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(status)}\n\n`);
  }, 5000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Start the server
async function main() {
  app.listen(PORT, () => {
    console.log(`o-bridge-mcp server started on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Tools list: http://localhost:${PORT}/tools`);
    console.log(`Tool call: POST http://localhost:${PORT}/tools/call`);
    console.log(
      `Streaming tool call: POST http://localhost:${PORT}/tools/call/stream`,
    );
    console.log(`Status stream: GET http://localhost:${PORT}/status/stream`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
