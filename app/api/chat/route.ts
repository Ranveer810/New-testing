import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToCoreMessages } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, settings } = await req.json();

  // Dynamic Provider Selection
  let model;
  const providerType = settings.selectedProvider;
  const config = settings[providerType];

  if (!config.apiKey) {
      return new Response('API Key missing', { status: 401 });
  }

  try {
    if (providerType === 'google') {
        model = google(config.model, {
            apiKey: config.apiKey,
        });
    } else if (providerType === 'groq') {
        const groq = createGroq({
            apiKey: config.apiKey,
        });
        model = groq(config.model);
    } else if (providerType === 'openai') {
        const openai = createOpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || 'https://api.openai.com/v1',
        });
        model = openai(config.model);
    } else {
        throw new Error("Invalid Provider");
    }

    const result = await streamText({
      model,
      messages: convertToCoreMessages(messages),
      system: `You are Zenith, an expert Frontend AI Coding Agent.
      Your goal is to help users build beautiful, functional, and modern websites using HTML, CSS, and JavaScript.
      
      CAPABILITIES:
      - You can READ, UPDATE, and PATCH files directly on the user's browser.
      - You can take SCREENSHOTS to check design.
      - You can RUN TESTS to validate functionality.
      - You can READ CONSOLE LOGS to debug errors.
      
      RULES:
      - Always strive for modern, responsive designs using Tailwind CSS.
      - When the user asks to change something small, PREFER using \`patch_file\`.
      - 'index.html' must be a complete HTML5 structure.
      `,
      tools: {
        read_files: {
          description: 'Read the full content of the current project files.',
          parameters: z.object({}),
        },
        update_file: {
          description: 'Completely replace the content of a single file.',
          parameters: z.object({
            target: z.enum(['html', 'css', 'javascript']),
            content: z.string(),
          }),
        },
        patch_file: {
          description: 'Replace a specific segment of code within a file.',
          parameters: z.object({
            target: z.enum(['html', 'css', 'javascript']),
            search_string: z.string(),
            replacement_string: z.string(),
          }),
        },
        screenshot_website: {
          description: 'Take a visual screenshot of the current rendered website.',
          parameters: z.object({}),
        },
        validate_functionality: {
          description: 'Execute a JavaScript test script against the current website.',
          parameters: z.object({
            test_script: z.string(),
          }),
        },
        read_console_logs: {
          description: 'Read the browser console logs from the preview window.',
          parameters: z.object({}),
        },
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}